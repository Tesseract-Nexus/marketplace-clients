import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import { cache } from '@/lib/cache/redis';

const PRODUCTS_SERVICE_URL = getServiceUrl('PRODUCTS');

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(id);
}

/**
 * PUT /api/products/:id/status
 * Update product status (approve, reject, publish, archive, etc.)
 *
 * PERFORMANCE: Invalidates products cache after status update
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!isValidId(id)) {
      return NextResponse.json({ success: false, message: 'Invalid product ID' }, { status: 400 });
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

    const response = await proxyToBackend(PRODUCTS_SERVICE_URL, `products/${id}/status`, {
      method: 'PUT',
      body,
      headers: proxyHeaders,
      incomingRequest: request,
    });

    const data = await response.json();

    // PERFORMANCE: Invalidate products cache for this tenant on successful update
    if (response.ok) {
      // Use pattern without colon before * to match both:
      // - products:tenantId (no params)
      // - products:tenantId:params (with params)
      await cache.delPattern(`products:${tenantId}*`);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'PUT products/:id/status');
  }
}
