/**
 * Profile Update API Route
 *
 * Handles profile updates for authenticated customers.
 * Proxies to the customers-service for persistence.
 * Supports both JWT-based and session-based (OAuth) authentication.
 */

import { NextRequest, NextResponse } from 'next/server';

const CUSTOMERS_SERVICE_URL = process.env.CUSTOMERS_SERVICE_URL || 'http://localhost:8089/api/v1';
const CUSTOMERS_BASE_URL = CUSTOMERS_SERVICE_URL.replace(/\/api\/v1\/?$/, '');
const AUTH_BFF_URL = process.env.AUTH_BFF_INTERNAL_URL || process.env.AUTH_BFF_URL || 'http://localhost:8080';

// Helper to decode JWT payload (base64url decode)
function decodeJwtPayload(token: string): { sub?: string; customer_id?: string; email?: string } | null {
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
  // Use /internal/get-token which returns access_token for BFF-to-service calls
  try {
    const cookie = request.headers.get('cookie');
    if (!cookie) {
      console.log('[Profile API] No cookie header present');
      return null;
    }

    // Forward host so auth-bff reads the correct session cookie (bff_storefront_session)
    const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';

    const response = await fetch(`${AUTH_BFF_URL}/internal/get-token`, {
      headers: {
        'Cookie': cookie,
        'X-Forwarded-Host': forwardedHost,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Profile API] get-token error:', response.status, errorText);
      return null;
    }

    const tokenData = await response.json();
    // /internal/get-token returns { access_token, user_id, tenant_id, tenant_slug, expires_at }
    if (tokenData.user_id) {
      return {
        customerId: tokenData.user_id,
        token: tokenData.access_token ? `Bearer ${tokenData.access_token}` : undefined,
      };
    }
  } catch (error) {
    console.error('[Profile API] Failed to get session:', error);
  }

  return null;
}

// GET /api/auth/profile - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    const auth = await getAuthContext(request);
    if (!auth?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = auth.customerId;

    // Build headers for internal service call
    const headers: Record<string, string> = {
      'X-Internal-Service': 'storefront',
      'X-User-Id': customerId,
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

    const response = await fetch(
      `${CUSTOMERS_BASE_URL}/api/v1/storefront/customers/${customerId}`,
      { headers }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[Profile API] GET error from customers-service:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to fetch profile' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data: data.data || data });
  } catch (error) {
    console.error('[Profile API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/profile - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    const auth = await getAuthContext(request);
    if (!auth?.customerId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const customerId = auth.customerId;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Only allow updating specific fields
    const allowedFields = ['firstName', 'lastName', 'phone'];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Build headers for internal service call
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Internal-Service': 'storefront',
      'X-User-Id': customerId,
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

    const response = await fetch(
      `${CUSTOMERS_BASE_URL}/api/v1/storefront/customers/${customerId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Profile API] Update error:', errorText);
      let error = {};
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText };
      }
      return NextResponse.json(
        { success: false, error: (error as { message?: string }).message || 'Failed to update profile' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data.data || data,
    });
  } catch (error) {
    console.error('[Profile API] PUT exception:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
