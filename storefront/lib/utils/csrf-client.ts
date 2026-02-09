/**
 * Client-side CSRF Token Utilities
 *
 * Handles fetching, storing, and retrieving CSRF tokens for the storefront.
 * Uses the Double Submit Cookie pattern — token is stored in both cookie and header.
 */

const CSRF_COOKIE_NAME = 'sf-csrf-token';

/**
 * Get CSRF token from cookie
 */
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const parts = cookie.trim().split('=');
    if (parts[0] === CSRF_COOKIE_NAME && parts[1]) {
      return decodeURIComponent(parts[1]);
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
 * Fetches a new one if cookie is missing
 */
export async function ensureCsrfToken(): Promise<string | null> {
  let token = getCsrfTokenFromCookie();

  if (!token) {
    token = await fetchCsrfToken();
  }

  return token;
}
