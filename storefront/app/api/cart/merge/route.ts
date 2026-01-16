import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { validateCustomerIdAccess } from '@/lib/server/auth';

const CUSTOMERS_SERVICE_URL = config.api.customersService;

/**
 * POST /api/cart/merge
 * Merge guest cart with customer cart on login
 * Note: customerId is extracted from the JWT token, not from request body (IDOR protection)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guestItems } = body;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    // Get access token from cookie or header
    const accessToken = request.cookies.get('accessToken')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Extract customer ID from token (IDOR protection)
    let customerId: string;
    try {
      const validation = validateCustomerIdAccess(null, accessToken);
      customerId = validation.customerId;
    } catch (authError) {
      console.error('[Cart Merge API] Auth validation failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward to customers service storefront endpoint
    const response = await fetch(
      `${CUSTOMERS_SERVICE_URL}/api/v1/storefront/customers/${customerId}/cart/merge`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
        },
        body: JSON.stringify({ guestItems }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Cart Merge API] Failed to merge cart:', error);
      return NextResponse.json({ error: 'Failed to merge cart' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Cart Merge API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
