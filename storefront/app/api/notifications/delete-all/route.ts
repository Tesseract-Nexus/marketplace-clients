import { NextRequest, NextResponse } from 'next/server';

const NOTIFICATION_HUB_URL = process.env.NOTIFICATION_HUB_URL || 'http://notification-hub.marketplace.svc.cluster.local:8080';

export async function DELETE(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  const userId = request.headers.get('x-user-id');

  if (!tenantId || !userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - missing tenant or user ID' },
      { status: 401 }
    );
  }

  const url = `${NOTIFICATION_HUB_URL}/api/v1/notifications`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
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

    return NextResponse.json({
      success: true,
      deletedCount: data.count || 0,
      message: data.message || 'All notifications deleted',
    });
  } catch (error) {
    console.error('[Notifications API] Error deleting all notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete all notifications' },
      { status: 500 }
    );
  }
}
