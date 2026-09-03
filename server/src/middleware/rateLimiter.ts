// ===================================================================
// Redis-Backed Distributed Rate Limiter
// ===================================================================
// SYSTEM DESIGN CONCEPT — Distributed Rate Limiting:
//
// In-memory rate limiters (such as express-rate-limit default memory store)
// maintain counts in local server memory. When the application scales to
// multiple API server instances behind a load balancer:
//   - Instance 1 sees 3 requests
//   - Instance 2 sees 3 requests
//   - Total requests = 6, but neither instance trips a threshold of 5!
//
// By storing rate counters in centralized Redis, all API instances share
// the exact same state, enforcing true global per-user rate limits.
//
// ALGORITHM: Fixed Window with Expiration
//   - Redis Key: `ratelimit:submissions:<userId | ip>`
//   - Atomic INCR + EXPIRE
//   - Response Headers:
//       X-RateLimit-Limit: 5
//       X-RateLimit-Remaining: 2
//       Retry-After: 42
//   - Fail-Open: If Redis is down, we log and allow traffic rather than
//     causing a cascading outage.
// ===================================================================

import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { config } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { rateLimitRejectionsTotal } from '../utils/metrics';

interface RateLimitOptions {
  windowSeconds?: number;
  limit?: number;
  keyPrefix?: string;
}

/**
 * Creates a rate limiting middleware backed by Redis.
 *
 * @param options - Configuration options (window in seconds, limit, prefix)
 */
export function rateLimiter(options: RateLimitOptions = {}) {
  const windowSeconds = options.windowSeconds ?? 60; // 1 minute window
  const limit = options.limit ?? config.rateLimitSubmissions ?? 5;
  const keyPrefix = options.keyPrefix ?? 'ratelimit:submissions';

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Identify user by JWT userId if authenticated, fallback to IP
    const identifier = req.user?.userId || req.ip || 'anonymous';
    const key = `${keyPrefix}:${identifier}`;

    try {
      // Atomic pipeline: increment counter and inspect TTL
      const pipeline = redis.pipeline();
      pipeline.incr(key);
      pipeline.ttl(key);
      const results = await pipeline.exec();

      if (!results || results.length < 2 || !results[0] || !results[1]) {
        return next();
      }

      const [incrErr, countResult] = results[0];
      const [ttlErr, ttlResult] = results[1];

      if (incrErr || ttlErr) {
        logger.warn({ incrErr, ttlErr }, 'Redis error in rateLimiter — failing open');
        return next();
      }

      const currentCount = Number(countResult);
      let currentTtl = Number(ttlResult);

      // If key is newly created (TTL is -1), set the expiration window
      if (currentTtl === -1) {
        await redis.expire(key, windowSeconds);
        currentTtl = windowSeconds;
      }

      const remaining = Math.max(0, limit - currentCount);

      // Standard Rate-Limit HTTP Headers (RFC 6585)
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + currentTtl);

      if (currentCount > limit) {
        rateLimitRejectionsTotal.inc({ endpoint: keyPrefix });
        res.setHeader('Retry-After', currentTtl);
        logger.warn(
          { identifier, currentCount, limit, currentTtl },
          'Rate limit exceeded for client'
        );
        throw ApiError.tooManyRequests(
          `Too many submissions. Maximum ${limit} submissions per ${windowSeconds}s. Please retry in ${currentTtl} seconds.`
        );
      }

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        return next(error);
      }
      // Fail-open: Do not block legitimate users if Redis is temporarily unreachable
      logger.warn({ error, identifier }, 'Rate limiter encountered unexpected error — failing open');
      next();
    }
  };
}

/**
 * Preconfigured rate limiter for code submission endpoints:
 * 5 submissions per 60 seconds per user.
 */
export const submissionRateLimiter = rateLimiter({
  windowSeconds: 60,
  limit: config.rateLimitSubmissions,
  keyPrefix: 'ratelimit:submissions',
});
