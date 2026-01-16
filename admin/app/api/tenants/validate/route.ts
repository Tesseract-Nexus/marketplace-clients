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

    // Validate against tenant service using the internal by-slug endpoint
    // This directly checks if a tenant exists, not just if the slug is reserved
    const response = await fetch(
      `${TENANT_SERVICE_URL}/internal/tenants/by-slug/${encodeURIComponent(normalizedSlug)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service': 'admin-bff', // Required for internal endpoints
        },
        // Internal request, short timeout
        signal: AbortSignal.timeout(5000),
      }
    );

    if (response.ok) {
      const result = await response.json();
      // Tenant exists if we got a successful response with tenant data
      const exists = result.success && result.data?.id;
      const tenantName = result.data?.name;

      // Update cache
      tenantCache.set(normalizedSlug, { exists, timestamp: Date.now() });

      return NextResponse.json(
        { exists, slug: normalizedSlug, name: tenantName },
        {
          status: exists ? 200 : 404,
          headers: {
            'Cache-Control': 'public, max-age=60',
            'X-Cache': 'MISS',
          }
        }
      );
    }

    // 404 means tenant does not exist
    if (response.status === 404) {
      tenantCache.set(normalizedSlug, { exists: false, timestamp: Date.now() });
      return NextResponse.json(
        { exists: false, slug: normalizedSlug },
        {
          status: 404,
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
