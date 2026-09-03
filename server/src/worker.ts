// ===================================================================
// Worker Process — Entry Point
// ===================================================================
// This runs as a completely SEPARATE, independent OS process from the
// Express API server.
//
// ARCHITECTURAL SEPARATION:
//   API Server:
//     - Starts via `src/index.ts` (npm run dev)
//     - Fast I/O bound HTTP handling (Auth, CRUD, Enqueueing)
//     - NEVER runs user code, compilers, or Docker containers
//
//   Worker:
//     - Starts via `src/worker.ts` (npm run dev:worker)
//     - CPU and memory intensive (spawns Docker sandboxes, runs compilers)
//     - Dequeues jobs from Redis via BullMQ
//     - Updates PostgreSQL with execution results
//
// WHY THIS WINS IN SYSTEM DESIGN INTERVIEWS:
//   1. Blast Radius Isolation: A crashed container or memory spike in
//      the worker cannot kill the API server or drop user HTTP connections.
//   2. Independent Auto-Scaling: If 1,000 students submit code during a contest,
//      we can scale workers from 2 to 20 without wasting money on API instances.
//   3. Hardware Specialization: Workers can run on compute-optimized VMs
//      (e.g., AWS c6i) while APIs run on general-purpose VMs (e.g., t4g).
//   4. Graceful Draining: On deploy, workers stop accepting new jobs and
//      wait for active Docker evaluations to finish before exiting.
// ===================================================================

import { Worker } from 'bullmq';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { disconnectRedis } from './config/redis';
import { createSubmissionWorker } from './queue/submissionConsumer';
import { SubmissionJobData } from './queue/submissionQueue';
import { closeSubmissionDlq } from './queue/submissionDlq';
import { logger } from './utils/logger';

let workerInstance: Worker<SubmissionJobData> | null = null;
let isShuttingDown = false;

async function main(): Promise<void> {
  try {
    // 1. Establish PostgreSQL connection
    await connectDatabase();

    // 2. Start the BullMQ worker consumer (concurrency = 2)
    const concurrency = 2;
    workerInstance = createSubmissionWorker(concurrency);

    logger.info(
      {
        env: config.nodeEnv,
        concurrency,
        useDocker: config.useDocker,
      },
      '🚀 Online Code Judge Worker started successfully — listening for submission jobs'
    );
  } catch (error) {
    logger.error({ error }, 'Fatal error during worker initialization');
    process.exit(1);
  }
}

// ─── Graceful Shutdown ──────────────────────────────────────────────
// When Kubernetes / Docker / PM2 / developer sends SIGTERM or SIGINT:
// 1. worker.close() stops polling Redis and waits for active jobs to finish.
// 2. Database connections are closed.
// 3. Redis connections are closed.
// 4. Process exits cleanly with code 0.

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, 'Worker received shutdown signal — draining active jobs...');

  try {
    if (workerInstance) {
      // BullMQ worker.close() gracefully waits for in-flight jobs to complete
      await workerInstance.close();
      logger.info('All active jobs drained. Worker closed.');
    }

    await closeSubmissionDlq();
    await disconnectDatabase();
    await disconnectRedis();
    logger.info('Worker shutdown completed cleanly');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during worker graceful shutdown');
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception in worker process');
  shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection in worker process');
  shutdown('UNHANDLED_REJECTION');
});

main();
