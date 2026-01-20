'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { getSession } from '@/lib/api/auth';

interface AuthSessionProviderProps {
  children: React.ReactNode;
}

/**
 * AuthSessionProvider - Validates authentication state against auth-bff session
 *
 * This provider runs on mount to:
 * 1. Check the auth-bff session cookie via /auth/session
 * 2. Sync the local auth store with the actual session state
 * 3. Clear stale auth data if the session is no longer valid
 *
 * For protected routes (/account/*), it will also populate the auth store
 * from a valid session cookie (for OAuth callback flows).
 *
 * This ensures:
 * - Storefront is browsable without being logged in
 * - OAuth callbacks properly populate auth state
 * - Clear separation between admin (staff) and storefront (customer) contexts
 */
export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const pathname = usePathname();
  const { logout, login, setLoading, isAuthenticated, customer } = useAuthStore();
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    // Only check once on mount
    if (hasCheckedSession.current) return;
    hasCheckedSession.current = true;

    const validateSession = async () => {
      try {
        // Check if we're on a protected route that requires auth
        const isProtectedRoute = pathname?.startsWith('/account');

        if (isAuthenticated && customer) {
          // User thinks they're logged in - verify the session is still valid
          const session = await getSession();

          if (!session.authenticated || !session.user) {
            // Session expired or was logged out elsewhere
            console.log('[AuthSessionProvider] Session expired, clearing auth state');
            logout();
            return;
          }

          // Check if session user matches stored customer
          if (session.user.id !== customer.id) {
            // Different user - this shouldn't happen, clear state
            console.log('[AuthSessionProvider] Session user mismatch, clearing auth state');
            logout();
            return;
          }

          // Session is valid and matches - keep the auth state
          console.log('[AuthSessionProvider] Session validated, keeping auth state');
        } else if (isProtectedRoute) {
          // Not authenticated but on a protected route (e.g., after OAuth callback)
          // Check if there's a valid session from OAuth
          setLoading(true);
          const session = await getSession();

          if (session.authenticated && session.user) {
            // Valid session exists - populate auth store
            console.log('[AuthSessionProvider] Found valid session after OAuth, populating auth store');
            const sessionUser = session.user;
            login(
              {
                id: sessionUser.id,
                email: sessionUser.email,
                firstName: sessionUser.firstName || sessionUser.name?.split(' ')[0] || '',
                lastName: sessionUser.lastName || sessionUser.name?.split(' ').slice(1).join(' ') || '',
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
          setLoading(false);
        }
        // If not authenticated and not on protected route, stay anonymous

      } catch (error) {
        console.error('[AuthSessionProvider] Failed to validate session:', error);
        // On error, if we think we're authenticated, clear the state to be safe
        if (isAuthenticated) {
          console.log('[AuthSessionProvider] Clearing auth state due to session check error');
          logout();
        }
        setLoading(false);
      }
    };

    validateSession();
  }, [logout, login, setLoading, isAuthenticated, customer, pathname]);

  return <>{children}</>;
}
