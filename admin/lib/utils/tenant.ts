/**
 * Tenant Utilities
 *
 * Utilities for extracting and managing tenant context from subdomains
 */

// Root domain prefixes (these are NOT tenants)
const ROOT_PREFIXES = ['dev', 'staging', 'prod'];

// Platform base domain - tesserix.app for staging, mark8ly.com for production
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app';

/**
 * Extract tenant slug from hostname
 *
 * Supports multiple patterns:
 * 1. {tenant}-admin.tesserix.app (cloud - all environments)
 * 2. {tenant}.localhost (local development)
 *
 * Root domains (return null):
 * - dev-admin.tesserix.app
 * - staging-admin.tesserix.app
 * - prod-admin.tesserix.app
 * - localhost
 */
export function extractTenantFromHost(host: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0];

  // Pattern 1: {tenant}-admin.{BASE_DOMAIN}
  // e.g., homechef-admin.mark8ly.com -> homechef
  // But dev-admin.mark8ly.com -> null (root domain)
  const escapedDomain = BASE_DOMAIN.replace(/\./g, '\\.');
  const cloudPattern = new RegExp(`^(.+)-admin\\.${escapedDomain}$`);
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
  return null;
}

/**
 * Get tenant slug from cookie
 */
export function getTenantFromCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'tenant-slug' && value) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Get tenant slug from current window location
 */
export function getTenantFromWindow(): string | null {
  if (typeof window === 'undefined') return null;
  return extractTenantFromHost(window.location.host);
}

/**
 * Check if current hostname is a custom domain (not tesserix.app or localhost)
 */
export function isCustomDomain(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return (
    !hostname.endsWith(`.${BASE_DOMAIN}`) &&
    hostname !== BASE_DOMAIN &&
    !hostname.endsWith('.localhost') &&
    hostname !== 'localhost'
  );
}

/**
 * Get tenant slug from window location
 *
 * For tesserix.app and localhost domains, extract tenant from hostname pattern.
 * For custom domains, read from the tenant-slug cookie set by middleware.
 */
export function getCurrentTenantSlug(): string | null {
  // First try to get tenant from URL pattern (tesserix.app or localhost)
  const fromWindow = getTenantFromWindow();
  if (fromWindow) {
    return fromWindow;
  }

  // For custom domains, the middleware sets a tenant-slug cookie
  // This is the source of truth for custom domain tenant resolution
  if (isCustomDomain()) {
    const fromCookie = getTenantFromCookie();
    if (fromCookie) {
      console.log('[Tenant] Custom domain detected, tenant from cookie:', fromCookie);
      return fromCookie;
    }
    // On a custom domain, the tenant is resolved by the middleware/Istio headers
    // even if the cookie is missing (e.g., blocked by browser extension).
    // Return a sentinel value so callers know a tenant exists.
    console.log('[Tenant] Custom domain detected but no tenant-slug cookie found, using domain as identifier');
    return '__custom_domain__';
  }

  return null;
}

/**
 * Build admin URL for a tenant
 *
 * @param tenantSlug - The tenant slug
 * @param path - Optional path to append (e.g., '/products')
 * @returns Full URL to the tenant's admin panel
 *
 * URL patterns:
 * - Cloud: {tenant}-admin.tesserix.app
 * - Local: {tenant}.localhost:3001
 * - Custom domain: Falls back to standard tesserix.app pattern
 */
export function buildAdminUrl(tenantSlug: string, path: string = ''): string {
  if (typeof window === 'undefined') {
    // Server-side - default to cloud pattern
    return `https://${tenantSlug}-admin.${BASE_DOMAIN}${path}`;
  }

  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  // Cloud: {tenant}-admin.{BASE_DOMAIN}
  if (hostname.endsWith(`.${BASE_DOMAIN}`) || hostname === BASE_DOMAIN) {
    return `${protocol}//${tenantSlug}-admin.${BASE_DOMAIN}${path}`;
  }

  // Local development: {tenant}.localhost
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    const portPart = port ? `:${port}` : '';
    return `${protocol}//${tenantSlug}.localhost${portPart}${path}`;
  }

  // Custom domain: fall back to platform domain pattern
  return `https://${tenantSlug}-admin.${BASE_DOMAIN}${path}`;
}

/**
 * Get the storefront domain dynamically based on current environment
 * This handles both build-time env vars and runtime detection
 */
export function getStorefrontDomain(): string {
  // First check if we have an explicit env var set (and it's not localhost in production)
  const envDomain = process.env.NEXT_PUBLIC_STOREFRONT_DOMAIN;

  // In browser, detect from current hostname to ensure correct domain in production
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // If we're on the platform domain, use it for storefronts
    if (hostname.endsWith(`.${BASE_DOMAIN}`) || hostname === BASE_DOMAIN) {
      return BASE_DOMAIN;
    }

    // If we're on localhost, use localhost:3200 for storefronts
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
      return 'localhost:3200';
    }
  }

  // Fallback to env var or default
  // Only use envDomain if it's not a localhost value in what appears to be production
  if (envDomain && !envDomain.includes('localhost')) {
    return envDomain;
  }

  // Default to platform domain
  return BASE_DOMAIN;
}

/**
 * Build storefront URL for a tenant
 *
 * @param tenantSlug - The tenant slug
 * @param path - Optional path to append
 * @returns Full URL to the tenant's storefront
 */
export function buildStorefrontUrl(tenantSlug: string, path: string = ''): string {
  const domain = getStorefrontDomain();
  const protocol = domain.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${tenantSlug}.${domain}${path}`;
}

/**
 * Get storefront URL from a Storefront object
 * Uses the API-provided storefrontUrl if available, otherwise computes from slug/customDomain
 *
 * @param storefront - Storefront object with slug, customDomain, and optional storefrontUrl
 * @param path - Optional path to append
 * @returns Full URL to the storefront
 */
export function getStorefrontUrl(
  storefront: { slug: string; customDomain?: string; storefrontUrl?: string },
  path: string = ''
): string {
  // Prefer API-provided URL if available
  if (storefront.storefrontUrl) {
    return storefront.storefrontUrl + path;
  }
  // Fallback: use custom domain if set
  if (storefront.customDomain) {
    return `https://${storefront.customDomain}${path}`;
  }
  // Fallback: compute from slug + domain
  return buildStorefrontUrl(storefront.slug, path);
}

/**
 * Check if we're on a root domain (no tenant in subdomain)
 * For custom domains, we're never on the root domain - the tenant is resolved via cookie
 */
export function isRootDomain(): boolean {
  if (typeof window === 'undefined') return true;
  // Custom domains are never root domains - the tenant is resolved by the domain itself
  if (isCustomDomain()) {
    return false;
  }
  return getCurrentTenantSlug() === null;
}

/**
 * Navigate to a different tenant's admin panel
 * This performs a full page navigation to change subdomains
 */
export function navigateToTenant(tenantSlug: string, path: string = ''): void {
  const url = buildAdminUrl(tenantSlug, path);
  window.location.href = url;
}

/**
 * Navigate to a specific admin URL
 * Used when tenant has a custom domain or explicit admin URL
 */
export function navigateToTenantWithUrl(url: string): void {
  window.location.href = url;
}
