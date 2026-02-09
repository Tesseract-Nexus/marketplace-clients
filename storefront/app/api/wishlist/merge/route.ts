import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getAuthContext } from '@/lib/api/server-auth';

interface WishlistItem {
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  addedAt?: string;
}

/**
 * POST /api/wishlist/merge
 * Merge guest wishlist items with authenticated customer's backend wishlist.
 * Union by productId — guest items win on conflict (fresher data).
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const storefrontId = request.headers.get('x-storefront-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const auth = await getAuthContext(request);
    if (!auth?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const guestItems: WishlistItem[] = body.guestItems || [];

    if (guestItems.length === 0) {
      // No guest items — just return current backend wishlist
      const getRes = await fetch(
        `${config.api.customersService}/storefront/customers/${auth.customerId}/wishlist`,
        {
          headers: {
            'X-Tenant-ID': tenantId,
            ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
            ...(auth.token && { Authorization: auth.token }),
          },
        }
      );
      const data = await getRes.json();
      return NextResponse.json(data, { status: getRes.status });
    }

    // Fetch existing backend wishlist
    const getRes = await fetch(
      `${config.api.customersService}/storefront/customers/${auth.customerId}/wishlist`,
      {
        headers: {
          'X-Tenant-ID': tenantId,
          ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
          ...(auth.token && { Authorization: auth.token }),
        },
      }
    );

    let backendItems: WishlistItem[] = [];
    if (getRes.ok) {
      const backendData = await getRes.json();
      backendItems = backendData.items || [];
    }

    // Merge: union by productId, guest items win on conflict
    const mergedMap = new Map<string, WishlistItem>();

    // Add backend items first
    for (const item of backendItems) {
      mergedMap.set(item.productId, item);
    }

    // Guest items overwrite on conflict (fresher data)
    for (const item of guestItems) {
      mergedMap.set(item.productId, item);
    }

    const mergedItems = Array.from(mergedMap.values());

    // PUT merged result back to backend
    const putRes = await fetch(
      `${config.api.customersService}/storefront/customers/${auth.customerId}/wishlist`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
          ...(auth.token && { Authorization: auth.token }),
        },
        body: JSON.stringify({ items: mergedItems }),
      }
    );

    const data = await putRes.json();
    return NextResponse.json(data, { status: putRes.status });
  } catch (error) {
    console.error('Error merging wishlist:', error);
    return NextResponse.json({ error: 'Failed to merge wishlist' }, { status: 500 });
  }
}
