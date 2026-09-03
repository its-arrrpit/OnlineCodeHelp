// ===================================================================
// Redis Client Singleton
// ===================================================================
// WHY REDIS?
//   Redis is an in-memory data store. We use it for three things:
//   1. Job Queue — BullMQ uses Redis to store and distribute jobs
//   2. Caching — Problem metadata is cached here (faster than PostgreSQL)
//   3. Rate Limiting — Per-user submission counters with TTL
//
// WHY ioredis?
//   ioredis is the standard Redis client for Node.js. It supports
//   clustering, sentinel, and Lua scripting. BullMQ uses it internally.
//
// TYPESCRIPT CONCEPT — Import Type:
//   `import Redis from 'ioredis'` imports both the class AND the type.
//   We use the class to create an instance, and TypeScript uses the
//   type to check our usage at compile time.
// ===================================================================

import Redis from 'ioredis';
import { config } from './env';
import { logger } from '../utils/logger';

// Create the singleton Redis client
export const redis = new Redis({
  host: config.redisHost,
  port: config.redisPort,
  maxRetriesPerRequest: null, // Required by BullMQ — it handles retries itself
  retryStrategy(times: number): number | null {
    // Exponential backoff: 500ms, 1s, 2s, 4s, ... up to 30s
    const delay = Math.min(times * 500, 30000);
    logger.warn({ attempt: times, delay }, 'Redis connection retry');
    return delay;
  },
});

// ─── Connection Event Handlers ──────────────────────────────────────

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

redis.on('error', (error) => {
  logger.error({ error }, 'Redis connection error');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

/**
 * Gracefully closes the Redis connection.
 * Called during server shutdown.
 */
export async function disconnectRedis(): Promise<void> {
  if (redis.status === 'ready' || redis.status === 'connecting' || redis.status === 'connect') {
    await redis.quit();
  }
  logger.info('Disconnected from Redis');
}
