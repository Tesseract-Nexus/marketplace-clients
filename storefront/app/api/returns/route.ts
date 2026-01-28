import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const ORDERS_SERVICE_URL = config.api.ordersService;
// Strip trailing /api/v1 from URL as we'll add it when constructing endpoints
const ORDERS_BASE_URL = ORDERS_SERVICE_URL.replace(/\/api\/v1\/?$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, reason, returnType, customerNotes, items } = body;

    const tenantId = request.headers.get('X-Tenant-ID') || '';
    const storefrontId = request.headers.get('X-Storefront-ID') || '';
    const authorization = request.headers.get('Authorization') || '';

    if (!orderId || !reason || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create return request in orders-service
    const response = await fetch(`${ORDERS_BASE_URL}/api/v1/returns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
        'X-Internal-Service': 'storefront',
        'Authorization': authorization,
      },
      body: JSON.stringify({
        orderId,
        reason,
        returnType: returnType || 'REFUND',
        customerNotes: customerNotes || '',
        items,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to create return:', errorData);
      return NextResponse.json(
        { success: false, error: errorData.error || errorData.details || 'Failed to create return request' },
        { status: response.status }
      );
    }

    const returnData = await response.json();
    return NextResponse.json({
      success: true,
      data: returnData,
    });
  } catch (error) {
    console.error('Return request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit return request. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID') || '';
    const storefrontId = request.headers.get('X-Storefront-ID') || '';
    const authorization = request.headers.get('Authorization') || '';

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const customerId = searchParams.get('customerId');

    const params = new URLSearchParams();
    if (orderId) params.set('orderId', orderId);
    if (customerId) params.set('customerId', customerId);

    const queryString = params.toString();
    const url = `${ORDERS_BASE_URL}/api/v1/returns${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
        'X-Internal-Service': 'storefront',
        'Authorization': authorization,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: errorData.error || 'Failed to fetch returns' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: data.returns || data,
    });
  } catch (error) {
    console.error('Fetch returns error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}
