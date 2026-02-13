import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/api/server-auth';

// Remove /api/v1 suffix if present (env var may include it)
const ORDERS_SERVICE_URL = (process.env.ORDERS_SERVICE_URL || 'http://localhost:3108').replace(/\/api\/v1\/?$/, '');

// GET /api/orders/[orderId] - Get order details
// SECURITY: Authorization header is required and passed to backend for ownership verification
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    let authHeader = request.headers.get('Authorization');
    const customerEmail = request.headers.get('X-Customer-Email');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const hasValidAuthHeader = authHeader && authHeader !== 'Bearer ' && authHeader !== 'Bearer';
    if (!hasValidAuthHeader) {
      const authContext = await getAuthContext(request);
      if (authContext?.token) {
        authHeader = authContext.token;
      }
    }

    // SECURITY: Require either Authorization header or customer email for ownership verification
    // The backend orders-service will validate that the order belongs to this customer
    const hasAuth = !!authHeader && authHeader !== 'Bearer ' && authHeader !== 'Bearer';
    if (!hasAuth && !customerEmail) {
      return NextResponse.json(
        { error: 'Authorization required to view order details' },
        { status: 401 }
      );
    }

    const response = await fetch(`${ORDERS_SERVICE_URL}/api/v1/orders/${orderId}`, {
      headers: {
        'X-Tenant-ID': tenantId,
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        // Pass auth headers to backend for ownership verification
        ...(hasAuth && authHeader ? { Authorization: authHeader } : {}),
        ...(customerEmail && { 'X-Customer-Email': customerEmail }),
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
        { error: (error as { error?: string; message?: string }).error || (error as { message?: string }).message || 'Failed to fetch order' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] Failed to fetch order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
