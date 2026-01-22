/**
 * Domain utilities for custom domain handling
 *
 * Provides normalization, validation, and URL generation for custom domains.
 * Aligned with backend validation in custom-domain-service/internal/services/dns_verifier.go
 */

/**
 * Common two-part TLDs (country code second-level domains)
 * Used to correctly identify apex vs subdomain domains
 */
const TWO_PART_TLDS = new Set([
  'co.uk',
  'com.au',
  'co.in',
  'co.nz',
  'com.br',
  'com.mx',
  'co.za',
  'com.sg',
  'co.jp',
  'co.kr',
  'com.ar',
  'com.co',
  'com.tw',
  'com.hk',
  'com.my',
  'com.ph',
  'com.vn',
  'co.id',
  'co.th',
  'org.uk',
  'net.au',
  'org.au',
  'ac.uk',
  'gov.uk',
]);

/**
 * Reserved subdomains that users should not use as their root domain
 * These indicate the user entered a subdomain instead of root domain
 */
const RESERVED_SUBDOMAINS = new Set([
  'admin',
  'www',
  'api',
  'app',
  'mail',
  'email',
  'smtp',
  'imap',
  'pop',
  'ftp',
  'sftp',
  'ssh',
  'vpn',
  'cdn',
  'static',
  'assets',
  'img',
  'images',
  'media',
  'files',
  'upload',
  'uploads',
  'download',
  'downloads',
  'blog',
  'shop',
  'store',
  'cart',
  'checkout',
  'pay',
  'payment',
  'payments',
  'billing',
  'invoice',
  'support',
  'help',
  'docs',
  'documentation',
  'wiki',
  'forum',
  'community',
  'dev',
  'staging',
  'stage',
  'test',
  'testing',
  'demo',
  'sandbox',
  'preview',
  'beta',
  'alpha',
  'dashboard',
  'panel',
  'portal',
  'my',
  'account',
  'accounts',
  'user',
  'users',
  'member',
  'members',
  'client',
  'clients',
  'customer',
  'customers',
  'auth',
  'login',
  'signin',
  'signup',
  'register',
  'oauth',
  'sso',
  'secure',
  'ns1',
  'ns2',
  'dns',
  'mx',
  'webmail',
]);

/**
 * Blocked domain patterns for security
 */
const BLOCKED_DOMAINS = [
  'tesserix.app',
  'tesserix.com',
  'tesserix.io',
  'tesserix.net',
  'tesserix.org',
  'localhost',
  'local',
  'internal',
  'intranet',
  'corp',
  'home',
  'lan',
  'nip.io',
  'sslip.io',
  'xip.io',
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'invalid',
];

export interface DomainValidationResult {
  isValid: boolean;
  normalizedDomain: string;
  error?: string;
  warning?: string;
  isSubdomain: boolean;
  rootDomain: string;
  suggestedRootDomain?: string;
}

export interface GeneratedUrls {
  admin: string;
  storefront: string;
  storefrontWww: string;
  adminSubdomain: string;
  storefrontSubdomain: string;
  baseDomain: string;
}

/**
 * Normalizes a domain input by removing protocols, www prefix, trailing slashes,
 * paths, and converting to lowercase.
 *
 * @param input - Raw domain input from user
 * @returns Normalized domain string
 */
