import { NextRequest, NextResponse } from 'next/server';

const CUSTOMERS_SERVICE_URL = process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:8089/api/v1';
const CUSTOMERS_BASE_URL = CUSTOMERS_SERVICE_URL.replace(/\/api\/v1\/?$/, '');
const AUTH_BFF_URL = process.env.AUTH_BFF_INTERNAL_URL || process.env.AUTH_BFF_URL || 'http://localhost:8080';

// Use storefront endpoints for customer-facing address operations
const STOREFRONT_API_PATH = '/api/v1/storefront';

// Helper to decode JWT payload (base64url decode)
function decodeJwtPayload(token: string): { sub?: string; customer_id?: string } | null {
  try {
    const parts = token.replace('Bearer ', '').split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (!payload) return null;
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Get session token from auth-bff using the request cookies.
 * Supports OAuth/session-based auth where accessToken is not available client-side.
 */
async function getSessionToken(request: NextRequest): Promise<{ token?: string; userId?: string } | null> {
  try {
    const cookie = request.headers.get('cookie');
    if (!cookie) return null;

    const response = await fetch(`${AUTH_BFF_URL}/auth/session`, {
      headers: {
        'Cookie': cookie,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return null;

    const session = await response.json();
    if (session.authenticated && session.user) {
      return {
        token: session.access_token || session.accessToken,
        userId: session.user.id,
      };
    }
    return null;
  } catch (error) {
    console.error('[Address API] Failed to get session:', error);
    return null;
  }
}

/**
 * Get auth info from either JWT header or session cookie.
 * Returns userId and optionally authorization token.
 */
async function getAuthInfo(request: NextRequest): Promise<{ userId?: string; authorization?: string } | null> {
  let authorization: string | null = request.headers.get('Authorization');
  let userId: string | null = request.headers.get('X-User-Id');

  // Check if authorization is empty or just "Bearer " (session-based auth)
  const hasValidAuth = authorization && authorization !== 'Bearer ' && authorization !== 'Bearer';

  if (!hasValidAuth) {
    // Try to get auth from session cookie (BFF pattern)
    const session = await getSessionToken(request);
    if (session?.token) {
      authorization = `Bearer ${session.token}`;
    }
    if (session?.userId) {
      userId = session.userId;
    }
    // If no session at all, return null
    if (!session?.userId) {
      return null;
    }
  } else {
    // Extract user ID from JWT if we have valid auth
    const tokenPayload = decodeJwtPayload(authorization!);
    userId = tokenPayload?.sub || tokenPayload?.customer_id || userId || null;
  }

  return { userId: userId || undefined, authorization: authorization || undefined };
}

// DELETE /api/customers/[customerId]/addresses/[addressId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string; addressId: string }> }
) {
  try {
    const { customerId, addressId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const auth = await getAuthInfo(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // SECURITY: Prevent IDOR attacks
    if (auth.userId !== customerId) {
      return NextResponse.json(
        { error: 'Access denied: You can only delete your own addresses' },
        { status: 403 }
      );
    }

    // Build headers for internal service call
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Internal-Request': 'true',
      'X-User-Id': auth.userId,
    };
    if (auth.authorization) {
      headers['Authorization'] = auth.authorization;
    }
    if (storefrontId) {
      headers['X-Storefront-ID'] = storefrontId;
    }

    // Use storefront endpoint path
    const response = await fetch(
      `${CUSTOMERS_BASE_URL}${STOREFRONT_API_PATH}/customers/${customerId}/addresses/${addressId}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.message || 'Failed to delete address' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[customerId]/addresses/[addressId] - Update address
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string; addressId: string }> }
) {
  try {
    const { customerId, addressId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const auth = await getAuthInfo(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // SECURITY: Prevent IDOR attacks
    if (auth.userId !== customerId) {
      return NextResponse.json(
        { error: 'Access denied: You can only update your own addresses' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Transform frontend address format to backend format
    const transformedBody = { ...body };
    if ('type' in transformedBody) {
      transformedBody.addressType = transformedBody.type;
      delete transformedBody.type;
    }
    if ('countryCode' in transformedBody && transformedBody.countryCode) {
      transformedBody.country = transformedBody.countryCode;
      delete transformedBody.countryCode;
    }

    // Build headers for internal service call
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Internal-Request': 'true',
      'X-User-Id': auth.userId,
    };
    if (auth.authorization) {
      headers['Authorization'] = auth.authorization;
    }
    if (storefrontId) {
      headers['X-Storefront-ID'] = storefrontId;
    }

    // Use storefront endpoint path
    const response = await fetch(
      `${CUSTOMERS_BASE_URL}${STOREFRONT_API_PATH}/customers/${customerId}/addresses/${addressId}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(transformedBody),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.message || 'Failed to update address' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform response to frontend format
    const transformedData = { ...data };
    if ('addressType' in transformedData) {
      transformedData.type = transformedData.addressType;
      delete transformedData.addressType;
    }
    if ('country' in transformedData && typeof transformedData.country === 'string') {
      transformedData.countryCode = transformedData.country;
    }

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Failed to update address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/customers/[customerId]/addresses/[addressId] - Set as default
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string; addressId: string }> }
) {
  try {
    const { customerId, addressId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    const auth = await getAuthInfo(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // SECURITY: Prevent IDOR attacks
    if (auth.userId !== customerId) {
      return NextResponse.json(
        { error: 'Access denied: You can only modify your own addresses' },
        { status: 403 }
      );
    }

    // Build headers for internal service call
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Internal-Request': 'true',
      'X-User-Id': auth.userId,
    };
    if (auth.authorization) {
      headers['Authorization'] = auth.authorization;
    }
    if (storefrontId) {
      headers['X-Storefront-ID'] = storefrontId;
    }

    // Use storefront endpoint path - PATCH on the address ID sets it as default
    const response = await fetch(
      `${CUSTOMERS_BASE_URL}${STOREFRONT_API_PATH}/customers/${customerId}/addresses/${addressId}`,
      {
        method: 'PATCH',
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.message || 'Failed to set default address' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform response to frontend format
    const transformedData = { ...data };
    if ('addressType' in transformedData) {
      transformedData.type = transformedData.addressType;
      delete transformedData.addressType;
    }
    if ('country' in transformedData && typeof transformedData.country === 'string') {
      transformedData.countryCode = transformedData.country;
    }

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Failed to set default address:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
