import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPut, CACHE_CONFIG } from '@/lib/utils/api-route-handler';
import { getBFFSession } from '@/app/api/lib/auth-helper';

const CATEGORIES_SERVICE_URL = getServiceUrl('CATEGORIES');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyGet(CATEGORIES_SERVICE_URL, `categories/${id}`, request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyPut(CATEGORIES_SERVICE_URL, `categories/${id}`, request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user info from BFF session for RBAC
    const session = await getBFFSession();
    const userId = session?.user?.id || '';
    const userEmail = session?.user?.email || '';
    const tenantId = request.headers.get('X-Tenant-ID') || request.headers.get('x-tenant-id') || '';

    // Forward to categories service with user context
    const response = await fetch(`${CATEGORIES_SERVICE_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-User-ID': userId,
        'X-User-Email': userEmail,
      },
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    nextResponse.headers.set('Cache-Control', CACHE_CONFIG.NO_CACHE.cacheControl);
    return nextResponse;
  } catch (error) {
    console.error('[Category Delete] Error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to delete category' } },
      { status: 500 }
    );
  }
}
