import { buildApp } from './app';
import { env } from '../config/env';
import { logger } from '../logger';

import { PlatformRegistry } from '../integrations/core/platform-registry';
import { MetaAdapter } from '../integrations/meta.adapter';
import { LinkedInAdapter } from '../integrations/linkedin.adapter';
import { XAdapter } from '../integrations/x.adapter';

// Initialize workers
import '../queues/workers/automation.worker';
import '../queues/workers/publishing.worker';

// Register real adapters
PlatformRegistry.register('instagram', new MetaAdapter('instagram'));
PlatformRegistry.register('facebook', new MetaAdapter('facebook'));
PlatformRegistry.register('linkedin', new LinkedInAdapter());
PlatformRegistry.register('x', new XAdapter());

const app = buildApp();

async function start() {
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`Server listening on port ${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, async () => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    await app.close();
    process.exit(0);
  });
});

start();
