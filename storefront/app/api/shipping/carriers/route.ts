import { NextRequest, NextResponse } from 'next/server';

const SHIPPING_SERVICE_URL = process.env.SHIPPING_SERVICE_URL || 'http://shipping-service:8080';

/**
 * GET /api/shipping/carriers
 * Fetches available shipping carriers configured via admin panel.
 *
 * Query params:
 * - country: Filter by country code (e.g., IN, US, AU)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || '';

    const tenantId =
      request.headers.get('x-tenant-id') ||
      request.headers.get('x-jwt-claim-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: { message: 'Tenant ID is required' } },
        { status: 400 }
      );
    }

    const baseUrl = SHIPPING_SERVICE_URL.replace(/\/api\/v1$/, '');
    const url = new URL(`${baseUrl}/api/carriers/available`);
    if (country) {
      url.searchParams.set('country', country);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-jwt-claim-tenant-id': tenantId,
        'X-Tenant-ID': tenantId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Shipping Service error:', response.status, errorData);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: errorData.message || 'Failed to fetch shipping carriers',
          },
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const carriers = data.carriers || [];

    return NextResponse.json({
      success: true,
      data: {
        carriers,
        country,
        carrierCount: carriers.length,
      },
    });
  } catch (error) {
    console.error('Failed to fetch shipping carriers:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch shipping carriers' } },
      { status: 500 }
    );
  }
}
