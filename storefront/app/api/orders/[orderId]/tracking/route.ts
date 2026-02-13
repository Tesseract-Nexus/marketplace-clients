import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/api/server-auth';

// Remove /api/v1 suffix if present (env var may include it)
const ORDERS_SERVICE_URL = (process.env.ORDERS_SERVICE_URL || 'http://localhost:3108').replace(/\/api\/v1\/?$/, '');

// GET /api/orders/[orderId]/tracking - Get order tracking info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    let authorization = request.headers.get('Authorization');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const hasValidAuth = authorization && authorization !== 'Bearer ' && authorization !== 'Bearer';
    if (!hasValidAuth) {
      const authContext = await getAuthContext(request);
      if (authContext?.token) {
        authorization = authContext.token;
      }
    }

    const hasAuth = !!authorization && authorization !== 'Bearer ' && authorization !== 'Bearer';
    if (!hasAuth) {
      return NextResponse.json({ error: 'Authorization required to view tracking' }, { status: 401 });
    }

    const response = await fetch(`${ORDERS_SERVICE_URL}/api/v1/orders/${orderId}/tracking`, {
      headers: {
        'X-Tenant-ID': tenantId,
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        ...(hasAuth && authorization ? { Authorization: authorization } : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let error = {};
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText };
      }
      return NextResponse.json(
        { error: (error as { error?: string; message?: string }).error || (error as { message?: string }).message || 'Failed to fetch tracking' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] Failed to fetch order tracking:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
