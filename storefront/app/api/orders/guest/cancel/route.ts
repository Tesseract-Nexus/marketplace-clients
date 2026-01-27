import { NextRequest, NextResponse } from 'next/server';

const ORDERS_SERVICE_URL =
  process.env.ORDERS_SERVICE_URL || 'http://orders-service:8080';

/**
 * POST /api/orders/guest/cancel
 * BFF proxy for guest order cancellation.
 * Forwards request body to orders-service public endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId =
      request.headers.get('x-tenant-id') ||
      request.headers.get('x-jwt-claim-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: { message: 'Tenant ID is required' } },
        { status: 400 }
      );
    }

    const body = await request.json();

    const response = await fetch(
      `${ORDERS_SERVICE_URL}/api/v1/public/orders/cancel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to cancel guest order:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to cancel order' } },
      { status: 500 }
    );
  }
}
