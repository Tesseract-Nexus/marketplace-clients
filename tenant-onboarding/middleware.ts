import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- CSRF protection for state-mutating API requests ---
  const isApiRoute = pathname.startsWith('/api/');
  const isMutatingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
  // Exclude SSE endpoint (GET-only, but also safe from CSRF)
  const isSSEEndpoint = pathname.includes('/events');

  if (isApiRoute && isMutatingMethod && !isSSEEndpoint) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    // Build allowed hostnames set from all trusted sources:
    // - host header, x-forwarded-host (proxy), configured domains
    // Behind Cloudflare → Cloud Run, host may be *.run.app, not the real domain
    const allowedHostnames = new Set<string>();
    const host = request.headers.get('host');
    if (host) allowedHostnames.add(host.split(':')[0]);
    const fwdHost = request.headers.get('x-forwarded-host');
    if (fwdHost) allowedHostnames.add(fwdHost.split(',')[0].trim().split(':')[0]);
    // Configured domains — source of truth for the real public domain
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (siteUrl) { try { allowedHostnames.add(new URL(siteUrl).hostname); } catch { /* */ } }
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;
    if (baseDomain) allowedHostnames.add(baseDomain);

    if (allowedHostnames.size > 0) {
      let originMatch = false;
      if (origin) {
        try { originMatch = allowedHostnames.has(new URL(origin).hostname); } catch { /* */ }
      }
      let refererMatch = false;
      if (referer) {
        try { refererMatch = allowedHostnames.has(new URL(referer).hostname); } catch { /* */ }
      }

      // Block if origin is present but doesn't match any allowed hostname
      if (origin && !originMatch) {
        return NextResponse.json({ error: 'CSRF check failed' }, { status: 403 });
      }
      // Block if no origin but referer is present and doesn't match
      if (!origin && referer && !refererMatch) {
        return NextResponse.json({ error: 'CSRF check failed' }, { status: 403 });
      }
      // Block if neither origin nor referer is present (programmatic clients, curl)
      // Exempt internal API routes (authenticated via X-Admin-Key or X-Internal-Key)
      if (!origin && !referer && !pathname.startsWith('/api/internal/')) {
        return NextResponse.json({ error: 'CSRF check failed: Origin header required' }, { status: 403 });
      }
    }
  }

  // --- Validate sessionId format in API routes (M3: prevent injection) ---
  const sessionIdMatch = pathname.match(/\/api\/onboarding\/([^/]+)\//);
  if (sessionIdMatch) {
    const sessionId = sessionIdMatch[1];
    // Skip if it's a known static segment (not a dynamic sessionId)
    if (!['validate', 'draft'].includes(sessionId)) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sessionId)) {
        return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
      }
    }
  }

  // --- Auth backstop for internal API routes ---
  if (pathname.startsWith('/api/internal/')) {
    const adminKey = request.headers.get('X-Admin-Key');
    if (!adminKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // --- CSP nonce generation ---
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // Build CSP directives with nonce (replaces unsafe-inline for scripts)
  // NOTE: style-src keeps 'unsafe-inline' because Tailwind CSS injects styles at runtime
  // and Next.js injects inline <style> tags for font optimization. Nonce-based styles
  // would require patching every style injection point which is impractical.
  const cspDirectives = [
    `default-src 'self'`,
    // 'unsafe-inline' is a CSP Level 2 fallback: CSP3 browsers that support
    // 'strict-dynamic' automatically ignore 'unsafe-inline', so nonce is enforced.
    // Needed because @openpanel/nextjs injects inline scripts without nonce support.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https://storage.googleapis.com https://*.tesserix.app https://images.unsplash.com`,
    `font-src 'self' data:`,
    `connect-src 'self' https://*.tesserix.app wss://*.tesserix.app https://storage.googleapis.com https://api.posthog.com https://api.frankfurter.app`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
  ].join('; ');

  // Clone request headers and add nonce
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Set security response headers
  response.headers.set('Content-Security-Policy', cspDirectives);
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(), usb=()');
  response.headers.set('X-Request-ID', crypto.randomUUID());

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files, images, and analytics proxy
    {
      source: '/((?!_next/static|_next/image|favicon\\.ico|icon-.*\\.png|apple-touch-icon\\.png|manifest\\.json|op1\\.js).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
