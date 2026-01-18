import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import { cache, cacheKeys, cacheTTL } from '@/lib/cache/redis';

const SETTINGS_SERVICE_URL = getServiceUrl('SETTINGS');

/**
 * GET /api/settings/context
 * Fetch settings by context
 * Uses proxyToBackend which properly extracts JWT claims and forwards Istio headers
 */
export async function GET(request: NextRequest) {
  try {
    // Get tenant ID for validation and caching from JWT claims
    const proxyHeaders = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = proxyHeaders['x-jwt-claim-tenant-id'];
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Missing tenant ID in JWT claims' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Build cache key from tenant ID and query params
    const cacheKey = cacheKeys.settings(tenantId) + (queryString ? `:${queryString}` : '');

    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const response = await proxyToBackend(SETTINGS_SERVICE_URL, 'api/v1/settings/context', {
      method: 'GET',
      params: searchParams,
      headers: await getProxyHeaders(request),
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
    console.error('Error fetching settings by context:', error);
    return handleApiError(error, 'GET settings/context');
  }
}
