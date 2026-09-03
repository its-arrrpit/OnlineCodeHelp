// ===================================================================
// Redis Cache-Aside Service
// ===================================================================
// SYSTEM DESIGN CONCEPT — Cache-Aside Pattern (Lazy Loading):
//
// 1. Application checks Redis cache first (sub-millisecond latency).
// 2. Cache Hit: Return data immediately — zero database load.
// 3. Cache Miss: Query PostgreSQL (source of truth).
// 4. Populate Redis with the fetched data and an expiration TTL.
// 5. Return data to client.
//
// CACHE INVALIDATION:
// When an Admin modifies or deletes a problem, we immediately purge
// the relevant Redis keys (`problem:<id>` and `problems:*`) so users
// never read stale problem statements or constraints.
//
// PRODUCTION RESILIENCE — Fail-Open Architecture:
// If Redis becomes temporarily unreachable, cache operations log a
// warning and fall back directly to PostgreSQL without crashing the user request.
// ===================================================================

import { redis } from '../config/redis';
import { logger } from '../utils/logger';
import { cacheOperationsTotal } from '../utils/metrics';

export class CacheService {
  /**
   * Retrieves an item from Redis cache and parses JSON.
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) {
        cacheOperationsTotal.inc({ operation: 'get', result: 'miss' });
        return null;
      }
      cacheOperationsTotal.inc({ operation: 'get', result: 'hit' });
      return JSON.parse(data) as T;
    } catch (error) {
      cacheOperationsTotal.inc({ operation: 'get', result: 'miss' });
      logger.warn({ key, error }, 'Cache GET failed — falling back to database');
      return null;
    }
  }

  /**
   * Stores an item in Redis cache with an expiration Time-To-Live (TTL).
   *
   * @param key - Cache key (e.g. 'problem:uuid')
   * @param value - Serializable data
   * @param ttlSeconds - Time-To-Live in seconds (default: 3600 = 1 hour)
   */
  static async set<T>(key: string, value: T, ttlSeconds = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await redis.set(key, serialized, 'EX', ttlSeconds);
      cacheOperationsTotal.inc({ operation: 'set', result: 'success' });
    } catch (error) {
      logger.warn({ key, error }, 'Cache SET failed');
    }
  }

  /**
   * Removes a specific key from Redis.
   */
  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
      cacheOperationsTotal.inc({ operation: 'del', result: 'success' });
      logger.debug({ key }, 'Cache key invalidated');
    } catch (error) {
      logger.warn({ key, error }, 'Cache DEL failed');
    }
  }

  /**
   * Invalidates multiple keys matching a pattern using non-blocking SCAN.
   *
   * WHY SCAN INSTEAD OF KEYS?
   * In Redis, `KEYS *` is an O(N) blocking operation that freezes the
   * entire single-threaded Redis server until all keys are examined.
   * `SCAN` is cursor-based and non-blocking, making it safe for production.
   */
  static async delPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        // SCAN returns [nextCursor, matchingKeys[]]
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
          logger.debug({ count: keys.length, pattern }, 'Invalidated keys matching pattern');
        }
      } while (cursor !== '0');
    } catch (error) {
      logger.warn({ pattern, error }, 'Cache delPattern failed');
    }
  }

  /**
   * Implements Cache-Aside: fetches from cache if available, otherwise queries DB,
   * populates cache, and returns.
   */
  static async getOrSet<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const freshData = await fetcher();
    if (freshData !== null && freshData !== undefined) {
      await this.set(key, freshData, ttlSeconds);
    }

    return freshData;
  }
}
