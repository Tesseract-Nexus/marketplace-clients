'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { getSession } from '@/lib/api/auth';

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
  country?: string;
  countryCode?: string;
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
 * AuthSessionProvider - Validates authentication state against auth-bff session
 *
 * This provider runs on mount to:
 * 1. Always check the auth-bff session cookie via /auth/session
 * 2. Sync the local auth store with the actual session state
 * 3. Populate auth store from valid server-side session (survives page refresh)
 * 4. Clear stale auth data if the session is no longer valid
 * 5. Fetch full customer profile (phone, country, etc.) from customers-service
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
  const { logout, login, updateCustomer, setLoading, isAuthenticated, customer } = useAuthStore();
  const hasCheckedSession = useRef(false);

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

          if (isAuthenticated && customer) {
            // Already authenticated in store — verify user matches
            if (customer.id !== sessionUser.id) {
              console.log('[AuthSessionProvider] Session user mismatch, re-syncing auth state');
              login(
                {
                  id: sessionUser.id,
                  email: sessionUser.email,
                  firstName: sessionUser.firstName || sessionUser.name?.split(' ')[0] || '',
                  lastName: sessionUser.lastName || sessionUser.name?.split(' ').slice(1).join(' ') || '',
                  phone: sessionUser.phone,
                  status: 'ACTIVE',
                  customerType: 'RETAIL',
                  totalOrders: 0,
                  totalSpent: 0,
                  marketingOptIn: false,
                  emailVerified: true,
                  createdAt: new Date().toISOString(),
                },
                '' // Token is managed by auth-bff via HttpOnly cookies
              );
            } else {
              console.log('[AuthSessionProvider] Session validated, keeping auth state');
            }
          } else {
            // Not authenticated in store but server has valid session
            // This happens after page refresh (store resets, cookie persists)
            console.log('[AuthSessionProvider] Restoring auth state from server session');
            login(
              {
                id: sessionUser.id,
                email: sessionUser.email,
                firstName: sessionUser.firstName || sessionUser.name?.split(' ')[0] || '',
                lastName: sessionUser.lastName || sessionUser.name?.split(' ').slice(1).join(' ') || '',
                phone: sessionUser.phone,
                status: 'ACTIVE',
                customerType: 'RETAIL',
                totalOrders: 0,
                totalSpent: 0,
                marketingOptIn: false,
                emailVerified: true,
                createdAt: new Date().toISOString(),
              },
              '' // Token is managed by auth-bff via HttpOnly cookies
            );
          }

          // Fetch full customer profile to get additional fields (phone, country, etc.)
          // This runs after login so the store is already populated with basic session data
          fetchCustomerProfile(sessionUser.tenantId).then((profile) => {
            if (profile) {
              updateCustomer({
                phone: profile.phone,
                country: profile.country,
                countryCode: profile.countryCode,
                totalOrders: profile.totalOrders,
                totalSpent: profile.totalSpent,
                ...(profile.firstName && { firstName: profile.firstName }),
                ...(profile.lastName && { lastName: profile.lastName }),
                ...(profile.createdAt && { createdAt: profile.createdAt }),
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
  }, [logout, login, updateCustomer, setLoading, isAuthenticated, customer, pathname]);

  return <>{children}</>;
}
