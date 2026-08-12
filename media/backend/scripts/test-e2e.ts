import { db } from '../src/db/client';
import { CampaignService } from '../src/services/CampaignService';
import { Platform, CampaignStatus, PlatformPostStatus, AutomationStatus } from '../src/domain/enums';
import { campaigns, platformPosts, automationRuns, socialAccounts, users } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { AutomationService } from '../src/services/AutomationService';
import { enqueueAutomationJob, automationQueue, publishingQueue } from '../src/queues/index';
import { logger } from '../src/logger';
import { logger } from '../src/logger';

// Ensure workers are imported so they listen to queues
import '../src/queues/workers/automation.worker';
import '../src/queues/workers/publishing.worker';

async function runTest() {
  logger.info('Starting E2E Test Flow');
  
  await automationQueue.obliterate({ force: true });
  await publishingQueue.obliterate({ force: true });
  logger.info('Cleared Redis queues.');

  try {
    // 0. Ensure user and social accounts exist
    const [user] = await db.insert(users).values({ email: `e2e_${Date.now()}@test.com` }).returning();
    await db.insert(socialAccounts).values([
      { userId: user.id, platform: 'instagram', externalAccountId: 'mock_ig', accessToken: 'mock_token', status: 'CONNECTED' },
      { userId: user.id, platform: 'linkedin', externalAccountId: 'mock_li', accessToken: 'mock_token', status: 'CONNECTED' },
      { userId: user.id, platform: 'x', externalAccountId: 'mock_x', accessToken: 'mock_token', status: 'CONNECTED' },
    ]);

    // 1. Create campaign
    logger.info('Creating Campaign...');
    const campaignId = await CampaignService.createCampaign({
      instruction: "Promote our upcoming AI automation event.",
      platforms: [Platform.INSTAGRAM, Platform.LINKEDIN, Platform.X]
    });
    logger.info({ campaignId }, 'Campaign Created');

    // 2. Add fake media metadata
    await CampaignService.addMediaAsset(campaignId, {
      publicId: 'test_asset_1',
      secureUrl: 'https://cloudinary.com/test1.jpg',
      resourceType: 'image',
      format: 'jpg'
    });
    await CampaignService.addMediaAsset(campaignId, {
        publicId: 'test_asset_2',
        secureUrl: 'https://cloudinary.com/test2.jpg',
        resourceType: 'image',
        format: 'jpg'
    });

    // 3. Start automation (queues generation job)
    logger.info('Starting automation run...');
    const runId = await CampaignService.startAutomation(campaignId);
    await enqueueAutomationJob(`automation_${runId}`, { runId, campaignId });

    // Wait for the worker to process (simulate polling)
    logger.info('Waiting for automation generation to complete...');
    await new Promise(r => setTimeout(r, 4000)); 

    const detailsAfterGeneration = await CampaignService.getCampaignDetails(campaignId);
    
    if (detailsAfterGeneration.campaign.status !== CampaignStatus.AWAITING_APPROVAL) {
       throw new Error(`Expected campaign status AWAITING_APPROVAL, got ${detailsAfterGeneration.campaign.status}`);
    }

    const posts = await db.select().from(platformPosts);
    const campaignPosts = posts.filter(p => detailsAfterGeneration.platforms.map(cp => cp.id).includes(p.campaignPlatformId));
    
    logger.info({ posts: campaignPosts.length }, 'Posts generated');

    // 4. Approve platforms
    logger.info('Approving platforms (simulating X failure initially)...');
    
    let xPostId: string | null = null;

    for (const p of campaignPosts) {
      const platformDetail = detailsAfterGeneration.platforms.find(cp => cp.id === p.campaignPlatformId);
      if (platformDetail?.platform === Platform.X) {
        xPostId = p.id;
        // Approve but force failure for testing retry
        await AutomationService.approvePlatformPost(p.id, true);
      } else {
        await AutomationService.approvePlatformPost(p.id, false);
      }
    }

    logger.info('Waiting for publishing jobs to complete...');
    await new Promise(r => setTimeout(r, 15000));

    const detailsAfterPublish = await CampaignService.getCampaignDetails(campaignId);
    
    logger.info({ status: detailsAfterPublish.campaign.status }, 'Campaign status after initial publish');

    if (detailsAfterPublish.campaign.status !== CampaignStatus.PARTIALLY_COMPLETED) {
        throw new Error(`Expected PARTIALLY_COMPLETED, got ${detailsAfterPublish.campaign.status}`);
    }

    if (xPostId) {
        logger.info('Retrying failed X post...');
        await AutomationService.retryPlatform(xPostId);
        await new Promise(r => setTimeout(r, 4000));
        
        const finalDetails = await CampaignService.getCampaignDetails(campaignId);
        logger.info({ status: finalDetails.campaign.status }, 'Campaign status after retry');

        if (finalDetails.campaign.status !== CampaignStatus.COMPLETED) {
            throw new Error(`Expected COMPLETED, got ${finalDetails.campaign.status}`);
        }
    }

    logger.info('E2E Test Flow Completed Successfully!');
    process.exit(0);

  } catch (error: any) {
    logger.error({ error: error.message, stack: error.stack }, 'E2E Test Flow Failed');
    console.error(error);
    process.exit(1);
  }
}

runTest();
