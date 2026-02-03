import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend, handleApiError, getProxyHeaders, CACHE_CONFIG } from '@/lib/utils/api-route-handler';

// Notification Hub URL - ensure /api/v1 path is included
const baseUrl = process.env.NOTIFICATION_HUB_URL || 'http://notification-hub.marketplace.svc.cluster.local:8080';
const NOTIFICATION_HUB_URL = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;

async function safeParseResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  try {
    if (contentType.includes('application/json') && text) return JSON.parse(text);
    return { success: false, error: { code: 'UPSTREAM_ERROR', message: text.substring(0, 200) || `Backend returned ${response.status}` } };
  } catch {
    return { success: false, error: { code: 'PARSE_ERROR', message: text.substring(0, 200) } };
  }
}

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the current user
 * Uses proxyToBackend which properly extracts JWT claims and forwards Istio headers
 */
export async function POST(request: NextRequest) {
  try {
    const response = await proxyToBackend(NOTIFICATION_HUB_URL, 'notifications/mark-all-read', {
      method: 'POST',
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await safeParseResponse(response);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    const nextResponse = NextResponse.json({ success: true, markedCount: data.markedCount || 0 });
    nextResponse.headers.set('Cache-Control', CACHE_CONFIG.NO_CACHE.cacheControl);
    return nextResponse;
  } catch (error) {
    console.error('[Notifications API] Error marking all as read:', error);
    return handleApiError(error, 'POST notifications/mark-all-read');
  }
}
