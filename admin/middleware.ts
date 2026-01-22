import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// SECURITY: Production runtime assertion - fail fast if dev bypass is enabled in production
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true') {
  throw new Error('SECURITY: DEV_AUTH_BYPASS cannot be enabled in production. This is a critical security violation.');
}

/**
 * Subdomain-based multi-tenant middleware
 *
 * SECURITY: Validates tenant exists before allowing access.
 * This prevents unauthorized access via arbitrary subdomains
 * when using wildcard DNS/SSL certificates.
 *
 * URL patterns:
 * - Cloud: {tenant}-admin.tesserix.app (e.g., homechef-admin.tesserix.app)
 * - Root:  dev-admin.tesserix.app (dev environment root)
 * - Local: {tenant}.localhost:3001
 *
 * Examples:
 * - homechef-admin.tesserix.app -> tenant: homechef (validated)
 * - dev-admin.tesserix.app -> tenant: null (root domain)
 * - random-admin.tesserix.app -> 404 (tenant doesn't exist)
 */

// Public paths that don't require tenant context
const PUBLIC_PATHS = [
  '/api',
  '/_next',
  '/favicon.ico',
  '/login',
  '/welcome',
  '/onboarding',
  '/tenant-not-found', // Add the 404 page
];

// Root domain prefixes (these are NOT tenants)
const ROOT_PREFIXES = ['dev', 'staging', 'prod'];

// Tenant service URL for validation
const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://tenant-service.devtest.svc.cluster.local:8082';

// DEV MODE: Skip tenant validation when running locally without services
// Set NEXT_PUBLIC_DEV_AUTH_BYPASS=true in .env.local to enable
const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

// Simple cache for tenant validation (Edge Runtime compatible)
// PERFORMANCE: Extended cache with stale-while-revalidate pattern
const validatedTenants = new Map<string, { exists: boolean; timestamp: number; validatedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes - tenant slugs rarely change
const STALE_TTL = 15 * 60 * 1000; // 15 minutes - allow stale data while revalidating
const VALIDATION_TIMEOUT = 1500; // 1.5 seconds - fail fast for better UX

/**
 * Extract tenant slug from hostname
 *
 * Supports multiple patterns:
 * 1. {tenant}-admin.tesserix.app (cloud - prod/dev/staging)
 * 2. {tenant}.localhost (local development)
 * 3. admin.{custom-domain} (custom domains - resolved via headers from VirtualService)
 */
function extractTenantFromHost(host: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0];

  // Pattern 1: {tenant}-admin.tesserix.app
  // e.g., homechef-admin.tesserix.app -> homechef
  // But dev-admin.tesserix.app -> null (root domain)
  const cloudPattern = /^(.+)-admin\.tesserix\.app$/;
  const cloudMatch = hostname.match(cloudPattern);
  if (cloudMatch) {
    const prefix = cloudMatch[1];
    // Check if this is a root prefix (dev, staging, prod)
    if (ROOT_PREFIXES.includes(prefix)) {
      return null; // This is a root domain, not a tenant
    }
    return prefix;
  }

  // Pattern 2: {tenant}.localhost (local development)
  // e.g., homechef.localhost -> homechef
  const localPattern = /^(.+)\.localhost$/;
  const localMatch = hostname.match(localPattern);
  if (localMatch && !localMatch[1].includes('.')) {
    return localMatch[1];
  }

  // Plain localhost or unknown domain
  if (hostname === 'localhost') {
    return null;
  }

  // No tenant found from hostname - will check headers in middleware
  return null;
}

/**
 * Extract tenant slug from request headers (set by Istio VirtualService for custom domains)
 *
 * For custom domains like admin.yahvismartfarm.com, the VirtualService injects:
 * - X-Tenant-Slug: the tenant slug (e.g., "customer-store")
 * - X-Tenant-ID: the tenant UUID
 * - X-Custom-Domain: the custom domain (e.g., "yahvismartfarm.com")
 *
 * Security: These headers are set by Istio's VirtualService "set" operation which
 * OVERWRITES any client-provided headers, so they cannot be spoofed.
 */
function extractTenantFromHeaders(request: NextRequest): string | null {
  // X-Tenant-Slug is set by VirtualService for custom domain requests
  const tenantSlug = request.headers.get('x-tenant-slug');
  if (tenantSlug && tenantSlug.length > 0) {
    return tenantSlug;
  }
  return null;
}

/**
 * Background validation - doesn't block the request
 * Used to refresh stale cache entries
 */
function validateTenantInBackground(slug: string): void {
  // Fire and forget - don't await
  fetchTenantValidation(slug).catch((err) => {
    console.warn('[Middleware] Background validation failed:', err);
  });
}

/**
 * Fetch tenant validation from service
 */
