import { NextRequest, NextResponse } from 'next/server';

const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8082';

interface CreateTenantRequest {
  name: string;
  slug: string;
  industry?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface CreateTenantResponse {
  success: boolean;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
  error?: string;
}

/**
 * Decode JWT token and extract user ID
 * JWT format: header.payload.signature (base64 encoded)
 */
function extractUserIdFromJWT(token: string): string | null {
  try {
    // Remove "Bearer " prefix if present
    const jwt = token.replace(/^Bearer\s+/i, '');
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));

    // Try common JWT user ID fields
    return payload.sub || payload.user_id || payload.userId || null;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

const getAuthHeaders = (request: NextRequest) => {
  const authToken = request.headers.get('authorization') || '';

  // Try to extract user ID from JWT token first
  let userId = '';
  if (authToken) {
    const jwtUserId = extractUserIdFromJWT(authToken);
    if (jwtUserId) {
      userId = jwtUserId;
    }
  }

  // Fall back to x-user-id header (set by ingress/middleware)
  if (!userId) {
    userId = request.headers.get('x-user-id') || '';
  }

  return { userId, authToken };
};

/**
 * POST /api/tenants/create
 * Create a new independent store (tenant) from the admin panel
 *
 * This is a simplified tenant creation flow for existing users who want to
 * create additional independent stores. It bypasses the full onboarding flow.
 */
export async function POST(request: NextRequest): Promise<NextResponse<CreateTenantResponse>> {
  try {
    const { userId, authToken } = getAuthHeaders(request);

    // Validate user is authenticated
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please log in and try again.' },
        { status: 401 }
      );
    }

    const body: CreateTenantRequest = await request.json();

    // Validate required fields
    if (!body.name || body.name.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Business name must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (!body.slug || body.slug.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Slug must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(body.slug)) {
      return NextResponse.json(
        { success: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Create tenant via tenant service
    // This endpoint creates a tenant and assigns the current user as owner
    const response = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/tenants/create-for-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
          ...(authToken && { 'Authorization': authToken }),
        },
        body: JSON.stringify({
          name: body.name,
          slug: body.slug,
          industry: body.industry || 'other',
          primary_color: body.primaryColor || '#3b82f6',
          secondary_color: body.secondaryColor || '#8b5cf6',
        }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      // Response format: { success: true, data: { tenant: {...}, membership: {...}, admin_url: string } }
      if (result.success && result.data?.tenant) {
        return NextResponse.json({
          success: true,
          tenant: {
            id: result.data.tenant.id,
            name: result.data.tenant.name,
            slug: result.data.tenant.slug,
          },
        });
      }
    }

    // Handle specific error cases
    if (response.status === 409) {
      return NextResponse.json(
        { success: false, error: 'A store with this slug already exists' },
        { status: 409 }
      );
    }

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json(
        { success: false, error: 'You are not authorized to create a store' },
        { status: response.status }
      );
    }

    // Try to get error message from response
    try {
      const errorResult = await response.json();
      return NextResponse.json(
        { success: false, error: errorResult.message || 'Failed to create store' },
        { status: response.status }
      );
    } catch {
      return NextResponse.json(
        { success: false, error: 'Failed to create store' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating tenant:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred while creating the store' },
      { status: 500 }
    );
  }
}
