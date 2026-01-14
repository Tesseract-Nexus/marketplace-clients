import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { validateCustomerIdAccess } from '@/lib/server/auth';

const CUSTOMERS_SERVICE_URL = config.api.customersService;

/**
 * GET /api/cart
 * Get cart from backend
 * Note: customerId is extracted from the JWT token, not from query params (IDOR protection)
 */
export async function GET(request: NextRequest) {
  try {
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

    // Extract and validate customer ID from token (IDOR protection)
    // Ignore any customerId passed in query params - use token's customer ID only
    let customerId: string;
    try {
      const validation = validateCustomerIdAccess(null, accessToken);
      customerId = validation.customerId;
    } catch (authError) {
      console.error('[Cart API] Auth validation failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward to customers service
    const response = await fetch(
      `${CUSTOMERS_SERVICE_URL}/customers/${customerId}/cart`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Cart API] Failed to get cart:', error);
      return NextResponse.json({ error: 'Failed to get cart' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Cart API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/cart
 * Sync entire cart to backend
 * Note: customerId is extracted from the JWT token, not from request body (IDOR protection)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId || !items) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
      console.error('[Cart API] Auth validation failed:', authError);
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
      console.error('[Cart API] Failed to sync cart:', error);
      return NextResponse.json({ error: 'Failed to sync cart' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Cart API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/cart
 * Clear cart
 * Note: customerId is extracted from the JWT token, not from query params (IDOR protection)
 */
export async function DELETE(request: NextRequest) {
  try {
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
      console.error('[Cart API] Auth validation failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward to customers service
    const response = await fetch(
      `${CUSTOMERS_SERVICE_URL}/customers/${customerId}/cart`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('[Cart API] Failed to clear cart:', error);
      return NextResponse.json({ error: 'Failed to clear cart' }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Cart API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
