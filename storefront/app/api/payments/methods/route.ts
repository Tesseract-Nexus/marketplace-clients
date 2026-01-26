import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ORDERS_SERVICE_URL = process.env.ORDERS_SERVICE_INTERNAL_URL || 'http://orders-service:8080';

/**
 * GET /api/payments/methods
 * Fetches enabled payment methods for the storefront checkout
 * Query params:
 * - region: Filter by region (e.g., AU, IN, US)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || '';

    // Get tenant ID from request headers (set by middleware)
    const tenantId = request.headers.get('x-tenant-id') || request.headers.get('x-jwt-claim-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: { message: 'Tenant ID is required' } },
        { status: 400 }
      );
    }

    // Build URL for storefront endpoint
    const url = new URL(`${ORDERS_SERVICE_URL}/api/v1/storefront/payments/methods`);
    if (region) {
      url.searchParams.set('region', region);
    }

    // Forward request to orders service
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-jwt-claim-tenant-id': tenantId,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch payment methods:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch payment methods' } },
      { status: 500 }
    );
  }
}
