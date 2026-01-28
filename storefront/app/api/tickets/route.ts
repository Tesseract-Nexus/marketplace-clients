import { NextRequest, NextResponse } from 'next/server';

const TICKETS_SERVICE_URL = (process.env.TICKETS_SERVICE_URL || 'http://localhost:3036').replace(/\/api\/v1\/?$/, '');
const AUTH_BFF_URL = process.env.AUTH_BFF_INTERNAL_URL || process.env.AUTH_BFF_URL || 'http://localhost:8080';

/**
 * Get session token from auth-bff using the request cookies.
 * This supports OAuth/session-based auth where accessToken is not available client-side.
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
      // auth-bff may provide access_token in session response for BFF-to-service calls
      return {
        token: session.access_token || session.accessToken,
        userId: session.user.id,
      };
    }
    return null;
  } catch (error) {
    console.error('[Tickets API] Failed to get session:', error);
    return null;
  }
}

// GET /api/tickets - List user's tickets
export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    let authorization = request.headers.get('Authorization');
    let userId = request.headers.get('X-User-Id');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Check if authorization is empty or just "Bearer " (OAuth/session-based auth)
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
      // If no session at all, require authorization
      if (!session?.userId) {
        return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
      }
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Build headers - include Authorization only if we have it
    const headers: Record<string, string> = {
      'X-Tenant-ID': tenantId,
    };
    if (authorization && authorization !== 'Bearer ' && authorization !== 'Bearer') {
      headers['Authorization'] = authorization;
    }
    if (storefrontId) {
      headers['X-Storefront-ID'] = storefrontId;
    }
    if (userId) {
      headers['X-User-Id'] = userId;
    }
    // Add internal service header to indicate this is a trusted internal request
    headers['X-Internal-Request'] = 'true';

    const response = await fetch(`${TICKETS_SERVICE_URL}/api/v1/tickets${queryString ? `?${queryString}` : ''}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No tickets found - return empty array
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
        });
      }
      const errorText = await response.text();
      console.error('[Tickets API] Service error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Tickets API] Failed to fetch tickets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');
    let authorization = request.headers.get('Authorization');
    const userName = request.headers.get('X-User-Name');
    let userId = request.headers.get('X-User-Id');
    const userEmail = request.headers.get('X-User-Email');

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Check if authorization is empty or just "Bearer " (OAuth/session-based auth)
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
      // If no session at all, require authorization
      if (!session?.userId) {
        return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
      }
    }

    const body = await request.json();

    // Build headers - include Authorization only if we have it
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Internal-Service': 'storefront',
    };
    if (authorization && authorization !== 'Bearer ' && authorization !== 'Bearer') {
      headers['Authorization'] = authorization;
    }
    if (storefrontId) {
      headers['X-Storefront-ID'] = storefrontId;
    }
    if (userName) {
      headers['X-User-Name'] = userName;
    }
    if (userId) {
      headers['X-User-Id'] = userId;
    }
    if (userEmail) {
      headers['X-User-Email'] = userEmail;
    }

    const response = await fetch(`${TICKETS_SERVICE_URL}/api/v1/tickets`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Tickets API] Create ticket error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to create ticket' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[Tickets API] Failed to create ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
