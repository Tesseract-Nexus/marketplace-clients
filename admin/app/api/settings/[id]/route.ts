import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders, CACHE_CONFIG } from '@/lib/utils/api-route-handler';
import { cache, cacheKeys } from '@/lib/cache/redis';

const SETTINGS_SERVICE_URL = getServiceUrl('SETTINGS');

/**
 * GET /api/settings/:id
 * Fetch a single setting by ID
 * Uses proxyToBackend which properly extracts JWT claims and forwards Istio headers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get tenant ID for validation from JWT claims
    const proxyHeaders = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = proxyHeaders['x-jwt-claim-tenant-id'];
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Missing tenant ID in JWT claims' },
        { status: 400 }
      );
    }

    const { id } = await params;

    const response = await proxyToBackend(SETTINGS_SERVICE_URL, `settings/${id}`, {
      method: 'GET',
      headers: proxyHeaders,
      incomingRequest: request,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return handleApiError(error, 'GET settings/:id');
  }
}

/**
 * PUT /api/settings/:id
 * Update a setting by ID
 * Uses proxyToBackend which properly extracts JWT claims and forwards Istio headers
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get tenant ID from JWT claims only - NEVER trust client-provided tenant ID
    // SECURITY: Tenant ID must come from authenticated JWT, not request body
    const proxyHeaders = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = proxyHeaders['x-jwt-claim-tenant-id'];

    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Missing tenant ID in JWT claims' },
        { status: 400 }
      );
    }

    const response = await proxyToBackend(SETTINGS_SERVICE_URL, `settings/${id}`, {
      method: 'PUT',
      body,
      headers: proxyHeaders,
      incomingRequest: request,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Invalidate settings cache for this tenant
    await cache.delPattern(`${cacheKeys.settings(tenantId)}*`);

    const nextResponse = NextResponse.json(data);
    nextResponse.headers.set('Cache-Control', CACHE_CONFIG.NO_CACHE.cacheControl);
    return nextResponse;
  } catch (error) {
    console.error('Error updating settings:', error);
    return handleApiError(error, 'PUT settings/:id');
  }
}

/**
 * DELETE /api/settings/:id
 * Delete a setting by ID
 * Uses proxyToBackend which properly extracts JWT claims and forwards Istio headers
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const response = await proxyToBackend(SETTINGS_SERVICE_URL, `settings/${id}`, {
      method: 'DELETE',
      headers: proxyHeaders,
      incomingRequest: request,
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Invalidate settings cache for this tenant
    await cache.delPattern(`${cacheKeys.settings(tenantId)}*`);

    const nextResponse = NextResponse.json(data);
    nextResponse.headers.set('Cache-Control', CACHE_CONFIG.NO_CACHE.cacheControl);
    return nextResponse;
  } catch (error) {
    console.error('Error deleting settings:', error);
    return handleApiError(error, 'DELETE settings/:id');
  }
}
