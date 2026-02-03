import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';

// Notification Hub URL - ensure /api/v1 path is included
const baseUrl = process.env.NOTIFICATION_HUB_URL || 'http://notification-hub.marketplace.svc.cluster.local:8080';
const NOTIFICATION_HUB_URL = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;

/**
 * Safely parse JSON response, handling non-JSON responses (e.g., gateway errors)
 */
async function safeParseResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  try {
    if (contentType.includes('application/json') && text) {
      return JSON.parse(text);
    }
    // Non-JSON response (connection error, gateway timeout, etc.)
    return {
      success: false,
      error: {
        code: 'UPSTREAM_ERROR',
        message: text.substring(0, 200) || `Backend returned ${response.status}`
      }
    };
  } catch {
    // JSON parse error
    return {
      success: false,
      error: {
        code: 'PARSE_ERROR',
        message: text.substring(0, 200)
      }
    };
  }
}

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

    const data = await safeParseResponse(response);

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
