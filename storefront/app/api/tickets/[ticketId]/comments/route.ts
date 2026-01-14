import { NextRequest, NextResponse } from 'next/server';

const TICKETS_SERVICE_URL = (process.env.TICKETS_SERVICE_URL || 'http://localhost:3036').replace(/\/api\/v1\/?$/, '');

// POST /api/tickets/[ticketId]/comments - Add a comment to a ticket
export async function POST(
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

    const body = await request.json();

    // Forward user info headers for proper attribution
    const userId = request.headers.get('X-User-Id');
    const userName = request.headers.get('X-User-Name');

    const response = await fetch(`${TICKETS_SERVICE_URL}/api/v1/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'Authorization': authorization,
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        ...(userId && { 'X-User-Id': userId }),
        ...(userName && { 'X-User-Name': userName }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Tickets API] Add comment error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to add comment' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[Tickets API] Failed to add comment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
