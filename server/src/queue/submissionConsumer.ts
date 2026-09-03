// ===================================================================
// Submission Consumer (BullMQ Worker) — Reliability Edition
// ===================================================================
// The worker process runs this consumer.
//
// SYSTEM DESIGN CONCEPT — Reliability & Fault Tolerance:
//   1. Atomic Transitions: Worker claims job via optimistic locking in DB.
//   2. Retry Policy: If infrastructure fails (Docker/DB), BullMQ retries
//      up to 3 times with exponential backoff (1s, 2s).
//   3. Dead-Letter Queue (DLQ): When retries are exhausted, the job is
//      quarantined to the DLQ, and PostgreSQL is set to SYSTEM_ERROR.
//   4. Stalled Job Detection: If a worker process is hard-killed (OOM/power),
//      BullMQ automatically detects the expired lock and recovers the job.
// ===================================================================

import { Worker, Job } from 'bullmq';
import { SUBMISSION_QUEUE_NAME, SubmissionJobData, redisConnectionOptions } from './submissionQueue';
import { sendToDeadLetterQueue } from './submissionDlq';
import { executeSubmissionAsync } from '../services/submission.service';
import { prisma } from '../config/database';
import { SubmissionStatus } from '../types';
import { logger } from '../utils/logger';

/**
 * Job processing function invoked by BullMQ for each submission.
 */
export async function processSubmissionJob(job: Job<SubmissionJobData>): Promise<void> {
  const { submissionId } = job.data;
  const currentAttempt = job.attemptsMade + 1;
  const maxAttempts = job.opts.attempts ?? 1;

  logger.info(
    { jobId: job.id, submissionId, attempt: currentAttempt, maxAttempts },
    'Worker started processing submission job'
  );

  try {
    await executeSubmissionAsync(submissionId);
    logger.info({ jobId: job.id, submissionId }, 'Worker finished processing submission');
  } catch (error) {
    logger.error(
      { jobId: job.id, submissionId, attempt: currentAttempt, maxAttempts, error },
      'Worker encountered infrastructure error during evaluation'
    );
    throw error; // Re-throw to trigger BullMQ retry logic
  }
}

/**
 * Creates and starts a BullMQ Worker instance for code submissions with
 * reliability, DLQ routing, and stalled job recovery.
 *
 * @param concurrency - Number of jobs this worker can process simultaneously (default: 2)
 */
export function createSubmissionWorker(concurrency = 2): Worker<SubmissionJobData> {
  const worker = new Worker<SubmissionJobData>(
    SUBMISSION_QUEUE_NAME,
    processSubmissionJob,
    {
      connection: redisConnectionOptions,
      concurrency,
      // Stalled job monitoring:
      stalledInterval: 30000, // Check for orphaned jobs every 30 seconds
      maxStalledCount: 2,     // Re-attempt a stalled job up to 2 times before failing
    }
  );

  worker.on('active', (job) => {
    logger.info(
      { jobId: job.id, submissionId: job.data.submissionId, attempt: job.attemptsMade + 1 },
      'Job is now ACTIVE in worker'
    );
  });

  worker.on('completed', (job) => {
    logger.info(
      { jobId: job.id, submissionId: job.data.submissionId },
      'Job COMPLETED successfully'
    );
  });

  // Stalled job event: triggers if another worker died while holding lock
  worker.on('stalled', (jobId) => {
    logger.warn(
      { jobId },
      'Job STALLED: Worker lock expired — job will be re-queued or moved to DLQ'
    );
  });

  // Failure handler: handles retries or DLQ quarantine on retry exhaustion
  worker.on('failed', async (job, err) => {
    if (!job) {
      logger.error({ err }, 'Unknown job failed in worker');
      return;
    }

    const maxAttempts = job.opts.attempts ?? 1;
    const isExhausted = job.attemptsMade >= maxAttempts;

    logger.warn(
      {
        jobId: job.id,
        submissionId: job.data.submissionId,
        attempt: job.attemptsMade,
        maxAttempts,
        isExhausted,
        err: err.message,
      },
      isExhausted
        ? 'Job permanently failed: Exhausted all retry attempts'
        : `Job attempt failed: Will retry with exponential backoff (${job.attemptsMade}/${maxAttempts})`
    );

    // If retries are completely exhausted, quarantine to Dead-Letter Queue
    if (isExhausted) {
      try {
        await sendToDeadLetterQueue({
          submissionId: job.data.submissionId,
          originalJobId: job.id,
          failedReason: err.message,
          attemptsMade: job.attemptsMade,
          failedAt: new Date().toISOString(),
          stack: err.stack,
        });

        // Ensure database record reaches terminal state (SYSTEM_ERROR)
        await prisma.submission.updateMany({
          where: {
            id: job.data.submissionId,
            status: { in: [SubmissionStatus.QUEUED, SubmissionStatus.RUNNING] },
          },
          data: {
            status: SubmissionStatus.SYSTEM_ERROR,
            errorOutput: `System Error: Evaluation failed after ${job.attemptsMade} attempts due to infrastructure error: ${err.message}`,
          },
        });

        logger.info(
          { submissionId: job.data.submissionId },
          'Submission marked as SYSTEM_ERROR and preserved in DLQ'
        );
      } catch (dlqErr) {
        logger.error({ dlqErr, submissionId: job.data.submissionId }, 'Failed to route job to DLQ');
      }
    }
  });

  worker.on('error', (err) => {
    logger.error({ err }, 'Worker process internal error');
  });

  return worker;
}
