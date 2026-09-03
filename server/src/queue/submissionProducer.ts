// ===================================================================
// Submission Producer (Job Enqueuer)
// ===================================================================
// The API server calls this service to enqueue code evaluation tasks.
//
// SYSTEM DESIGN CONCEPT — Asynchronous Processing:
//   1. Client sends POST /api/submissions
//   2. API server saves submission in PostgreSQL with status QUEUED
//   3. API server calls `addSubmissionJob(submission.id)`
//   4. API server immediately returns HTTP 201 Created with submission ID
//   5. Worker asynchronously consumes the job from Redis and evaluates code
//
// WHY BullMQ jobId:
//   By passing `jobId: submissionId`, BullMQ enforces job deduplication.
//   If the API accidentally attempts to enqueue the same submission twice,
//   Redis rejects the duplicate key, avoiding wasted CPU and duplicate Docker runs.
// ===================================================================

import { Job } from 'bullmq';
import { submissionQueue, SubmissionJobData } from './submissionQueue';
import { logger } from '../utils/logger';

/**
 * Enqueues a code submission for background evaluation by workers.
 *
 * @param submissionId - The unique UUID of the submission in PostgreSQL
 * @returns The created BullMQ Job instance
 */
export async function addSubmissionJob(submissionId: string): Promise<Job<SubmissionJobData>> {
  const job = await submissionQueue.add(
    'evaluate-submission',
    { submissionId },
    {
      // Deduplication: BullMQ will not create a second job with this ID
      // while one is already waiting or active in the queue.
      jobId: submissionId,
      // Reliability & Retry Policy:
      // If a transient infrastructure failure occurs (e.g. Docker daemon socket blip),
      // retry up to 3 times using exponential backoff (1s, 2s).
      // Note: User code errors (WA, TLE, etc.) are handled inside the worker and
      // will NOT trigger a BullMQ retry.
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    }
  );

  logger.info(
    { submissionId, bullmqJobId: job.id },
    'Submission successfully enqueued to BullMQ'
  );

  return job;
}
