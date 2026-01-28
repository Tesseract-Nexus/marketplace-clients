import { NextRequest, NextResponse } from 'next/server';

const CUSTOMERS_SERVICE_URL = process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:8089/api/v1';
const CUSTOMERS_BASE_URL = CUSTOMERS_SERVICE_URL.replace(/\/api\/v1\/?$/, '');

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

// SECURITY: Validate that the customerId in URL path matches the authenticated customer
function validateCustomerOwnership(authHeader: string, requestedCustomerId: string): boolean {
  const tokenPayload = decodeJwtPayload(authHeader);
  if (!tokenPayload) return false;

  const authenticatedCustomerId = tokenPayload.sub || tokenPayload.customer_id;
  return authenticatedCustomerId === requestedCustomerId;
}

// Transform frontend address format to backend format
function transformAddressForBackend(address: Record<string, unknown>): Record<string, unknown> {
  const transformed: Record<string, unknown> = { ...address };

  // Frontend uses 'type', backend uses 'addressType'
  if ('type' in transformed) {
    transformed.addressType = transformed.type;
    delete transformed.type;
  }

  // Backend expects 'country' to be 2-letter ISO code
  // If we have countryCode, use it for country and remove countryCode
  if ('countryCode' in transformed && transformed.countryCode) {
    transformed.country = transformed.countryCode;
    delete transformed.countryCode;
  }

  return transformed;
}

// Transform backend address format to frontend format
function transformAddressForFrontend(address: Record<string, unknown>): Record<string, unknown> {
  const transformed: Record<string, unknown> = { ...address };

  // Backend uses 'addressType', frontend uses 'type'
  if ('addressType' in transformed) {
    transformed.type = transformed.addressType;
    delete transformed.addressType;
  }

  // Frontend expects both country and countryCode
  // Backend only stores country as 2-letter code
  if ('country' in transformed && typeof transformed.country === 'string') {
    transformed.countryCode = transformed.country;
    // Keep country as is - it's already the code
  }

  return transformed;
}

// GET /api/customers/[customerId]/addresses - List addresses
// SECURITY: Validates that the authenticated customer owns the requested data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Prevent IDOR attacks - verify the customerId belongs to the authenticated user
    if (!validateCustomerOwnership(authHeader, customerId)) {
      return NextResponse.json(
        { error: 'Access denied: You can only access your own addresses' },
        { status: 403 }
      );
    }

    // Use storefront endpoint path for customer-facing operations
    const response = await fetch(
      `${CUSTOMERS_BASE_URL}${STOREFRONT_API_PATH}/customers/${customerId}/addresses`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...(tenantId && { 'X-Tenant-ID': tenantId }),
          ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
          'Authorization': authHeader,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.message || 'Failed to fetch addresses' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform response addresses to frontend format
    if (Array.isArray(data)) {
      return NextResponse.json(data.map(transformAddressForFrontend));
    } else if (data.data && Array.isArray(data.data)) {
      return NextResponse.json({
        ...data,
        data: data.data.map(transformAddressForFrontend),
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to fetch addresses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/customers/[customerId]/addresses - Add address
// SECURITY: Validates that the authenticated customer owns the requested data
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // SECURITY: Prevent IDOR attacks - verify the customerId belongs to the authenticated user
    if (!validateCustomerOwnership(authHeader, customerId)) {
      return NextResponse.json(
        { error: 'Access denied: You can only add addresses to your own account' },
        { status: 403 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Transform request body to backend format
    const transformedBody = transformAddressForBackend(body);

    // Use storefront endpoint path for customer-facing operations
    const targetUrl = `${CUSTOMERS_BASE_URL}${STOREFRONT_API_PATH}/customers/${customerId}/addresses`;
    console.log('POST address - target URL:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tenantId && { 'X-Tenant-ID': tenantId }),
        ...(storefrontId && { 'X-Storefront-ID': storefrontId }),
        'Authorization': authHeader,
      },
      body: JSON.stringify(transformedBody),
    });

    console.log('POST address - response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('POST address - error response:', errorText);
      let error = {};
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText };
      }
      return NextResponse.json(
        { error: (error as { message?: string }).message || 'Failed to add address' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform response to frontend format
    const transformedData = data.data
      ? { ...data, data: transformAddressForFrontend(data.data) }
      : transformAddressForFrontend(data);

    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Failed to add address - exception:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
