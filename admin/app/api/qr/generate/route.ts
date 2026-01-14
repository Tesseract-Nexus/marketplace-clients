import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, CACHE_CONFIG } from '@/lib/utils/api-route-handler';

const QR_SERVICE_URL = getServiceUrl('QR');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => undefined);
    const response = await proxyToBackend(QR_SERVICE_URL, 'qr/generate', {
      method: 'POST',
      body,
      incomingRequest: request,
    });

    const data = await response.json();

    // Wrap response in standard API format expected by frontend
    const wrappedResponse = response.ok
      ? { success: true, data }
      : { success: false, error: data.error || { message: 'QR generation failed' } };

    const nextResponse = NextResponse.json(wrappedResponse, { status: response.ok ? 200 : response.status });
    nextResponse.headers.set('Cache-Control', CACHE_CONFIG.NO_CACHE.cacheControl);
    return nextResponse;
  } catch (error) {
    return handleApiError(error, 'POST qr/generate');
  }
}
