/**
 * Server-side Auth Helper
 *
 * Shared auth context extraction for Next.js API routes.
 * Supports both JWT-based and session-based (OAuth/BFF) authentication.
 *
 * Usage:
 *   const auth = await getAuthContext(request);
 *   if (!auth?.customerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 */

import { NextRequest } from 'next/server';

const AUTH_BFF_URL = process.env.AUTH_BFF_INTERNAL_URL || process.env.AUTH_BFF_URL || 'http://localhost:8080';

/** Decode JWT payload without verification (base64url decode). */
export function decodeJwtPayload(token: string): { sub?: string; customer_id?: string; email?: string } | null {
  try {
    const parts = token.replace('Bearer ', '').split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (!payload) return null;
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export interface AuthContext {
  customerId: string;
  token?: string;
}

/**
 * Get auth context from either JWT or session cookie.
 * Supports OAuth/session-based auth where accessToken is not available client-side.
 *
 * 1. Checks Authorization header for a valid JWT
 * 2. Falls back to session cookie via auth-bff /internal/get-token
 */
export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const authHeader = request.headers.get('Authorization');

  // Check if we have a valid JWT token
  if (authHeader && authHeader !== 'Bearer ' && authHeader !== 'Bearer') {
    const tokenPayload = decodeJwtPayload(authHeader);
    if (tokenPayload?.sub) {
      return { customerId: tokenPayload.sub, token: authHeader };
    }
  }

  // Fall back to session-based auth (OAuth flow)
  // Use /internal/get-token which returns access_token for BFF-to-service calls
  try {
    const cookie = request.headers.get('cookie');
    if (!cookie) {
      return null;
    }

    // Forward host so auth-bff reads the correct session cookie (bff_storefront_session)
    const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';

    const response = await fetch(`${AUTH_BFF_URL}/internal/get-token`, {
      headers: {
        'Cookie': cookie,
        'X-Forwarded-Host': forwardedHost,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const tokenData = await response.json();
    // /internal/get-token returns { access_token, user_id, tenant_id, tenant_slug, expires_at }
    if (tokenData.user_id) {
      return {
        customerId: tokenData.user_id,
        token: tokenData.access_token ? `Bearer ${tokenData.access_token}` : undefined,
      };
    }
  } catch (error) {
    console.error('[server-auth] Failed to get session:', error);
  }

  return null;
}
