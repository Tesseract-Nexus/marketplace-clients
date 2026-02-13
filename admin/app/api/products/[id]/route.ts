import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import { cache } from '@/lib/cache/redis';

const PRODUCTS_SERVICE_URL = getServiceUrl('PRODUCTS');

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid product ID' }, { status: 400 });
  }
  return proxyGet(PRODUCTS_SERVICE_URL, `/products/${id}`, request);
}

/**
 * PUT /api/products/:id
 * Update a product by ID
 * PERFORMANCE: Invalidates products cache on update
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid product ID' }, { status: 400 });
  }
  try {
    const proxyHeaders = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = proxyHeaders['x-jwt-claim-tenant-id'];
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Missing tenant context' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const response = await proxyToBackend(PRODUCTS_SERVICE_URL, `/products/${id}`, {
      method: 'PUT',
      body,
      headers: proxyHeaders,
      incomingRequest: request,
    });

    const data = await response.json();

    // PERFORMANCE: Invalidate products cache for this tenant on successful update
    if (response.ok) {
      await cache.delPattern(`products:${tenantId}:*`);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'PUT products');
  }
}

/**
 * DELETE /api/products/:id
 * Delete a product by ID
 * PERFORMANCE: Invalidates products cache on deletion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid product ID' }, { status: 400 });
  }
  try {
    const proxyHeaders = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = proxyHeaders['x-jwt-claim-tenant-id'];
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Missing tenant context' },
        { status: 401 }
      );
    }

    const response = await proxyToBackend(PRODUCTS_SERVICE_URL, `/products/${id}`, {
      method: 'DELETE',
      headers: proxyHeaders,
      incomingRequest: request,
    });

    const data = await response.json();

    // PERFORMANCE: Invalidate products cache for this tenant on successful deletion
    if (response.ok) {
      await cache.delPattern(`products:${tenantId}:*`);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'DELETE products');
  }
}
