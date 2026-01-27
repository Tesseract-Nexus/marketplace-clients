import { NextRequest, NextResponse } from 'next/server';

const ORDERS_SERVICE_URL = (process.env.ORDERS_SERVICE_URL || 'http://localhost:3108').replace(/\/api\/v1\/?$/, '');

interface CancelOrderRequest {
  orderNumber: string;
  reason: string;
}

/**
 * POST /api/orders/cancel
 * Cancel an order by order number.
 * Uses the storefront cancel endpoint which supports both guest and authenticated flows.
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const body: CancelOrderRequest = await request.json();
    if (!body.orderNumber) {
      return NextResponse.json({ error: 'Order number is required' }, { status: 400 });
    }

    // Get access token for authenticated cancel
    const accessToken = request.cookies.get('accessToken')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Call the storefront cancel endpoint
    const response = await fetch(`${ORDERS_SERVICE_URL}/api/v1/storefront/orders/cancel`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderNumber: body.orderNumber,
        reason: body.reason || 'Cancelled by customer',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BFF Orders Cancel] Error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Unable to cancel this order' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF Orders Cancel] Failed:', error);
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
