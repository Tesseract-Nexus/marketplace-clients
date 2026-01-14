/**
 * Redis Caching Utility for Admin Portal
 *
 * Provides a shared Redis cache across all pods with:
 * - Lazy connection initialization
 * - Automatic reconnection
 * - Graceful fallback to in-memory cache
 * - TTL-based expiration
 * - Namespace isolation per tenant
 *
 * Usage:
 *   import { cache } from '@/lib/cache/redis';
 *   await cache.set('key', { data: 'value' }, 300); // 5 min TTL
 *   const data = await cache.get('key');
 */

import Redis from 'ioredis';

// Cache configuration
// Support both full URL (REDIS_URL) and individual components
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || '6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_DB = process.env.REDIS_DB || '0';

// Construct Redis URL from components or use direct URL
function getRedisUrl(): string | undefined {
  // If full URL is provided, use it directly
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  // If host is provided, construct URL
  if (REDIS_HOST) {
    const auth = REDIS_PASSWORD ? `:${REDIS_PASSWORD}@` : '';
    return `redis://${auth}${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}`;
  }

  return undefined;
}

const REDIS_URL = getRedisUrl();
const CACHE_PREFIX = 'admin:';
const DEFAULT_TTL = 300; // 5 minutes

// In-memory fallback cache (used when Redis is unavailable)
const memoryCache = new Map<string, { value: string; expiresAt: number }>();
const MAX_MEMORY_CACHE_SIZE = 1000;

// Redis client singleton
let redisClient: Redis | null = null;
let isConnecting = false;
let connectionFailed = false;
let lastConnectionAttempt = 0;
const RECONNECT_COOLDOWN = 30000; // 30 seconds between reconnect attempts

/**
 * Get or create Redis client with lazy initialization
 */
function getRedisClient(): Redis | null {
  // If connection previously failed, try again after cooldown
  if (connectionFailed) {
    const now = Date.now();
    if (now - lastConnectionAttempt < RECONNECT_COOLDOWN) {
      return null; // Still in cooldown, use memory cache
    }
    // Reset for retry
    connectionFailed = false;
  }

  // Return existing client if connected
  if (redisClient?.status === 'ready') {
    return redisClient;
  }

  // Don't create new connection if already connecting
  if (isConnecting) {
    return null;
  }

  // No Redis URL configured
  if (!REDIS_URL) {
    console.log('[Cache] REDIS_URL not configured, using memory cache');
    connectionFailed = true;
    return null;
  }

  try {
    isConnecting = true;
    lastConnectionAttempt = Date.now();

    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('[Cache] Redis max retries exceeded');
          connectionFailed = true;
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 3000,
      enableReadyCheck: true,
      enableOfflineQueue: false, // Fail fast when disconnected
    });

    redisClient.on('connect', () => {
      console.log('[Cache] Redis connected');
      connectionFailed = false;
    });

    redisClient.on('error', (err) => {
      console.error('[Cache] Redis error:', err.message);
    });

    redisClient.on('close', () => {
      console.log('[Cache] Redis connection closed');
    });

    // Attempt connection
    redisClient.connect().catch((err) => {
      console.error('[Cache] Redis connection failed:', err.message);
      connectionFailed = true;
      redisClient = null;
    });

    isConnecting = false;
    return redisClient;
  } catch (error) {
    console.error('[Cache] Failed to create Redis client:', error);
    isConnecting = false;
    connectionFailed = true;
    return null;
  }
}

/**
 * Clean up expired entries from memory cache
 */
