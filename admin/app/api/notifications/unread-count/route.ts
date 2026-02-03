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

    // Safe JSON parsing to handle non-JSON responses (e.g., "upstream connect error")
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    let data: any;
    try {
      if (contentType.includes('application/json') && text) {
        data = JSON.parse(text);
      } else {
        // Non-JSON response (connection error, gateway timeout, etc.)
        data = {
          success: false,
          error: {
            code: 'UPSTREAM_ERROR',
            message: text.substring(0, 200) || `Backend returned ${response.status}`
          }
        };
      }
    } catch {
      // JSON parse error
      data = {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: text.substring(0, 200)
        }
      };
    }

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({ success: true, count: data.count || 0 });
  } catch (error) {
    console.error('[Notifications API] Error fetching unread count:', error);
    return handleApiError(error, 'GET notifications/unread-count');
  }
}
