import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../logger';
// Ensure redis client is reused
const redisConnection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
});
redisConnection.on('error', (err) => {
    logger.error({ err }, 'Redis connection error');
});
// Queues
export const automationQueue = new Queue('automation', { connection: redisConnection });
export const publishingQueue = new Queue('publishing', { connection: redisConnection });
// Shared helper to enqueue jobs
export async function enqueueAutomationJob(name, data, jobId) {
    logger.debug({ name, jobId }, 'Enqueueing automation job');
    return automationQueue.add(name, data, {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
    });
}
export async function enqueuePublishingJob(name, data, jobId) {
    logger.debug({ name, jobId }, 'Enqueueing publishing job');
    return publishingQueue.add(name, data, {
        jobId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
    });
}
