import { db } from '../db/client';
import { campaigns, mediaAssets, campaignPlatforms, automationRuns, users } from '../db/schema';
import { CampaignStatus, Platform } from '../domain/enums';
import { AppError } from '../errors/AppError';
import { eq } from 'drizzle-orm';

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
}
