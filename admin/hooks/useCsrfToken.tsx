/**
 * CSRF Token Hook
 *
 * Ensures CSRF token is available for the application.
 * Should be used at the app root level to initialize the token.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { getCsrfTokenFromCookie, fetchCsrfToken } from '@/lib/utils/csrf-client';

interface UseCsrfTokenResult {
  token: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage CSRF token lifecycle
 *
 * Usage:
 * ```tsx
 * function App() {
 *   const { isLoading } = useCsrfToken();
 *   if (isLoading) return <Loading />;
 *   return <AppContent />;
 * }
 * ```
 */
export function useCsrfToken(): UseCsrfTokenResult {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First check if we already have a valid token in cookie
      let csrfToken = getCsrfTokenFromCookie();

      if (!csrfToken) {
        // No cookie, fetch a new token
        csrfToken = await fetchCsrfToken();
      }

      if (csrfToken) {
        setToken(csrfToken);
      } else {
        setError('Failed to obtain CSRF token');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch CSRF token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { token, isLoading, error, refresh };
}

/**
 * Provider component that initializes CSRF token
 * Can be used to wrap the app and ensure token is available
 */
export function CsrfTokenInitializer({ children }: { children: React.ReactNode }) {
  const { isLoading, error } = useCsrfToken();

  // Don't block rendering for CSRF - the API client will fetch on-demand if needed
  // This just pre-fetches the token for better UX

  if (error && process.env.NODE_ENV === 'development') {
    console.warn('[CSRF] Token initialization warning:', error);
  }

  return <>{children}</>;
}
