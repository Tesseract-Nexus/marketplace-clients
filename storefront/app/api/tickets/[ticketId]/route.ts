import { NextRequest, NextResponse } from 'next/server';

const TICKETS_SERVICE_URL = (process.env.TICKETS_SERVICE_URL || 'http://localhost:3036').replace(/\/api\/v1\/?$/, '');

// GET /api/tickets/[ticketId] - Get a single ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    const authorization = request.headers.get('Authorization');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    if (!authorization) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Forward user ID for permission check
    const userId = request.headers.get('X-User-Id');

    const response = await fetch(`${TICKETS_SERVICE_URL}/api/v1/tickets/${ticketId}`, {
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
      const errorData = await response.json().catch(() => ({}));
      console.error('[Tickets API] Get ticket error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Ticket not found' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Tickets API] Failed to get ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
