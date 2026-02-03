import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, getProxyHeaders } from '@/lib/utils/api-route-handler';

const CATEGORIES_SERVICE_URL = getServiceUrl('CATEGORIES');

/**
 * POST /api/categories/:id/submit-for-approval
 * Submit a draft category for approval workflow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Read the incoming request body (may be empty object {})
    let body = {};
    try {
      body = await request.json();
    } catch {
      // No body or invalid JSON - use empty object
    }

    const response = await proxyToBackend(CATEGORIES_SERVICE_URL, `categories/${id}/submit-for-approval`, {
      method: 'POST',
      headers: await getProxyHeaders(request),
      incomingRequest: request,
      body, // Forward the request body to the backend
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return handleApiError(error, 'POST categories/:id/submit-for-approval');
  }
}
