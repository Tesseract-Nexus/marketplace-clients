import { NextRequest, NextResponse } from 'next/server';

const NOTIFICATION_HUB_URL = process.env.NOTIFICATION_HUB_URL || 'http://notification-hub.marketplace.svc.cluster.local:8080';

export async function PATCH(
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

  const url = `${NOTIFICATION_HUB_URL}/api/v1/notifications/${id}/read`;

  try {
    const response = await fetch(url, {
      method: 'PATCH',
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
    console.error('[Notifications API] Error marking as read:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark as read' },
      { status: 500 }
    );
  }
}
