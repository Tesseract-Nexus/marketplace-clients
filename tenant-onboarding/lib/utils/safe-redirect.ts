/**
 * Safe redirect utility to prevent open redirect vulnerabilities
 * Only allows redirects to:
 * - Same origin
 * - Configured base domain subdomains (e.g., *.mark8ly.com)
 * - Explicitly allowed external URLs
 */

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'mark8ly.com';

// Allowed external domains for OAuth flows etc.
const ALLOWED_EXTERNAL_DOMAINS = [
  'accounts.google.com',
  'www.facebook.com',
];

// Store custom domains that have been validated during this session
// This allows safe redirects to custom domain admin URLs
const validatedCustomDomains = new Set<string>();

/**
 * Register a custom domain as validated (called after domain validation during onboarding)
 * @param domain - The custom domain to register
 */
export function registerValidatedCustomDomain(domain: string): void {
  if (domain) {
    validatedCustomDomains.add(domain.toLowerCase());
  }
}

/**
 * Validates that a URL is safe to redirect to
 * @param url - The URL to validate
 * @returns boolean - Whether the URL is safe for redirect
 */
export function isValidRedirectUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url, window.location.origin);
    const hostname = parsedUrl.hostname;

    // Allow same origin
    if (parsedUrl.origin === window.location.origin) {
      return true;
    }

    // Allow subdomains of base domain (e.g., *.mark8ly.com)
    if (hostname.endsWith(`.${BASE_DOMAIN}`) || hostname === BASE_DOMAIN) {
      return true;
    }

    // Allow explicitly allowed external domains
    if (ALLOWED_EXTERNAL_DOMAINS.includes(hostname)) {
      return true;
    }

    // Allow validated custom domains (including subdomains like admin.customdomain.com)
    for (const validatedDomain of validatedCustomDomains) {
      if (hostname === validatedDomain || hostname.endsWith(`.${validatedDomain}`)) {
        return true;
      }
    }

    // Block everything else
    return false;
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Safely redirect to a URL after validation
 * Falls back to homepage if URL is invalid
 * @param url - The URL to redirect to
 * @param fallback - Optional fallback URL (default: '/')
 */
export function safeRedirect(url: string, fallback: string = '/'): void {
  if (isValidRedirectUrl(url)) {
    window.location.href = url;
  } else {
    console.warn(`[SafeRedirect] Blocked redirect to potentially unsafe URL: ${url}`);
    window.location.href = fallback;
  }
}

/**
 * Build a safe admin URL for a tenant
 * @param tenantSlug - The tenant's slug
 * @param path - Optional path to append (default: '')
 * @returns The constructed admin URL
 */
export function buildAdminUrl(tenantSlug: string, path: string = ''): string {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'mark8ly.com';
  // Sanitize tenant slug to prevent injection
  const sanitizedSlug = tenantSlug.replace(/[^a-z0-9-]/gi, '').toLowerCase();
  return `https://${sanitizedSlug}-admin.${baseDomain}${path}`;
}

/**
 * Build the dev admin URL (not tenant-specific)
 * @param path - Optional path to append (default: '')
 * @returns The constructed dev admin URL
 */
export function buildDevAdminUrl(path: string = ''): string {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'mark8ly.com';
  return `https://dev-admin.${baseDomain}${path}`;
}

/**
 * Build a custom domain admin URL
 * @param customDomain - The custom domain (e.g., yahvismartfarm.com)
 * @param adminSubdomain - The admin subdomain (default: 'admin')
 * @param path - Optional path to append (default: '')
 * @returns The constructed custom domain admin URL
 */
export function buildCustomDomainAdminUrl(
  customDomain: string,
  adminSubdomain: string = 'admin',
  path: string = ''
): string {
  // Sanitize inputs to prevent injection
  const sanitizedDomain = customDomain.toLowerCase().trim();
  const sanitizedSubdomain = adminSubdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');

  // Register this domain as validated for redirect safety
  registerValidatedCustomDomain(sanitizedDomain);

  return `https://${sanitizedSubdomain}.${sanitizedDomain}${path}`;
}

/**
 * Build the appropriate admin URL based on session data
 * Automatically chooses between custom domain, subdomain, or dev admin URL
 *
 * @param options - Configuration options
 * @param options.customDomain - The custom domain if using one
 * @param options.customAdminSubdomain - The admin subdomain for custom domains (default: 'admin')
 * @param options.tenantSlug - The tenant slug for subdomain-based URLs
 * @param options.path - Path to append to the URL
 * @returns The constructed admin URL
 */
export function buildSmartAdminUrl(options: {
  customDomain?: string;
  customAdminSubdomain?: string;
  tenantSlug?: string;
  path?: string;
}): string {
  const { customDomain, customAdminSubdomain = 'admin', tenantSlug, path = '' } = options;

  // Priority 1: Custom domain
  if (customDomain) {
    return buildCustomDomainAdminUrl(customDomain, customAdminSubdomain, path);
  }

  // Priority 2: Tenant subdomain
  if (tenantSlug) {
    return buildAdminUrl(tenantSlug, path);
  }

  // Priority 3: Fall back to dev admin
  return buildDevAdminUrl(path);
}
