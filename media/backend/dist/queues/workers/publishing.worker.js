import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../../logger';
import { db } from '../../db/client';
import { platformPosts, publishAttempts, campaigns, campaignPlatforms, automationEvents, socialAccounts } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { PlatformPostStatus, PublishAttemptStatus, CampaignStatus } from '../../domain/enums';
import { PlatformRegistry } from '../../integrations/core/platform-registry';
import { TokenService } from '../../services/TokenService';
const redisConnection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
export const publishingWorker = new Worker('publishing', async (job) => {
    const { postId, campaignId, runId, forceFail } = job.data;
    const requestId = job.id;
    logger.info({ requestId, postId }, 'Starting publishing job');
    // Insert Attempt
    const [attempt] = await db.insert(publishAttempts).values({
        platformPostId: postId,
        status: PublishAttemptStatus.PENDING,
    }).returning();
    try {
        await db.update(platformPosts).set({ status: PlatformPostStatus.PUBLISHING }).where(eq(platformPosts.id, postId));
        // Get platform details
        const postWithPlatform = await db.query.platformPosts.findFirst({
            where: eq(platformPosts.id, postId),
            with: {
                campaignPlatform: true,
            }
        });
        if (!postWithPlatform)
            throw new Error('Post not found');
        const platform = postWithPlatform.campaignPlatform.platform;
        // Find social account for user
        const campaign = await db.query.campaigns.findFirst({
            where: eq(campaigns.id, postWithPlatform.campaignPlatform.campaignId)
        });
        if (!campaign)
            throw new Error('Campaign not found');
        const socialAccount = await db.query.socialAccounts.findFirst({
            where: and(eq(socialAccounts.userId, campaign.userId), eq(socialAccounts.platform, platform))
        });
        if (!socialAccount) {
            throw new Error(`User does not have a connected ${platform} account`);
        }
        // Get valid access token
        const accessToken = await TokenService.getValidAccessToken(socialAccount.id);
        // Get the platform adapter
        const adapter = PlatformRegistry.get(platform);
        // Publish
        const result = await adapter.publish({
            platformPostId: postId,
            campaignId: campaign.id,
            socialAccountId: socialAccount.id,
            content: postWithPlatform.content || '',
            mediaUrls: [], // TODO: fetch from media_assets
            hashtags: postWithPlatform.hashtags,
            accessToken,
        });
        if (!result.success) {
            throw new Error(result.error || 'Unknown publishing error');
        }
        // Success
        await db.update(publishAttempts).set({ status: PublishAttemptStatus.SUCCESS, externalId: result.externalId }).where(eq(publishAttempts.id, attempt.id));
        await db.update(platformPosts).set({ status: PlatformPostStatus.PUBLISHED }).where(eq(platformPosts.id, postId));
        if (runId) {
            await db.insert(automationEvents).values({
                automationRunId: runId,
                type: 'PUBLISH_SUCCEEDED',
                details: { postId }
            });
        }
        // Check if campaign is fully completed
        await checkCampaignCompletion(campaignId);
        logger.info({ requestId, postId }, 'Publishing job succeeded');
        return { success: true };
    }
    catch (error) {
        logger.error({ requestId, postId, error }, 'Publishing job failed');
        await db.update(publishAttempts).set({ status: PublishAttemptStatus.FAILED, error: error.message }).where(eq(publishAttempts.id, attempt.id));
        await db.update(platformPosts).set({ status: PlatformPostStatus.FAILED }).where(eq(platformPosts.id, postId));
        if (runId) {
            await db.insert(automationEvents).values({
                automationRunId: runId,
                type: 'PUBLISH_FAILED',
                details: { postId, error: error.message }
            });
        }
        await checkCampaignCompletion(campaignId);
        throw error;
    }
}, { connection: redisConnection });
async function checkCampaignCompletion(campaignId) {
    const platforms = await db.select().from(campaignPlatforms).where(eq(campaignPlatforms.campaignId, campaignId));
    const postsList = await db.select().from(platformPosts).where(eq(platformPosts.campaignPlatformId, platforms[0].id)); // simplified for now
    // Real implementation would check all platforms' posts statuses
    let allPublished = true;
    let anyFailed = false;
    for (const plat of platforms) {
        const pPosts = await db.select().from(platformPosts).where(eq(platformPosts.campaignPlatformId, plat.id));
        for (const p of pPosts) {
            if (p.status !== PlatformPostStatus.PUBLISHED)
                allPublished = false;
            if (p.status === PlatformPostStatus.FAILED)
                anyFailed = true;
        }
    }
    let finalStatus = CampaignStatus.PUBLISHING;
    if (allPublished) {
        finalStatus = CampaignStatus.COMPLETED;
    }
    else if (anyFailed) {
        finalStatus = CampaignStatus.PARTIALLY_COMPLETED;
    }
    await db.update(campaigns).set({ status: finalStatus }).where(eq(campaigns.id, campaignId));
}
publishingWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Publishing worker job failed');
});
