// src/lib/cache.ts
import { Redis } from '@upstash/redis'

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return redis
}

/**
 * Cache-aside wrapper. Returns cached value if present, otherwise calls `fn`,
 * stores the result, and returns it.
 *
 * Falls open on Redis errors — if Redis is unavailable the function is called
 * directly so the app never breaks because of a cache outage.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const cached = await getRedis().get<T>(key)
    if (cached !== null) return cached
  } catch {
    // Redis unavailable — fall through to source
  }

  const value = await fn()

  try {
    await getRedis().set(key, value, { ex: ttlSeconds })
  } catch {
    // Redis write failure is non-fatal
  }

  return value
}

/** Explicitly delete a cache key (e.g. on lobby create/delete). */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await getRedis().del(key)
  } catch {
    // Non-fatal
  }
}
