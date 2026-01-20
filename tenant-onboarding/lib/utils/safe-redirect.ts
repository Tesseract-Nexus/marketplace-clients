/**
 * Safe redirect utility to prevent open redirect vulnerabilities
 * Only allows redirects to:
 * - Same origin
 * - Configured base domain subdomains (e.g., *.tesserix.app)
 * - Explicitly allowed external URLs
 */

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app';

// Allowed external domains for OAuth flows etc.
const ALLOWED_EXTERNAL_DOMAINS = [
  'accounts.google.com',
  'www.facebook.com',
];

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

    // Allow subdomains of base domain (e.g., *.tesserix.app)
    if (hostname.endsWith(`.${BASE_DOMAIN}`) || hostname === BASE_DOMAIN) {
      return true;
    }

    // Allow explicitly allowed external domains
    if (ALLOWED_EXTERNAL_DOMAINS.includes(hostname)) {
      return true;
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
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app';
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
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app';
  return `https://dev-admin.${baseDomain}${path}`;
}
