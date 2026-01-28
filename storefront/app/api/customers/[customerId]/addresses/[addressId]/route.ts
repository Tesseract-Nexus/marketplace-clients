import { NextRequest, NextResponse } from 'next/server';

const CUSTOMERS_SERVICE_URL = process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:8089/api/v1';
const CUSTOMERS_BASE_URL = CUSTOMERS_SERVICE_URL.replace(/\/api\/v1\/?$/, '');
const AUTH_BFF_URL = process.env.AUTH_BFF_INTERNAL_URL || process.env.AUTH_BFF_URL || 'http://localhost:8080';

// Use storefront endpoints for customer-facing address operations
// These endpoints use customer JWT auth instead of staff RBAC
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
 * Get auth context from either JWT or session cookie.
 * Supports OAuth/session-based auth where accessToken is not available client-side.
 */
async function getAuthContext(request: NextRequest): Promise<{ customerId?: string; token?: string } | null> {
  const authHeader = request.headers.get('Authorization');

  // Check if we have a valid JWT token
  if (authHeader && authHeader !== 'Bearer ' && authHeader !== 'Bearer') {
    const tokenPayload = decodeJwtPayload(authHeader);
    if (tokenPayload?.sub) {
      return { customerId: tokenPayload.sub, token: authHeader };
    }
  }

  // Fall back to session-based auth (OAuth flow)
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
        customerId: session.user.id,
        // auth-bff may provide access_token for BFF-to-service calls
        token: session.access_token ? `Bearer ${session.access_token}` : undefined,
      };
    }
  } catch (error) {
    console.error('[Address API] Failed to get session:', error);
  }

  return null;
}

// SECURITY: Validate that the customerId in URL path matches the authenticated customer
function validateCustomerOwnership(authenticatedCustomerId: string | undefined, requestedCustomerId: string): boolean {
  if (!authenticatedCustomerId) return false;
  return authenticatedCustomerId === requestedCustomerId;
}

// DELETE /api/customers/[customerId]/addresses/[addressId]
// Supports both JWT and session-based (OAuth) authentication
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string; addressId: string }> }
) {
  try {
    const { customerId, addressId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    // Get auth context from either JWT or session
    const auth = await getAuthContext(request);
    if (!auth?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Prevent IDOR attacks
    if (!validateCustomerOwnership(auth.customerId, customerId)) {
      return NextResponse.json(
        { error: 'Access denied: You can only delete your own addresses' },
        { status: 403 }
      );
    }

    // Build headers for internal service call
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Internal-Request': 'true',
      'X-User-Id': auth.customerId,
    };
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }
    if (storefrontId) {
      headers['X-Storefront-ID'] = storefrontId;
    }
    if (auth.token) {
      headers['Authorization'] = auth.token;
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
// Supports both JWT and session-based (OAuth) authentication
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string; addressId: string }> }
) {
  try {
    const { customerId, addressId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    // Get auth context from either JWT or session
    const auth = await getAuthContext(request);
    if (!auth?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Prevent IDOR attacks
    if (!validateCustomerOwnership(auth.customerId, customerId)) {
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
      'X-Internal-Request': 'true',
      'X-User-Id': auth.customerId,
    };
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }
    if (storefrontId) {
      headers['X-Storefront-ID'] = storefrontId;
    }
    if (auth.token) {
      headers['Authorization'] = auth.token;
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
// Supports both JWT and session-based (OAuth) authentication
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string; addressId: string }> }
) {
  try {
    const { customerId, addressId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    // Get auth context from either JWT or session
    const auth = await getAuthContext(request);
    if (!auth?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Prevent IDOR attacks
    if (!validateCustomerOwnership(auth.customerId, customerId)) {
      return NextResponse.json(
        { error: 'Access denied: You can only modify your own addresses' },
        { status: 403 }
      );
    }

    // Build headers for internal service call
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Internal-Request': 'true',
      'X-User-Id': auth.customerId,
    };
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }
    if (storefrontId) {
      headers['X-Storefront-ID'] = storefrontId;
    }
    if (auth.token) {
      headers['Authorization'] = auth.token;
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
