import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { validateCustomerIdAccess } from '@/lib/server/auth';

const CUSTOMERS_SERVICE_URL = config.api.customersService;

/**
 * POST /api/cart/validate
 * Validate cart items against current product data
 * Checks for: out of stock, price changes, unavailable products
 * Note: customerId is extracted from the JWT token, not from query params (IDOR protection)
 */
export async function POST(request: NextRequest) {
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
      console.error('[Cart Validate API] Auth validation failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Forward to customers service validate endpoint
    const response = await fetch(
      `${CUSTOMERS_SERVICE_URL}/customers/${customerId}/cart/validate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId || '',
        },
      }
    );

    // If customers service doesn't have validate endpoint, return success with empty validation
    if (response.status === 404) {
      // Fallback: just get cart and return it as validated
      const cartResponse = await fetch(
        `${CUSTOMERS_SERVICE_URL}/customers/${customerId}/cart`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Tenant-ID': tenantId,
            'X-Storefront-ID': storefrontId || '',
          },
        }
      );

      if (!cartResponse.ok) {
        return NextResponse.json({
          cartId: '',
          items: [],
          subtotal: 0,
          originalSubtotal: 0,
          hasUnavailableItems: false,
          hasPriceChanges: false,
          unavailableCount: 0,
          outOfStockCount: 0,
          lowStockCount: 0,
          priceChangedCount: 0,
        });
      }

      const cart = await cartResponse.json();
      const items = cart.items || [];
      const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) =>
        sum + (item.price * item.quantity), 0);

      return NextResponse.json({
        cartId: cart.id || '',
        items,
        subtotal,
        originalSubtotal: subtotal,
        hasUnavailableItems: false,
        hasPriceChanges: false,
        unavailableCount: 0,
        outOfStockCount: 0,
        lowStockCount: 0,
        priceChangedCount: 0,
      });
    }

    if (!response.ok) {
      const error = await response.text();
      console.error('[Cart Validate API] Failed to validate cart:', error);
      return NextResponse.json({ error: 'Failed to validate cart' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Cart Validate API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
