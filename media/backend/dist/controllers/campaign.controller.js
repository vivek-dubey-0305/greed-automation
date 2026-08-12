import { CampaignService } from '../services/CampaignService';
import { AutomationService } from '../services/AutomationService';
import { enqueueAutomationJob } from '../queues';
import { createCampaignSchema, addMediaSchema } from '../validators/campaign.validator';
import { formatSuccessResponse } from '../utils/response';
export async function createCampaign(req, reply) {
    const data = createCampaignSchema.parse(req.body);
    const campaignId = await CampaignService.createCampaign(data);
    return reply.status(201).send(formatSuccessResponse({ campaignId }, req.id));
}
export async function addMedia(req, reply) {
    const campaignId = req.params.id;
    const data = addMediaSchema.parse(req.body); // In real scenario, handle multipart upload or base64. Here we just expect URL for simplicity or use cloudinary service
    const asset = await CampaignService.addMediaAsset(campaignId, data);
    return reply.status(200).send(formatSuccessResponse(asset, req.id));
}
export async function startCampaign(req, reply) {
    const campaignId = req.params.id;
    const runId = await CampaignService.startAutomation(campaignId);
    await enqueueAutomationJob(`automation_${runId}`, {
        runId,
        campaignId,
    });
    return reply.status(200).send(formatSuccessResponse({ runId }, req.id));
}
export async function approvePlatformPost(req, reply) {
    const postId = req.params.postId;
    await AutomationService.approvePlatformPost(postId, req.body?.forceFailTest);
    return reply.status(200).send(formatSuccessResponse({ status: 'queued_for_publishing' }, req.id));
}
export async function getCampaign(req, reply) {
    const campaignId = req.params.id;
    const details = await CampaignService.getCampaignDetails(campaignId);
    return reply.status(200).send(formatSuccessResponse(details, req.id));
}
