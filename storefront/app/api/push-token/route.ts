import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/api/server-auth';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service.marketplace.svc.cluster.local:8080';

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth?.customerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/v1/devices/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': auth.customerId,
        'X-Tenant-ID': request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID') || '',
        'X-Internal-Service': 'storefront',
        ...(auth.token ? { 'Authorization': auth.token } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Push Token API] Error registering:', error);
    return NextResponse.json({ error: 'Failed to register push subscription' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth?.customerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/v1/devices/unregister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': auth.customerId,
        'X-Tenant-ID': request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID') || '',
        'X-Internal-Service': 'storefront',
        ...(auth.token ? { 'Authorization': auth.token } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Push Token API] Error unregistering:', error);
    return NextResponse.json({ error: 'Failed to unregister push subscription' }, { status: 500 });
  }
}
