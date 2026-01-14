import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

// POST /api/lists/default/items - Add item to default list
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const customerId = request.nextUrl.searchParams.get('customerId');
    const authHeader = request.headers.get('authorization');
    const body = await request.json();

    if (!tenantId || !customerId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${config.api.customersService}/storefront/customers/${customerId}/lists/default/items`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          ...(authHeader && { Authorization: authHeader }),
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error adding item to default list:', error);
    return NextResponse.json(
      { error: 'Failed to add item to default list' },
      { status: 500 }
    );
  }
}
