import { FastifyInstance } from 'fastify';
import { createCampaign, addMedia, startCampaign, approvePlatformPost, getCampaign } from '../controllers/campaign.controller';

export async function campaignRoutes(app: FastifyInstance) {
  app.post('/', createCampaign);
  app.get('/:id', getCampaign);
  app.post('/:id/media', addMedia);
  app.post('/:id/start', startCampaign);
  app.post('/posts/:postId/approve', approvePlatformPost);
}
