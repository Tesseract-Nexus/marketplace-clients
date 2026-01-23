/**
 * Client-side CSRF Token Utilities
 *
 * Handles fetching, storing, and retrieving CSRF tokens for the client.
 * Uses the Double Submit Cookie pattern - token is stored in both cookie and header.
 */

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Get CSRF token from cookie
 * The cookie is set by the server when calling /api/csrf
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Fetch a new CSRF token from the server
 * This sets the cookie and returns the token
 */
export async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/csrf', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('[CSRF] Failed to fetch token:', response.status);
      return null;
    }

    const data = await response.json();
    return data.data?.token || null;
  } catch (error) {
    console.error('[CSRF] Error fetching token:', error);
    return null;
  }
}

/**
 * Ensure CSRF token is available
 * Fetches a new one if cookie is missing or expired
 */
export async function ensureCsrfToken(): Promise<string | null> {
  // First try to get from cookie
  let token = getCsrfTokenFromCookie();

  if (!token) {
    // No cookie, fetch a new token
    token = await fetchCsrfToken();
  }

  return token;
}

/**
 * Get the CSRF header name
 */
export function getCsrfHeaderName(): string {
  return CSRF_HEADER_NAME;
}

/**
 * Check if a request method requires CSRF protection
 */
export function requiresCsrfProtection(method: string): boolean {
  const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  return protectedMethods.includes(method.toUpperCase());
}
