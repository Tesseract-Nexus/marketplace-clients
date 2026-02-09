import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { getAuthContext } from '@/lib/api/server-auth';

// GET /api/wishlist - Get wishlist for authenticated customer
export async function GET(request: NextRequest) {
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

    const response = await fetch(
      `${config.api.customersService}/storefront/customers/${auth.customerId}/wishlist`,
      {
        headers: {
          'X-Tenant-ID': tenantId,
          ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
          ...(auth.token && { Authorization: auth.token }),
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

// POST /api/wishlist - Add item to wishlist
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const storefrontId = request.headers.get('x-storefront-id');
    const body = await request.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const auth = await getAuthContext(request);
    if (!auth?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(
      `${config.api.customersService}/storefront/customers/${auth.customerId}/wishlist`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
          ...(auth.token && { Authorization: auth.token }),
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
  }
}

// PUT /api/wishlist - Sync entire wishlist
export async function PUT(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const storefrontId = request.headers.get('x-storefront-id');
    const body = await request.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const auth = await getAuthContext(request);
    if (!auth?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(
      `${config.api.customersService}/storefront/customers/${auth.customerId}/wishlist`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
          ...(auth.token && { Authorization: auth.token }),
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error syncing wishlist:', error);
    return NextResponse.json({ error: 'Failed to sync wishlist' }, { status: 500 });
  }
}

// DELETE /api/wishlist - Clear entire wishlist
export async function DELETE(request: NextRequest) {
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

    const response = await fetch(
      `${config.api.customersService}/storefront/customers/${auth.customerId}/wishlist`,
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

    return NextResponse.json({ message: 'Wishlist cleared' });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    return NextResponse.json({ error: 'Failed to clear wishlist' }, { status: 500 });
  }
}
