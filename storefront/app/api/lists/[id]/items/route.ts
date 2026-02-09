import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getAuthContext } from '@/lib/api/server-auth';

// POST /api/lists/[id]/items - Add item to list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    const body = await request.json();

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
      `${config.api.customersService}/storefront/customers/${auth.customerId}/lists/${listId}/items`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          ...(auth.token && { Authorization: auth.token }),
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error adding item to list:', error);
    return NextResponse.json(
      { error: 'Failed to add item to list' },
      { status: 500 }
    );
  }
}
