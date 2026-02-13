import { NextRequest, NextResponse } from 'next/server';
import { cache, cacheKeys, cacheTTL } from '@/lib/cache/redis';
import { RESERVED_TENANT_SLUGS } from '@/lib/constants/slug-reservations';

const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8082';
const RESERVED_TENANT_SLUGS_SET = new Set(RESERVED_TENANT_SLUGS);

interface SlugCheckResponse {
  success: boolean;
  data?: {
    available: boolean;
    slug: string;
    reason?: string;
  };
  message?: string;
  cached?: boolean;
}

/**
 * GET /api/tenants/check-slug?slug=xxx
 * Check if a tenant slug is available
 *
 * PERFORMANCE: Uses Redis caching to avoid hitting tenant-service on every request.
 * Cache TTL: 10 minutes (tenant slugs rarely change)
 */
export async function GET(request: NextRequest): Promise<NextResponse<SlugCheckResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { success: false, message: 'Slug is required' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (slug.length < 3) {
      return NextResponse.json(
        { success: false, data: { available: false, slug, reason: 'Slug must be at least 3 characters' } },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { success: false, data: { available: false, slug, reason: 'Slug can only contain lowercase letters, numbers, and hyphens' } },
        { status: 400 }
      );
    }

    // Reserved slugs that cannot be used
    if (RESERVED_TENANT_SLUGS_SET.has(slug)) {
      return NextResponse.json({
        success: true,
        data: { available: false, slug, reason: 'This slug is reserved' }
      });
    }

    // PERFORMANCE: Check Redis cache first
    const cacheKey = cacheKeys.tenantExists(slug);
    const cachedResult = await cache.get<{ available: boolean; reason?: string }>(cacheKey);

    if (cachedResult !== null) {
      // Cache hit - return immediately
      return NextResponse.json({
        success: true,
        data: { available: cachedResult.available, slug, reason: cachedResult.reason },
        cached: true,
      });
    }

    // Cache miss - check with tenant service
    const response = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/tenants/check-slug?slug=${encodeURIComponent(slug)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      }
    );

    if (response.ok) {
      const result = await response.json();
      // Response format: { success: true, data: { available: boolean, slug: string, reason: string } }
      if (result.success && result.data) {
        // PERFORMANCE: Cache the result in Redis for 10 minutes
        await cache.set(cacheKey, {
          available: result.data.available,
          reason: result.data.reason,
        }, cacheTTL.tenant);

        return NextResponse.json({
          success: true,
          data: {
            available: result.data.available,
            slug,
            reason: result.data.reason,
          },
          cached: false,
        });
      }
    }

    // If we can't reach the service, return unavailable to be safe
    console.error('Failed to check slug availability with tenant service');
    return NextResponse.json(
      { success: false, message: 'Unable to verify slug availability' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return NextResponse.json(
      { success: false, message: 'Error checking slug availability' },
      { status: 500 }
    );
  }
}
