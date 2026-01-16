import { NextRequest, NextResponse } from 'next/server';

// Internal search service URL - never exposed to client
const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://search-service.marketplace.svc.cluster.local:8080';

/**
 * POST /api/search/typesense/* - Proxy search requests to internal search service
 * SECURITY: This route keeps the internal search service URL hidden from clients
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const tenantId = request.headers.get('X-Tenant-ID') || '';
  const vendorId = request.headers.get('X-Vendor-ID') || tenantId;
  const userId = request.headers.get('X-User-ID') || '';

  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: 'Tenant ID is required' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { path } = await params;

    // Build the internal search service path
    const searchPath = path ? `/${path.join('/')}` : '';
    const searchUrl = `${SEARCH_SERVICE_URL}/api/v1/search${searchPath}`;

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-Vendor-ID': vendorId,
        'X-User-ID': userId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Search service error:', response.status, error);
      return NextResponse.json(
        { error: error.error || 'Search failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search service unavailable' },
      { status: 500 }
    );
  }
}
