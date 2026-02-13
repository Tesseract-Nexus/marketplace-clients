import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { validateCustomerIdAccess } from '@/lib/server/auth';

const CUSTOMERS_SERVICE_URL = config.api.customersService;

/**
 * POST /api/cart/sync
 * Sync cart to backend - used by sendBeacon on page unload
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tenantId: tenantIdFromBody, storefrontId: storefrontIdFromBody, customerId, items } = body;
    const tenantId = request.headers.get('X-Tenant-ID') || tenantIdFromBody;
    const storefrontId = request.headers.get('X-Storefront-ID') || storefrontIdFromBody;

    if (!tenantId || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get access token from cookie or header
    const accessToken = request.cookies.get('accessToken')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Validate customer ID against token (IDOR protection)
    let resolvedCustomerId: string;
    try {
      const validation = validateCustomerIdAccess(customerId || null, accessToken);
      resolvedCustomerId = validation.customerId;
    } catch (authError) {
      console.error('[Cart Sync API] Auth validation failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward to customers service storefront endpoint
    const response = await fetch(
      `${CUSTOMERS_SERVICE_URL}/api/v1/storefront/customers/${resolvedCustomerId}/cart`,
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
