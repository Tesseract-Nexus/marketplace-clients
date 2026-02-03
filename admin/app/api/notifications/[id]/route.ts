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
 * GET /api/notifications/:id
 * Fetch a single notification by ID
 * Uses proxyToBackend which properly extracts JWT claims and forwards Istio headers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await proxyToBackend(NOTIFICATION_HUB_URL, `notifications/${id}`, {
      method: 'GET',
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await safeParseResponse(response);

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({ success: true, data: data.notification });
  } catch (error) {
    console.error('[Notifications API] Error fetching notification:', error);
    return handleApiError(error, 'GET notifications/:id');
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete a notification by ID
 * Uses proxyToBackend which properly extracts JWT claims and forwards Istio headers
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await proxyToBackend(NOTIFICATION_HUB_URL, `notifications/${id}`, {
      method: 'DELETE',
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    if (!response.ok) {
      const data = await safeParseResponse(response);
      return NextResponse.json(data, { status: response.status });
    }

    const nextResponse = NextResponse.json({ success: true });
    nextResponse.headers.set('Cache-Control', CACHE_CONFIG.NO_CACHE.cacheControl);
    return nextResponse;
  } catch (error) {
    console.error('[Notifications API] Error deleting notification:', error);
    return handleApiError(error, 'DELETE notifications/:id');
  }
}
