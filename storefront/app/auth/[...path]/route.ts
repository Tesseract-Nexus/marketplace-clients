/**
 * Auth Route Proxy for Storefront
 *
 * Proxies all /auth/* requests to auth-bff service for customer authentication.
 * This enables BFF-pattern authentication with Keycloak OIDC.
 *
 * Routes proxied:
 * - /auth/session - GET - Returns current session info
 * - /auth/login - GET - Redirects to Keycloak login (supports kc_idp_hint for social login)
 * - /auth/logout - GET/POST - Logs out via Keycloak
 * - /auth/callback - GET - Handles Keycloak callback
 * - /auth/refresh - POST - Refreshes session tokens
 * - /auth/csrf - GET - Returns CSRF token
 *
 * Social Login:
 * - /auth/login?kc_idp_hint=google - Google OAuth
 * - /auth/login?kc_idp_hint=facebook - Facebook/Meta OAuth
 * - /auth/login?kc_idp_hint=apple - Apple Sign In
 * - /auth/login?kc_idp_hint=instagram - Instagram (via Facebook)
 *
 * Registration:
 * - /auth/login?prompt=create - Direct to Keycloak registration page
 */

import { NextRequest, NextResponse } from 'next/server';

// Auth-BFF URL - should be configured via environment variable
// For storefront, this connects to the customer realm authentication
const AUTH_BFF_URL = process.env.AUTH_BFF_URL || process.env.NEXT_PUBLIC_AUTH_BFF_URL || 'http://localhost:8080';

// Optional: Different auth-bff for internal vs external calls
const AUTH_BFF_INTERNAL_URL = process.env.AUTH_BFF_INTERNAL_URL || AUTH_BFF_URL;

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
  const targetUrl = `${AUTH_BFF_INTERNAL_URL}${authPath}${url.search}`;

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

    // Forward tenant context headers
    const tenantId = request.headers.get('X-Tenant-ID');
    const tenantSlug = request.headers.get('x-tenant-slug');
    const storefrontId = request.headers.get('X-Storefront-ID');

    if (tenantId) headers.set('X-Tenant-ID', tenantId);
    if (tenantSlug) headers.set('X-Tenant-Slug', tenantSlug);
    if (storefrontId) headers.set('X-Storefront-ID', storefrontId);

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

    console.log(`[Auth Proxy] ${method} ${authPath} -> ${targetUrl}`);

    const response = await fetch(targetUrl, fetchOptions);

    // Handle redirects (login/logout flows)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        console.log(`[Auth Proxy] Redirecting to: ${location}`);

        // Convert relative URLs to absolute (NextResponse.redirect requires absolute URLs)
        let absoluteLocation = location;
        if (location.startsWith('/')) {
          const host = request.headers.get('host') || 'localhost';
          const protocol = request.headers.get('x-forwarded-proto') || 'https';
          absoluteLocation = `${protocol}://${host}${location}`;
          console.log(`[Auth Proxy] Converted to absolute URL: ${absoluteLocation}`);
        }

        // Create redirect response and copy cookies
        const redirectResponse = NextResponse.redirect(absoluteLocation, response.status);

        // Copy Set-Cookie headers (critical for session management)
        const setCookies = response.headers.getSetCookie();
        for (const setCookie of setCookies) {
          redirectResponse.headers.append('Set-Cookie', setCookie);
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
      for (const setCookie of setCookies) {
        nextResponse.headers.append('Set-Cookie', setCookie);
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
    for (const setCookie of setCookies) {
      nextResponse.headers.append('Set-Cookie', setCookie);
    }

    return nextResponse;
  } catch (error) {
    console.error('[Auth Proxy] Error:', error);
    return NextResponse.json(
      {
        error: 'Authentication service unavailable',
        message: 'Please try again later',
      },
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
