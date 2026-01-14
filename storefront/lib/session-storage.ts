/**
 * Session Storage Utility with TTL Support for Anonymous Users
 *
 * This module provides a custom storage implementation for Zustand that:
 * 1. Uses sessionStorage for anonymous users (data cleared on browser close)
 * 2. Applies a 3-hour TTL for anonymous user data
 * 3. Uses localStorage for authenticated users (persistent + backend sync)
 *
 * The goal is to allow anonymous users to have full cart/wishlist functionality
 * during their session, with automatic cleanup when:
 * - The browser is closed (sessionStorage behavior)
 * - The TTL expires (3 hours max)
 * - The user logs in (data migrated to persistent storage + backend)
 */

import { StateStorage } from 'zustand/middleware';

// 3 hours in milliseconds
export const ANONYMOUS_TTL_MS = 3 * 60 * 60 * 1000;

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
 * Create a new expiration timestamp
 */
export function createExpirationTimestamp(): number {
  return Date.now() + ANONYMOUS_TTL_MS;
}

/**
 * Custom storage adapter for Zustand that handles:
 * - sessionStorage for anonymous users with TTL
 * - localStorage for authenticated users
 *
 * @param storeName - The name of the store (e.g., 'storefront-cart')
 */
export function createSessionAwareStorage(storeName: string): StateStorage {
  return {
    getItem: (name: string): string | null => {
      if (!isBrowser) return null;

      const isAuth = isUserAuthenticated();

      // For authenticated users, use localStorage (will be synced with backend)
      if (isAuth) {
        const persistentData = localStorage.getItem(name);
        if (persistentData) {
          try {
            // Check if it's wrapped data (from anonymous session that was migrated)
            const parsed = JSON.parse(persistentData);
            if (parsed.data !== undefined && parsed.expiresAt !== undefined) {
              // It's wrapped data, unwrap it
              return JSON.stringify(parsed.data);
            }
            // It's regular data
            return persistentData;
          } catch {
            return persistentData;
          }
        }
        return null;
      }

      // For anonymous users, check sessionStorage first, then localStorage for migration
      const sessionData = sessionStorage.getItem(name);
      const ttlKey = `${name}${TTL_KEY_SUFFIX}`;

      if (sessionData) {
        // Check TTL
        const ttlData = sessionStorage.getItem(ttlKey);
        if (ttlData) {
          const expiresAt = parseInt(ttlData, 10);
          if (isExpired(expiresAt)) {
            // Data expired, clear it
            sessionStorage.removeItem(name);
            sessionStorage.removeItem(ttlKey);
            console.log(`[SessionStorage] Anonymous data expired for ${storeName}, cleared.`);
            return null;
          }
        }
        return sessionData;
      }

      // Check if there's data in localStorage that needs to be migrated to session
      // This handles the case where user was authenticated and logged out
      const localData = localStorage.getItem(name);
      if (localData) {
        // Don't migrate - let them start fresh as anonymous
        // The old authenticated data stays in localStorage for if they log back in
        return null;
      }

      return null;
    },

    setItem: (name: string, value: string): void => {
      if (!isBrowser) return;

      const isAuth = isUserAuthenticated();

      if (isAuth) {
        // Authenticated users use localStorage (with backend sync)
        localStorage.setItem(name, value);

        // Clear any session storage data since user is now authenticated
        sessionStorage.removeItem(name);
        sessionStorage.removeItem(`${name}${TTL_KEY_SUFFIX}`);
      } else {
        // Anonymous users use sessionStorage with TTL
        sessionStorage.setItem(name, value);

        // Set/update TTL
        const ttlKey = `${name}${TTL_KEY_SUFFIX}`;
        const existingTTL = sessionStorage.getItem(ttlKey);

        if (!existingTTL) {
          // First time setting data, create TTL
          const expiresAt = createExpirationTimestamp();
          sessionStorage.setItem(ttlKey, expiresAt.toString());
          console.log(`[SessionStorage] Set TTL for ${storeName}: expires in 3 hours`);
        }
        // If TTL exists, don't extend it - let it expire at original time
      }
    },

    removeItem: (name: string): void => {
      if (!isBrowser) return;

      // Remove from both storages
      localStorage.removeItem(name);
      sessionStorage.removeItem(name);
      sessionStorage.removeItem(`${name}${TTL_KEY_SUFFIX}`);
    },
  };
}

/**
 * Migrate anonymous session data to authenticated storage
 * Called when a user logs in to preserve their cart/wishlist
 *
 * @param storeName - The store name to migrate
 * @returns The migrated data or null if no data to migrate
 */
export function migrateToAuthenticatedStorage<T>(storeName: string): T | null {
  if (!isBrowser) return null;

  const sessionData = sessionStorage.getItem(storeName);
  if (!sessionData) return null;

  try {
    // Parse the session data
    const data = JSON.parse(sessionData) as T;

    // Store in localStorage (authenticated storage)
    localStorage.setItem(storeName, sessionData);

    // Clear session storage
    sessionStorage.removeItem(storeName);
    sessionStorage.removeItem(`${storeName}${TTL_KEY_SUFFIX}`);

    console.log(`[SessionStorage] Migrated ${storeName} from session to authenticated storage`);

    return data;
  } catch (error) {
    console.error(`[SessionStorage] Failed to migrate ${storeName}:`, error);
    return null;
  }
}

/**
 * Get anonymous session data without consuming it
 * Useful for checking what needs to be merged on login
 *
 * @param storeName - The store name to check
 * @returns The session data or null
 */
