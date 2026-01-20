import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders, CACHE_CONFIG } from '@/lib/utils/api-route-handler';
import { cache, cacheKeys, cacheTTL } from '@/lib/cache/redis';

const SETTINGS_SERVICE_URL = getServiceUrl('SETTINGS');

/**
 * GET /api/settings
 * List settings with caching
 * Uses proxyToBackend which properly extracts JWT claims and forwards Istio headers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Get tenant ID from JWT claims
    const proxyHeaders = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = proxyHeaders['x-jwt-claim-tenant-id'];
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Missing tenant ID in JWT claims' },
        { status: 400 }
      );
    }

    // Build cache key from tenant ID and query params
    const cacheKey = `${cacheKeys.settings(tenantId)}:list${queryString ? `:${queryString}` : ''}`;

    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const response = await proxyToBackend(SETTINGS_SERVICE_URL, 'settings', {
      method: 'GET',
      params: searchParams,
      headers: proxyHeaders,
      incomingRequest: request,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Cache the successful response
    await cache.set(cacheKey, data, cacheTTL.settings);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return handleApiError(error, 'GET settings');
  }
}

/**
 * POST /api/settings
 * Create a new setting
 * Uses proxyToBackend which properly extracts JWT claims and forwards Istio headers
 */
export async function POST(request: NextRequest) {
  try {
    // Get tenant ID for cache invalidation from JWT claims
    const proxyHeaders = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = proxyHeaders['x-jwt-claim-tenant-id'];
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Missing tenant ID in JWT claims' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const response = await proxyToBackend(SETTINGS_SERVICE_URL, 'settings', {
      method: 'POST',
      body,
      headers: proxyHeaders,
      incomingRequest: request,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Invalidate settings cache for this tenant after creating new settings
    await cache.delPattern(`${cacheKeys.settings(tenantId)}*`);

    const nextResponse = NextResponse.json(data);
    nextResponse.headers.set('Cache-Control', CACHE_CONFIG.NO_CACHE.cacheControl);
    return nextResponse;
  } catch (error) {
    console.error('Error creating settings:', error);
    return handleApiError(error, 'POST settings');
  }
}
