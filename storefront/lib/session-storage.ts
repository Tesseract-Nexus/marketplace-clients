/**
 * Session Storage Utility with TTL Support
 *
 * This module provides a custom storage implementation for Zustand that:
 * 1. Uses localStorage for both anonymous and authenticated users (survives refresh/tab close)
 * 2. Applies different TTLs:
 *    - Anonymous users: 30 minutes (short session for guest checkout)
 *    - Authenticated users: 1 month (persistent + backend sync)
 *
 * The goal is to allow anonymous users to have full cart/wishlist functionality
 * during their checkout session, with automatic cleanup when:
 * - The TTL expires (30 minutes for anonymous, 1 month for authenticated)
 * - The user logs in (data migrated to authenticated storage + backend sync)
 */

import { StateStorage } from 'zustand/middleware';

// 30 minutes in milliseconds for anonymous users
export const ANONYMOUS_TTL_MS = 30 * 60 * 1000;

// 1 month in milliseconds for authenticated users
export const AUTHENTICATED_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Keys for tracking TTL
const TTL_KEY_SUFFIX = '_ttl';

/**
 * Wrapper interface for stored data with TTL
 */
interface StoredDataWithTTL<T> {
  data: T;
  expiresAt: number;
  isAnonymous: boolean;
}

/**
 * Check if we're in a browser environment
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Get the current authentication state from the auth store
 * This is a simple check - we look for the auth-storage in localStorage
 */
export function isUserAuthenticated(): boolean {
  if (!isBrowser) return false;

  try {
    const authData = localStorage.getItem('auth-storage');
    if (!authData) return false;

    const parsed = JSON.parse(authData);
    return parsed?.state?.isAuthenticated === true;
  } catch {
    return false;
  }
}

/**
 * Check if data has expired based on TTL
 */
export function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

/**
 * Create a new expiration timestamp based on authentication status
 */
export function createExpirationTimestamp(isAuthenticated: boolean = false): number {
  const ttl = isAuthenticated ? AUTHENTICATED_TTL_MS : ANONYMOUS_TTL_MS;
  return Date.now() + ttl;
}

/**
 * Get appropriate TTL description for logging
 */
function getTTLDescription(isAuthenticated: boolean): string {
  return isAuthenticated ? '1 month' : '30 minutes';
}

/**
 * Custom storage adapter for Zustand that handles TTL-based persistence:
 * - Uses localStorage for BOTH anonymous and authenticated users (survives refresh/tab close)
 * - Applies different TTLs:
 *   - Anonymous: 30 minutes (for guest checkout sessions)
 *   - Authenticated: 1 month (persistent with backend sync)
 *
 * @param storeName - The name of the store (e.g., 'storefront-cart')
 */
export function createSessionAwareStorage(storeName: string): StateStorage {
  return {
    getItem: (name: string): string | null => {
      if (!isBrowser) return null;

      const isAuth = isUserAuthenticated();
      const ttlKey = `${name}${TTL_KEY_SUFFIX}`;

      // Both anonymous and authenticated use localStorage now
      const storedData = localStorage.getItem(name);
      const ttlData = localStorage.getItem(ttlKey);

      if (!storedData) {
        // Check for legacy sessionStorage data and migrate it
        const sessionData = sessionStorage.getItem(name);
        if (sessionData) {
          // Migrate from sessionStorage to localStorage
          localStorage.setItem(name, sessionData);
          const expiresAt = createExpirationTimestamp(isAuth);
          localStorage.setItem(ttlKey, expiresAt.toString());
          // Clean up old sessionStorage
          sessionStorage.removeItem(name);
          sessionStorage.removeItem(ttlKey);
          console.log(`[Storage] Migrated ${storeName} from sessionStorage to localStorage`);
          return sessionData;
        }
        return null;
      }

      // Check TTL
      if (ttlData) {
        const expiresAt = parseInt(ttlData, 10);
        if (isExpired(expiresAt)) {
          // Data expired, clear it
          localStorage.removeItem(name);
          localStorage.removeItem(ttlKey);
          const userType = isAuth ? 'authenticated' : 'anonymous';
          console.log(`[Storage] ${userType} data expired for ${storeName}, cleared.`);
          return null;
        }
      }

      // Handle wrapped data (from migration)
      try {
        const parsed = JSON.parse(storedData);
        if (parsed.data !== undefined && parsed.expiresAt !== undefined) {
          // It's wrapped data, unwrap it
          return JSON.stringify(parsed.data);
        }
      } catch {
        // Not JSON or not wrapped, return as-is
      }

      return storedData;
    },

    setItem: (name: string, value: string): void => {
      if (!isBrowser) return;

      const isAuth = isUserAuthenticated();
      const ttlKey = `${name}${TTL_KEY_SUFFIX}`;

      // Store in localStorage with TTL
      localStorage.setItem(name, value);

      // Set/update TTL based on auth status
      const existingTTL = localStorage.getItem(ttlKey);
      const wasAnonymous = existingTTL ? !isAuth : true;

      if (!existingTTL || (isAuth && wasAnonymous)) {
        // First time setting data, or user just logged in - set appropriate TTL
        const expiresAt = createExpirationTimestamp(isAuth);
        localStorage.setItem(ttlKey, expiresAt.toString());
        console.log(`[Storage] Set TTL for ${storeName}: expires in ${getTTLDescription(isAuth)}`);
      }
      // If TTL exists and user is still in same auth state, keep existing TTL

      // Clean up any legacy sessionStorage
      sessionStorage.removeItem(name);
      sessionStorage.removeItem(ttlKey);
    },

    removeItem: (name: string): void => {
      if (!isBrowser) return;

      // Remove from both storages (for migration cleanup)
      localStorage.removeItem(name);
      localStorage.removeItem(`${name}${TTL_KEY_SUFFIX}`);
      sessionStorage.removeItem(name);
      sessionStorage.removeItem(`${name}${TTL_KEY_SUFFIX}`);
    },
  };
}

