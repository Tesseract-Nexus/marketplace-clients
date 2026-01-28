import { NextRequest, NextResponse } from 'next/server';

// Remove /api/v1 suffix if present (env var may include it)
const ORDERS_SERVICE_URL = (process.env.ORDERS_SERVICE_URL || 'http://localhost:3108').replace(/\/api\/v1\/?$/, '');

// POST /api/orders/[orderId]/cancel - Cancel order (customer-facing)
// Uses the storefront cancel endpoint which doesn't require admin RBAC permissions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    console.log('[BFF] Cancelling order:', orderId, 'orderNumber:', body.orderNumber, 'reason:', body.reason);

    const authorization = request.headers.get('Authorization');

    // Use the storefront cancel endpoint which is designed for customer use
    // and doesn't require admin RBAC permissions like orders:cancel
    // The endpoint expects orderNumber (not orderId) in the request body
    const response = await fetch(`${ORDERS_SERVICE_URL}/api/v1/storefront/orders/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-Internal-Service': 'storefront',
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        ...(authorization && { 'Authorization': authorization }),
      },
      body: JSON.stringify({
        orderNumber: body.orderNumber,
        reason: body.reason,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BFF] Cancel order error:', errorText);
      let errorData: Record<string, unknown> = {};
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      // Extract error message from potentially nested error object
      // API may return { error: { message: "..." } } or { error: "..." } or { message: "..." }
      let errorMessage = 'Failed to cancel order';
      if (typeof errorData.error === 'object' && errorData.error !== null) {
        const nestedError = errorData.error as Record<string, unknown>;
        errorMessage = (nestedError.message as string) || (nestedError.code as string) || errorMessage;
      } else if (typeof errorData.error === 'string') {
        errorMessage = errorData.error;
      } else if (typeof errorData.message === 'string') {
        errorMessage = errorData.message;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[BFF] Order cancelled:', orderId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] Failed to cancel order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
