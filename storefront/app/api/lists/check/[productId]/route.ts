import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

// GET /api/lists/check/[productId] - Check if product is in any list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
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
      `${config.api.customersService}/storefront/customers/${customerId}/lists/check/${productId}`,
      {
        headers: {
          'X-Tenant-ID': tenantId,
          ...(authHeader && { Authorization: authHeader }),
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error checking product:', error);
    return NextResponse.json(
      { error: 'Failed to check product' },
      { status: 500 }
    );
  }
}