export function getAnonymousSessionData<T>(storeName: string): T | null {
  if (!isBrowser) return null;

  const sessionData = sessionStorage.getItem(storeName);
  if (!sessionData) return null;

  // Check TTL
  const ttlKey = `${storeName}${TTL_KEY_SUFFIX}`;
  const ttlData = sessionStorage.getItem(ttlKey);
  if (ttlData) {
    const expiresAt = parseInt(ttlData, 10);
    if (isExpired(expiresAt)) {
      // Data expired
      sessionStorage.removeItem(storeName);
      sessionStorage.removeItem(ttlKey);
      return null;
    }
  }

  try {
    return JSON.parse(sessionData) as T;
  } catch {
    return null;
  }
}

/**
 * Clear all anonymous session data
 * Called after successful migration to authenticated storage
 */
export function clearAnonymousSessionData(storeName: string): void {
  if (!isBrowser) return;

  sessionStorage.removeItem(storeName);
  sessionStorage.removeItem(`${storeName}${TTL_KEY_SUFFIX}`);
}

/**
 * Get remaining TTL for anonymous session data
 * @returns Remaining time in milliseconds, or 0 if expired/no TTL
 */
export function getRemainingTTL(storeName: string): number {
  if (!isBrowser) return 0;

  const ttlKey = `${storeName}${TTL_KEY_SUFFIX}`;
  const ttlData = sessionStorage.getItem(ttlKey);

  if (!ttlData) return 0;

  const expiresAt = parseInt(ttlData, 10);
  const remaining = expiresAt - Date.now();

  return remaining > 0 ? remaining : 0;
}

/**
 * Clean up all expired anonymous session data
 * Should be called on app initialization
 */
export function cleanupExpiredSessionData(): void {
  if (!isBrowser) return;

  const storesToCheck = ['storefront-cart', 'storefront-wishlist'];

  for (const storeName of storesToCheck) {
    const ttlKey = `${storeName}${TTL_KEY_SUFFIX}`;
    const ttlData = sessionStorage.getItem(ttlKey);

    if (ttlData) {
      const expiresAt = parseInt(ttlData, 10);
      if (isExpired(expiresAt)) {
        sessionStorage.removeItem(storeName);
        sessionStorage.removeItem(ttlKey);
        console.log(`[SessionStorage] Cleaned up expired session data for ${storeName}`);
      }
    }
  }
}

/**
 * Check if there's anonymous session data that can be migrated
 */
export function hasAnonymousSessionData(storeName: string): boolean {
  if (!isBrowser) return false;

  const sessionData = sessionStorage.getItem(storeName);
  if (!sessionData) return false;

  // Verify it's not expired
  const ttlKey = `${storeName}${TTL_KEY_SUFFIX}`;
  const ttlData = sessionStorage.getItem(ttlKey);

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

// Expiration warning threshold (30 minutes before expiry)
const EXPIRATION_WARNING_THRESHOLD_MS = 30 * 60 * 1000;

/**
 * Start periodic TTL cleanup check
 * Runs every 5 minutes to check for expired session data
 *
 * @param onExpired - Optional callback when session data expires
 * @param onExpirationWarning - Optional callback when session is about to expire (30 min warning)
 */
export function startPeriodicTTLCleanup(
  onExpired?: (storeName: string) => void,
  onExpirationWarning?: (storeName: string, remainingMs: number) => void
): void {
  if (!isBrowser) return;

  // Don't start multiple intervals
  if (cleanupIntervalId) return;

  const checkInterval = 5 * 60 * 1000; // 5 minutes
  const storesToCheck = ['storefront-cart', 'storefront-wishlist'];

  const performCheck = () => {
    // Only check for anonymous users
    if (isUserAuthenticated()) return;

    for (const storeName of storesToCheck) {
      const ttlKey = `${storeName}${TTL_KEY_SUFFIX}`;
      const ttlData = sessionStorage.getItem(ttlKey);
      const sessionData = sessionStorage.getItem(storeName);

      if (ttlData && sessionData) {
        const expiresAt = parseInt(ttlData, 10);
        const remainingMs = expiresAt - Date.now();

        if (remainingMs <= 0) {
          // Expired - clean up
          sessionStorage.removeItem(storeName);
          sessionStorage.removeItem(ttlKey);
          console.log(`[SessionStorage] Periodic cleanup: expired session data for ${storeName}`);
          onExpired?.(storeName);
        } else if (remainingMs <= EXPIRATION_WARNING_THRESHOLD_MS) {
          // About to expire - warn user
          console.log(`[SessionStorage] Warning: ${storeName} expires in ${Math.round(remainingMs / 60000)} minutes`);
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

  const ttlKey = `${storeName}${TTL_KEY_SUFFIX}`;
  const ttlData = sessionStorage.getItem(ttlKey);

  if (!ttlData) return null;

  const expiresAt = parseInt(ttlData, 10);
  const remainingMs = expiresAt - Date.now();

  if (remainingMs > 0 && remainingMs <= EXPIRATION_WARNING_THRESHOLD_MS) {
    return {
      expiresIn: remainingMs,
      expiresAt: new Date(expiresAt),
    };
  }

  return null;
}

/**
 * Extend TTL for session data (e.g., when user is actively using the cart)
 * Only extends if user is anonymous and data exists
 * @param storeName - The store to extend TTL for
 * @returns true if TTL was extended, false otherwise
 */
export function extendSessionTTL(storeName: string): boolean {
  if (!isBrowser) return false;
  if (isUserAuthenticated()) return false;

  const sessionData = sessionStorage.getItem(storeName);
  if (!sessionData) return false;

  const ttlKey = `${storeName}${TTL_KEY_SUFFIX}`;
  const newExpiresAt = createExpirationTimestamp();
  sessionStorage.setItem(ttlKey, newExpiresAt.toString());

  console.log(`[SessionStorage] Extended TTL for ${storeName}: expires in 3 hours`);
  return true;
}
