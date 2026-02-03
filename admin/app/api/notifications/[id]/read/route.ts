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

    const data = await safeParseResponse(response);

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
