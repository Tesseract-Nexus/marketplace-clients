import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend, handleApiError, getProxyHeaders, CACHE_CONFIG } from '@/lib/utils/api-route-handler';

const NOTIFICATION_HUB_URL = process.env.NOTIFICATION_HUB_URL || 'http://notification-hub.devtest.svc.cluster.local:8080/api/v1';

/**
 * DELETE /api/notifications/delete-all
 * Delete all notifications for the current user
 * Uses proxyToBackend which properly extracts JWT claims and forwards Istio headers
 */
export async function DELETE(request: NextRequest) {
  try {
    const response = await proxyToBackend(NOTIFICATION_HUB_URL, 'notifications', {
      method: 'DELETE',
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    const nextResponse = NextResponse.json({
      success: true,
      deletedCount: data.count || 0,
      message: data.message || 'All notifications deleted',
    });
    nextResponse.headers.set('Cache-Control', CACHE_CONFIG.NO_CACHE.cacheControl);
    return nextResponse;
  } catch (error) {
    console.error('[Notifications API] Error deleting all notifications:', error);
    return handleApiError(error, 'DELETE notifications/delete-all');
  }
}
