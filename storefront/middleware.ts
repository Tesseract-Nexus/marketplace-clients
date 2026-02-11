import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { secureCompare, validateCsrfToken } from '@/lib/security/csrf';

// Simple debug logger for middleware (Edge runtime compatible)
const isDev = process.env.NODE_ENV !== 'production';
const debugLog = (...args: unknown[]) => isDev && console.log(...args);

// Base domain for tenant subdomains (e.g., tesserix.app)
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'tesserix.app';

// Custom domain service URL for domain resolution
const CUSTOM_DOMAIN_SERVICE_URL = process.env.CUSTOM_DOMAIN_SERVICE_URL || 'http://custom-domain-service.marketplace.svc.cluster.local:8093';

// Timeouts and cache settings
const RESOLUTION_TIMEOUT = 1500; // 1.5 seconds

// Cache for custom domain resolution
const resolvedDomains = new Map<string, { tenantSlug: string; tenantId: string; timestamp: number }>();
const DOMAIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Static paths that should not be processed (tenant resolution skipped)
// Note: /api and /auth are NOT here — they go through CSRF validation below
const STATIC_PATHS = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/images',
  '/assets',
];

// Paths excluded from CSRF validation (pre-auth, webhooks, health checks, analytics proxy, BFF session management)
const CSRF_EXCLUDED_PATHS = [
  '/api/csrf',           // Token generation endpoint
  '/api/webhooks/',      // External callers (Stripe/Razorpay signature verification)
  '/api/health',         // Health check
  '/api/op/',            // OpenPanel analytics proxy (rewritten to external service)
  '/api/auth/login',     // Pre-authentication
  '/api/auth/register',  // Pre-authentication
  '/api/auth/register-from-guest', // Pre-authentication
  '/api/auth/oauth/',    // OAuth flow
  '/auth/direct/login',  // BFF pre-authentication
  '/auth/direct/register', // BFF pre-authentication
  '/auth/direct/mfa/',   // Mid-login flow
  '/auth/direct/check-deactivated', // Pre-auth check
  '/auth/direct/request-password-reset', // Unauthenticated
  '/auth/direct/validate-reset-token',   // Unauthenticated
  '/auth/direct/reset-password',         // Unauthenticated
  '/auth/direct/reactivate-account',     // Unauthenticated
  '/auth/otp/',          // OTP login flow (pre-auth)
  '/auth/passkeys/authentication/', // Passkey login flow (pre-auth)
  '/auth/refresh',       // BFF session token refresh (protected by HttpOnly session cookie)
  '/auth/logout',        // BFF session logout (protected by HttpOnly session cookie)
  '/auth/ws-ticket',     // BFF WebSocket ticket (protected by HttpOnly session cookie)
];

/**
 * Check if a hostname is a custom domain (not tesserix.app or localhost)
 */
function isCustomDomain(host: string): boolean {
  const hostname = (host.split(':')[0] || '').toLowerCase();

  // Not custom if it's tesserix.app
  if (hostname.endsWith(`.${BASE_DOMAIN}`) || hostname === BASE_DOMAIN) {
    return false;
  }

  // Not custom if it's localhost
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return false;
  }

  // Not custom if it's an IP address
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return false;
  }

  return true;
}

/**
 * Extract the base domain from a hostname
 * e.g., www.yahvismartfarm.com -> yahvismartfarm.com
 */
function extractBaseDomain(host: string): string {
  const hostname = (host.split(':')[0] || '').toLowerCase();

  // If it starts with 'www.', remove it
  if (hostname.startsWith('www.')) {
    return hostname.substring(4);
  }

  return hostname;
}

/**
 * Resolve a custom domain to tenant information using custom-domain-service
 */
