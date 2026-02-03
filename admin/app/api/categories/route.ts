import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import { cache } from '@/lib/cache/redis';

const CATEGORIES_SERVICE_URL = getServiceUrl('CATEGORIES');

export async function GET(request: NextRequest) {
  return proxyGet(CATEGORIES_SERVICE_URL, 'categories', request);
}

/**
 * POST /api/categories
 * Create a new category
 *
 * PERFORMANCE: Invalidates categories cache on creation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await proxyToBackend(CATEGORIES_SERVICE_URL, 'categories', {
      method: 'POST',
      body,
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();

    // PERFORMANCE: Invalidate categories cache for this tenant on successful creation
    if (response.ok) {
      const postHeaders = await getProxyHeaders(request) as Record<string, string>;
      const tenantId = postHeaders['x-jwt-claim-tenant-id'] || 'default';
      await cache.delPattern(`categories:${tenantId}*`);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'POST categories');
  }
}
