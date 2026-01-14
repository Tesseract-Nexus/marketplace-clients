import { NextRequest, NextResponse } from 'next/server';

const REVIEWS_SERVICE_URL = (process.env.REVIEWS_SERVICE_URL || 'http://localhost:8084').replace(/\/api\/v1\/?$/, '');

// POST /api/reviews/media/upload - Upload media for a review
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    const authorization = request.headers.get('Authorization');
    const userId = request.headers.get('X-User-Id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    if (!authorization) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Get the FormData from the request
    const formData = await request.formData();

    // Forward the FormData to the backend service
    const response = await fetch(`${REVIEWS_SERVICE_URL}/api/v1/reviews/media/upload`, {
      method: 'POST',
      headers: {
        'X-Tenant-ID': tenantId,
        'Authorization': authorization,
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        ...(userId && { 'X-User-Id': userId }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Reviews API] Upload media error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to upload media' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[Reviews API] Failed to upload media:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
