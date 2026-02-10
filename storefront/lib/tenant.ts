// Tenant resolution utility for server components
import { cookies, headers } from 'next/headers';

export interface TenantHostInfo {
  slug: string;
  tenant_id: string;
  storefront_id?: string;
  admin_host: string;
  storefront_host: string;
  status: string;
  is_custom_domain?: boolean;
  primary_domain?: string;
  name?: string; // Optional tenant display name
}

/**
 * Resolution source for debugging/logging
 */
export type TenantResolutionSource = 'header' | 'subdomain' | 'custom-domain-lookup';

/**
 * Resolves tenant from request headers (set by Istio VirtualService for custom domains)
 * Returns null if headers are not present
 */
export async function resolveTenantFromHeaders(): Promise<TenantHostInfo | null> {
  try {
    const headerStore = await headers();
    const tenantId = headerStore.get('x-tenant-id');
    const tenantSlug = headerStore.get('x-tenant-slug');
    const customDomain = headerStore.get('x-custom-domain');

    if (tenantId && tenantSlug) {
      return {
        tenant_id: tenantId,
        slug: tenantSlug,
        admin_host: `${tenantSlug}-admin.mark8ly.app`,
        storefront_host: customDomain || `${tenantSlug}.mark8ly.app`,
        status: 'active',
        is_custom_domain: !!customDomain,
        primary_domain: customDomain || undefined,
      };
    }
  } catch (error) {
    // Headers not available (e.g., during build)
  }
  return null;
}

/**
 * Resolves a tenant slug to full tenant info including UUID
 * Uses fresh fetch to ensure up-to-date routing
 */
