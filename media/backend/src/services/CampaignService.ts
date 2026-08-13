import { db } from '../db/client';
import { campaigns, mediaAssets, campaignPlatforms, automationRuns, users, platformPosts, publishAttempts, automationEvents, socialAccounts } from '../db/schema';
import { CampaignStatus, Platform } from '../domain/enums';
import { AppError } from '../errors/AppError';
import { eq, desc, inArray } from 'drizzle-orm';
import { PlatformRegistry } from '../integrations/core/platform-registry';
import { logger } from '../logger';

export class CampaignService {
  /**
   * For the sake of Phase 2, we will ensure there is a default user
   */
  static async getOrCreateDefaultUser(): Promise<string> {
    const existing = await db.select().from(users).limit(1);
    if (existing.length > 0) return existing[0].id;
    
    const [newUser] = await db.insert(users).values({
      email: 'test@greedsocial.com',
    }).returning({ id: users.id });
    return newUser.id;
  }

  /**
   * Creates a new campaign
   */
  static async createCampaign(data: {
    instruction: string;
    platforms: Platform[];
    postType?: string;
  }) {
    const userId = await this.getOrCreateDefaultUser();

    if (data.platforms.length === 0) {
      throw new AppError({
        message: 'At least one platform is required.',
        code: 'VALIDATION_ERROR',
        category: 'ValidationError',
        statusCode: 400,
      });
    }

    const uniquePlatforms = [...new Set(data.platforms)];

    return await db.transaction(async (tx) => {
      // 1. Create campaign
      const [campaign] = await tx.insert(campaigns).values({
        userId,
        instruction: data.instruction,
        postType: data.postType || 'FEED',
        status: CampaignStatus.DRAFT,
      }).returning({ id: campaigns.id });

      // 2. Create platforms
      for (const platform of uniquePlatforms) {
        await tx.insert(campaignPlatforms).values({
          campaignId: campaign.id,
          platform,
        });
      }

      return campaign.id;
    });
  }

  /**
   * Adds a media asset to a campaign
   */
  static async addMediaAsset(campaignId: string, mediaData: {
    publicId: string;
    secureUrl: string;
    resourceType: string;
    format: string;
    width?: number;
    height?: number;
    bytes?: number;
  }) {
    // Check media limit
    const existingMedia = await db.select().from(mediaAssets).where(eq(mediaAssets.campaignId, campaignId));
    if (existingMedia.length >= 5) {
      throw new AppError({
        message: 'Maximum of 5 images allowed per campaign.',
        code: 'MEDIA_LIMIT_EXCEEDED',
        category: 'ValidationError',
        statusCode: 400,
      });
    }

    const [asset] = await db.insert(mediaAssets).values({
      campaignId,
      ...mediaData,
    }).returning();
    return asset;
  }

  static async getCampaignDetails(campaignId: string) {
    const campaignList = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
    if (!campaignList.length) {
      throw new AppError({
        message: 'Campaign not found',
        code: 'NOT_FOUND',
        category: 'NotFoundError',
        statusCode: 404,
      });
    }
    
    const platforms = await db.select().from(campaignPlatforms).where(eq(campaignPlatforms.campaignId, campaignId));
    const media = await db.select().from(mediaAssets).where(eq(mediaAssets.campaignId, campaignId));
    
    // Get posts for these platforms
    const platformIds = platforms.map(p => p.id);
    let posts: any[] = [];
    let attempts: any[] = [];
    
    if (platformIds.length > 0) {
      const { inArray } = require('drizzle-orm');
      posts = await db.select().from(require('../db/schema').platformPosts).where(inArray(require('../db/schema').platformPosts.campaignPlatformId, platformIds));
      
      const postIds = posts.map(p => p.id);
      if (postIds.length > 0) {
        attempts = await db.select().from(require('../db/schema').publishAttempts).where(inArray(require('../db/schema').publishAttempts.platformPostId, postIds));
      }
    }

    return {
      campaign: campaignList[0],
      platforms,
      media,
      posts,
      attempts,
    };
  }

  /**
   * Transitions campaign to ready and creates an automation run
   */
  static async startAutomation(campaignId: string) {
    const details = await this.getCampaignDetails(campaignId);

    if (details.media.length === 0) {
      throw new AppError({
        message: 'Campaign must have at least one media asset to start',
        code: 'VALIDATION_ERROR',
        category: 'ValidationError',
        statusCode: 400,
      });
    }

    if (details.campaign.status !== CampaignStatus.DRAFT) {
      throw new AppError({
        message: 'Campaign is not in DRAFT state',
        code: 'INVALID_TRANSITION',
        category: 'ConflictError',
        statusCode: 409,
      });
    }

    return await db.transaction(async (tx) => {
      // update status
      await tx.update(campaigns).set({ status: CampaignStatus.READY }).where(eq(campaigns.id, campaignId));

      // create run
      const [run] = await tx.insert(automationRuns).values({
        campaignId,
      }).returning({ id: automationRuns.id });

      return run.id;
    });
  }

