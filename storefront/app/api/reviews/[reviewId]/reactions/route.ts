import { NextRequest, NextResponse } from 'next/server';

const REVIEWS_SERVICE_URL = (process.env.REVIEWS_SERVICE_URL || 'http://localhost:8084').replace(/\/api\/v1\/?$/, '');

// POST /api/reviews/[reviewId]/reactions - Add reaction to review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    const authorization = request.headers.get('Authorization');
    const userId = request.headers.get('X-User-Id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const body = await request.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Internal-Service': 'storefront',
    };
    if (authorization) headers['Authorization'] = authorization;
    if (storefrontId) headers['X-Storefront-ID'] = storefrontId;
    if (userId) headers['X-User-Id'] = userId;

    const response = await fetch(`${REVIEWS_SERVICE_URL}/api/v1/storefront/reviews/${reviewId}/reactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Reviews API] Add reaction error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to add reaction' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[Reviews API] Failed to add reaction:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
