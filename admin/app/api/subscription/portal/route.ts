import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';

const SUBSCRIPTION_SERVICE_URL = getServiceUrl('SUBSCRIPTION');

export async function POST(request: NextRequest) {
  try {
    const proxyHeaders = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = proxyHeaders['x-jwt-claim-tenant-id'];
    if (!tenantId) {
      return NextResponse.json({ error: 'Missing tenant ID' }, { status: 400 });
    }

    const body = await request.json();
    const response = await proxyToBackend(SUBSCRIPTION_SERVICE_URL, 'subscriptions/portal', {
      method: 'POST',
      body: { ...body, tenantId },
      headers: proxyHeaders,
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'POST subscription portal');
  }
}
