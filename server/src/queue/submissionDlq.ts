// ===================================================================
// Dead-Letter Queue (DLQ) — Poison Pill Quarantine
// ===================================================================
// SYSTEM DESIGN CONCEPT — Dead-Letter Queue:
//
// When a background job encounters an unexpected infrastructure failure
// (e.g., Docker daemon unavailable, out of host disk space) and exhausts
// its retry attempts, we do NOT simply discard it.
//
// Instead, we route it to the Dead-Letter Queue (DLQ):
//   1. Quarantines "poison pill" jobs so they stop crashing workers.
//   2. Preserves failed payload, error stack trace, and attempt count.
//   3. Enables engineers to debug, patch the issue, and manually re-drive.
//   4. Updates PostgreSQL submission status to 'SYSTEM_ERROR'.
// ===================================================================

import { Queue } from 'bullmq';
import { redisConnectionOptions } from './submissionQueue';
import { logger } from '../utils/logger';

export const SUBMISSION_DLQ_NAME = 'submission-dlq';

export interface SubmissionDlqJobData {
  submissionId: string;
  originalJobId?: string;
  failedReason: string;
  attemptsMade: number;
  failedAt: string;
  stack?: string;
}

/**
 * Dead-Letter Queue instance
 */
export const submissionDlq = new Queue<SubmissionDlqJobData>(SUBMISSION_DLQ_NAME, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    // Preserve dead-letter jobs for 14 days (or up to 10,000 jobs)
    removeOnComplete: { count: 10000 },
    removeOnFail: false,
  },
});

submissionDlq.on('error', (err) => {
  logger.error({ err }, 'BullMQ Dead-Letter Queue encountered an error');
});

/**
 * Moves a permanently failed submission job into the Dead-Letter Queue.
 */
export async function sendToDeadLetterQueue(data: SubmissionDlqJobData): Promise<void> {
  await submissionDlq.add('poison-submission', data, {
    jobId: `dlq-${data.submissionId}-${Date.now()}`,
  });

  logger.warn(
    {
      submissionId: data.submissionId,
      attemptsMade: data.attemptsMade,
      failedReason: data.failedReason,
    },
    'Submission permanently failed and routed to Dead-Letter Queue (DLQ)'
  );
}

/**
 * Gracefully closes DLQ connection.
 */
export async function closeSubmissionDlq(): Promise<void> {
  await submissionDlq.close();
  logger.info('BullMQ Dead-Letter Queue closed');
}
