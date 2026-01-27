import { NextRequest, NextResponse } from 'next/server';

const ORDERS_SERVICE_URL =
  process.env.ORDERS_SERVICE_URL || 'http://orders-service:8080';

/**
 * GET /api/orders/guest
 * BFF proxy for guest order lookup.
 * Forwards query params to orders-service public endpoint.
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const url = new URL(
      `${ORDERS_SERVICE_URL}/api/v1/public/orders/lookup`
    );
    // Forward all query params
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Failed to lookup guest order:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to lookup order' } },
      { status: 500 }
    );
  }
}
