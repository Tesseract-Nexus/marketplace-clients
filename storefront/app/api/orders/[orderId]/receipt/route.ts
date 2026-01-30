import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Remove /api/v1 suffix if present (env var may include it)
const ORDERS_SERVICE_URL = (process.env.ORDERS_SERVICE_URL || 'http://localhost:3108').replace(/\/api\/v1\/?$/, '');

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
 * Resolves tenant ID using multiple sources (in priority order):
 * 1. x-tenant-id header (set by middleware for client-side fetch calls)
 * 2. JWT token tenant_id claim (works for browser navigation / <a> downloads)
 * 3. Hostname-based resolution via tenant-router-service
 */
async function resolveTenantId(request: NextRequest, accessToken: string | null): Promise<string | null> {
  // 1. Middleware-injected header (client-side fetch calls send this)
  const fromHeader = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID');
  if (fromHeader) return fromHeader;

  // 2. Extract from JWT token (browser navigation — middleware skips /api routes)
  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);
    if (payload?.tenant_id) return payload.tenant_id;
  }

  // 3. Resolve from hostname via tenant-router-service
  const host = request.headers.get('host') || '';
  if (host) {
    let slug: string | null = null;

    // Standard subdomain: {slug}.tesserix.app
    if (host.endsWith('.tesserix.app')) {
      slug = host.split('.')[0] || null;
    }
    // Localhost dev: extract from x-tenant-slug if available
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
        console.error('[BFF] Failed to resolve tenant from slug:', err);
      }
    }
  }

  return null;
}

/**
 * GET /api/orders/[orderId]/receipt
 * Download receipt/invoice for a customer's own order.
 *
 * This endpoint is designed to work with BOTH:
 * - Client-side fetch calls (which send X-Tenant-ID + Authorization headers)
 * - Direct browser navigation via <a href> (which only sends cookies)
 *
 * The middleware skips /api routes, so we resolve tenant ID from multiple sources.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // Get auth: prefer Authorization header, fallback to accessToken cookie
    let accessToken: string | null = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.slice(7);
    }
    if (!accessToken) {
      const cookieStore = await cookies();
      accessToken = cookieStore.get('accessToken')?.value || null;
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required to download receipt' },
        { status: 401 }
      );
    }

    // Resolve tenant ID (handles both fetch-with-headers and browser-navigation cases)
    const tenantId = await resolveTenantId(request, accessToken);
    if (!tenantId) {
      console.error('[BFF] Could not resolve tenant ID for receipt download');
      return NextResponse.json({ error: 'Could not determine tenant' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'pdf';

    // Proxy to the customer-authenticated receipt endpoint
    const backendUrl = `${ORDERS_SERVICE_URL}/api/v1/storefront/my/orders/${encodeURIComponent(orderId)}/receipt?format=${encodeURIComponent(format)}`;

    const response = await fetch(backendUrl, {
      headers: {
        'X-Tenant-ID': tenantId,
        Authorization: `Bearer ${accessToken}`,
        'X-Internal-Service': 'storefront',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[BFF] Receipt fetch failed: ${response.status} - ${errorText}`);
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
    console.error('[BFF] Failed to get receipt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
