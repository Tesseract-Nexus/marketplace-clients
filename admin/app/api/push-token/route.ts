import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend } from '@/lib/utils/api-route-handler';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service.marketplace.svc.cluster.local:8080';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await proxyToBackend(
      NOTIFICATION_SERVICE_URL,
      '/api/v1/devices/register',
      {
        method: 'POST',
        body,
        incomingRequest: request,
      }
    );

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Push Token API] Error registering:', error);
    return NextResponse.json({ error: 'Failed to register push subscription' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await proxyToBackend(
      NOTIFICATION_SERVICE_URL,
      '/api/v1/devices/unregister',
      {
        method: 'POST',
        body,
        incomingRequest: request,
      }
    );

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Push Token API] Error unregistering:', error);
    return NextResponse.json({ error: 'Failed to unregister push subscription' }, { status: 500 });
  }
}
