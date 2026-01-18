import { NextRequest, NextResponse } from 'next/server';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';

const NOTIFICATION_HUB_URL = process.env.NOTIFICATION_HUB_URL || 'http://notification-hub.devtest.svc.cluster.local:8080/api/v1';

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
