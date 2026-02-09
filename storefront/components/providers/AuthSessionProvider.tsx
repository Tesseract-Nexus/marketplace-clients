'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { getSession, refreshToken } from '@/lib/api/auth';
import { storefrontToast } from '@/components/ui/sonner';

interface AuthSessionProviderProps {
  children: React.ReactNode;
}

/**
 * Fetch the full customer profile from customers-service via BFF route.
 * This provides additional fields (phone, country, etc.) not available
 * in the auth-bff session response.
 */
async function fetchCustomerProfile(tenantId?: string): Promise<{
  phone?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  country?: string;
  countryCode?: string;
  avatarUrl?: string;
  totalOrders?: number;
  totalSpent?: number;
  createdAt?: string;
} | null> {
  try {
    const headers: Record<string, string> = {};
    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }
    const response = await fetch('/api/auth/profile', {
      credentials: 'include',
      headers,
    });
    if (!response.ok) return null;
    const result = await response.json();
    if (result.success && result.data) {
      return result.data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Roles that identify admin/staff users from the internal Keycloak realm.
 * Sessions with these roles must NOT be treated as customer sessions on the
 * storefront — the admin panel and storefront use different Keycloak realms
 * (tesserix-internal vs mark8ly-customer) and their sessions must be isolated.
 */
const ADMIN_STAFF_ROLES = ['owner', 'admin', 'staff', 'manager', 'super_admin'];

/**
 * Check whether a session belongs to an admin/staff user rather than a customer.
 * Returns true if ANY admin/staff role is present.
 */
function isAdminSession(roles?: string[]): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.some(role => ADMIN_STAFF_ROLES.includes(role));
}

/** Refresh tokens 5 minutes before session expiry */
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

/**
 * AuthSessionProvider - Validates authentication state against auth-bff session
 *
 * This provider runs on mount to:
 * 1. Always check the auth-bff session cookie via /auth/session
 * 2. Sync the local auth store with the actual session state
 * 3. Populate auth store from valid server-side session (survives page refresh)
 * 4. Clear stale auth data if the session is no longer valid
 * 5. Fetch full customer profile (phone, country, etc.) from customers-service
 * 6. **Reject admin/staff sessions** — the storefront only accepts customer sessions
 *
 * The Zustand auth store intentionally does NOT persist to localStorage.
 * Auth state is managed server-side via auth-bff HttpOnly cookies.
 * On every page load (including refresh), we call /auth/session to rehydrate
 * the client-side store from the server-side session.
 *
 * This ensures:
 * - Session persists across soft and hard refreshes
 * - Storefront is browsable without being logged in
 * - OAuth callbacks properly populate auth state
 * - Clear separation between admin (staff) and storefront (customer) contexts
 */
export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const pathname = usePathname();
  const { logout, login, updateCustomer, setLoading, setExpiresAt, isAuthenticated, customer } = useAuthStore();
  const hasCheckedSession = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const doRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    try {
      const success = await refreshToken();
      if (success) {
        // Fetch updated session to get new expiresAt
        const session = await getSession();
        if (session.authenticated && session.expiresAt) {
          const expiresAtMs = session.expiresAt * 1000;
          setExpiresAt(expiresAtMs);
          scheduleRefresh(expiresAtMs);
          console.log('[AuthSessionProvider] Token refreshed, next refresh at', new Date(expiresAtMs - REFRESH_BUFFER_MS).toISOString());
        }
      } else {
        // Refresh failed — session is no longer valid
        console.log('[AuthSessionProvider] Token refresh failed, logging out');
        clearRefreshTimer();
        storefrontToast.warning('Session expired', 'Your session has expired. Please log in again.');
        logout();
      }
    } catch (error) {
      console.error('[AuthSessionProvider] Token refresh error:', error);
      clearRefreshTimer();
      storefrontToast.warning('Session expired', 'Your session has expired. Please log in again.');
      logout();
    } finally {
      isRefreshingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleRefresh = useCallback((expiresAtMs: number) => {
    clearRefreshTimer();
    const msUntilExpiry = expiresAtMs - Date.now();
    const refreshIn = msUntilExpiry - REFRESH_BUFFER_MS;

    if (refreshIn <= 0) {
      // Already past the refresh window — refresh immediately
      doRefresh();
    } else {
      refreshTimerRef.current = setTimeout(doRefresh, refreshIn);
    }
  }, [clearRefreshTimer, doRefresh]);

  // Handle tab visibility — refresh if overdue when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const { isAuthenticated: authed, expiresAt: expiry } = useAuthStore.getState();
      if (!authed || !expiry) return;

      const msUntilExpiry = expiry - Date.now();
      if (msUntilExpiry <= REFRESH_BUFFER_MS) {
        // Within refresh window or past expiry — refresh now
        doRefresh();
      } else {
        // Reschedule in case the timer drifted while tab was hidden
        scheduleRefresh(expiry);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [doRefresh, scheduleRefresh]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearRefreshTimer();
  }, [clearRefreshTimer]);

  useEffect(() => {
    // Only check once on mount
    if (hasCheckedSession.current) return;
    hasCheckedSession.current = true;

    const validateSession = async () => {
      try {
        // Always call /auth/session to rehydrate auth state from server-side
        // session cookie. This is necessary because the Zustand store does not
        // persist auth state to localStorage — on every page load (including
        // refresh), the client store resets to anonymous. The auth-bff HttpOnly
        // cookie survives refresh, so we always check it to restore auth state.
        const session = await getSession();

        if (session.authenticated && session.user) {
          const sessionUser = session.user;

          // CRITICAL: Reject admin/staff sessions on the storefront.
          // The admin portal (tesserix-internal realm) and storefront (mark8ly-customer realm)
          // share the .tesserix.app cookie domain, so the browser sends admin session cookies
          // to the storefront. We must detect and ignore these — admin users are NOT customers.
          if (isAdminSession(sessionUser.roles)) {
            console.log(
              '[AuthSessionProvider] Rejected admin/staff session on storefront (roles:',
              sessionUser.roles,
              '). Storefront only accepts customer sessions.'
            );
            // Treat as unauthenticated — don't log them in, don't log them out
            // (logging out would destroy their valid admin session)
            if (isAuthenticated) {
              logout();
            }
            setLoading(false);
            return;
          }

          if (isAuthenticated && customer) {
            // Already authenticated in store — verify user matches
            if (customer.id !== sessionUser.id) {
              console.log('[AuthSessionProvider] Session user mismatch, re-syncing auth state');
              login({
                  id: sessionUser.id,
                  email: sessionUser.email,
                  firstName: sessionUser.firstName || sessionUser.name?.split(' ')[0] || '',
                  lastName: sessionUser.lastName || sessionUser.name?.split(' ').slice(1).join(' ') || '',
                  phone: sessionUser.phone,
                  avatarUrl: sessionUser.picture,
                  status: 'ACTIVE',
                  customerType: 'RETAIL',
                  totalOrders: 0,
                  totalSpent: 0,
                  marketingOptIn: false,
                  emailVerified: true,
                  createdAt: new Date().toISOString(),
                });
            } else {
              console.log('[AuthSessionProvider] Session validated, keeping auth state');
            }
          } else {
            // Not authenticated in store but server has valid session
            // This happens after page refresh (store resets, cookie persists)
            console.log('[AuthSessionProvider] Restoring auth state from server session');
            login({
                id: sessionUser.id,
                email: sessionUser.email,
                firstName: sessionUser.firstName || sessionUser.name?.split(' ')[0] || '',
                lastName: sessionUser.lastName || sessionUser.name?.split(' ').slice(1).join(' ') || '',
                phone: sessionUser.phone,
                avatarUrl: sessionUser.picture,
                status: 'ACTIVE',
                customerType: 'RETAIL',
                totalOrders: 0,
                totalSpent: 0,
                marketingOptIn: false,
                emailVerified: true,
                createdAt: new Date().toISOString(),
              });
          }

          // Schedule auto-refresh if session has an expiry
          if (session.expiresAt) {
            const expiresAtMs = session.expiresAt * 1000;
            setExpiresAt(expiresAtMs);
            scheduleRefresh(expiresAtMs);
            console.log('[AuthSessionProvider] Auto-refresh scheduled, session expires at', new Date(expiresAtMs).toISOString());
          }

          // Fetch full customer profile to get additional fields (phone, country, etc.)
          // This runs after login so the store is already populated with basic session data
          fetchCustomerProfile(sessionUser.tenantId).then((profile) => {
            if (profile) {
              updateCustomer({
                phone: profile.phone,
                dateOfBirth: profile.dateOfBirth,
                country: profile.country,
                countryCode: profile.countryCode,
                totalOrders: profile.totalOrders,
                totalSpent: profile.totalSpent,
                ...(profile.firstName && { firstName: profile.firstName }),
                ...(profile.lastName && { lastName: profile.lastName }),
                ...(profile.createdAt && { createdAt: profile.createdAt }),
                ...(profile.avatarUrl && { avatarUrl: profile.avatarUrl }),
              });
            }
          }).catch((err) => {
            console.warn('[AuthSessionProvider] Failed to fetch customer profile:', err);
          });
        } else {
          // No valid server session
          if (isAuthenticated) {
            // Store thinks we're authenticated but server disagrees — clear it
            console.log('[AuthSessionProvider] Session expired, clearing auth state');
            logout();
          }
          // Otherwise, stay anonymous — this is the normal unauthenticated state
        }
      } catch (error) {
        console.error('[AuthSessionProvider] Failed to validate session:', error);
        // On error, if we think we're authenticated, clear the state to be safe
        if (isAuthenticated) {
          console.log('[AuthSessionProvider] Clearing auth state due to session check error');
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, [logout, login, updateCustomer, setLoading, setExpiresAt, isAuthenticated, customer, pathname, scheduleRefresh]);

  return <>{children}</>;
}
