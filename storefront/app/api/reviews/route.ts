import { NextRequest, NextResponse } from 'next/server';

const REVIEWS_SERVICE_URL = (process.env.REVIEWS_SERVICE_URL || 'http://localhost:8084').replace(/\/api\/v1\/?$/, '');

// Get tenant ID from request headers or environment (for multi-tenant storefronts)
function getTenantId(request: NextRequest): string | null {
  return (
    request.headers.get('X-Tenant-ID') ||
    process.env.TENANT_ID ||
    process.env.DEV_TENANT_ID ||
    null
  );
}

// GET /api/reviews - List reviews
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      console.error('[Reviews API] No tenant ID found in request or environment');
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    const response = await fetch(`${REVIEWS_SERVICE_URL}/api/v1/storefront/reviews${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-Internal-Service': 'storefront',
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No reviews found - return empty array
        return NextResponse.json({
          success: true,
          data: [],
          reviews: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });
      }
      const errorText = await response.text();
      console.error('[Reviews API] Service error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Reviews API] Failed to fetch reviews:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    const storefrontId = request.headers.get('X-Storefront-ID');
    const authorization = request.headers.get('Authorization');
    const userId = request.headers.get('X-User-Id');
    const userName = request.headers.get('X-User-Name');
    const userEmail = request.headers.get('X-User-Email');

    if (!tenantId) {
      console.error('[Reviews API] No tenant ID found in request or environment');
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
    if (userName) headers['X-User-Name'] = userName;
    if (userEmail) headers['X-User-Email'] = userEmail;

    const response = await fetch(`${REVIEWS_SERVICE_URL}/api/v1/storefront/reviews`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Reviews API] Create review error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to create review' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[Reviews API] Failed to create review:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