export async function resolveTenantInfo(slug: string): Promise<TenantHostInfo | null> {
  try {
    const tenantRouterUrl = process.env.TENANT_ROUTER_SERVICE_URL || 'http://tenant-router-service.marketplace.svc.cluster.local:8089';
    const response = await fetch(
      `${tenantRouterUrl}/api/v1/hosts/${slug}`,
      {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (response.ok) {
      const data = await response.json();
      return {
        ...data,
        is_custom_domain: false,
      };
    }
  } catch (error) {
    console.error('Failed to resolve tenant from router:', error);
  }
  return null;
}

/**
 * Resolves tenant from custom domain via custom-domain-service
 */
export async function resolveTenantFromCustomDomain(domain: string): Promise<TenantHostInfo | null> {
  try {
    const customDomainServiceUrl = process.env.CUSTOM_DOMAIN_SERVICE_URL || 'http://custom-domain-service.marketplace.svc.cluster.local:8093';
    const response = await fetch(
      `${customDomainServiceUrl}/api/v1/internal/resolve?domain=${encodeURIComponent(domain)}`,
      {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (response.ok) {
      const data = await response.json();
      return {
        tenant_id: data.tenant_id,
        slug: data.tenant_slug,
        admin_host: `${data.tenant_slug}-admin.mark8ly.app`,
        storefront_host: domain,
        status: data.is_active ? 'active' : 'inactive',
        is_custom_domain: true,
        primary_domain: domain,
      };
    }
  } catch (error) {
    console.error('Failed to resolve tenant from custom domain:', error);
  }
  return null;
}

/**
 * Smart tenant resolution that tries multiple methods:
 * 1. Request headers (for custom domains, set by Istio)
 * 2. Subdomain extraction (for *.mark8ly.app)
 * 3. Custom domain lookup (fallback)
 */
export async function resolveTenantSmart(host: string): Promise<{ info: TenantHostInfo | null; source: TenantResolutionSource | null }> {
  // Method 1: Check headers (set by VirtualService for custom domains)
  const fromHeaders = await resolveTenantFromHeaders();
  if (fromHeaders) {
    return { info: fromHeaders, source: 'header' };
  }

  // Method 2: Built-in subdomain (*.mark8ly.app)
  if (host.endsWith('.mark8ly.app')) {
    const slug = host.split('.')[0];
    if (slug && slug !== 'www') {
      const fromSubdomain = await resolveTenantInfo(slug);
      if (fromSubdomain) {
        return { info: fromSubdomain, source: 'subdomain' };
      }
    }
  }

  // Method 3: Custom domain lookup
  const fromCustomDomain = await resolveTenantFromCustomDomain(host);
  if (fromCustomDomain) {
    return { info: fromCustomDomain, source: 'custom-domain-lookup' };
  }

  return { info: null, source: null };
}

/**
 * Resolves a tenant slug to just the tenant UUID
 */
export async function resolveTenantId(slug: string): Promise<string | null> {
  const info = await resolveTenantInfo(slug);
  return info?.tenant_id || null;
}

interface AuthTokenPayload {
  sub?: string;  // customer ID (from RegisteredClaims.Subject)
  user_id?: string;  // customer ID (from Claims.UserID in accessToken)
  email?: string;
  tenant_id?: string;
  exp?: number;
}

/**
 * Decodes a JWT token and returns the payload
 * Returns null if token is missing, invalid, or expired
 */
function decodeJwtPayload(token: string): AuthTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
      return null;
    }

    const payloadStr = parts[1];
    const payload = JSON.parse(
      Buffer.from(payloadStr, 'base64url').toString('utf-8')
    ) as AuthTokenPayload;

    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Gets auth payload from cookies
 * Tries accessToken first (has email), falls back to refreshToken
 * Returns null if not authenticated or token is expired
 */
async function getAuthPayloadFromCookie(): Promise<AuthTokenPayload | null> {
  try {
    const cookieStore = await cookies();

    // Try accessToken first - it contains email
    const accessToken = cookieStore.get('accessToken')?.value;
    if (accessToken) {
      const payload = decodeJwtPayload(accessToken);
      if (payload?.email) {
        return payload;
      }
    }

    // Fall back to refreshToken (only has sub/user ID, no email)
    const refreshToken = cookieStore.get('refreshToken')?.value;
    if (refreshToken) {
      return decodeJwtPayload(refreshToken);
    }

    return null;
  } catch (error) {
    console.error('Failed to decode auth token:', error);
    return null;
  }
}

/**
 * Gets the current authenticated customer ID from cookies
 * Returns null if not authenticated
 */
export async function getCustomerIdFromCookie(): Promise<string | null> {
  const payload = await getAuthPayloadFromCookie();
  return payload?.sub || payload?.user_id || null;
}

/**
 * Gets the raw accessToken JWT from cookies for forwarding to backend services.
 * Returns null if not authenticated.
 */
export async function getAccessTokenFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get('accessToken')?.value || null;
  } catch {
    return null;
  }
}

/**
 * Gets the current authenticated customer email from cookies
 * Returns null if not authenticated
 */
export async function getCustomerEmailFromCookie(): Promise<string | null> {
  // First try JWT-based auth (legacy/direct auth)
  const payload = await getAuthPayloadFromCookie();
  if (payload?.email) {
    return payload.email;
  }

  // Fall back to auth-bff session (OAuth/OIDC flow)
  const session = await getSessionFromAuthBff();
  return session?.email || null;
}

/**
 * Session info from auth-bff
 */
interface AuthBffSession {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
}

/**
 * Gets user session from auth-bff using the bff_storefront_session cookie.
 * This supports OAuth/OIDC flows where JWT tokens aren't exposed.
 */
async function getSessionFromAuthBff(): Promise<AuthBffSession | null> {
  try {
    const cookieStore = await cookies();
    const bffSession = cookieStore.get('bff_storefront_session')?.value;

    if (!bffSession) {
      return null;
    }

    // Call auth-bff session endpoint with the session cookie
    const authBffUrl = process.env.AUTH_BFF_INTERNAL_URL || process.env.AUTH_BFF_URL || 'http://localhost:8080';

    // Include X-Forwarded-Host so auth-bff reads the correct cookie name
    const host = (await headers()).get('host') || '';

    const response = await fetch(`${authBffUrl}/auth/session`, {
      headers: {
        'Cookie': `bff_storefront_session=${bffSession}`,
        'X-Forwarded-Host': host,
        'Accept': 'application/json',
        // Scope to customer realm — prevents admin sessions from leaking
        // into server-side storefront session lookups
        'X-Auth-Context': 'customer',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.log('[tenant] auth-bff session check failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.authenticated && data.user) {
      return {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName || data.user.first_name,
        lastName: data.user.lastName || data.user.last_name,
        name: data.user.name,
      };
    }

    return null;
  } catch (error) {
    console.error('[tenant] Failed to get auth-bff session:', error);
    return null;
  }
}

/**
 * Gets the current authenticated customer info from cookies (email and ID).
 * Supports both JWT-based and OAuth/session-based auth.
 */
export async function getCustomerInfoFromCookie(): Promise<{ id?: string; email?: string } | null> {
  // First try JWT-based auth
  const payload = await getAuthPayloadFromCookie();
  if (payload?.email || payload?.sub || payload?.user_id) {
    return {
      id: payload.sub || payload.user_id,
      email: payload.email,
    };
  }

  // Fall back to auth-bff session
  const session = await getSessionFromAuthBff();
  if (session) {
    return {
      id: session.id,
      email: session.email,
    };
  }

  return null;
}
