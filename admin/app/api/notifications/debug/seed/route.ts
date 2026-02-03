import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';

// Notification Hub URL - ensure /api/v1 path is included
const baseUrl = process.env.NOTIFICATION_HUB_URL || 'http://notification-hub.marketplace.svc.cluster.local:8080';
const NOTIFICATION_HUB_URL = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;

/**
 * POST /api/notifications/debug/seed
 * Seed test notifications for debugging
 * Uses proxyToBackend which properly extracts JWT claims and forwards Istio headers
 */
export async function POST(request: NextRequest) {
  try {
    const response = await proxyToBackend(NOTIFICATION_HUB_URL, 'notifications/debug/seed', {
      method: 'POST',
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Notifications API] Error seeding notifications:', error);
    return handleApiError(error, 'POST notifications/debug/seed');
  }
}
