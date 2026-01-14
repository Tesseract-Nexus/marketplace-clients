/**
 * Server-side auth utilities for extracting user info from JWT tokens
 * Note: Full signature verification is done by the backend services
 */

export interface TokenPayload {
  sub?: string; // Subject (customer ID or user ID)
  customerId?: string; // Custom claim for customer ID
  customer_id?: string; // Alternative claim name
  email?: string;
  exp?: number;
  iat?: number;
  preferred_username?: string;
  [key: string]: unknown;
}

/**
 * Decode a JWT token payload without verification
 * Use this only for extracting claims - actual auth verification
 * is handled by the backend services
 */
export function decodeJwtPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    // Handle base64url encoding
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const decoded = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Extract customer ID from a JWT token
 * Checks multiple possible claim names
 */
export function extractCustomerId(token: string): string | null {
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  // Check various claim names that might contain customer ID
  return payload.customerId ||
    payload.customer_id ||
    payload.sub ||
    null;
}

/**
 * Check if a token is expired (with 60s buffer)
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return true; // Treat as expired if no exp claim
  }

  const now = Math.floor(Date.now() / 1000);
  const buffer = 60; // 60 second buffer
  return payload.exp < (now + buffer);
}

/**
 * Validate that a customerId from request matches the token's customer
 * Returns true if valid, throws Error if mismatch (IDOR attempt)
 */
export function validateCustomerIdAccess(
  requestedCustomerId: string | null | undefined,
  token: string
): { valid: boolean; customerId: string } {
  const tokenCustomerId = extractCustomerId(token);

  if (!tokenCustomerId) {
    throw new Error('Could not extract customer ID from token');
  }

  // If no customerId in request, use token's customer ID
  if (!requestedCustomerId) {
    return { valid: true, customerId: tokenCustomerId };
  }

  // Validate that requested customerId matches token
  if (requestedCustomerId !== tokenCustomerId) {
    console.warn(
      '[Auth] IDOR attempt detected: requested customerId',
      requestedCustomerId,
      'does not match token customerId',
      tokenCustomerId
    );
    throw new Error('Access denied: customer ID mismatch');
  }

  return { valid: true, customerId: tokenCustomerId };
}
