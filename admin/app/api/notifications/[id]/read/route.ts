import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend, handleApiError, getProxyHeaders, CACHE_CONFIG } from '@/lib/utils/api-route-handler';

const NOTIFICATION_HUB_URL = process.env.NOTIFICATION_HUB_URL || 'http://notification-hub.devtest.svc.cluster.local:8080/api/v1';

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 * Uses proxyToBackend which properly extracts JWT claims and forwards Istio headers
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await proxyToBackend(NOTIFICATION_HUB_URL, `notifications/${id}/read`, {
      method: 'PATCH',
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    const nextResponse = NextResponse.json({ success: true, data: data.notification });
    nextResponse.headers.set('Cache-Control', CACHE_CONFIG.NO_CACHE.cacheControl);
    return nextResponse;
  } catch (error) {
    console.error('[Notifications API] Error marking as read:', error);
    return handleApiError(error, 'PATCH notifications/:id/read');
  }
}
