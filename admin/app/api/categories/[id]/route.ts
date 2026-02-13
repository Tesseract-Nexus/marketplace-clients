import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';
import { cache } from '@/lib/cache/redis';

const CATEGORIES_SERVICE_URL = getServiceUrl('CATEGORIES');

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(id);
}

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
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid category ID' }, { status: 400 });
  }
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
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid category ID' }, { status: 400 });
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

    const response = await proxyToBackend(CATEGORIES_SERVICE_URL, `categories/${id}`, {
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
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid category ID' }, { status: 400 });
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

    const response = await proxyToBackend(CATEGORIES_SERVICE_URL, `categories/${id}`, {
      method: 'DELETE',
      headers: proxyHeaders,
      incomingRequest: request,
    });

    const data = await response.json();

    // PERFORMANCE: Invalidate categories cache for this tenant on successful deletion
    if (response.ok) {
      await cache.delPattern(`categories:${tenantId}*`);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'DELETE categories');
  }
}
