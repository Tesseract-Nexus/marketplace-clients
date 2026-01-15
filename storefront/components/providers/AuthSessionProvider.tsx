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
 * IMPORTANT: The storefront should remain anonymous by default.
 * Users must explicitly log in to be authenticated on the storefront.
 * Admin/staff sessions should NOT automatically log users into the storefront.
 *
 * This ensures:
 * - Storefront is purely anonymous until user chooses to log in
 * - Staff members using admin don't see personal account info on storefront
 * - Clear separation between admin (staff) and storefront (customer) contexts
 */
export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const { logout, isAuthenticated, customer } = useAuthStore();
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    // Only check once on mount
    if (hasCheckedSession.current) return;
    hasCheckedSession.current = true;

    const validateSession = async () => {
      try {
        // STOREFRONT DESIGN: Anonymous by default
        // The storefront should NOT auto-login users from shared sessions.
        // Users must explicitly click "Login" or "Create Account" to authenticate.
        //
        // This is intentional because:
        // 1. Storefronts should be browsable without being logged in
        // 2. Staff members using admin shouldn't see personal data on storefront
        // 3. Shared Keycloak sessions (from admin) shouldn't leak to storefront
        //
        // We only validate existing auth state to clear stale data:

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
        }
        // If not authenticated, do nothing - stay anonymous
        // User must explicitly log in to authenticate on storefront

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
  }, [logout, isAuthenticated, customer]);

  return <>{children}</>;
}
