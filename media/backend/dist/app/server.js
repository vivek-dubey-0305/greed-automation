import { buildApp } from './app';
import { env } from '../config/env';
import { logger } from '../logger';
import { registerMockAdapters } from '../integrations/mock.adapter';
// Initialize workers
import '../queues/workers/automation.worker';
import '../queues/workers/publishing.worker';
// Register mock adapters for local testing
registerMockAdapters();
const app = buildApp();
async function start() {
    try {
        await app.listen({ port: env.PORT, host: '0.0.0.0' });
        logger.info(`Server listening on port ${env.PORT}`);
    }
    catch (err) {
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
