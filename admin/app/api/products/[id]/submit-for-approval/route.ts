import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';

const PRODUCTS_SERVICE_URL = getServiceUrl('PRODUCTS');

/**
 * POST /api/products/:id/submit-for-approval
 * Submit a draft product for approval workflow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const response = await proxyToBackend(PRODUCTS_SERVICE_URL, `products/${id}/submit-for-approval`, {
      method: 'POST',
      headers: await getProxyHeaders(request),
      incomingRequest: request,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'POST products/:id/submit-for-approval');
  }
}
