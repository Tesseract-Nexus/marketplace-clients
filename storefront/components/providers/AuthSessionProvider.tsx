'use client';

import { useEffect, useRef } from 'react';
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
 * This ensures the storefront auth state is always in sync with Keycloak.
 */
export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const { login, logout, isAuthenticated } = useAuthStore();
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    // Only check once on mount
    if (hasCheckedSession.current) return;
    hasCheckedSession.current = true;

    const validateSession = async () => {
      try {
        const session = await getSession();

        if (session.authenticated && session.user) {
          // User has a valid Keycloak session - sync to local store
          console.log('[AuthSessionProvider] Valid session found, syncing auth state');

          login(
            {
              id: session.user.id,
              email: session.user.email,
              firstName: session.user.firstName || '',
              lastName: session.user.lastName || '',
              status: 'ACTIVE',
              customerType: 'RETAIL',
              totalOrders: 0,
              totalSpent: 0,
              marketingOptIn: false,
              emailVerified: true,
              createdAt: new Date().toISOString(),
            },
            // Note: We don't have the access token here since it's managed by auth-bff
            // The session cookie is used for authentication instead
            ''
          );
        } else if (isAuthenticated) {
          // No valid session but local store thinks user is authenticated
          // This means the session expired or was logged out elsewhere
          console.log('[AuthSessionProvider] No valid session, clearing stale auth state');
          logout();
        }
      } catch (error) {
        console.error('[AuthSessionProvider] Failed to validate session:', error);
        // On error, if we think we're authenticated, clear the state to be safe
        if (isAuthenticated) {
          console.log('[AuthSessionProvider] Clearing auth state due to session check error');
          logout();
        }
      }
    };

    validateSession();
  }, [login, logout, isAuthenticated]);

  return <>{children}</>;
}