/**
 * Upgrade anonymous storage to authenticated storage
 * Called when a user logs in to extend their TTL
 *
 * @param storeName - The store name to upgrade
 * @returns The data or null if no data exists
 */
export function migrateToAuthenticatedStorage<T>(storeName: string): T | null {
  if (!isBrowser) return null;

  const storedData = localStorage.getItem(storeName);
  if (!storedData) return null;

  try {
    // Parse the data
    const data = JSON.parse(storedData) as T;

    // Extend TTL to authenticated duration (1 month)
    const ttlKey = `${storeName}${TTL_KEY_SUFFIX}`;
    const expiresAt = createExpirationTimestamp(true);
    localStorage.setItem(ttlKey, expiresAt.toString());

    // Clean up any legacy sessionStorage
    sessionStorage.removeItem(storeName);
    sessionStorage.removeItem(ttlKey);

    console.log(`[Storage] Upgraded ${storeName} to authenticated storage (1 month TTL)`);

    return data;
  } catch (error) {
    console.error(`[Storage] Failed to upgrade ${storeName}:`, error);
    return null;
  }
}

/**
 * Get session data without consuming it
 * Useful for checking what needs to be merged on login
 *
 * @param storeName - The store name to check
 * @returns The session data or null
 */
export function getAnonymousSessionData<T>(storeName: string): T | null {
  if (!isBrowser) return null;

  const storedData = localStorage.getItem(storeName);
  if (!storedData) return null;

  // Check TTL
  const ttlKey = `${storeName}${TTL_KEY_SUFFIX}`;
  const ttlData = localStorage.getItem(ttlKey);
  if (ttlData) {
    const expiresAt = parseInt(ttlData, 10);
    if (isExpired(expiresAt)) {
      // Data expired
      localStorage.removeItem(storeName);
      localStorage.removeItem(ttlKey);
      return null;
    }
  }

  try {
    return JSON.parse(storedData) as T;
  } catch {
    return null;
  }
}

/**
 * Clear session data
 * Called after successful order completion or logout
 */
export function clearAnonymousSessionData(storeName: string): void {
  if (!isBrowser) return;

  localStorage.removeItem(storeName);
  localStorage.removeItem(`${storeName}${TTL_KEY_SUFFIX}`);
  // Also clear legacy sessionStorage
  sessionStorage.removeItem(storeName);
  sessionStorage.removeItem(`${storeName}${TTL_KEY_SUFFIX}`);
}

/**
 * Get remaining TTL for session data
 * @returns Remaining time in milliseconds, or 0 if expired/no TTL
 */
export function getRemainingTTL(storeName: string): number {
  if (!isBrowser) return 0;

  const ttlKey = `${storeName}${TTL_KEY_SUFFIX}`;
  const ttlData = localStorage.getItem(ttlKey);

  if (!ttlData) return 0;

  const expiresAt = parseInt(ttlData, 10);
  const remaining = expiresAt - Date.now();

  return remaining > 0 ? remaining : 0;
}

/**
 * Clean up all expired session data
 * Should be called on app initialization
 */
export function cleanupExpiredSessionData(): void {
  if (!isBrowser) return;

  const storesToCheck = ['storefront-cart', 'storefront-wishlist', 'storefront-checkout'];

  for (const storeName of storesToCheck) {
    const ttlKey = `${storeName}${TTL_KEY_SUFFIX}`;
    const ttlData = localStorage.getItem(ttlKey);

    if (ttlData) {
      const expiresAt = parseInt(ttlData, 10);
      if (isExpired(expiresAt)) {
        localStorage.removeItem(storeName);
        localStorage.removeItem(ttlKey);
        console.log(`[Storage] Cleaned up expired data for ${storeName}`);
      }
    }

    // Also clean up legacy sessionStorage
    const sessionTTL = sessionStorage.getItem(ttlKey);
    if (sessionTTL) {
      const expiresAt = parseInt(sessionTTL, 10);
      if (isExpired(expiresAt)) {
        sessionStorage.removeItem(storeName);
        sessionStorage.removeItem(ttlKey);
      }
    }
  }
}

