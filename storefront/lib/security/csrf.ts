/**
 * CSRF Protection Utilities (Edge-compatible)
 *
 * Implements CSRF protection using the Double Submit Cookie pattern.
 * All crypto uses Web Crypto API (crypto.subtle) for Edge runtime compatibility.
 *
 * Secret management follows admin portal pattern:
 * - In production: fetched from GCP Secret Manager (async path, Node.js API routes)
 * - Fallback: process.env.CSRF_SECRET (sync path, used by Edge middleware)
 * - In development: 'dev-csrf-secret-not-for-production' fallback
 *
 * Pattern:
 * 1. Server generates a random token and sets it as a cookie
 * 2. Client reads the cookie and sends the token in a header
 * 3. Server validates that the cookie and header values match
 */

import { NextResponse } from 'next/server';

// CSRF token configuration
const CSRF_COOKIE_NAME = 'sf-csrf-token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_MAX_AGE = 60 * 60; // 1 hour in seconds

// --- Inline crypto helpers (Edge-compatible, no external imports) ---

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate a secure random hex string
 */
function generateSecureToken(length: number = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate HMAC-SHA256 signature
 */
async function generateHmacSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
}

/**
 * Verify HMAC-SHA256 signature
 */
async function verifyHmacSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await generateHmacSignature(payload, secret);
  return secureCompare(expectedSignature, signature);
}

// --- CSRF secret (mirrors admin/lib/security/csrf.ts pattern) ---

// Cached CSRF secret for performance (initialized lazily)
let cachedCsrfSecret: string | null = null;
let csrfSecretInitPromise: Promise<void> | null = null;

/**
 * Initialize CSRF secret from GCP Secret Manager or environment variable.
 * Called lazily on first use in Node.js runtime (API routes).
 * NOTE: secrets.ts is dynamically imported to avoid bundling @google-cloud/secret-manager
 * into the Edge middleware bundle.
 */
export async function initializeCsrfSecret(): Promise<void> {
  if (cachedCsrfSecret) return;

  // Prevent concurrent initialization
  if (csrfSecretInitPromise) return csrfSecretInitPromise;

  csrfSecretInitPromise = (async () => {
    try {
      // Dynamic import — only runs in Node.js runtime, not Edge
      const { getSecretWithFallback, isGcpSecretManagerEnabled } = await import('../config/secrets');
      const secret = await getSecretWithFallback('csrf-secret', 'CSRF_SECRET');

      if (!secret && process.env.NODE_ENV === 'production') {
        throw new Error('SECURITY: CSRF_SECRET must be configured in production (via GCP Secret Manager or env var)');
      }

      cachedCsrfSecret = secret || 'dev-csrf-secret-not-for-production';

      if (process.env.NODE_ENV !== 'production') {
        console.log('[CSRF] Secret initialized (development mode)');
      } else {
        const source = isGcpSecretManagerEnabled() ? 'GCP Secret Manager' : 'environment variable';
        console.log(`[CSRF] Secret initialized from ${source}`);
      }
    } catch (error) {
      console.error('[CSRF] Failed to initialize secret:', error);
      throw error;
    }
  })();

  return csrfSecretInitPromise;
}

/**
 * Get CSRF secret (async) — tries cached value, then GCP Secret Manager.
 * Used by Node.js API routes (e.g., /api/csrf token generation).
 */
async function getCsrfSecretAsync(): Promise<string> {
  if (!cachedCsrfSecret) {
    await initializeCsrfSecret();
  }

  if (!cachedCsrfSecret) {
    throw new Error('CSRF secret not initialized');
  }

  return cachedCsrfSecret;
}

/**
 * Get CSRF secret (sync) — reads from cache or falls back to env var.
 * Used by Edge middleware where async GCP SDK calls are not available.
 */
function getCsrfSecret(): string {
  if (cachedCsrfSecret) {
    return cachedCsrfSecret;
  }

  // Fallback to direct env var read (Edge middleware path)
  const secret = process.env.CSRF_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('SECURITY: CSRF_SECRET environment variable must be set in production');
  }
  return secret || 'dev-csrf-secret-not-for-production';
}

// --- Token generation & validation ---

/**
 * Generate a new CSRF token
 * Format: {randomHex}.{timestamp}.{hmacSignature}
 *
 * Uses async secret fetching (GCP Secret Manager in production).
 * Called from Node.js API route (/api/csrf).
 */
export async function generateCsrfToken(): Promise<string> {
  const randomPart = generateSecureToken(CSRF_TOKEN_LENGTH);
  const timestamp = Date.now().toString();
  const data = `${randomPart}.${timestamp}`;
  const secret = await getCsrfSecretAsync();
  const signature = await generateHmacSignature(data, secret);
  return `${data}.${signature}`;
}

/**
 * Validate a CSRF token (checks HMAC signature and expiry)
 *
 * Uses sync secret fallback so it works in Edge middleware.
 * In production, the env var and GCP secret hold the same value,
 * so tokens generated via async path validate correctly via sync path.
 */
export async function validateCsrfToken(token: string): Promise<boolean> {
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const randomPart = parts[0]!;
  const timestamp = parts[1]!;
  const providedSignature = parts[2]!;
  const data = `${randomPart}.${timestamp}`;

  const secret = getCsrfSecret();
  const isValidSignature = await verifyHmacSignature(data, providedSignature, secret);
  if (!isValidSignature) return false;

  const tokenTime = parseInt(timestamp, 10);
  if (isNaN(tokenTime)) return false;

  const tokenAge = (Date.now() - tokenTime) / 1000;
  if (tokenAge > CSRF_TOKEN_MAX_AGE) return false;

  return true;
}

/**
 * Validate CSRF token from request (double-submit cookie vs header)
 */
export async function validateCsrfRequest(request: Request & { cookies?: { get(name: string): { value: string } | undefined } }): Promise<{ valid: boolean; error?: string }> {
  const cookieToken = request.cookies?.get(CSRF_COOKIE_NAME)?.value;
  if (!cookieToken) return { valid: false, error: 'Missing CSRF cookie' };

  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!headerToken) return { valid: false, error: 'Missing CSRF header' };

  if (!secureCompare(cookieToken, headerToken)) {
    return { valid: false, error: 'CSRF token mismatch' };
  }

  const isValid = await validateCsrfToken(headerToken);
  if (!isValid) return { valid: false, error: 'Invalid or expired CSRF token' };

  return { valid: true };
}

/**
 * Set CSRF cookie on response
 */
export async function setCsrfCookie(response: NextResponse, token?: string): Promise<NextResponse> {
  const csrfToken = token || await generateCsrfToken();

  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Must be readable by JavaScript for double-submit
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: CSRF_TOKEN_MAX_AGE,
  });

  return response;
}

/**
 * API route handler to get a new CSRF token
 */
export async function handleCsrfTokenRequest(): Promise<NextResponse> {
  const token = await generateCsrfToken();
  const response = NextResponse.json({
    success: true,
    data: { token },
  });

  return setCsrfCookie(response, token);
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
