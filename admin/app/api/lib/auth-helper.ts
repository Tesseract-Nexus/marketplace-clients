import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

// Auth BFF URL for session validation
const AUTH_BFF_URL = process.env.AUTH_BFF_INTERNAL_URL || 'http://auth-bff.marketplace.svc.cluster.local:8080';
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || '';

/**
 * Response from the internal get-token endpoint
 */
interface InternalTokenResponse {
  access_token: string;
  user_id: string;
  tenant_id?: string;
  tenant_slug?: string;
  expires_at: number;
}

/**
 * Get access token from BFF session for server-side API calls
 * This allows the Next.js BFF to make authenticated calls to backend services
 */
export async function getAccessTokenFromBFF(): Promise<InternalTokenResponse | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('bff_session');

    if (!sessionCookie?.value) {
      return null;
    }

    // Call the auth-bff internal endpoint to get the token
    const response = await fetch(`${AUTH_BFF_URL}/internal/get-token`, {
      method: 'GET',
      headers: {
        'Cookie': `bff_session=${sessionCookie.value}`,
        'Accept': 'application/json',
        ...(INTERNAL_SERVICE_KEY ? { 'X-Internal-Service-Key': INTERNAL_SERVICE_KEY } : {}),
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

interface BFFSessionResponse {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
    tenantId?: string;
    tenantSlug?: string;
    roles: string[];
  };
  error?: string;
}

interface BFFTokenResponse {
  access_token: string;
  user_id?: string;
  tenant_id?: string;
  tenant_slug?: string;
  expires_at?: number;
}

/**
 * Decode JWT token and extract user ID
 * JWT format: header.payload.signature (base64 encoded)
 */
export function extractUserIdFromJWT(token: string): string | null {
  try {
    // Remove "Bearer " prefix if present
    const jwt = token.replace(/^Bearer\s+/i, '');
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;

    // Decode the payload (second part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));

    // Try common JWT user ID fields
    return payload.sub || payload.user_id || payload.userId || null;
  } catch {
    return null;
  }
}

/**
 * Get user ID from BFF session cookie
 * This calls the auth-bff to validate the session and get user info
 */
export async function getUserIdFromBFFSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('bff_session');

    if (!sessionCookie?.value) {
      return null;
    }

    // Call the auth-bff session endpoint with the session cookie
    const response = await fetch(`${AUTH_BFF_URL}/auth/session`, {
      method: 'GET',
      headers: {
        'Cookie': `bff_session=${sessionCookie.value}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const session: BFFSessionResponse = await response.json();

    if (session.authenticated && session.user?.id) {
      return session.user.id;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get full session info from BFF
 * Returns the complete session response including user details
 */
export async function getBFFSession(): Promise<BFFSessionResponse | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('bff_session');

    if (!sessionCookie?.value) {
      return null;
    }

    const response = await fetch(`${AUTH_BFF_URL}/auth/session`, {
      method: 'GET',
      headers: {
        'Cookie': `bff_session=${sessionCookie.value}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Get access token from BFF session (server-side only)
 * Uses the HttpOnly session cookie to fetch a short-lived access token.
 */
export async function getAccessTokenFromBFFSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('bff_session');

    if (!sessionCookie?.value) {
      return null;
    }

    const response = await fetch(`${AUTH_BFF_URL}/internal/get-token`, {
      method: 'GET',
      headers: {
        'Cookie': `bff_session=${sessionCookie.value}`,
        'Accept': 'application/json',
        ...(INTERNAL_SERVICE_KEY ? { 'X-Internal-Service-Key': INTERNAL_SERVICE_KEY } : {}),
      },
    });

    if (!response.ok) {
      return null;
    }

    const tokenData: BFFTokenResponse = await response.json();
    if (!tokenData.access_token) {
      return null;
    }

    return `Bearer ${tokenData.access_token}`;
  } catch {
    return null;
  }
}

interface AuthHeaders {
  userId: string;
  authToken: string;
}

/**
 * @deprecated Use getProxyHeaders from @/lib/utils/api-route-handler instead.
 * This function is kept for backwards compatibility but should not be used for new code.
 *
 * Get authentication headers from request
 * Tries multiple authentication methods in order:
 * 1. JWT token from Authorization header
 * 2. x-jwt-claim-sub header (Istio JWT claim for user ID)
 * 3. BFF session cookie (for browser-based auth)
 * 4. DEV_USER_ID env var (development only)
 */
export async function getAuthHeaders(request: NextRequest): Promise<AuthHeaders> {
  let authToken = request.headers.get('authorization') || '';

  // Try to extract user ID from JWT token first
  let userId = '';
  if (authToken) {
    const jwtUserId = extractUserIdFromJWT(authToken);
    if (jwtUserId) {
      userId = jwtUserId;
    }
  }

  // Use Istio JWT claim header (x-jwt-claim-sub) for user ID
  if (!userId) {
    userId = request.headers.get('x-jwt-claim-sub') || '';
  }

  // Try BFF session cookie (for BFF-based auth flow)
  if (!userId) {
    const bffUserId = await getUserIdFromBFFSession();
    if (bffUserId) {
      userId = bffUserId;
    }
  }

  // Try to get access token from BFF session if no Authorization header provided
  if (!authToken) {
    const bffToken = await getAccessTokenFromBFFSession();
    if (bffToken) {
      authToken = bffToken;
    }
  }

  // Only use DEV_USER_ID in development when explicitly enabled
  if (!userId && process.env.NODE_ENV === 'development' && process.env.USE_DEV_USER === 'true') {
    userId = process.env.DEV_USER_ID || '';
  }

  return { userId, authToken };
}
