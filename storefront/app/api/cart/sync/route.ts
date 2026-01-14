import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const CUSTOMERS_SERVICE_URL = config.api.customersService;

/**
 * POST /api/cart/sync
 * Sync cart to backend - used by sendBeacon on page unload
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId, storefrontId, customerId, items } = body;

    if (!tenantId || !customerId || !items) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get access token from cookie or header
    const accessToken = request.cookies.get('accessToken')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward to customers service
    const response = await fetch(
      `${CUSTOMERS_SERVICE_URL}/customers/${customerId}/cart`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
        },
        body: JSON.stringify({ items }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Cart Sync API] Failed to sync cart:', error);
      return NextResponse.json({ error: 'Failed to sync cart' }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Cart Sync API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
