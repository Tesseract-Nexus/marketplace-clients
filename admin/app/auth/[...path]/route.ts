/**
 * Auth Route Proxy
 *
 * Proxies all /auth/* requests to auth-bff service.
 * This enables BFF-pattern authentication with Keycloak OIDC.
 *
 * Routes proxied:
 * - /auth/session - GET - Returns current session info
 * - /auth/login - GET - Redirects to Keycloak login
 * - /auth/logout - GET/POST - Logs out via Keycloak
 * - /auth/callback - GET - Handles Keycloak callback
 * - /auth/refresh - POST - Refreshes session tokens
 * - /auth/csrf - GET - Returns CSRF token
 */

import { NextRequest, NextResponse } from 'next/server';

const AUTH_BFF_URL = process.env.AUTH_BFF_URL || 'http://localhost:8080';

/**
 * Proxy request to auth-bff
 */
async function proxyToAuthBff(
  request: NextRequest,
  path: string[],
  method: string
): Promise<NextResponse | Response> {
  const authPath = '/auth/' + path.join('/');
  const url = new URL(request.url);
  const targetUrl = `${AUTH_BFF_URL}${authPath}${url.search}`;

  try {
    // Forward headers (especially cookies for session management)
    const headers = new Headers();
    headers.set('Accept', 'application/json');

    // Forward cookies from the incoming request
    const cookie = request.headers.get('cookie');
    if (cookie) {
      headers.set('cookie', cookie);
    }

    // Forward X-Forwarded-* headers for proper URL construction in BFF
    const host = request.headers.get('host');
    if (host) {
      headers.set('X-Forwarded-Host', host);
    }
    headers.set('X-Forwarded-Proto', 'https');

    // Tell auth-bff this is an admin/staff context — NOT customer/storefront.
    // This ensures auth-bff scopes session lookups to the tesserix-internal
    // realm and prevents customer sessions from being returned for admin requests.
    headers.set('X-Auth-Context', 'admin');

    // Forward tenant context headers (set by middleware from subdomain/Istio)
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantSlug = request.headers.get('x-tenant-slug');
    if (tenantId) headers.set('X-Tenant-ID', tenantId);
    if (tenantSlug) headers.set('X-Tenant-Slug', tenantSlug);

    // Forward CSRF token if present
    const csrfToken = request.headers.get('X-CSRF-Token');
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }

    // Build request options
    const fetchOptions: RequestInit = {
      method,
      headers,
      redirect: 'manual', // Handle redirects ourselves to preserve cookies
    };

    // Add body for POST/PUT/PATCH requests
    // Only set Content-Type: application/json when there's actually a body,
    // otherwise Fastify rejects with FST_ERR_CTP_EMPTY_JSON_BODY
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const body = await request.text();
        if (body) {
          headers.set('Content-Type', request.headers.get('content-type') || 'application/json');
          fetchOptions.body = body;
        }
      } catch {
        // No body is fine for some requests
      }
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Handle redirects (login/logout flows)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        // Convert relative URLs to absolute (NextResponse.redirect requires absolute URLs)
        let absoluteLocation = location;
        if (location.startsWith('/')) {
          const host = request.headers.get('host') || 'localhost';
          const protocol = request.headers.get('x-forwarded-proto') || 'https';
          absoluteLocation = `${protocol}://${host}${location}`;
        }

        // Create redirect response and copy cookies
        const redirectResponse = NextResponse.redirect(absoluteLocation, response.status);

        // Copy Set-Cookie headers
        const setCookies = response.headers.getSetCookie();
        for (const cookie of setCookies) {
          redirectResponse.headers.append('Set-Cookie', cookie);
        }

        return redirectResponse;
      }
    }

    // For JSON responses, parse and return
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      const nextResponse = NextResponse.json(data, { status: response.status });

      // Copy Set-Cookie headers (important for session cookies)
      const setCookies = response.headers.getSetCookie();
      for (const cookie of setCookies) {
        nextResponse.headers.append('Set-Cookie', cookie);
      }

      // Copy other relevant headers
      const cacheControl = response.headers.get('cache-control');
      if (cacheControl) {
        nextResponse.headers.set('Cache-Control', cacheControl);
      }

      return nextResponse;
    }

    // For non-JSON responses (HTML, etc.), stream through
    const body = await response.arrayBuffer();
    const nextResponse = new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type': contentType || 'text/html',
      },
    });

    // Copy Set-Cookie headers
    const setCookies = response.headers.getSetCookie();
    for (const cookie of setCookies) {
      nextResponse.headers.append('Set-Cookie', cookie);
    }

    return nextResponse;
  } catch (error) {
    console.error('[Auth Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToAuthBff(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToAuthBff(request, path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToAuthBff(request, path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyToAuthBff(request, path, 'DELETE');
}
