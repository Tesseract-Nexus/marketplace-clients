import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend, handleApiError, getProxyHeaders, CACHE_CONFIG } from '@/lib/utils/api-route-handler';

const NOTIFICATION_HUB_URL = process.env.NOTIFICATION_HUB_URL || 'http://notification-hub.devtest.svc.cluster.local:8080/api/v1';

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

    const data = await response.json();

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
      const data = await response.json();
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
