import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from '../config/env';
import { logger } from '../logger';
import { AppError } from '../errors/AppError';
import { formatErrorResponse } from '../utils/response';
import { v4 as uuidv4 } from 'uuid';

import { campaignRoutes } from '../routes/campaign.routes';
import { oauthRoutes } from '../routes/oauth.routes';

export function buildApp() {
  const app = Fastify({
    loggerInstance: logger,
    genReqId: () => uuidv4(),
  });

  app.register(cors, {
    origin: '*', // For development. Update for prod.
  });

  // Health
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date() };
  });
  
  app.get('/health/ready', async () => {
    // We could add DB or Redis checks here
    return { status: 'ready', timestamp: new Date() };
  });

  // Routes
  app.register(campaignRoutes, { prefix: '/api/campaigns' });
  app.register(oauthRoutes, { prefix: '/api' });

  // Error Handler
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      reply.status(error.statusCode).send(formatErrorResponse({
        code: error.code,
        message: error.message,
        category: error.category,
        retryable: error.retryable,
      }, request.id));
    } else {
      logger.error({ err: error }, 'Unhandled Error');
      reply.status(500).send(formatErrorResponse({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        category: 'UnknownError',
        retryable: true,
      }, request.id));
    }
  });

  return app;
}
