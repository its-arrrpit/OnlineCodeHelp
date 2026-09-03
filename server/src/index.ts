// ===================================================================
// Express API Server — Entry Point
// ===================================================================
// This is the MAIN entry point for the API server.
// It wires up: middleware → routes → error handler → server.listen()
//
// This file should stay small. It only:
//   1. Creates the Express app
//   2. Registers global middleware
//   3. Mounts route modules
//   4. Registers the error handler
//   5. Starts listening
//
// Business logic lives in services/, not here.
// ===================================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { config } from './config/env';
import { connectDatabase, disconnectDatabase, prisma } from './config/database';
import { disconnectRedis, redis } from './config/redis';
import { closeSubmissionQueue, submissionQueue } from './queue/submissionQueue';
import { closeSubmissionDlq } from './queue/submissionDlq';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import { metricsMiddleware } from './middleware/metricsMiddleware';
import { getPrometheusMetrics } from './utils/metrics';

// ─── Create Express App ─────────────────────────────────────────────

const app = express();

// ─── Global Middleware ──────────────────────────────────────────────

// helmet: Sets various HTTP security headers (X-Content-Type-Options,
// X-Frame-Options, etc.) to protect against common web vulnerabilities.
app.use(helmet());

// cors: Allows the React frontend (different origin) to call our API.
// In production, you'd restrict this to your frontend's domain.
app.use(cors());

// Parse JSON request bodies. Limit size to 1MB to prevent abuse.
app.use(express.json({ limit: '1mb' }));

// Prometheus HTTP metrics instrumentation
app.use(metricsMiddleware);

// ─── Health, Readiness & Observability Endpoints ────────────────────

// Liveness probe: returns basic process uptime
app.get('/api/health', (_req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
      },
    },
  });
});

// Readiness probe: performs active pings on PostgreSQL, Redis, and BullMQ
app.get('/api/ready', async (_req, res) => {
  let dbHealthy = false;
  let redisHealthy = false;
  let queueHealthy = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
  } catch (err) {
    logger.error({ err }, 'Readiness check failed on PostgreSQL');
  }

  try {
    const pong = await redis.ping();
    redisHealthy = pong === 'PONG';
  } catch (err) {
    logger.error({ err }, 'Readiness check failed on Redis');
  }

  try {
    const queueClient = await submissionQueue.client;
    queueHealthy = queueClient.status === 'ready' || (await (queueClient as any).ping()) === 'PONG';
  } catch (err) {
    logger.error({ err }, 'Readiness check failed on BullMQ');
  }

  const isReady = dbHealthy && redisHealthy && queueHealthy;

  res.status(isReady ? 200 : 503).json({
    success: isReady,
    data: {
      status: isReady ? 'ready' : 'degraded',
      database: dbHealthy ? 'connected' : 'disconnected',
      redis: redisHealthy ? 'connected' : 'disconnected',
      queue: queueHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
  });
});

// Prometheus scraping endpoint
app.get('/api/metrics', async (_req, res) => {
  try {
    const { metrics, contentType } = await getPrometheusMetrics();
    res.set('Content-Type', contentType);
    res.end(metrics);
  } catch (error) {
    res.status(500).end('# Error collecting metrics');
  }
});

// Admin System Telemetry Status
app.get('/api/system/status', async (_req, res) => {
  try {
    const counts = await submissionQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
    const memory = process.memoryUsage();

    res.json({
      success: true,
      data: {
        queue: counts,
        memory: {
          heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
          rssMb: Math.round(memory.rss / 1024 / 1024),
        },
        uptime: process.uptime(),
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: { message: 'Failed to fetch system status' } });
  }
});

// ─── API Routes ─────────────────────────────────────────────────────

import authRoutes from './routes/auth.routes';
import problemRoutes from './routes/problem.routes';
import { problemTestCaseRouter, testCaseRouter } from './routes/testcase.routes';
import submissionRoutes from './routes/submission.routes';
import * as submissionController from './controllers/submission.controller';
import { authenticate } from './middleware/auth';
import { validate } from './middleware/validate';
import { submissionQuerySchema } from './schemas/submission.schema';
import { asyncHandler } from './utils/helpers';

app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/problems/:problemId/testcases', problemTestCaseRouter);
app.use('/api/testcases', testCaseRouter);
app.use('/api/submissions', submissionRoutes);

// Alias: GET /api/users/me/submissions
app.get(
  '/api/users/me/submissions',
  authenticate,
  validate(submissionQuerySchema, 'query'),
  asyncHandler(submissionController.getMySubmissions)
);

// 404 for unknown API routes — must be after all real routes
app.use('/api/*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'API endpoint not found',
    },
  });
});

// ─── Error Handler ──────────────────────────────────────────────────
// MUST be registered LAST — Express calls error middleware only
// after all other middleware and routes have been tried.

app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────

async function main(): Promise<void> {
  try {
    // Connect to PostgreSQL
    await connectDatabase();

    // Start listening for HTTP requests
    app.listen(config.port, () => {
      logger.info({ port: config.port, env: config.nodeEnv }, 'API server started');
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// ─── Graceful Shutdown ──────────────────────────────────────────────
// When the process receives a termination signal (Ctrl+C, Docker stop),
// we cleanly close database and Redis connections before exiting.
// Without this, connections may leak or transactions may be left open.

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Received shutdown signal');
  await closeSubmissionQueue();
  await closeSubmissionDlq();
  await disconnectDatabase();
  await disconnectRedis();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));   // Ctrl+C
process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker stop / kill

// Start the server
main();
