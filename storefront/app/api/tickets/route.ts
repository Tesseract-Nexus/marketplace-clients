import { NextRequest, NextResponse } from 'next/server';

const TICKETS_SERVICE_URL = (process.env.TICKETS_SERVICE_URL || 'http://localhost:3036').replace(/\/api\/v1\/?$/, '');

// GET /api/tickets - List user's tickets
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    const authorization = request.headers.get('Authorization');
    const userId = request.headers.get('X-User-Id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    if (!authorization) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const response = await fetch(`${TICKETS_SERVICE_URL}/api/v1/tickets${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'Authorization': authorization,
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        ...(userId && { 'X-User-Id': userId }),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No tickets found - return empty array
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
        });
      }
      const errorText = await response.text();
      console.error('[Tickets API] Service error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Tickets API] Failed to fetch tickets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    const authorization = request.headers.get('Authorization');
    const userName = request.headers.get('X-User-Name');
    const userId = request.headers.get('X-User-Id');
    const userEmail = request.headers.get('X-User-Email');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    if (!authorization) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch(`${TICKETS_SERVICE_URL}/api/v1/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'Authorization': authorization,
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        ...(userName && { 'X-User-Name': userName }),
        ...(userId && { 'X-User-Id': userId }),
        ...(userEmail && { 'X-User-Email': userEmail }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Tickets API] Create ticket error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to create ticket' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[Tickets API] Failed to create ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
