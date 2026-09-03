// ===================================================================
// Submission Queue Definition (BullMQ)
// ===================================================================
// WHY BULLMQ?
//   BullMQ is a robust, fast, Redis-backed distributed job queue for
//   Node.js. It gives us:
//   1. Persistence: Jobs are stored in Redis data structures (sorted sets, hashes)
//      so jobs survive server restarts.
//   2. Concurrency Control: Workers can pull N jobs in parallel.
//   3. Retries & Backoff: Automatic retries with exponential backoff.
//   4. Job Deduplication: Using deterministic `jobId`, the same submission
//      is never enqueued twice.
//   5. Observability: Completed, failed, delayed, and active job tracking.
//
// SYSTEM DESIGN CONCEPT — Producer-Consumer Decoupling:
//   The Express API server is the PRODUCER (it only enqueues jobs).
//   The Worker is the CONSUMER (it dequeues and executes jobs in Docker).
//   They communicate exclusively via Redis.
// ===================================================================

import { Queue } from 'bullmq';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export const SUBMISSION_QUEUE_NAME = 'submission-queue';

/**
 * Payload data associated with each submission job in Redis.
 */
export interface SubmissionJobData {
  submissionId: string;
}

/**
 * Shared Redis connection options for BullMQ.
 * Note: BullMQ requires `maxRetriesPerRequest: null` to allow
 * workers to perform blocking commands (BLMOVE/BRPOPLPUSH).
 */
export const redisConnectionOptions = {
  host: config.redisHost,
  port: config.redisPort,
  maxRetriesPerRequest: null,
};

/**
 * BullMQ Queue instance used by the API server to produce jobs.
 */
export const submissionQueue = new Queue<SubmissionJobData>(SUBMISSION_QUEUE_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    // Keep last 1,000 completed jobs in Redis for inspection / metrics
    removeOnComplete: {
      count: 1000,
    },
    // Keep last 5,000 failed jobs for debugging
    removeOnFail: {
      count: 5000,
    },
  },
});

submissionQueue.on('error', (err) => {
  logger.error({ err }, 'BullMQ Submission Queue encountered an error');
});

/**
 * Closes the queue connection gracefully.
 * Called when API server shuts down.
 */
export async function closeSubmissionQueue(): Promise<void> {
  await submissionQueue.close();
  logger.info('BullMQ Submission Queue closed');
}
