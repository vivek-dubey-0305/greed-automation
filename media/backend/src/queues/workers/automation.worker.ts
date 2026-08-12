import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../../config/env';
import { logger } from '../../logger';
import { CampaignService } from '../../services/CampaignService';
import { db } from '../../db/client';
import { campaigns, automationEvents, platformPosts, campaignPlatforms, automationRuns } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { CampaignStatus, PlatformPostStatus, AutomationStatus } from '../../domain/enums';
import { MockAIProvider } from '../../integrations/ai.mock';
import { enqueuePublishingJob } from '../index';

const redisConnection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const automationWorker = new Worker('automation', async (job) => {
  const { runId, campaignId } = job.data;
  const requestId = job.id!;
  
  logger.info({ requestId, runId, campaignId }, 'Starting automation job');

  const aiProvider = new MockAIProvider();
  
  try {
    // Transition to ANALYZING/GENERATING
    await db.update(campaigns).set({ status: CampaignStatus.GENERATING }).where(eq(campaigns.id, campaignId));
    await db.update(automationRuns).set({ status: AutomationStatus.PROCESSING, startedAt: new Date() }).where(eq(automationRuns.id, runId));
    
    // fetch details
    const details = await CampaignService.getCampaignDetails(campaignId);

    // Call AI
    const generated = await aiProvider.generateCampaignContent(details.campaign.instruction || '', details.platforms.map(p => p.platform as any), details.media.length);

    // Save platform posts
    for (const p of details.platforms) {
      const pData = generated[p.platform as keyof typeof generated];
      if (pData) {
        await db.insert(platformPosts).values({
          campaignPlatformId: p.id,
          content: pData.caption,
          hashtags: pData.hashtags,
          status: PlatformPostStatus.AWAITING_APPROVAL,
        });
      }
    }

    // Transition campaign to AWAITING_APPROVAL
    await db.update(campaigns).set({ status: CampaignStatus.AWAITING_APPROVAL }).where(eq(campaigns.id, campaignId));

    // Record Event
    await db.insert(automationEvents).values({
      automationRunId: runId,
      type: 'GENERATION_COMPLETED',
      details: { generatedPlatforms: Object.keys(generated) }
    });

    logger.info({ requestId, runId, campaignId }, 'Automation job completed');
    return { success: true };
  } catch (error: any) {
    logger.error({ requestId, runId, error }, 'Automation job failed');
    await db.update(campaigns).set({ status: CampaignStatus.FAILED }).where(eq(campaigns.id, campaignId));
    await db.update(automationRuns).set({ status: AutomationStatus.FAILED, completedAt: new Date() }).where(eq(automationRuns.id, runId));
    throw error;
  }
}, { connection: redisConnection });

automationWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Automation worker job failed with error');
});
