/**
 * Redis Cache Layer
 * Production-grade caching for scalability
 */

import Redis from 'ioredis'
import { logger } from './logger'

// ============================================================================
// Types
// ============================================================================

interface CacheOptions {
  ttl?: number // Time to live in seconds
  prefix?: string
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_TTL = 300 // 5 minutes
const CACHE_PREFIX = 'petwatch:'

// ============================================================================
// Redis Client
// ============================================================================

let redis: Redis | null = null

function getRedisClient(): Redis | null {
  if (!process.env.REDIS_URL) {
    return null
  }

  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      lazyConnect: true,
    })

    redis.on('error', (err) => {
      logger.error('Redis connection error', err)
    })

    redis.on('connect', () => {
      logger.info('Redis connected')
    })
  }

  return redis
}

// ============================================================================
// In-Memory Fallback Cache
// ============================================================================

const memoryCache = new Map<string, CacheEntry<unknown>>()
const MAX_MEMORY_CACHE_SIZE = 1000

function cleanupMemoryCache() {
  if (memoryCache.size > MAX_MEMORY_CACHE_SIZE) {
    const now = Date.now()
    const toDelete: string[] = []

    memoryCache.forEach((entry, key) => {
      if (now > entry.timestamp + entry.ttl * 1000) {
        toDelete.push(key)
      }
    })

    toDelete.forEach((key) => memoryCache.delete(key))

    // If still too large, delete oldest entries
    if (memoryCache.size > MAX_MEMORY_CACHE_SIZE) {
      const entries = Array.from(memoryCache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      const deleteCount = memoryCache.size - MAX_MEMORY_CACHE_SIZE + 100
      entries.slice(0, deleteCount).forEach(([key]) => memoryCache.delete(key))
    }
  }
}

// ============================================================================
// Cache Class
// ============================================================================

export class Cache {
  private prefix: string
  private defaultTtl: number

  constructor(options: CacheOptions = {}) {
    this.prefix = options.prefix || CACHE_PREFIX
    this.defaultTtl = options.ttl || DEFAULT_TTL
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key)
    const client = getRedisClient()

    try {
      if (client) {
        const data = await client.get(fullKey)
        if (data) {
          return JSON.parse(data) as T
        }
      } else {
        // Fallback to memory cache
        const entry = memoryCache.get(fullKey)
        if (entry) {
          const now = Date.now()
          if (now <= entry.timestamp + entry.ttl * 1000) {
            return entry.data as T
          }
          memoryCache.delete(fullKey)
        }
      }
    } catch (error) {
      logger.error('Cache get error', error, { key: fullKey })
    }

    return null
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const fullKey = this.getKey(key)
    const actualTtl = ttl || this.defaultTtl
    const client = getRedisClient()

    try {
      if (client) {
        await client.setex(fullKey, actualTtl, JSON.stringify(value))
      } else {
        // Fallback to memory cache
        cleanupMemoryCache()
        memoryCache.set(fullKey, {
          data: value,
          timestamp: Date.now(),
          ttl: actualTtl,
        })
      }
    } catch (error) {
      logger.error('Cache set error', error, { key: fullKey })
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    const fullKey = this.getKey(key)
    const client = getRedisClient()

    try {
      if (client) {
        await client.del(fullKey)
      } else {
        memoryCache.delete(fullKey)
      }
    } catch (error) {
      logger.error('Cache delete error', error, { key: fullKey })
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    const fullPattern = this.getKey(pattern)
    const client = getRedisClient()

    try {
      if (client) {
        const keys = await client.keys(fullPattern)
        if (keys.length > 0) {
          await client.del(...keys)
        }
      } else {
        const regex = new RegExp(fullPattern.replace(/\*/g, '.*'))
        const toDelete: string[] = []
        memoryCache.forEach((_, key) => {
          if (regex.test(key)) {
            toDelete.push(key)
          }
        })
        toDelete.forEach((key) => memoryCache.delete(key))
      }
    } catch (error) {
      logger.error('Cache delete pattern error', error, { pattern: fullPattern })
    }
  }

  /**
   * Get or set with callback
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await factory()
    await this.set(key, value, ttl)
    return value
  }

  /**
   * Increment a counter
   */
  async increment(key: string, ttl?: number): Promise<number> {
    const fullKey = this.getKey(key)
    const client = getRedisClient()

    try {
      if (client) {
        const value = await client.incr(fullKey)
        if (ttl && value === 1) {
          await client.expire(fullKey, ttl)
        }
        return value
      } else {
        // Fallback to memory cache
        const entry = memoryCache.get(fullKey)
        const currentValue = (entry?.data as number) || 0
        const newValue = currentValue + 1
        await this.set(key, newValue, ttl)
        return newValue
      }
    } catch (error) {
      logger.error('Cache increment error', error, { key: fullKey })
      return 0
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.getKey(key)
    const client = getRedisClient()

    try {
      if (client) {
        return (await client.exists(fullKey)) === 1
      } else {
        return memoryCache.has(fullKey)
      }
    } catch (error) {
      logger.error('Cache exists error', error, { key: fullKey })
      return false
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const cache = new Cache()

// ============================================================================
// Specialized Caches
// ============================================================================

export const petCache = new Cache({ prefix: 'petwatch:pet:', ttl: 600 }) // 10 minutes
export const userCache = new Cache({ prefix: 'petwatch:user:', ttl: 300 }) // 5 minutes
export const analysisCache = new Cache({ prefix: 'petwatch:analysis:', ttl: 1800 }) // 30 minutes
export const sessionCache = new Cache({ prefix: 'petwatch:session:', ttl: 86400 }) // 24 hours

// ============================================================================
// Cache Keys Helpers
// ============================================================================

export const cacheKeys = {
  pet: (id: string) => `pet:${id}`,
  petList: (userId: string) => `pets:${userId}`,
  healthLogs: (petId: string, date: string) => `healthLogs:${petId}:${date}`,
  analysis: (petId: string) => `analysis:${petId}`,
  subscription: (userId: string) => `subscription:${userId}`,
}

// ============================================================================
// Cache Invalidation Helpers
// ============================================================================

export async function invalidatePetCache(petId: string, userId: string) {
  await Promise.all([
    petCache.delete(cacheKeys.pet(petId)),
    petCache.delete(cacheKeys.petList(userId)),
  ])
}

export async function invalidateHealthCache(petId: string) {
  await Promise.all([
    analysisCache.delete(cacheKeys.analysis(petId)),
    cache.deletePattern(`healthLogs:${petId}:*`),
  ])
}
