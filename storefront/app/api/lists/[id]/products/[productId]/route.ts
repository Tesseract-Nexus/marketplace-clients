import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

// DELETE /api/lists/[id]/products/[productId] - Remove item by product ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; productId: string }> }
) {
  try {
    const { id: listId, productId } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const customerId = request.nextUrl.searchParams.get('customerId');
    const authHeader = request.headers.get('authorization');

    if (!tenantId || !customerId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${config.api.customersService}/storefront/customers/${customerId}/lists/${listId}/products/${productId}`,
      {
        method: 'DELETE',
        headers: {
          'X-Tenant-ID': tenantId,
          ...(authHeader && { Authorization: authHeader }),
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({ message: 'Item removed' });
  } catch (error) {
    console.error('Error removing item by product ID:', error);
    return NextResponse.json(
      { error: 'Failed to remove item' },
      { status: 500 }
    );
  }
}
