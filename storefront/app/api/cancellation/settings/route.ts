import { NextRequest, NextResponse } from 'next/server';

// Remove /api/v1 suffix if present (env var may include it)
const ORDERS_SERVICE_URL = (process.env.ORDERS_SERVICE_URL || 'http://localhost:3108').replace(/\/api\/v1\/?$/, '');

// GET /api/cancellation/settings - Get cancellation settings for storefront
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.nextUrl.searchParams.get('tenantId') || request.headers.get('X-Tenant-ID');
    const storefrontId = request.nextUrl.searchParams.get('storefrontId') || request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 400 });
    }

    const queryParams = new URLSearchParams();
    queryParams.set('tenantId', tenantId);
    if (storefrontId) {
      queryParams.set('storefrontId', storefrontId);
    }

    console.log('[BFF] Fetching cancellation settings for tenant:', tenantId, 'storefront:', storefrontId);

    const response = await fetch(
      `${ORDERS_SERVICE_URL}/api/v1/public/settings/cancellation?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Internal-Service': 'storefront',
          ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BFF] Cancellation settings error:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch cancellation settings' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[BFF] Cancellation settings fetched successfully');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF] Failed to fetch cancellation settings:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