  static async listCampaigns() {
    const userId = await this.getOrCreateDefaultUser();
    
    // Get all campaigns for user
    const userCampaigns = await db.select().from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));

    // For each campaign, attach platforms and status
    const result = [];
    for (const campaign of userCampaigns) {
      const platforms = await db.select().from(campaignPlatforms).where(eq(campaignPlatforms.campaignId, campaign.id));
      result.push({
        ...campaign,
        platforms: platforms.map(p => p.platform),
      });
    }

    return result;
  }

  static async deleteCampaign(campaignId: string, deleteOnPlatforms: boolean) {
    // Make sure campaign exists
    const campaignList = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
    if (!campaignList.length) {
      throw new AppError({
        message: 'Campaign not found',
        code: 'NOT_FOUND',
        category: 'NotFoundError',
        statusCode: 404,
      });
    }

    const userId = campaignList[0].userId;

    if (deleteOnPlatforms) {
      // Find all published posts for this campaign to delete them externally
      const platforms = await db.select().from(campaignPlatforms).where(eq(campaignPlatforms.campaignId, campaignId));
      if (platforms.length > 0) {
        const platformIds = platforms.map(p => p.id);
        const posts = await db.select().from(platformPosts).where(inArray(platformPosts.campaignPlatformId, platformIds));
        
        for (const post of posts) {
          // Find the success attempt to get the externalId
          const attempts = await db.select().from(publishAttempts)
            .where(eq(publishAttempts.platformPostId, post.id));
          const successAttempt = attempts.find(a => a.status === 'SUCCESS' && a.externalId);
          
          if (successAttempt && successAttempt.externalId) {
            const platformConfig = platforms.find(p => p.id === post.campaignPlatformId);
            if (platformConfig) {
              const platformName = platformConfig.platform as Platform;
              // Get the user's social account for this platform
              const accountList = await db.select().from(socialAccounts)
                .where(eq(socialAccounts.userId, userId));
              const account = accountList.find(a => a.platform === platformName);
              
              if (account && account.accessToken) {
                const adapter = PlatformRegistry.get(platformName);
                if (adapter.capabilities.supportsDelete && adapter.deletePost) {
                  try {
                    const result = await adapter.deletePost(successAttempt.externalId, account.accessToken, account.externalAccountId);
                    if (result.alreadyDeleted) {
                      logger.info(`Post ${successAttempt.externalId} was already deleted on ${platformName}`);
                    } else {
                      logger.info(`Successfully deleted post ${successAttempt.externalId} on ${platformName}`);
                    }
                  } catch (error: any) {
                    logger.error({ error: error.message }, `Failed to delete post ${successAttempt.externalId} on ${platformName}`);
                  }
                }
              }
            }
          }
        }
      }
    }

    // Delete locally in correct order
    await db.transaction(async (tx) => {
      // 1. Publish Attempts & Platform Posts
      const platforms = await tx.select().from(campaignPlatforms).where(eq(campaignPlatforms.campaignId, campaignId));
      if (platforms.length > 0) {
        const platformIds = platforms.map(p => p.id);
        const posts = await tx.select().from(platformPosts).where(inArray(platformPosts.campaignPlatformId, platformIds));
        if (posts.length > 0) {
          const postIds = posts.map(p => p.id);
          await tx.delete(publishAttempts).where(inArray(publishAttempts.platformPostId, postIds));
          await tx.delete(platformPosts).where(inArray(platformPosts.campaignPlatformId, platformIds));
        }
        await tx.delete(campaignPlatforms).where(eq(campaignPlatforms.campaignId, campaignId));
      }

      // 2. Automation Events & Runs
      const runs = await tx.select().from(automationRuns).where(eq(automationRuns.campaignId, campaignId));
      if (runs.length > 0) {
        const runIds = runs.map(r => r.id);
        await tx.delete(automationEvents).where(inArray(automationEvents.automationRunId, runIds));
        await tx.delete(automationRuns).where(eq(automationRuns.campaignId, campaignId));
      }

      // 3. Media Assets
      await tx.delete(mediaAssets).where(eq(mediaAssets.campaignId, campaignId));

      // 4. Campaign itself
      await tx.delete(campaigns).where(eq(campaigns.id, campaignId));
    });
  }
}
