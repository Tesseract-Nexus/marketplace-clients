// Tenant resolution utility for server components
import { cookies } from 'next/headers';

export interface TenantHostInfo {
  slug: string;
  tenant_id: string;
  storefront_id?: string;
  admin_host: string;
  storefront_host: string;
  status: string;
}

/**
 * Resolves a tenant slug to full tenant info including UUID
 * Uses fresh fetch to ensure up-to-date routing
 */
export async function resolveTenantInfo(slug: string): Promise<TenantHostInfo | null> {
  try {
    const tenantRouterUrl = process.env.TENANT_ROUTER_SERVICE_URL || 'http://tenant-router-service.devtest.svc.cluster.local:8089';
    const response = await fetch(
      `${tenantRouterUrl}/api/v1/hosts/${slug}`,
      {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Failed to resolve tenant:', error);
  }
  return null;
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
 * Gets the current authenticated customer email from cookies
 * Returns null if not authenticated
 */
export async function getCustomerEmailFromCookie(): Promise<string | null> {
  const payload = await getAuthPayloadFromCookie();
  return payload?.email || null;
}
