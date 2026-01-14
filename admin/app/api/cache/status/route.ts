import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache/redis';

/**
 * GET /api/cache/status
 * Returns the current cache status for monitoring
 *
 * Response:
 * - redis: boolean - whether Redis is connected
 * - memorySize: number - size of fallback memory cache
 */
export async function GET() {
  const stats = cache.getStats();

  return NextResponse.json({
    success: true,
    data: {
      redis: {
        connected: stats.redis,
        status: stats.redis ? 'connected' : 'disconnected',
      },
      memoryCache: {
        size: stats.memorySize,
        maxSize: 1000,
      },
      timestamp: new Date().toISOString(),
    },
  });
}
