import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getAuthContext } from '@/lib/api/server-auth';

// DELETE /api/wishlist/[productId] - Remove item from wishlist by product ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const storefrontId = request.headers.get('x-storefront-id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const auth = await getAuthContext(request);
    if (!auth?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(
      `${config.api.customersService}/storefront/customers/${auth.customerId}/wishlist/${productId}`,
      {
        method: 'DELETE',
        headers: {
          'X-Tenant-ID': tenantId,
          ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
          ...(auth.token && { Authorization: auth.token }),
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({ message: 'Item removed' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
}
