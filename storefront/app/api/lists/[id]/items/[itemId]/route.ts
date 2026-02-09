import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getAuthContext } from '@/lib/api/server-auth';

// DELETE /api/lists/[id]/items/[itemId] - Remove item from list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: listId, itemId } = await params;
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 400 }
      );
    }

    const auth = await getAuthContext(request);
    if (!auth?.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${config.api.customersService}/storefront/customers/${auth.customerId}/lists/${listId}/items/${itemId}`,
      {
        method: 'DELETE',
        headers: {
          'X-Tenant-ID': tenantId,
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
    console.error('Error removing item from list:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from list' },
      { status: 500 }
    );
  }
}
