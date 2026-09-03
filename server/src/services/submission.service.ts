// ===================================================================
// Submission Service & State Machine
// ===================================================================
// Manages the complete lifecycle of a code submission:
//   1. Validation & Record Creation (Status: QUEUED)
//   2. Immediate async job dispatch (non-blocking HTTP response)
//   3. Transition to RUNNING
//   4. Evaluation via ExecutionEngine
//   5. Terminal State Transition (ACCEPTED, WRONG_ANSWER, TLE, etc.)
//
// SYSTEM DESIGN CONCEPT — Submission State Machine:
//
//                 ┌──────────┐
//                 │  QUEUED  │
//                 └────┬─────┘
//                      │ (Worker picks up job)
//                      ▼
//                 ┌──────────┐
//                 │ RUNNING  │
//                 └────┬─────┘
//                      │ (Execution completes)
//     ┌────────────┬───┴────────┬────────────┬─────────────┐
//     ▼            ▼            ▼            ▼             ▼
//  ACCEPTED  WRONG_ANSWER      TLE          CE        RUNTIME_ERROR
//                                                          / SYSTEM_ERROR
//
// Rules:
// - Terminal states are IMMUTABLE. Once decided, they cannot be updated.
// - Invalid transitions are strictly rejected.
// ===================================================================

import { prisma } from '../config/database';
import { ApiError } from '../utils/ApiError';
import { ExecutionEngine } from '../execution/ExecutionEngine';
import { CreateSubmissionInput } from '../schemas/submission.schema';
import { Language, SubmissionStatus } from '../types';
import { logger } from '../utils/logger';
import { addSubmissionJob } from '../queue/submissionProducer';
import { InfrastructureError } from '../utils/InfrastructureError';
import {
  submissionJobsTotal,
  submissionVerdictsTotal,
  submissionDurationSeconds,
} from '../utils/metrics';

// ─── State Machine Transition Rules ─────────────────────────────────

const VALID_TRANSITIONS: Record<SubmissionStatus, SubmissionStatus[]> = {
  [SubmissionStatus.QUEUED]: [
    SubmissionStatus.RUNNING,
    SubmissionStatus.SYSTEM_ERROR,
  ],
  [SubmissionStatus.RUNNING]: [
    SubmissionStatus.ACCEPTED,
    SubmissionStatus.WRONG_ANSWER,
    SubmissionStatus.TIME_LIMIT_EXCEEDED,
    SubmissionStatus.MEMORY_LIMIT_EXCEEDED,
    SubmissionStatus.COMPILATION_ERROR,
    SubmissionStatus.RUNTIME_ERROR,
    SubmissionStatus.SYSTEM_ERROR,
  ],
  // Terminal states cannot transition to anything
  [SubmissionStatus.ACCEPTED]: [],
  [SubmissionStatus.WRONG_ANSWER]: [],
  [SubmissionStatus.TIME_LIMIT_EXCEEDED]: [],
  [SubmissionStatus.MEMORY_LIMIT_EXCEEDED]: [],
  [SubmissionStatus.COMPILATION_ERROR]: [],
  [SubmissionStatus.RUNTIME_ERROR]: [],
  [SubmissionStatus.SYSTEM_ERROR]: [],
};

/**
 * Validates whether a state machine transition is allowed.
 */
function validateStateTransition(current: SubmissionStatus, next: SubmissionStatus): boolean {
  const allowed = VALID_TRANSITIONS[current] ?? [];
  return allowed.includes(next);
}

// ─── Create Submission (Async Lifecycle) ────────────────────────────

/**
 * Creates a submission record with QUEUED status and triggers execution asynchronously.
 *
 * IMPORTANT ARCHITECTURAL PRINCIPLE:
 * We return the submission ID to the HTTP client IMMEDIATELY.
 * Code execution happens in the background. The client polls /api/submissions/:id
 * for the final verdict.
 */
export async function createSubmission(
  input: CreateSubmissionInput,
  userId: string,
  isAdmin = false
) {
  // 1. Verify that the problem exists and is published
  const problem = await prisma.problem.findUnique({
    where: { id: input.problemId },
    select: { id: true, isPublished: true },
  });

  if (!problem) {
    throw ApiError.notFound('Problem not found');
  }

  if (!problem.isPublished && !isAdmin) {
    throw ApiError.notFound('Problem not found');
  }

  // 2. Insert record in PostgreSQL with status QUEUED
  const submission = await prisma.submission.create({
    data: {
      userId,
      problemId: input.problemId,
      language: input.language,
      sourceCode: input.sourceCode,
      status: SubmissionStatus.QUEUED,
    },
    select: {
      id: true,
      status: true,
      language: true,
      problemId: true,
      createdAt: true,
    },
  });

  // 3. Push evaluation job to BullMQ queue
  // The API server returns HTTP 201 immediately; the worker process handles execution.
  await addSubmissionJob(submission.id);
  submissionJobsTotal.inc({ language: input.language });

  return submission;
}

