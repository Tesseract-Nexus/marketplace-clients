import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple debug logger for middleware (Edge runtime compatible)
const isDev = process.env.NODE_ENV !== 'production';
const debugLog = (...args: unknown[]) => isDev && console.log(...args);

// Base domain for tenant subdomains (e.g., mark8ly.app)
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'mark8ly.app';

// Custom domain service URL for domain resolution
const CUSTOM_DOMAIN_SERVICE_URL = process.env.CUSTOM_DOMAIN_SERVICE_URL || 'http://custom-domain-service.marketplace.svc.cluster.local:8093';

// Timeouts and cache settings
const RESOLUTION_TIMEOUT = 1500; // 1.5 seconds

// Cache for custom domain resolution
const resolvedDomains = new Map<string, { tenantSlug: string; tenantId: string; timestamp: number }>();
const DOMAIN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Static paths that should not be processed
const STATIC_PATHS = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/images',
  '/assets',
];

/**
 * Check if a hostname is a custom domain (not mark8ly.app or localhost)
 */
function isCustomDomain(host: string): boolean {
  const hostname = (host.split(':')[0] || '').toLowerCase();

  // Not custom if it's mark8ly.app
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
// e.g., demo-store.mark8ly.app -> demo-store
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
    // Standard mark8ly.app or localhost domain - extract from hostname
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

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
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
