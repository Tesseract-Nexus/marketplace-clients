import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';

const NOTIFICATION_HUB_URL = process.env.NOTIFICATION_HUB_URL || 'http://notification-hub.devtest.svc.cluster.local:8080/api/v1';

/**
 * GET /api/notifications
 * Fetch notifications for the current user
 * Uses proxyToBackend which properly extracts JWT claims and forwards Istio headers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const response = await proxyToBackend(NOTIFICATION_HUB_URL, 'notifications', {
      method: 'GET',
      params: searchParams,
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Backend returns { success, data, unreadCount, pagination }
    return NextResponse.json({
      success: true,
      data: data.data || [],
      unreadCount: data.unreadCount || 0,
      pagination: data.pagination,
    });
  } catch (error) {
    console.error('[Notifications API] Error fetching notifications:', error);
    return handleApiError(error, 'GET notifications');
  }
}
