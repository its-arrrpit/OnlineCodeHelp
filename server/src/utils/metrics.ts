// ===================================================================
// Prometheus Metrics & Observability Registry
// ===================================================================

import client from 'prom-client';
import { submissionQueue } from '../queue/submissionQueue';

// Create a dedicated Prometheus Registry
export const register = new client.Registry();

// Enable default Node.js runtime metrics (event loop lag, memory, CPU, GC)
client.collectDefaultMetrics({
  register,
  prefix: 'codejudge_',
});

// ─── 1. HTTP Request Metrics ────────────────────────────────────────

export const httpRequestDurationSeconds = new client.Histogram({
  name: 'codejudge_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});
register.registerMetric(httpRequestDurationSeconds);

export const httpRequestsTotal = new client.Counter({
  name: 'codejudge_http_requests_total',
  help: 'Total count of HTTP requests handled by the API server',
  labelNames: ['method', 'route', 'status_code'] as const,
});
register.registerMetric(httpRequestsTotal);

// ─── 2. Submission & Execution Telemetry ─────────────────────────────

export const submissionJobsTotal = new client.Counter({
  name: 'codejudge_submissions_total',
  help: 'Total code submissions received and enqueued',
  labelNames: ['language'] as const,
});
register.registerMetric(submissionJobsTotal);

export const submissionVerdictsTotal = new client.Counter({
  name: 'codejudge_submission_verdicts_total',
  help: 'Total submission outcomes by language and verdict',
  labelNames: ['language', 'verdict'] as const,
});
register.registerMetric(submissionVerdictsTotal);

export const submissionDurationSeconds = new client.Histogram({
  name: 'codejudge_submission_execution_duration_seconds',
  help: 'Execution duration of sandboxed code executions',
  labelNames: ['language', 'verdict'] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
});
register.registerMetric(submissionDurationSeconds);

// ─── 3. Cache & Rate Limit Telemetry ────────────────────────────────

export const cacheOperationsTotal = new client.Counter({
  name: 'codejudge_cache_operations_total',
  help: 'Redis Cache-Aside operations breakdown',
  labelNames: ['operation', 'result'] as const, // result: 'hit' | 'miss' | 'success'
});
register.registerMetric(cacheOperationsTotal);

export const rateLimitRejectionsTotal = new client.Counter({
  name: 'codejudge_rate_limit_rejections_total',
  help: 'Total requests blocked by Redis rate limiting (HTTP 429)',
  labelNames: ['endpoint'] as const,
});
register.registerMetric(rateLimitRejectionsTotal);

// ─── 4. BullMQ Distributed Queue Telemetry ──────────────────────────

export const queueJobsGauge = new client.Gauge({
  name: 'codejudge_queue_jobs',
  help: 'Current count of jobs in the BullMQ submission queue',
  labelNames: ['state'] as const, // 'waiting' | 'active' | 'completed' | 'failed' | 'delayed'
});
register.registerMetric(queueJobsGauge);

/**
 * Updates queue depth gauges before Prometheus scrapes.
 */
export async function updateQueueMetrics(): Promise<void> {
  try {
    const counts = await submissionQueue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
    queueJobsGauge.set({ state: 'waiting' }, counts.waiting || 0);
    queueJobsGauge.set({ state: 'active' }, counts.active || 0);
    queueJobsGauge.set({ state: 'completed' }, counts.completed || 0);
    queueJobsGauge.set({ state: 'failed' }, counts.failed || 0);
    queueJobsGauge.set({ state: 'delayed' }, counts.delayed || 0);
  } catch {
    // Fail silently if queue is temporarily unreachable
  }
}

/**
 * Scrapes all registered metrics and formats as Prometheus text.
 */
export async function getPrometheusMetrics(): Promise<{ metrics: string; contentType: string }> {
  await updateQueueMetrics();
  const metrics = await register.metrics();
  return {
    metrics,
    contentType: register.contentType,
  };
}
