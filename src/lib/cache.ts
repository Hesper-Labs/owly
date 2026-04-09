/**
 * Cache Abstraction Layer
 *
 * In-memory cache with optional Redis backend.
 * If REDIS_URL is set, uses Redis. Otherwise falls back to in-memory Map.
 * This allows single-instance deployments to work without Redis,
 * while multi-instance deployments can use Redis for shared state.
 */

import { logger } from "@/lib/logger";

interface CacheEntry {
  value: string;
  expiresAt: number | null;
}

// In-memory fallback store
const memoryStore = new Map<string, CacheEntry>();

let redisClient: {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options?: { EX?: number }) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
  keys: (pattern: string) => Promise<string[]>;
} | null = null;

let redisInitialized = false;

async function getRedisClient() {
  if (redisInitialized) return redisClient;
  redisInitialized = true;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    // Dynamic import - only loads if Redis URL is configured
    const { createClient } = await import("redis" as string);
    const client = createClient({ url: redisUrl });
    await client.connect();
    redisClient = client;
    logger.info("Redis connected");
    return client;
  } catch (error) {
    logger.warn("Redis connection failed, using in-memory cache", { error: String(error) });
    return null;
  }
}

/**
 * Get a cached value.
 */
export async function cacheGet(key: string): Promise<string | null> {
  const redis = await getRedisClient();

  if (redis) {
    return redis.get(`owly:${key}`);
  }

  // In-memory fallback (use same prefix as Redis for backend-switch consistency)
  const prefixed = `owly:${key}`;
  const entry = memoryStore.get(prefixed);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memoryStore.delete(prefixed);
    return null;
  }
  return entry.value;
}

/**
 * Set a cached value with optional TTL in seconds.
 */
export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<void> {
  const redis = await getRedisClient();

  if (redis) {
    if (ttlSeconds) {
      await redis.set(`owly:${key}`, value, { EX: ttlSeconds });
    } else {
      await redis.set(`owly:${key}`, value);
    }
    return;
  }

  // In-memory fallback (use same prefix as Redis for backend-switch consistency)
  memoryStore.set(`owly:${key}`, {
    value,
    expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
  });
}

/**
 * Delete a cached value.
 */
export async function cacheDel(key: string): Promise<void> {
  const redis = await getRedisClient();

  if (redis) {
    await redis.del(`owly:${key}`);
    return;
  }

  memoryStore.delete(`owly:${key}`);
}

/**
 * Check if Redis is available.
 */
export async function isCacheDistributed(): Promise<boolean> {
  const redis = await getRedisClient();
  return redis !== null;
}
