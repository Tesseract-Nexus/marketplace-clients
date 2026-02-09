/**
 * CSRF Token Hook + Global Fetch Interceptor
 *
 * CsrfTokenInitializer pre-fetches the CSRF token on mount and installs a
 * global fetch interceptor that automatically attaches X-CSRF-Token to all
 * mutation requests (POST/PUT/PATCH/DELETE). This means zero changes needed
 * to existing API modules.
 *
 * The interceptor also auto-retries once on 403 CSRF_VALIDATION_FAILED
 * (e.g., after token expiry) by fetching a fresh token.
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

const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

export function useCsrfToken(): UseCsrfTokenResult {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let csrfToken = getCsrfTokenFromCookie();

      if (!csrfToken) {
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
 * Provider component that initializes CSRF token and installs fetch interceptor.
 * Place inside QueryProvider, before TenantProvider.
 */
export function CsrfTokenInitializer({ children }: { children: React.ReactNode }) {
  const { error } = useCsrfToken();

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const method = (init?.method || 'GET').toUpperCase();

      // Attach CSRF token to mutation requests
      if (MUTATION_METHODS.includes(method)) {
        const token = getCsrfTokenFromCookie();
        if (token) {
          const headers = new Headers(init?.headers);
          if (!headers.has('X-CSRF-Token')) {
            headers.set('X-CSRF-Token', token);
          }
          init = { ...init, headers };
        }
      }

      const response = await originalFetch.call(window, input, init);

      // Auto-retry once on CSRF token expiry
      if (response.status === 403) {
        const body = await response.clone().json().catch(() => null);
        if (body?.error?.code === 'CSRF_VALIDATION_FAILED') {
          // Fetch fresh token using originalFetch to avoid interceptor loop
          try {
            const csrfResponse = await originalFetch.call(window, '/api/csrf', {
              method: 'GET',
              credentials: 'include',
            });
            if (csrfResponse.ok) {
              const data = await csrfResponse.json();
              const newToken = data.data?.token;
              if (newToken) {
                const headers = new Headers(init?.headers);
                headers.set('X-CSRF-Token', newToken);
                return originalFetch.call(window, input, { ...init, headers });
              }
            }
          } catch {
            // Retry failed — return original 403 response
          }
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  if (error && process.env.NODE_ENV === 'development') {
    console.warn('[CSRF] Token initialization warning:', error);
  }

  return <>{children}</>;
}
