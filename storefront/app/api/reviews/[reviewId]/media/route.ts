import { NextRequest, NextResponse } from 'next/server';

const REVIEWS_SERVICE_URL = (process.env.REVIEWS_SERVICE_URL || 'http://localhost:8084').replace(/\/api\/v1\/?$/, '');

// GET /api/reviews/[reviewId]/media - Get media for a review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const response = await fetch(`${REVIEWS_SERVICE_URL}/api/v1/reviews/${reviewId}/media`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ data: [] });
      }
      const errorText = await response.text();
      console.error('[Reviews API] Get media error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch review media' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Reviews API] Failed to fetch review media:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
