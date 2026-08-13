import { FastifyInstance } from 'fastify';
import { createCampaign, addMedia, uploadBase64Media, startCampaign, approvePlatformPost, getCampaign, listCampaigns, deleteCampaign } from '../controllers/campaign.controller';

export async function campaignRoutes(app: FastifyInstance) {
  app.get('/', listCampaigns);
  app.post('/', createCampaign);
  app.get('/:id', getCampaign);
  app.delete('/:id', deleteCampaign);
  app.post('/:id/media', addMedia);
  app.post('/:id/upload-base64', uploadBase64Media);
  app.post('/:id/start', startCampaign);
  app.post('/posts/:postId/approve', approvePlatformPost);
}