/**
 * Check if there's valid session data
 */
export function hasAnonymousSessionData(storeName: string): boolean {
  if (!isBrowser) return false;

  const storedData = localStorage.getItem(storeName);
  if (!storedData) return false;

  // Verify it's not expired
  const ttlKey = `${storeName}${TTL_KEY_SUFFIX}`;
  const ttlData = localStorage.getItem(ttlKey);

  if (ttlData) {
    const expiresAt = parseInt(ttlData, 10);
    if (isExpired(expiresAt)) {
      return false;
    }
  }

  return true;
}

// Store periodic cleanup interval reference
let cleanupIntervalId: NodeJS.Timeout | null = null;

/**
 * Start periodic TTL cleanup check
 * Runs every 5 minutes to check for expired session data
 *
 * @param onExpired - Optional callback when session data expires
 * @param onExpirationWarning - Optional callback when session is about to expire (5 min warning for anonymous)
 */
export function startPeriodicTTLCleanup(
  onExpired?: (storeName: string) => void,
  onExpirationWarning?: (storeName: string, remainingMs: number) => void
): void {
  if (!isBrowser) return;

  // Don't start multiple intervals
  if (cleanupIntervalId) return;

  const checkInterval = 1 * 60 * 1000; // 1 minute (more frequent for 30 min TTL)
  const storesToCheck = ['storefront-cart', 'storefront-wishlist', 'storefront-checkout'];

  const performCheck = () => {
    const isAuth = isUserAuthenticated();
    // Warning threshold: 5 mins for anonymous, 1 day for authenticated
    const warningThreshold = isAuth ? 24 * 60 * 60 * 1000 : 5 * 60 * 1000;

    for (const storeName of storesToCheck) {
      const ttlKey = `${storeName}${TTL_KEY_SUFFIX}`;
      const ttlData = localStorage.getItem(ttlKey);
      const storedData = localStorage.getItem(storeName);

      if (ttlData && storedData) {
        const expiresAt = parseInt(ttlData, 10);
        const remainingMs = expiresAt - Date.now();

        if (remainingMs <= 0) {
          // Expired - clean up
          localStorage.removeItem(storeName);
          localStorage.removeItem(ttlKey);
          console.log(`[Storage] Periodic cleanup: expired data for ${storeName}`);
          onExpired?.(storeName);
        } else if (remainingMs <= warningThreshold) {
          // About to expire - warn user
          console.log(`[Storage] Warning: ${storeName} expires in ${Math.round(remainingMs / 60000)} minutes`);
          onExpirationWarning?.(storeName, remainingMs);
        }
      }
    }
  };

  // Run immediately
  performCheck();

  // Then run periodically
  cleanupIntervalId = setInterval(performCheck, checkInterval);
}

/**
 * Stop periodic TTL cleanup
 */
export function stopPeriodicTTLCleanup(): void {
  if (cleanupIntervalId) {
    clearInterval(cleanupIntervalId);
    cleanupIntervalId = null;
  }
}

/**
 * Check if session is expiring soon (within warning threshold)
 * @returns Object with warning info or null if not expiring soon
 */
export function getExpirationWarning(storeName: string): { expiresIn: number; expiresAt: Date } | null {
  if (!isBrowser) return null;

  const isAuth = isUserAuthenticated();
  // Warning threshold: 5 mins for anonymous, 1 day for authenticated
  const warningThreshold = isAuth ? 24 * 60 * 60 * 1000 : 5 * 60 * 1000;

  const ttlKey = `${storeName}${TTL_KEY_SUFFIX}`;
  const ttlData = localStorage.getItem(ttlKey);

  if (!ttlData) return null;

  const expiresAt = parseInt(ttlData, 10);
  const remainingMs = expiresAt - Date.now();

  if (remainingMs > 0 && remainingMs <= warningThreshold) {
    return {
      expiresIn: remainingMs,
      expiresAt: new Date(expiresAt),
    };
  }

  return null;
}

/**
 * Extend TTL for session data (e.g., when user is actively using the cart)
 * Resets TTL to full duration based on auth status
 * @param storeName - The store to extend TTL for
 * @returns true if TTL was extended, false otherwise
 */
export function extendSessionTTL(storeName: string): boolean {
  if (!isBrowser) return false;

  const storedData = localStorage.getItem(storeName);
  if (!storedData) return false;

  const isAuth = isUserAuthenticated();
  const ttlKey = `${storeName}${TTL_KEY_SUFFIX}`;
  const newExpiresAt = createExpirationTimestamp(isAuth);
  localStorage.setItem(ttlKey, newExpiresAt.toString());

  console.log(`[Storage] Extended TTL for ${storeName}: expires in ${getTTLDescription(isAuth)}`);
  return true;
}
