import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getAuthContext } from '@/lib/api/server-auth';

const ORDERS_SERVICE_URL = config.api.ordersService;
// Strip trailing /api/v1 from URL as we'll add it when constructing endpoints
const ORDERS_BASE_URL = ORDERS_SERVICE_URL.replace(/\/api\/v1\/?$/, '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, reason, returnType, customerNotes, items } = body;

    const tenantId = request.headers.get('X-Tenant-ID') || request.headers.get('x-tenant-id') || '';
    const storefrontId = request.headers.get('X-Storefront-ID') || '';
    const auth = await getAuthContext(request);

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      );
    }

    if (!auth?.token || !auth.customerId) {
      return NextResponse.json(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }

    if (!orderId || !reason || !Array.isArray(items) || items.length === 0) {
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
        'Authorization': auth.token,
      },
      body: JSON.stringify({
        orderId,
        customerId: auth.customerId,
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
    const tenantId = request.headers.get('X-Tenant-ID') || request.headers.get('x-tenant-id') || '';
    const storefrontId = request.headers.get('X-Storefront-ID') || '';
    const auth = await getAuthContext(request);

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 400 }
      );
    }

    if (!auth?.token || !auth.customerId) {
      return NextResponse.json(
        { success: false, error: 'Authorization required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    const params = new URLSearchParams();
    if (orderId) params.set('orderId', orderId);
    params.set('customerId', auth.customerId);

    const queryString = params.toString();
    const url = `${ORDERS_BASE_URL}/api/v1/returns${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      headers: {
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
        'X-Internal-Service': 'storefront',
        'Authorization': auth.token,
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