export function normalizeDomain(input: string): string {
  if (!input) return '';

  return input
    .toLowerCase()
    .trim()
    // Remove protocol (http://, https://, ftp://, etc.)
    .replace(/^[a-z]+:\/\//, '')
    // Remove www. prefix
    .replace(/^www\./, '')
    // Remove any path after domain
    .replace(/\/.*$/, '')
    // Remove any query string
    .replace(/\?.*$/, '')
    // Remove any hash
    .replace(/#.*$/, '')
    // Remove any port number
    .replace(/:\d+$/, '')
    // Remove any remaining whitespace
    .replace(/\s/g, '')
    // Remove trailing dots
    .replace(/\.+$/, '')
    // Remove leading dots
    .replace(/^\.+/, '')
    // Collapse multiple consecutive dots
    .replace(/\.{2,}/g, '.');
}

/**
 * Checks if a domain is a two-part TLD (like co.uk, com.au)
 */
function isTwoPartTld(domain: string): boolean {
  const parts = domain.split('.');
  if (parts.length < 2) return false;
  const lastTwo = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  return TWO_PART_TLDS.has(lastTwo);
}

/**
 * Extracts the root domain from a potentially subdomain input
 */
export function extractRootDomain(domain: string): string {
  const parts = domain.split('.');
  if (parts.length <= 2) return domain;

  if (isTwoPartTld(domain)) {
    // For two-part TLDs, root is last 3 parts (e.g., example.co.uk)
    return parts.length >= 3 ? parts.slice(-3).join('.') : domain;
  }

  // For standard TLDs, root is last 2 parts (e.g., example.com)
  return parts.slice(-2).join('.');
}

/**
 * Checks if domain appears to start with a reserved subdomain
 */
export function detectReservedSubdomain(domain: string): {
  hasReservedSubdomain: boolean;
  subdomain?: string;
  rootDomain?: string;
} {
  const parts = domain.split('.');
  if (parts.length <= 2) {
    // Could still be two-part TLD, check
    if (isTwoPartTld(domain) && parts.length === 2) {
      // This is just a TLD, not a valid domain
      return { hasReservedSubdomain: false };
    }
    return { hasReservedSubdomain: false };
  }

  const firstPart = parts[0];
  if (RESERVED_SUBDOMAINS.has(firstPart)) {
    const rootDomain = isTwoPartTld(domain)
      ? parts.slice(-3).join('.')
      : parts.slice(-2).join('.');

    return {
      hasReservedSubdomain: true,
      subdomain: firstPart,
      rootDomain,
    };
  }

  return { hasReservedSubdomain: false };
}

/**
 * Validates a domain format and checks for common issues
 *
 * @param input - Domain to validate (will be normalized first)
 * @returns Validation result with error/warning messages
 */
export function validateDomain(input: string): DomainValidationResult {
  const normalizedDomain = normalizeDomain(input);

  // Empty check
  if (!normalizedDomain) {
    return {
      isValid: false,
      normalizedDomain: '',
      error: 'Please enter a domain name',
      isSubdomain: false,
      rootDomain: '',
    };
  }

  // Minimum length
  if (normalizedDomain.length < 4) {
    return {
      isValid: false,
      normalizedDomain,
      error: 'Domain name is too short',
      isSubdomain: false,
      rootDomain: normalizedDomain,
    };
  }

  // Maximum length (RFC 1035)
  if (normalizedDomain.length > 253) {
    return {
      isValid: false,
      normalizedDomain,
      error: 'Domain name exceeds maximum length of 253 characters',
      isSubdomain: false,
      rootDomain: normalizedDomain,
    };
  }

  // Check for valid characters only (a-z, 0-9, hyphen, dot)
  if (!/^[a-z0-9.-]+$/.test(normalizedDomain)) {
    return {
      isValid: false,
      normalizedDomain,
      error: 'Domain contains invalid characters. Only letters, numbers, hyphens, and dots are allowed.',
      isSubdomain: false,
      rootDomain: normalizedDomain,
    };
  }

  // Must have at least one dot
  const parts = normalizedDomain.split('.');
  if (parts.length < 2) {
    return {
      isValid: false,
      normalizedDomain,
      error: 'Please enter a complete domain (e.g., yourbrand.com)',
      isSubdomain: false,
      rootDomain: normalizedDomain,
    };
  }

  // Check each label
  for (const label of parts) {
    // Empty label (double dots)
    if (!label) {
      return {
        isValid: false,
        normalizedDomain,
        error: 'Invalid domain format',
        isSubdomain: false,
        rootDomain: normalizedDomain,
      };
    }

    // Label too long (RFC 1123)
    if (label.length > 63) {
      return {
        isValid: false,
        normalizedDomain,
        error: 'Domain part exceeds 63 character limit',
        isSubdomain: false,
        rootDomain: normalizedDomain,
      };
    }

    // Label starts or ends with hyphen
    if (label.startsWith('-') || label.endsWith('-')) {
      return {
        isValid: false,
        normalizedDomain,
        error: 'Domain parts cannot start or end with a hyphen',
        isSubdomain: false,
        rootDomain: normalizedDomain,
      };
    }

    // Label is all numeric (TLD can't be all numeric)
    if (label === parts[parts.length - 1] && /^\d+$/.test(label)) {
      return {
        isValid: false,
        normalizedDomain,
        error: 'Invalid top-level domain',
        isSubdomain: false,
        rootDomain: normalizedDomain,
      };
    }
  }

  // Check for punycode (internationalized domain names)
  if (normalizedDomain.includes('xn--')) {
    return {
      isValid: false,
      normalizedDomain,
      error: 'Internationalized domain names are not currently supported',
      isSubdomain: false,
      rootDomain: normalizedDomain,
    };
  }

  // Check blocked domains
  const isBlocked = BLOCKED_DOMAINS.some(
    (blocked) =>
      normalizedDomain === blocked || normalizedDomain.endsWith(`.${blocked}`)
  );

  if (isBlocked) {
    return {
      isValid: false,
      normalizedDomain,
      error: 'This domain is reserved or not allowed',
      isSubdomain: false,
      rootDomain: normalizedDomain,
    };
  }

  // Determine if it's a subdomain
  const rootDomain = extractRootDomain(normalizedDomain);
  const isSubdomain = normalizedDomain !== rootDomain;

  // Check for reserved subdomain usage
  const reservedCheck = detectReservedSubdomain(normalizedDomain);

  if (reservedCheck.hasReservedSubdomain) {
    return {
      isValid: true, // Still valid, but with warning
      normalizedDomain,
      warning: `It looks like you entered a subdomain (${reservedCheck.subdomain}.${reservedCheck.rootDomain}). For custom domains, please enter your root domain (${reservedCheck.rootDomain}). We'll automatically configure admin.${reservedCheck.rootDomain} for your admin panel.`,
      isSubdomain: true,
      rootDomain: reservedCheck.rootDomain || rootDomain,
      suggestedRootDomain: reservedCheck.rootDomain,
    };
  }

  // Valid domain
  return {
    isValid: true,
    normalizedDomain,
    isSubdomain,
    rootDomain,
  };
}

export interface GenerateUrlsOptions {
  adminSubdomain?: string;
  storefrontSubdomain?: string;
}

/**
 * Default subdomain for storefront when using custom domains
 * Users can also use apex domains (empty subdomain) which will use A records
 */
export const DEFAULT_STOREFRONT_SUBDOMAIN = 'www';

/**
 * Validates a storefront subdomain format
 * Returns error message if invalid, undefined if valid
 * Note: Empty string is allowed (apex domain)
 */
export function validateStorefrontSubdomain(subdomain: string | undefined): string | undefined {
  // Empty subdomain (apex domain) is now allowed - we use A records for apex
  if (!subdomain || subdomain.trim() === '') {
    return undefined; // Apex domains are now supported
  }

  // Check for valid subdomain characters
  const trimmed = subdomain.trim().toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(trimmed)) {
    return 'Subdomain can only contain letters, numbers, and hyphens (cannot start or end with hyphen)';
  }

  // Max length check
  if (trimmed.length > 63) {
    return 'Subdomain cannot exceed 63 characters';
  }

  return undefined;
}

/**
 * Generates admin and storefront URLs from a root domain
 *
 * Apex domains are supported using A records pointing to gateway IP.
 * Subdomains use CNAME records.
 *
 * @param domain - Root domain (should be normalized first)
 * @param options - Optional custom subdomains (empty string for apex)
 * @returns Generated URLs for admin and storefront
 */
export function generateUrls(domain: string, options?: GenerateUrlsOptions): GeneratedUrls | null {
  const normalized = normalizeDomain(domain);
  if (!normalized) return null;

  // If domain appears to be a subdomain with reserved prefix, extract root
  const reservedCheck = detectReservedSubdomain(normalized);
  const baseDomain = reservedCheck.hasReservedSubdomain
    ? reservedCheck.rootDomain!
    : normalized;

  // Use custom subdomains if provided, otherwise defaults
  const adminSubdomain = options?.adminSubdomain || 'admin';
  // Default to 'www' but empty string is allowed for apex domain
  const storefrontSubdomain = options?.storefrontSubdomain ?? DEFAULT_STOREFRONT_SUBDOMAIN;

  // Build URLs - storefront can use subdomain or apex
  const adminUrl = `https://${adminSubdomain}.${baseDomain}`;
  const storefrontUrl = storefrontSubdomain
    ? `https://${storefrontSubdomain}.${baseDomain}`
    : `https://${baseDomain}`; // Apex domain
  const storefrontWwwUrl = `https://www.${baseDomain}`;

  return {
    admin: adminUrl,
    storefront: storefrontUrl,
    storefrontWww: storefrontWwwUrl,
    adminSubdomain,
    storefrontSubdomain,
    baseDomain,
  };
}

/**
 * Checks if a string looks like it might contain a protocol
 */
export function hasProtocol(input: string): boolean {
  return /^[a-z]+:\/\//i.test(input.trim());
}

/**
 * Checks if a string looks like it has a path
 */
export function hasPath(input: string): boolean {
  const normalized = input.replace(/^[a-z]+:\/\//i, '').replace(/^www\./i, '');
  return normalized.includes('/');
}