async function resolveCustomDomain(domain: string): Promise<{ tenantSlug: string; tenantId: string } | null> {
  const now = Date.now();

  // Check cache first
  const cached = resolvedDomains.get(domain);
  if (cached && now - cached.timestamp < DOMAIN_CACHE_TTL) {
    debugLog('[Storefront Middleware] Custom domain resolved from cache:', domain, '->', cached.tenantSlug);
    return { tenantSlug: cached.tenantSlug, tenantId: cached.tenantId };
  }

  try {
    const response = await fetch(
      `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/internal/resolve?domain=${encodeURIComponent(domain)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service': 'storefront-middleware',
        },
        signal: AbortSignal.timeout(RESOLUTION_TIMEOUT),
      }
    );

    if (response.ok) {
      const result = await response.json();
      if (result.tenant_slug && result.tenant_id) {
        // Cache the result
        resolvedDomains.set(domain, {
          tenantSlug: result.tenant_slug,
          tenantId: result.tenant_id,
          timestamp: now,
        });
        debugLog('[Storefront Middleware] Custom domain resolved via API:', domain, '->', result.tenant_slug);
        return { tenantSlug: result.tenant_slug, tenantId: result.tenant_id };
      }
    }

    if (response.status === 404) {
      debugLog('[Storefront Middleware] Custom domain not found:', domain);
      return null;
    }

    console.error('[Storefront Middleware] Custom domain resolution failed:', response.status);
    return null;
  } catch (error) {
    console.error('[Storefront Middleware] Custom domain resolution error:', error);
    // Return cached value if available (even if stale)
    if (cached) {
      return { tenantSlug: cached.tenantSlug, tenantId: cached.tenantId };
    }
    return null;
  }
}

// Extract tenant slug from hostname
// e.g., demo-store.tesserix.app -> demo-store
function getTenantFromHost(host: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0] || '';

  // Check if it's a subdomain of the base domain
  if (hostname && hostname.endsWith(`.${BASE_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${BASE_DOMAIN}`, '');
    // Skip if it's a system subdomain (these don't have tenant storefronts)
    if (['www', 'api', 'admin', 'dev-store', 'dev-admin'].includes(subdomain)) {
      return null;
    }
    return subdomain;
  }

  // For localhost or IP addresses, return null (use path-based routing)
  if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  return null;
}

/**
 * Extract tenant slug from request headers (set by Istio VirtualService for custom domains)
 *
 * For custom domains like yahvismartfarm.com, the VirtualService injects:
 * - X-Tenant-Slug: the tenant slug (e.g., "customer-store")
 * - X-Tenant-ID: the tenant UUID
 * - X-Custom-Domain: the custom domain (e.g., "yahvismartfarm.com")
 *
 * Security: These headers are set by Istio's VirtualService "set" operation which
 * OVERWRITES any client-provided headers, so they cannot be spoofed.
 */
function getTenantFromHeaders(request: NextRequest): string | null {
  const tenantSlug = request.headers.get('x-tenant-slug');
  if (tenantSlug && tenantSlug.length > 0) {
    return tenantSlug;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // Skip static paths
  if (STATIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // --- CSRF validation for API routes ---
  // /auth/* routes are proxied to auth-bff which has its own session-based CSRF protection.
  // Storefront CSRF (double-submit cookie) only applies to /api/* routes.
  // /auth/error is a Next.js page (not a BFF proxy route) — let it through to tenant resolution
  const isAuthPage = pathname === '/auth/error';
  const isApiOrAuth = !isAuthPage && (pathname.startsWith('/api/') || pathname.startsWith('/auth/'));
  if (isApiOrAuth) {
    const isAuthBffRoute = pathname.startsWith('/auth/');
    const method = request.method.toUpperCase();
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    if (isMutation && !isAuthBffRoute && !CSRF_EXCLUDED_PATHS.some(p => pathname.startsWith(p))) {
      const cookieToken = request.cookies.get('sf-csrf-token')?.value;
      const headerToken = request.headers.get('X-CSRF-Token');

      if (!cookieToken || !headerToken || !secureCompare(cookieToken, headerToken)) {
        return NextResponse.json(
          { success: false, error: { code: 'CSRF_VALIDATION_FAILED', message: 'Missing or invalid CSRF token' } },
          { status: 403 }
        );
      }

      const isValid = await validateCsrfToken(headerToken);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: { code: 'CSRF_VALIDATION_FAILED', message: 'Expired CSRF token' } },
          { status: 403 }
        );
      }
    }

    // API/auth routes don't need tenant resolution — exit early
    return NextResponse.next();
  }

  let tenantSlug: string | null = null;
  let tenantId: string | null = null;
  let isCustomDomainRequest = false;

  // Check if this is a custom domain request
  if (isCustomDomain(host)) {
    isCustomDomainRequest = true;
    const baseDomain = extractBaseDomain(host);
    debugLog('[Storefront Middleware] Detected custom domain:', host, '-> base domain:', baseDomain);

    // Resolve the custom domain to get tenant info
    const resolved = await resolveCustomDomain(baseDomain);
    if (resolved) {
      tenantSlug = resolved.tenantSlug;
      tenantId = resolved.tenantId;
      debugLog('[Storefront Middleware] Custom domain resolved:', baseDomain, '-> tenant:', tenantSlug);
    } else {
      // Fallback: Check if VirtualService injected headers
      tenantSlug = getTenantFromHeaders(request);
      tenantId = request.headers.get('x-tenant-id');
      if (tenantSlug) {
        debugLog('[Storefront Middleware] Custom domain fallback - tenant from headers:', tenantSlug);
      }
    }
  } else {
    // Standard tesserix.app or localhost domain - extract from hostname
    tenantSlug = getTenantFromHost(host);

    // If not found in hostname, check headers (for VirtualService-injected custom domains)
    if (!tenantSlug) {
      tenantSlug = getTenantFromHeaders(request);
      tenantId = request.headers.get('x-tenant-id');
    }
  }

  // Check for preview mode via query parameter
  // This allows store owners to preview unpublished storefronts
  const isPreviewMode = searchParams.get('preview') === 'true';

  // Set tenant slug and preview mode in request headers for layout to read
  const requestHeaders = new Headers(request.headers);
  if (tenantSlug) {
    requestHeaders.set('x-tenant-slug', tenantSlug);
  }
  if (tenantId) {
    requestHeaders.set('x-tenant-id', tenantId);
  }
  if (isPreviewMode) {
    requestHeaders.set('x-preview-mode', 'true');
  }
  requestHeaders.set('x-is-custom-domain', isCustomDomainRequest ? 'true' : 'false');

  // Generate nonce for Content Security Policy
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  requestHeaders.set('x-nonce', nonce);

  // Build CSP with nonce (replaces unsafe-inline and unsafe-eval for scripts)
  const cspDevConnectSrc = isDev ? ' http://localhost:* ws://localhost:*' : '';
  const openpanelApiUrl = process.env.NEXT_PUBLIC_OPENPANEL_API_URL || '';
  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com https://*.razorpay.com${openpanelApiUrl ? ` ${openpanelApiUrl}` : ''}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https://storage.googleapis.com https://storage.cloud.google.com https://*.storage.googleapis.com https://*.googleusercontent.com https://platform-lookaside.fbsbx.com https://*.fbcdn.net https://*.mark8ly.app https://images.unsplash.com https://picsum.photos https://*.blob.core.windows.net",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' https://*.mark8ly.app https://storage.googleapis.com https://api.stripe.com https://*.razorpay.com https://api.frankfurter.app wss://*.mark8ly.app${openpanelApiUrl ? ` ${openpanelApiUrl}` : ''}${cspDevConnectSrc}`,
    "frame-src 'self' https://js.stripe.com https://*.razorpay.com",
    "frame-ancestors 'self' https://*.mark8ly.app",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
