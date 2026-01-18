import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';

const NOTIFICATION_HUB_URL = process.env.NOTIFICATION_HUB_URL || 'http://notification-hub.devtest.svc.cluster.local:8080/api/v1';

/**
 * GET /api/notifications/unread-count
 * Get the count of unread notifications for the current user
 * Uses proxyToBackend which properly extracts JWT claims and forwards Istio headers
 */
export async function GET(request: NextRequest) {
  try {
    const response = await proxyToBackend(NOTIFICATION_HUB_URL, 'notifications/unread-count', {
      method: 'GET',
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({ success: true, count: data.count || 0 });
  } catch (error) {
    console.error('[Notifications API] Error fetching unread count:', error);
    return handleApiError(error, 'GET notifications/unread-count');
  }
}
