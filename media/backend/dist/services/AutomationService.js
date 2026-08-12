import { db } from '../db/client';
import { campaigns, platformPosts } from '../db/schema';
import { eq } from 'drizzle-orm';
import { CampaignStatus, PlatformPostStatus } from '../domain/enums';
import { enqueuePublishingJob } from '../queues';
import { AppError } from '../errors/AppError';
export class AutomationService {
    /**
     * Approves a platform post and queues it for publishing
     */
    static async approvePlatformPost(postId, forceFailTest = false) {
        const posts = await db.select().from(platformPosts).where(eq(platformPosts.id, postId));
        if (!posts.length)
            throw new AppError({ message: 'Post not found', code: 'NOT_FOUND', category: 'NotFoundError' });
        const post = posts[0];
        if (post.status !== PlatformPostStatus.AWAITING_APPROVAL) {
            throw new AppError({ message: 'Post is not awaiting approval', code: 'INVALID_TRANSITION', category: 'ConflictError' });
        }
        await db.update(platformPosts).set({ status: PlatformPostStatus.APPROVED }).where(eq(platformPosts.id, postId));
        // Get the campaign ID from platform
        const details = await db.query.platformPosts.findFirst({
            where: eq(platformPosts.id, postId),
            with: { campaignPlatform: true }
        });
        const campaignId = details?.campaignPlatform.campaignId;
        if (campaignId) {
            await db.update(campaigns).set({ status: CampaignStatus.PUBLISHING }).where(eq(campaigns.id, campaignId));
        }
        // Queue publish job
        await enqueuePublishingJob(`publish_${postId}`, {
            postId,
            campaignId,
            forceFail: forceFailTest,
        });
    }
    static async retryPlatform(postId) {
        const posts = await db.select().from(platformPosts).where(eq(platformPosts.id, postId));
        if (!posts.length)
            throw new AppError({ message: 'Post not found', code: 'NOT_FOUND', category: 'NotFoundError' });
        const post = posts[0];
        if (post.status !== PlatformPostStatus.FAILED) {
            throw new AppError({ message: 'Only failed posts can be retried', code: 'INVALID_TRANSITION', category: 'ConflictError' });
        }
        await db.update(platformPosts).set({ status: PlatformPostStatus.APPROVED }).where(eq(platformPosts.id, postId));
        const details = await db.query.platformPosts.findFirst({
            where: eq(platformPosts.id, postId),
            with: { campaignPlatform: true }
        });
        await enqueuePublishingJob(`retry_publish_${postId}`, {
            postId,
            campaignId: details?.campaignPlatform.campaignId,
        });
    }
}