async function fetchTenantValidation(slug: string): Promise<boolean> {
  // FIX-MEDIUM: Use GetTenantBySlug instead of slug validation
  // The slug validation endpoint returns "valid: false" for both:
  // 1. Reserved slugs (during onboarding but not yet committed)
  // 2. Blocked/reserved words
  // 3. Actual existing tenants
  // This caused the middleware to treat reserved slugs as existing tenants.
  // Using GetTenantBySlug directly checks for actual tenant existence.
  const response = await fetch(
    `${TENANT_SERVICE_URL}/internal/tenants/by-slug/${encodeURIComponent(slug)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service': 'admin-middleware', // Required by tenant-service internal API
      },
      signal: AbortSignal.timeout(VALIDATION_TIMEOUT),
    }
  );

  const now = Date.now();

  if (response.ok) {
    const result = await response.json();
    // Tenant exists if we got a successful response with tenant data
    // Also check that tenant status is 'active' to exclude failed/creating tenants
    const exists =
      result.success &&
      result.data &&
      result.data.id &&
      result.data.status === 'active';
    validatedTenants.set(slug, { exists, timestamp: now, validatedAt: now });
    return exists;
  }

  if (response.status === 404) {
    // Tenant doesn't exist - this is a valid response, not an error
    validatedTenants.set(slug, { exists: false, timestamp: now, validatedAt: now });
    return false;
  }

  throw new Error(`Validation failed: ${response.status}`);
}

/**
 * Validate if a tenant exists by checking with tenant-service
 *
 * PERFORMANCE OPTIMIZED:
 * - Uses stale-while-revalidate pattern for better performance
 * - Fail-OPEN with cached data when service is unavailable
 * - Short timeout (1.5s) for responsive UX
 * - Background refresh for stale cache entries
 */
async function validateTenantExists(slug: string): Promise<boolean> {
  // DEV MODE: Skip tenant validation entirely
  // This allows running locally without tenant-service
  if (DEV_AUTH_BYPASS) {
    console.log('[Middleware] 🔓 DEV AUTH BYPASS - skipping tenant validation for:', slug);
    return true;
  }

  const now = Date.now();
  const cached = validatedTenants.get(slug);

  // FAST PATH: Fresh cache hit - return immediately
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.exists;
  }

  // STALE-WHILE-REVALIDATE: Return stale data, refresh in background
  if (cached && now - cached.timestamp < STALE_TTL) {
    // Return cached value immediately, refresh in background
    validateTenantInBackground(slug);
    return cached.exists;
  }

  // SLOW PATH: No cache or expired - must validate synchronously
  try {
    return await fetchTenantValidation(slug);
  } catch (error) {
    // FAIL-OPEN: If we have any cached data (even very stale), use it
    // This prioritizes availability over strict security for better UX
    if (cached) {
      console.warn('[Middleware] Validation failed, using stale cache for:', slug);
      // Update timestamp to prevent repeated failed validations
      validatedTenants.set(slug, { ...cached, timestamp: now });
      return cached.exists;
    }

    // No cache at all - this is a new/unknown tenant
    // For security, deny access to completely unknown tenants
    console.error('[Middleware] Tenant validation failed, no cache available:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // Skip middleware for public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Skip static files
  if (pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|map)$/)) {
    return NextResponse.next();
  }

  // Extract tenant from subdomain first
  let tenantSlug = extractTenantFromHost(host);

  // If not found in hostname, check headers (for custom domains)
  // VirtualService injects X-Tenant-Slug for custom domain requests
  if (!tenantSlug) {
    tenantSlug = extractTenantFromHeaders(request);
    if (tenantSlug) {
      console.log('[Middleware] Tenant resolved from headers (custom domain):', tenantSlug);
    }
  }

  // DEV MODE: Use mock tenant when no tenant in subdomain
  if (!tenantSlug && DEV_AUTH_BYPASS) {
    tenantSlug = 'dev-tenant';
    console.log('[Middleware] 🔓 DEV AUTH BYPASS - using mock tenant: dev-tenant');
  }

  // If on root domain without tenant, let the app handle it
  // (will show tenant selector or redirect to default tenant)
  if (!tenantSlug) {
    const response = NextResponse.next();
    response.headers.set('x-tenant-slug', '');
    response.headers.set('x-is-root-domain', 'true');
    // Clear any stale tenant cookie
    response.cookies.delete('tenant-slug');
    return response;
  }

  // SECURITY: Validate that the tenant actually exists
  // This prevents access via arbitrary subdomains with wildcard DNS/SSL
  const tenantExists = await validateTenantExists(tenantSlug);

  if (!tenantExists) {
    // Tenant doesn't exist - redirect to tenant-not-found page
    // Use rewrite to show 404 while keeping the URL
    const url = request.nextUrl.clone();
    url.pathname = '/tenant-not-found';
    return NextResponse.rewrite(url);
  }

  // Tenant found and validated - pass it to the app via headers
  const response = NextResponse.next();
  response.headers.set('x-tenant-slug', tenantSlug);
  response.headers.set('x-is-root-domain', 'false');
  response.headers.set('x-tenant-validated', 'true');

  // Also set a cookie for client-side access
  response.cookies.set('tenant-slug', tenantSlug, {
    httpOnly: false, // Allow client-side access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