function cleanupMemoryCache() {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt < now) {
      memoryCache.delete(key);
    }
  }

  // If still too large, remove oldest entries
  if (memoryCache.size > MAX_MEMORY_CACHE_SIZE) {
    const entries = Array.from(memoryCache.entries())
      .sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    const toRemove = entries.slice(0, memoryCache.size - MAX_MEMORY_CACHE_SIZE);
    for (const [key] of toRemove) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Set a value in cache with optional TTL
 */
async function set<T>(key: string, value: T, ttlSeconds: number = DEFAULT_TTL): Promise<boolean> {
  const fullKey = `${CACHE_PREFIX}${key}`;
  const serialized = JSON.stringify(value);

  const client = getRedisClient();

  if (client?.status === 'ready') {
    try {
      await client.setex(fullKey, ttlSeconds, serialized);
      return true;
    } catch (error) {
      console.warn('[Cache] Redis set failed, falling back to memory:', error);
    }
  }

  // Fallback to memory cache
  cleanupMemoryCache();
  memoryCache.set(fullKey, {
    value: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  return true;
}

/**
 * Get a value from cache
 */
async function get<T>(key: string): Promise<T | null> {
  const fullKey = `${CACHE_PREFIX}${key}`;

  const client = getRedisClient();

  if (client?.status === 'ready') {
    try {
      const value = await client.get(fullKey);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      console.warn('[Cache] Redis get failed, falling back to memory:', error);
    }
  }

  // Fallback to memory cache
  const cached = memoryCache.get(fullKey);
  if (cached && cached.expiresAt > Date.now()) {
    return JSON.parse(cached.value) as T;
  }

  // Expired or not found
  if (cached) {
    memoryCache.delete(fullKey);
  }
  return null;
}

/**
 * Delete a key from cache
 */
async function del(key: string): Promise<boolean> {
  const fullKey = `${CACHE_PREFIX}${key}`;

  const client = getRedisClient();

  if (client?.status === 'ready') {
    try {
      await client.del(fullKey);
    } catch (error) {
      console.warn('[Cache] Redis del failed:', error);
    }
  }

  // Also delete from memory cache
  memoryCache.delete(fullKey);
  return true;
}

/**
 * Delete all keys matching a pattern
 */
async function delPattern(pattern: string): Promise<boolean> {
  const fullPattern = `${CACHE_PREFIX}${pattern}`;

  const client = getRedisClient();

  if (client?.status === 'ready') {
    try {
      const keys = await client.keys(fullPattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      console.warn('[Cache] Redis delPattern failed:', error);
    }
  }

  // Also clean memory cache
  const regex = new RegExp('^' + fullPattern.replace(/\*/g, '.*'));
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
  return true;
}

/**
 * Get or set a value with a factory function
 * This is the most common pattern for caching
 */
async function getOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL
): Promise<T> {
  // Try to get from cache first
  const cached = await get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Not in cache, call factory
  const value = await factory();

  // Store in cache (fire and forget)
  set(key, value, ttlSeconds).catch((err) => {
    console.warn('[Cache] Failed to cache value:', err);
  });

  return value;
}

/**
 * Cache key builders for common entities
 */
export const cacheKeys = {
  // Tenant validation cache
  tenantExists: (slug: string) => `tenant:exists:${slug}`,
  tenantData: (slug: string) => `tenant:data:${slug}`,

  // API response caches (per tenant)
  orders: (tenantId: string, params?: string) =>
    `orders:${tenantId}${params ? `:${params}` : ''}`,
  products: (tenantId: string, params?: string) =>
    `products:${tenantId}${params ? `:${params}` : ''}`,
  customers: (tenantId: string, params?: string) =>
    `customers:${tenantId}${params ? `:${params}` : ''}`,
  categories: (tenantId: string) => `categories:${tenantId}`,
  reviews: (tenantId: string, params?: string) =>
    `reviews:${tenantId}${params ? `:${params}` : ''}`,

  // Dashboard data (aggregated)
  dashboard: (tenantId: string) => `dashboard:${tenantId}`,
  analytics: (tenantId: string, preset: string) =>
    `analytics:${tenantId}:${preset}`,

  // Settings (rarely change)
  settings: (tenantId: string) => `settings:${tenantId}`,
  countries: () => 'location:countries',
  currencies: () => 'location:currencies',
};

/**
 * TTL presets for different data types
 */
export const cacheTTL = {
  // Tenant validation - long cache (rarely changes)
  tenant: 10 * 60, // 10 minutes

  // Dynamic data - short cache
  orders: 30, // 30 seconds
  products: 60, // 1 minute
  customers: 60, // 1 minute
  reviews: 60, // 1 minute

  // Dashboard - moderate cache
  dashboard: 60, // 1 minute
  analytics: 2 * 60, // 2 minutes

  // Static data - long cache
  settings: 5 * 60, // 5 minutes
  countries: 24 * 60 * 60, // 24 hours
  categories: 5 * 60, // 5 minutes
};

/**
 * Check if Redis is connected
 */
function isConnected(): boolean {
  return redisClient?.status === 'ready';
}

/**
 * Get cache stats for monitoring
 */
function getStats(): { redis: boolean; memorySize: number } {
  return {
    redis: isConnected(),
    memorySize: memoryCache.size,
  };
}

// Export cache interface
export const cache = {
  get,
  set,
  del,
  delPattern,
  getOrSet,
  isConnected,
  getStats,
};

export default cache;
