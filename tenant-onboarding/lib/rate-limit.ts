// Shared in-memory rate limiter
// Adequate for single-replica devtest. For production multi-replica deployments,
// migrate to Redis-backed rate limiting or Istio EnvoyFilter at the gateway layer
// (see tesserix-k8s for infrastructure-level rate limiting).

import { NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitRecord>();

// Periodic cleanup to prevent unbounded Map growth
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, record] of store) {
    if (now > record.resetTime) store.delete(key);
  }
}

export interface RateLimitConfig {
  windowMs?: number;   // Time window in milliseconds (default: 60_000 = 1 minute)
  maxRequests?: number; // Max requests per window (default: 100)
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 100;

/**
 * Extract client IP from request headers.
 * Takes the first IP from x-forwarded-for, strips port if present.
 */
export function extractClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    // Take only the first IP (client IP), strip port
    const firstIp = forwarded.split(',')[0].trim();
    // Strip IPv6 bracket port notation [::1]:port or IPv4 ip:port
    return firstIp.replace(/:\d+$/, '').replace(/^\[|\]$/g, '');
  }
  return headers.get('x-real-ip') || 'unknown';
}

/**
 * Check rate limit for an identifier. Returns remaining count and whether the request is allowed.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = {}
): { allowed: boolean; limit: number; remaining: number; resetTime: number } {
  cleanupExpired();

  const windowMs = config.windowMs ?? DEFAULT_WINDOW_MS;
  const maxRequests = config.maxRequests ?? DEFAULT_MAX_REQUESTS;
  const now = Date.now();
  const record = store.get(identifier);

  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    store.set(identifier, { count: 1, resetTime });
    return { allowed: true, limit: maxRequests, remaining: maxRequests - 1, resetTime };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, limit: maxRequests, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return {
    allowed: true,
    limit: maxRequests,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Apply rate limit headers to a response.
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  result: { limit: number; remaining: number; resetTime: number }
): void {
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(Math.max(0, result.remaining)));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));
}

/**
 * Create a 429 Too Many Requests response with rate limit headers.
 */
export function rateLimitExceededResponse(
  result: { limit: number; remaining: number; resetTime: number }
): NextResponse {
  const response = NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { status: 429 }
  );
  applyRateLimitHeaders(response, result);
  return response;
}
