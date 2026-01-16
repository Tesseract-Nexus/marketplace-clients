import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import { cache } from '@/lib/cache/redis';

const CATEGORIES_SERVICE_URL = getServiceUrl('CATEGORIES');

/**
 * PUT /api/categories/bulk/status
 * Bulk update category status for multiple categories
 *
 * PERFORMANCE: Invalidates categories cache after status update
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await proxyToBackend(CATEGORIES_SERVICE_URL, 'categories/bulk', {
      method: 'PUT',
      body,
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();

    // PERFORMANCE: Invalidate categories cache for this tenant on successful update
    if (response.ok) {
      const tenantId = request.headers.get('X-Tenant-ID') || 'default';
      await cache.delPattern(`categories:${tenantId}*`);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'PUT categories/bulk/status');
  }
}
