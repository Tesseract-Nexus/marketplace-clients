import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import { cache } from '@/lib/cache/redis';

const CATEGORIES_SERVICE_URL = getServiceUrl('CATEGORIES');

/**
 * GET /api/categories/:id
 * Fetch a single category by ID
 * Uses proxyGet which properly extracts JWT claims and forwards Istio headers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyGet(CATEGORIES_SERVICE_URL, `categories/${id}`, request);
}

/**
 * PUT /api/categories/:id
 * Update a category by ID
 * PERFORMANCE: Invalidates categories cache on update
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();

    const response = await proxyToBackend(CATEGORIES_SERVICE_URL, `categories/${id}`, {
      method: 'PUT',
      body,
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();

    // PERFORMANCE: Invalidate categories cache for this tenant on successful update
    if (response.ok) {
      const headers = await getProxyHeaders(request) as Record<string, string>;
      const tenantId = headers['x-jwt-claim-tenant-id'] || 'default';
      await cache.delPattern(`categories:${tenantId}*`);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'PUT categories');
  }
}

/**
 * DELETE /api/categories/:id
 * Delete a category by ID
 * PERFORMANCE: Invalidates categories cache on deletion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const response = await proxyToBackend(CATEGORIES_SERVICE_URL, `categories/${id}`, {
      method: 'DELETE',
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();

    // PERFORMANCE: Invalidate categories cache for this tenant on successful deletion
    if (response.ok) {
      const headers = await getProxyHeaders(request) as Record<string, string>;
      const tenantId = headers['x-jwt-claim-tenant-id'] || 'default';
      await cache.delPattern(`categories:${tenantId}*`);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'DELETE categories');
  }
}
