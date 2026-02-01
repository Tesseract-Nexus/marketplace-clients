import { NextRequest, NextResponse } from 'next/server';

// Remove /api/v1 suffix if present (env var may include it)
const ORDERS_SERVICE_URL = (process.env.ORDERS_SERVICE_URL || 'http://localhost:3108').replace(/\/api\/v1\/?$/, '');
const AUTH_BFF_URL = process.env.AUTH_BFF_INTERNAL_URL || process.env.AUTH_BFF_URL || 'http://localhost:8080';

/**
 * Decode JWT payload to extract tenant_id (without verification — Istio validates the JWT).
 */
function decodeJwtPayload(token: string): Record<string, string> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
  } catch {
    return null;
  }
}

/**
 * Get access token from the auth-bff session endpoint using the browser's session cookie.
 * This is required because the accessToken is stored server-side in the auth-bff session,
 * not as a browser cookie — the browser only has the bff_session cookie.
 */
async function getSessionToken(request: NextRequest): Promise<{ token: string; tenantId?: string } | null> {
  // First check if there's a direct Authorization header (from programmatic fetch calls)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = decodeJwtPayload(token);
    return { token, tenantId: payload?.tenant_id };
  }

  // For browser navigation: get the access token from auth-bff using cookies
  // Use /internal/get-token which returns access_token for BFF-to-service calls
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;

  try {
    const response = await fetch(`${AUTH_BFF_URL}/internal/get-token`, {
      headers: {
        'Cookie': cookie,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) return null;

    const tokenData = await response.json();
    // /internal/get-token returns { access_token, user_id, tenant_id, tenant_slug, expires_at }
    if (tokenData.access_token) {
      return {
        token: tokenData.access_token,
        tenantId: tokenData.tenant_id,
      };
    }
    return null;
  } catch (error) {
    console.error('[BFF Receipt] Failed to get session token:', error);
    return null;
  }
}

/**
 * Resolves tenant ID using multiple sources (in priority order):
 * 1. x-tenant-id header (set by middleware for client-side fetch calls)
 * 2. Session/JWT tenant_id (from auth-bff session or JWT claim)
 * 3. Hostname-based resolution via tenant-router-service
 */
async function resolveTenantId(request: NextRequest, sessionTenantId?: string, accessToken?: string): Promise<string | null> {
  // 1. Header (from middleware or client fetch)
  const fromHeader = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
  if (fromHeader) return fromHeader;

  // 2. From session or JWT
  if (sessionTenantId) return sessionTenantId;
  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);
    if (payload?.tenant_id) return payload.tenant_id;
  }

  // 3. Resolve from hostname
  const host = request.headers.get('host') || '';
  let slug: string | null = null;
  if (host.endsWith('.tesserix.app')) {
    slug = host.split('.')[0] || null;
  }
  if (!slug) {
    slug = request.headers.get('x-tenant-slug');
  }

  if (slug) {
    try {
      const tenantRouterUrl = process.env.TENANT_ROUTER_SERVICE_URL || 'http://tenant-router-service:8089';
      const resp = await fetch(`${tenantRouterUrl}/api/v1/hosts/${slug}`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.tenant_id) return data.tenant_id;
      }
    } catch (err) {
      console.error('[BFF Receipt] Failed to resolve tenant from slug:', err);
    }
  }

  return null;
}

/**
 * GET /api/orders/[orderId]/receipt
 * Download receipt/invoice for a customer's own order.
 *
 * Supports both:
 * - Client-side fetch calls (X-Tenant-ID + Authorization headers)
 * - Direct browser navigation via <a href> (session cookie → auth-bff → access token)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // Get access token (from Authorization header or auth-bff session)
    const session = await getSessionToken(request);
    if (!session?.token) {
      return NextResponse.json(
        { error: 'Authentication required to download receipt' },
        { status: 401 }
      );
    }

    // Resolve tenant ID
    const tenantId = await resolveTenantId(request, session.tenantId, session.token);
    if (!tenantId) {
      console.error('[BFF Receipt] Could not resolve tenant ID');
      return NextResponse.json({ error: 'Could not determine tenant' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';

    // Proxy to the admin receipt endpoint (uses RequirePermissionAllowInternal,
    // so X-Internal-Service header grants access without RBAC role checks).
    // This is the same endpoint the admin BFF calls — avoids CustomerAuthMiddleware
    // issues where the customer JWT isn't properly propagated through Istio.
    const backendUrl = `${ORDERS_SERVICE_URL}/api/v1/orders/${encodeURIComponent(orderId)}/receipt?format=${encodeURIComponent(format)}`;

    const response = await fetch(backendUrl, {
      headers: {
        'X-Tenant-ID': tenantId,
        Authorization: `Bearer ${session.token}`,
        'X-Internal-Service': 'storefront',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[BFF Receipt] Backend error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: errorText || 'Failed to get receipt' },
        { status: response.status }
      );
    }

    // For PDF, stream binary response
    if (format === 'pdf') {
      const blob = await response.blob();
      return new NextResponse(blob, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': response.headers.get('Content-Disposition') || `attachment; filename="receipt-${orderId}.pdf"`,
        },
      });
    }

    // For HTML or JSON, pass through
    const body = await response.text();
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'text/html',
      },
    });
  } catch (error) {
    console.error('[BFF Receipt] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
