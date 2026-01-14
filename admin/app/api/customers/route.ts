import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, getProxyHeaders, handleApiError, proxyPost } from '@/lib/utils/api-route-handler';

const CUSTOMERS_SERVICE_URL = getServiceUrl('CUSTOMERS');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const response = await proxyToBackend(CUSTOMERS_SERVICE_URL, 'customers', {
      method: 'GET',
      params: searchParams,
      incomingRequest: request,
    });

    const backendData = await response.json();

    if (!response.ok) {
      return NextResponse.json(backendData, { status: response.status });
    }

    // Transform backend response format to frontend expected format
    // Backend returns: { customers: [...], total, page, pageSize, totalPages }
    // Frontend expects: { data: [...], pagination: { page, limit, total, totalPages } }
    const transformedResponse = {
      success: true,
      data: backendData.customers || [],
      pagination: {
        page: backendData.page || 1,
        limit: backendData.pageSize || 20,
        total: backendData.total || 0,
        totalPages: backendData.totalPages || 1,
        hasNext: (backendData.page || 1) < (backendData.totalPages || 1),
        hasPrevious: (backendData.page || 1) > 1,
      },
    };

    // Create response with cache headers for faster subsequent loads
    const nextResponse = NextResponse.json(transformedResponse);

    // Customers are moderate data - 1 min cache with stale-while-revalidate
    nextResponse.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    nextResponse.headers.set('Vary', 'Accept-Encoding, X-Tenant-ID');

    return nextResponse;
  } catch (error) {
    return handleApiError(error, 'GET customers');
  }
}

export async function POST(request: NextRequest) {
  return proxyPost(CUSTOMERS_SERVICE_URL, 'customers', request);
}
