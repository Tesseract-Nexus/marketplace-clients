import { NextRequest, NextResponse } from 'next/server';

const NOTIFICATION_HUB_URL = process.env.NOTIFICATION_HUB_URL || 'http://notification-hub.marketplace.svc.cluster.local:8080';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = request.headers.get('X-Tenant-ID') || request.headers.get('x-tenant-id');
  const userId = request.headers.get('X-User-ID') || request.headers.get('x-user-id');
  const { id } = await params;

  if (!tenantId || !userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - missing tenant or user ID' },
      { status: 401 }
    );
  }

  const url = `${NOTIFICATION_HUB_URL}/api/v1/notifications/${id}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-User-ID': userId,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({ success: true, data: data.notification });
  } catch (error) {
    console.error('[Notifications API] Error fetching notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = request.headers.get('X-Tenant-ID') || request.headers.get('x-tenant-id');
  const userId = request.headers.get('X-User-ID') || request.headers.get('x-user-id');
  const { id } = await params;

  if (!tenantId || !userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - missing tenant or user ID' },
      { status: 401 }
    );
  }

  const url = `${NOTIFICATION_HUB_URL}/api/v1/notifications/${id}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-User-ID': userId,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Notifications API] Error deleting notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