// ─── Asynchronous Execution Pipeline ────────────────────────────────

/**
 * Background worker task that advances the state machine and executes code.
 * Invoked by BullMQ submission worker.
 */
export async function executeSubmissionAsync(submissionId: string): Promise<void> {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      problem: {
        include: {
          testCases: {
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
    },
  });

  if (!submission) {
    logger.error({ submissionId }, 'Submission not found for async processing');
    return;
  }

  // ─── Optimistic Lock & State Transition Guard ──────────────────────
  // Atomically transition from QUEUED -> RUNNING.
  // Using updateMany ensures that if another worker picked up this job
  // concurrently, only ONE worker succeeds (count === 1).
  const transitionToRunning = await prisma.submission.updateMany({
    where: {
      id: submissionId,
      status: SubmissionStatus.QUEUED, // Guard: MUST be currently QUEUED
    },
    data: { status: SubmissionStatus.RUNNING },
  });

  if (transitionToRunning.count === 0) {
    logger.warn(
      { submissionId, currentStatus: submission.status },
      'Optimistic locking aborted: Submission is no longer in QUEUED state (already claimed or processed)'
    );
    return;
  }

  try {
    // Prepare test case inputs
    const testCaseData = submission.problem.testCases.map((tc) => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      timeLimitMs: tc.timeLimitMs,
      memoryLimitMb: tc.memoryLimitMb,
    }));

    // Run the code through our ExecutionEngine (inside Docker Sandbox)
    const result = await ExecutionEngine.execute(
      submission.language as Language,
      submission.sourceCode,
      testCaseData
    );

    // Guard: Verify transition RUNNING -> Terminal Status
    if (!validateStateTransition(SubmissionStatus.RUNNING, result.status)) {
      logger.error(
        { submissionId, status: result.status },
        'Illegal state transition requested from RUNNING'
      );
      return;
    }

    // ─── Terminal State Immutability Guard ───────────────────────────
    // Atomically transition from RUNNING -> Terminal Verdict.
    // If the submission is no longer RUNNING (e.g. timed out or cancelled),
    // we do NOT overwrite it.
    const finalizeResult = await prisma.submission.updateMany({
      where: {
        id: submissionId,
        status: SubmissionStatus.RUNNING, // Guard: MUST be currently RUNNING
      },
      data: {
        status: result.status,
        executionTimeMs: result.executionTimeMs,
        memoryUsedMb: result.memoryUsedMb,
        errorOutput: result.errorOutput,
        failedTestCaseIndex: result.failedTestCaseIndex,
      },
    });

    if (finalizeResult.count === 0) {
      logger.warn(
        { submissionId, attemptedStatus: result.status },
        'Terminal update aborted: Submission was already finalized or no longer in RUNNING state'
      );
      return;
    }

    logger.info(
      {
        submissionId,
        status: result.status,
        timeMs: result.executionTimeMs,
        failedIndex: result.failedTestCaseIndex,
      },
      'Submission processed successfully and finalized in database'
    );

    // Record execution telemetry
    submissionVerdictsTotal.inc({ language: submission.language, verdict: result.status });
    submissionDurationSeconds.observe(
      { language: submission.language, verdict: result.status },
      (result.executionTimeMs || 0) / 1000
    );
  } catch (error) {
    logger.error({ submissionId, error }, 'Infrastructure failure during code evaluation');

    // Propagate as InfrastructureError to trigger BullMQ exponential retry
    if (error instanceof InfrastructureError) {
      throw error;
    }
    throw new InfrastructureError(
      error instanceof Error ? error.message : 'Internal execution engine failure',
      error
    );
  }
}

// ─── Get Submission Details (Polling endpoint) ──────────────────────

/**
 * Returns submission status and outcome.
 * Regular users can only access their own submissions.
 */
export async function getSubmissionById(
  submissionId: string,
  requestUserId: string,
  isAdmin = false
) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          difficulty: true,
        },
      },
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!submission) {
    throw ApiError.notFound('Submission not found');
  }

  // Authorization check: User can only see their own submission unless Admin
  if (submission.userId !== requestUserId && !isAdmin) {
    throw ApiError.forbidden('Access denied to this submission');
  }

  return submission;
}

// ─── List User Submissions (History) ────────────────────────────────

/**
 * Returns paginated submission history for a specific user.
 */
export async function getUserSubmissions(
  userId: string,
  page = 1,
  limit = 10,
  problemId?: string,
  status?: SubmissionStatus
) {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(50, Number(limit) || 10));

  const where: { userId: string; problemId?: string; status?: SubmissionStatus } = {
    userId,
  };

  if (problemId) {
    where.problemId = problemId;
  }
  if (status) {
    where.status = status;
  }

  const [items, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      select: {
        id: true,
        problemId: true,
        language: true,
        status: true,
        executionTimeMs: true,
        memoryUsedMb: true,
        createdAt: true,
        problem: {
          select: {
            title: true,
            difficulty: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
    }),
    prisma.submission.count({ where }),
  ]);

  return {
    items,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  };
}
