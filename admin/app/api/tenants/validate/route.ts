import { NextRequest, NextResponse } from 'next/server';

const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8082';

// Simple in-memory cache for tenant validation
// In production, consider using Redis or Vercel KV
const tenantCache = new Map<string, { exists: boolean; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute cache

interface ValidateResponse {
  exists: boolean;
  slug?: string;
  name?: string;
  error?: string;
}

/**
 * GET /api/tenants/validate?slug=xxx
 *
 * Validates if a tenant exists and is active.
 * Used by middleware to block access to non-existent tenants.
 *
 * This is a critical security endpoint that prevents access to
 * arbitrary subdomains when using wildcard DNS/SSL.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ValidateResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { exists: false, error: 'Slug is required' },
        { status: 400 }
      );
    }

    // Normalize slug
    const normalizedSlug = slug.toLowerCase().trim();

    // Check cache first
    const cached = tenantCache.get(normalizedSlug);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(
        { exists: cached.exists, slug: normalizedSlug },
        {
          status: cached.exists ? 200 : 404,
          headers: {
            'Cache-Control': 'public, max-age=60', // Browser cache for 1 minute
            'X-Cache': 'HIT',
          }
        }
      );
    }

    // Validate against tenant service
    // Using the existing check-slug endpoint but inverting the logic
    // If slug is NOT available, it means a tenant with that slug EXISTS
    const response = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/tenants/check-slug?slug=${encodeURIComponent(normalizedSlug)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Internal request, short timeout
        signal: AbortSignal.timeout(5000),
      }
    );

    if (response.ok) {
      const result = await response.json();
      // If slug is available, tenant does NOT exist
      // If slug is NOT available, tenant EXISTS
      const exists = result.success && result.data && !result.data.available;

      // Update cache
      tenantCache.set(normalizedSlug, { exists, timestamp: Date.now() });

      return NextResponse.json(
        { exists, slug: normalizedSlug },
        {
          status: exists ? 200 : 404,
          headers: {
            'Cache-Control': 'public, max-age=60',
            'X-Cache': 'MISS',
          }
        }
      );
    }

    // Service unavailable - fail open for now (allow access)
    // In production, you might want to fail closed
    console.error('[Tenant Validate] Service unavailable');
    return NextResponse.json(
      { exists: true, slug: normalizedSlug, error: 'Service unavailable, allowing access' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store', // Don't cache errors
        }
      }
    );
  } catch (error) {
    console.error('[Tenant Validate] Error:', error);
    // Fail open - allow access on error
    return NextResponse.json(
      { exists: true, error: 'Validation error' },
      { status: 200 }
    );
  }
}
