// ===================================================================
// HTTP Metrics Middleware
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { httpRequestDurationSeconds, httpRequestsTotal } from '../utils/metrics';

/**
 * Express middleware to record request duration and status metrics.
 * Normalizes parameterized paths to avoid high-cardinality metric explosion.
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationSeconds = diff[0] + diff[1] / 1e9;

    // Normalize path to route pattern (e.g., req.route?.path or regex normalization)
    let route = req.route?.path || req.baseUrl || req.path;
    
    // Replace UUIDs and numeric IDs in route to prevent label cardinality explosion
    route = route
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
      .replace(/\/\d+/g, '/:id');

    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
  });

  next();
}
