import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Base domain for tenant subdomains (e.g., tesserix.app)
const BASE_DOMAIN = process.env.BASE_DOMAIN || 'tesserix.app';

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // Skip static paths
  if (STATIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Extract tenant from hostname (subdomain)
  // e.g., demo-store.tesserix.app -> demo-store
  const tenantSlug = getTenantFromHost(host);

  // Set tenant slug in request headers for layout to read
  const requestHeaders = new Headers(request.headers);
  if (tenantSlug) {
    requestHeaders.set('x-tenant-slug', tenantSlug);
  }

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
