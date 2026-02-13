import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import { cache } from '@/lib/cache/redis';

const CATEGORIES_SERVICE_URL = getServiceUrl('CATEGORIES');

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(id);
}

/**
 * PUT /api/categories/:id/status
 * Update category status (approve, reject, draft, pending)
 *
 * PERFORMANCE: Invalidates categories cache after status update
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, message: 'Invalid category ID' }, { status: 400 });
    }
    const proxyHeaders = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = proxyHeaders['x-jwt-claim-tenant-id'];
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Missing tenant context' },
        { status: 401 }
      );
    }
    const body = await request.json();

    const response = await proxyToBackend(CATEGORIES_SERVICE_URL, `categories/${id}/status`, {
      method: 'PUT',
      body,
      headers: proxyHeaders,
      incomingRequest: request,
    });

    const data = await response.json();

    // PERFORMANCE: Invalidate categories cache for this tenant on successful update
    if (response.ok) {
      await cache.delPattern(`categories:${tenantId}*`);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'PUT categories/:id/status');
  }
}
