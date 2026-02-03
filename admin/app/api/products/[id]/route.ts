import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import { cache } from '@/lib/cache/redis';

const PRODUCTS_SERVICE_URL = getServiceUrl('PRODUCTS');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  try {
    const body = await request.json();

    const response = await proxyToBackend(PRODUCTS_SERVICE_URL, `/products/${id}`, {
      method: 'PUT',
      body,
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();

    // PERFORMANCE: Invalidate products cache for this tenant on successful update
    if (response.ok) {
      const headers = await getProxyHeaders(request) as Record<string, string>;
      const tenantId = headers['x-jwt-claim-tenant-id'] || 'default';
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
  try {
    const response = await proxyToBackend(PRODUCTS_SERVICE_URL, `/products/${id}`, {
      method: 'DELETE',
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();

    // PERFORMANCE: Invalidate products cache for this tenant on successful deletion
    if (response.ok) {
      const headers = await getProxyHeaders(request) as Record<string, string>;
      const tenantId = headers['x-jwt-claim-tenant-id'] || 'default';
      await cache.delPattern(`products:${tenantId}:*`);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'DELETE products');
  }
}
