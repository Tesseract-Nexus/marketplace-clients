import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { getBFFSession } from '@/app/api/lib/auth-helper';
import { CACHE_CONFIG } from '@/lib/utils/api-route-handler';

const CATEGORIES_SERVICE_URL = getServiceUrl('CATEGORIES');

export async function DELETE(request: NextRequest) {
  try {
    // Get user info from BFF session for RBAC
    const session = await getBFFSession();
    const userId = session?.user?.id || '';
    const userEmail = session?.user?.email || '';
    const tenantId = request.headers.get('X-Tenant-ID') || request.headers.get('x-tenant-id') || '';

    // Get request body
    const body = await request.json().catch(() => undefined);

    // Forward to categories service with user context
    const response = await fetch(`${CATEGORIES_SERVICE_URL}/categories/bulk`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-User-ID': userId,
        'X-User-Email': userEmail,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });
    nextResponse.headers.set('Cache-Control', CACHE_CONFIG.NO_CACHE.cacheControl);
    return nextResponse;
  } catch (error) {
    console.error('[Categories Bulk Delete] Error:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to delete categories' } },
      { status: 500 }
    );
  }
}
