/**
 * CSRF Protection Utilities
 *
 * Implements CSRF protection using the Double Submit Cookie pattern.
 * This approach is suitable for SPAs and provides protection against
 * cross-site request forgery attacks.
 *
 * Pattern:
 * 1. Server generates a random token and sets it as a cookie
 * 2. Client reads the cookie and sends the token in a header
 * 3. Server validates that the cookie and header values match
 *
 * @see docs/SECURITY_COMPLIANCE.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateSecureToken, generateHmacSignature, verifyHmacSignature, secureCompare } from './encryption';

// CSRF token configuration
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_MAX_AGE = 60 * 60; // 1 hour in seconds

// Secret key for HMAC signing (should be from environment in production)
const CSRF_SECRET = process.env.CSRF_SECRET || 'csrf-secret-key-change-in-production';

/**
 * Generate a new CSRF token
 * Uses HMAC to create a tamper-proof token
 */
export async function generateCsrfToken(): Promise<string> {
  const randomPart = generateSecureToken(CSRF_TOKEN_LENGTH);
  const timestamp = Date.now().toString();
  const data = `${randomPart}.${timestamp}`;
  const signature = await generateHmacSignature(data, CSRF_SECRET);
  return `${data}.${signature}`;
}

/**
 * Validate a CSRF token
 */
export async function validateCsrfToken(token: string): Promise<boolean> {
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [randomPart, timestamp, providedSignature] = parts;
  const data = `${randomPart}.${timestamp}`;

  // Verify HMAC signature
  const isValidSignature = await verifyHmacSignature(data, providedSignature, CSRF_SECRET);
  if (!isValidSignature) {
    return false;
  }

  // Check token age (not older than max age)
  const tokenTime = parseInt(timestamp, 10);
  if (isNaN(tokenTime)) return false;

  const now = Date.now();
  const tokenAge = (now - tokenTime) / 1000; // in seconds

  if (tokenAge > CSRF_TOKEN_MAX_AGE) {
    return false;
  }

  return true;
}

/**
 * CSRF validation result
 */
export interface CsrfValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate CSRF token from request
 * Checks that the header token matches the cookie token
 */
export async function validateCsrfRequest(request: NextRequest): Promise<CsrfValidationResult> {
  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  if (!cookieToken) {
    return { valid: false, error: 'Missing CSRF cookie' };
  }

  // Get token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) {
    return { valid: false, error: 'Missing CSRF header' };
  }

  // Tokens must match (Double Submit Cookie pattern)
  // Use constant-time comparison to prevent timing attacks
  if (!secureCompare(cookieToken, headerToken)) {
    return { valid: false, error: 'CSRF token mismatch' };
  }

  // Validate the token itself
  const isValid = await validateCsrfToken(headerToken);
  if (!isValid) {
    return { valid: false, error: 'Invalid CSRF token' };
  }

  return { valid: true };
}

/**
 * Set CSRF cookie on response
 */
export async function setCsrfCookie(response: NextResponse, token?: string): Promise<NextResponse> {
  const csrfToken = token || await generateCsrfToken();

  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Must be readable by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: CSRF_TOKEN_MAX_AGE,
  });

  return response;
}

/**
 * Create a CSRF-protected response
 * Use this when returning responses that should include a new CSRF token
 */
export async function createCsrfProtectedResponse(
  data: unknown,
  options: { status?: number; headers?: HeadersInit } = {}
): Promise<NextResponse> {
  const response = NextResponse.json(data, {
    status: options.status || 200,
    headers: options.headers,
  });

  return setCsrfCookie(response);
}

/**
 * Create CSRF error response
 */
export function createCsrfErrorResponse(error: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'CSRF_VALIDATION_FAILED',
        message: error,
      },
    },
    { status: 403 }
  );
}

/**
 * Methods that require CSRF protection
 * GET, HEAD, OPTIONS are considered "safe" methods
 */
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Check if request method requires CSRF protection
 */
export function requiresCsrfProtection(method: string): boolean {
  return CSRF_PROTECTED_METHODS.includes(method.toUpperCase());
}

/**
 * Middleware helper to protect routes with CSRF
 *
 * Usage in API route:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const csrfResult = await validateCsrfRequest(request);
 *   if (!csrfResult.valid) {
 *     return createCsrfErrorResponse(csrfResult.error!);
 *   }
 *   // Proceed with protected operation
 * }
 * ```
 */
export function withCsrfProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Only validate CSRF for state-changing methods
    if (requiresCsrfProtection(request.method)) {
      const csrfResult = await validateCsrfRequest(request);
      if (!csrfResult.valid) {
        return createCsrfErrorResponse(csrfResult.error!);
      }
    }

    return handler(request);
  };
}

/**
 * API route to get a new CSRF token
 * Client should call this on app init and after token expires
 */
export async function handleCsrfTokenRequest(): Promise<NextResponse> {
  const token = await generateCsrfToken();
  const response = NextResponse.json({
    success: true,
    data: { token },
  });

  return setCsrfCookie(response, token);
}
