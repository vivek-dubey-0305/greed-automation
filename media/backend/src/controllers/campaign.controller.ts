import { FastifyRequest, FastifyReply } from 'fastify';
import { CampaignService } from '../services/CampaignService';
import { AutomationService } from '../services/AutomationService';
import { enqueueAutomationJob } from '../queues';
import { createCampaignSchema, addMediaSchema } from '../validators/campaign.validator';
import { formatSuccessResponse } from '../utils/response';

export async function createCampaign(req: FastifyRequest, reply: FastifyReply) {
  const data = createCampaignSchema.parse(req.body);
  const campaignId = await CampaignService.createCampaign(data);
  return reply.status(201).send(formatSuccessResponse({ campaignId }, req.id));
}

export async function addMedia(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const campaignId = req.params.id;
  const data = addMediaSchema.parse(req.body); 
  
  const asset = await CampaignService.addMediaAsset(campaignId, data);
  return reply.status(200).send(formatSuccessResponse(asset, req.id));
}

export async function uploadBase64Media(req: FastifyRequest<{ Params: { id: string }, Body: { base64: string, resourceType: string, format: string } }>, reply: FastifyReply) {
  const campaignId = req.params.id;
  const { base64, resourceType, format } = req.body;
  
  const cloudinary = require('cloudinary').v2;
  
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  
  try {
    const result = await cloudinary.uploader.upload(`data:image/${format};base64,${base64}`, {
      resource_type: resourceType || 'auto',
      folder: `greed-automation/campaigns/${campaignId}`
    });
    
    const asset = await CampaignService.addMediaAsset(campaignId, {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      resourceType: result.resource_type,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    });
    
    return reply.status(200).send(formatSuccessResponse(asset, req.id));
  } catch (error: any) {
    req.log.error({ error: error.message }, 'Cloudinary upload failed');
    return reply.status(500).send({ success: false, error: 'Failed to upload image' });
  }
}

export async function startCampaign(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const campaignId = req.params.id;
  const runId = await CampaignService.startAutomation(campaignId);
  
  await enqueueAutomationJob(`automation_${runId}`, {
    runId,
    campaignId,
  });

  return reply.status(200).send(formatSuccessResponse({ runId }, req.id));
}

export async function approvePlatformPost(req: FastifyRequest<{ Params: { postId: string }, Body: { forceFailTest?: boolean } }>, reply: FastifyReply) {
  const postId = req.params.postId;
  await AutomationService.approvePlatformPost(postId, (req.body as any)?.forceFailTest);
  return reply.status(200).send(formatSuccessResponse({ status: 'queued_for_publishing' }, req.id));
}

export async function getCampaign(req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  const campaignId = req.params.id;
  const details = await CampaignService.getCampaignDetails(campaignId);
  return reply.status(200).send(formatSuccessResponse(details, req.id));
}

export async function listCampaigns(req: FastifyRequest, reply: FastifyReply) {
  const campaigns = await CampaignService.listCampaigns();
  return reply.status(200).send(formatSuccessResponse(campaigns, req.id));
}

export async function deleteCampaign(req: FastifyRequest<{ Params: { id: string }, Querystring: { deleteOnPlatforms?: string } }>, reply: FastifyReply) {
  const campaignId = req.params.id;
  const deleteOnPlatforms = req.query.deleteOnPlatforms === 'true';
  await CampaignService.deleteCampaign(campaignId, deleteOnPlatforms);
  return reply.status(200).send(formatSuccessResponse({ success: true }, req.id));
}
