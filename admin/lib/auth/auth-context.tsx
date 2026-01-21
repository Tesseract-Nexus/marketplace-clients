'use client';

/**
 * Authentication Context and Provider
 *
 * Provides authentication state to the entire application.
 * Uses BFF pattern - no tokens are stored client-side.
 *
 * ENTERPRISE PERFORMANCE OPTIMIZATIONS:
 * - Smart scheduling: Calculates exact time to refresh based on session expiry
 * - Idle detection: Pauses refresh when user is inactive
 * - Network-aware: Skips refresh attempts when offline
 * - Request deduplication: Prevents duplicate in-flight requests
 * - Exponential backoff: Reduces load on failures
 * - Visibility debouncing: Prevents rapid tab-switch API calls
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  getSession,
  refreshSession,
  login as authLogin,
  logout as authLogout,
  logoutAsync,
  isSessionExpiring,
  type SessionUser,
  type SessionResponse,
} from './auth-client';
import { authConfig } from './config';
import { SESSION_CONFIG, IDLE_CONFIG } from '../polling/config';

// =============================================================================
// DEV AUTH BYPASS
// Set NEXT_PUBLIC_DEV_AUTH_BYPASS=true in .env.local to bypass authentication
// This allows local development without running the auth BFF service
// =============================================================================
const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

// Mock session for dev auth bypass mode
const DEV_MOCK_SESSION: SessionResponse = {
  authenticated: true,
  user: {
    id: 'dev-user-001',
    email: 'dev@tesserix.local',
    firstName: 'Dev',
    lastName: 'User',
    displayName: 'Dev User',
    roles: ['owner', 'admin'],
    tenantSlug: 'dev-tenant',
    tenantId: 'dev-tenant-001',
  },
  csrfToken: 'dev-csrf-token',
  expiresAt: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
};

/**
 * Auth context state
 */
interface AuthContextState {
  // State
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  csrfToken: string | null;

  // Actions
  login: (options?: { returnTo?: string; prompt?: 'login' | 'none' }) => void;
  logout: (options?: { returnTo?: string }) => void;
  logoutAsync: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextState | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: React.ReactNode;
  /**
   * Initial session from server-side rendering
   */
  initialSession?: SessionResponse | null;
}

/**
 * Authentication Provider Component
 */
export function AuthProvider({ children, initialSession }: AuthProviderProps) {
  // DEV MODE: Use mock session when auth bypass is enabled
  const effectiveInitialSession = DEV_AUTH_BYPASS ? DEV_MOCK_SESSION : initialSession;

  const [user, setUser] = useState<SessionUser | null>(effectiveInitialSession?.user || null);
  const [isAuthenticated, setIsAuthenticated] = useState(effectiveInitialSession?.authenticated || false);
  const [isLoading, setIsLoading] = useState(!effectiveInitialSession);
  const [error, setError] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(effectiveInitialSession?.csrfToken || null);
  const [expiresAt, setExpiresAt] = useState<number | null>(effectiveInitialSession?.expiresAt || null);

  // Log dev bypass mode on first render
  useEffect(() => {
    if (DEV_AUTH_BYPASS) {
      console.log('[Auth] 🔓 DEV AUTH BYPASS ENABLED - Using mock session');
      console.log('[Auth] Mock user:', DEV_MOCK_SESSION.user?.email);
    }
  }, []);

  // ENTERPRISE: Track state for smart scheduling
  const lastSessionCheckRef = useRef<number>(Date.now());
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef<boolean>(false);
  const consecutiveFailuresRef = useRef<number>(0);
  const isIdleRef = useRef<boolean>(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOnlineRef = useRef<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Configuration
  const MIN_CHECK_INTERVAL_MS = SESSION_CONFIG.VISIBILITY_DEBOUNCE;
  const MAX_CONSECUTIVE_FAILURES = 5;
  const MAX_BACKOFF_MS = 300000; // 5 minutes

  /**
   * Check session and update state
   * ENTERPRISE: Includes request deduplication
   */
  const checkSession = useCallback(async () => {
    // DEV MODE: Skip network call, return mock session
    if (DEV_AUTH_BYPASS) {
      return DEV_MOCK_SESSION;
    }

    // Request deduplication
    if (isRefreshingRef.current) {
      console.log('[Auth] Skipping check - refresh in progress');
      return null;
    }

    // Network check
    if (!isOnlineRef.current) {
      console.log('[Auth] Skipping check - offline');
      return null;
    }

    try {
      lastSessionCheckRef.current = Date.now();
      const session = await getSession();

      setIsAuthenticated(session.authenticated);
      setUser(session.user || null);
      setCsrfToken(session.csrfToken || null);
      setExpiresAt(session.expiresAt || null);
      setError(session.error || null);

      // Reset failures on success
      consecutiveFailuresRef.current = 0;

      return session;
    } catch (err) {
      console.error('[Auth] Session check failed:', err);
      consecutiveFailuresRef.current++;
      setIsAuthenticated(false);
      setUser(null);
      setError(err instanceof Error ? err.message : 'Session check failed');
      return null;
    }
  }, []);

  /**
   * Refresh session with exponential backoff
   * ENTERPRISE: Includes backoff and deduplication
   */
  const handleRefresh = useCallback(async (): Promise<boolean> => {
    // DEV MODE: Skip refresh, always return success
    if (DEV_AUTH_BYPASS) {
      return true;
    }

    // Request deduplication
    if (isRefreshingRef.current) {
      console.log('[Auth] Skipping refresh - already in progress');
      return false;
    }

    // Network check
    if (!isOnlineRef.current) {
      console.log('[Auth] Skipping refresh - offline');
      return false;
    }

    // Idle check - still refresh if close to expiry even when idle
    if (isIdleRef.current && expiresAt) {
      // expiresAt is in SECONDS, convert to ms for comparison
      const timeUntilExpiry = (expiresAt * 1000) - Date.now();
      if (timeUntilExpiry > 60000) { // More than 1 minute left
        console.log('[Auth] Deferring refresh - user idle with time remaining');
        return true; // Return true to not trigger logout
      }
    }

    isRefreshingRef.current = true;

    try {
      const success = await refreshSession();

      if (success) {
        await checkSession();
        consecutiveFailuresRef.current = 0;
      }

      return success;
    } catch {
      consecutiveFailuresRef.current++;
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [checkSession, expiresAt]);

  /**
   * ENTERPRISE: Smart scheduling - schedules refresh at exact time needed
   */
  const scheduleSmartRefresh = useCallback(() => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (!isAuthenticated || !expiresAt) {
      return;
    }

    // expiresAt from server is in SECONDS (Unix timestamp), convert to ms
    const expiresAtMs = expiresAt * 1000;
    const now = Date.now();
    const timeUntilExpiry = expiresAtMs - now;
    const refreshThresholdMs = authConfig.sessionRefreshThreshold * 1000;

    // Calculate when to refresh (threshold before expiry)
    let timeUntilRefresh = timeUntilExpiry - refreshThresholdMs;

    // Apply exponential backoff if there have been failures
    if (consecutiveFailuresRef.current > 0) {
      const backoffMs = Math.min(
        1000 * Math.pow(2, consecutiveFailuresRef.current),
        MAX_BACKOFF_MS
      );
      timeUntilRefresh = Math.max(timeUntilRefresh, backoffMs);
      console.log(`[Auth] Backoff applied: ${backoffMs}ms (failures: ${consecutiveFailuresRef.current})`);
    }

    // Ensure we don't schedule in the past
    if (timeUntilRefresh <= 0) {
      // Session is already expiring or expired, refresh immediately
      console.log('[Auth] Session expiring, refreshing now');
      handleRefresh().then(success => {
        if (!success) {
          setIsAuthenticated(false);
          setUser(null);
        }
      });
      return;
    }

    // Cap at reasonable maximum (5 minutes) to ensure periodic checks
    const maxScheduleTime = SESSION_CONFIG.CHECK_INTERVAL;
    const scheduledTime = Math.min(timeUntilRefresh, maxScheduleTime);

    console.log(`[Auth] Smart scheduling: refresh in ${Math.round(scheduledTime / 1000)}s (expiry in ${Math.round(timeUntilExpiry / 1000)}s)`);

    refreshTimerRef.current = setTimeout(async () => {
      if (isSessionExpiring(expiresAt, authConfig.sessionRefreshThreshold)) {
        const success = await handleRefresh();
        if (!success && consecutiveFailuresRef.current >= MAX_CONSECUTIVE_FAILURES) {
          console.error('[Auth] Max refresh failures reached, logging out');
          setIsAuthenticated(false);
          setUser(null);
          return;
        }
      }
      // Schedule next check
      scheduleSmartRefresh();
    }, scheduledTime);
  }, [isAuthenticated, expiresAt, handleRefresh]);

  /**
   * ENTERPRISE: Idle detection setup
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const resetIdleTimer = () => {
      if (isIdleRef.current) {
        isIdleRef.current = false;
        console.log('[Auth] User active');
        // Reschedule refresh when user becomes active
        if (isAuthenticated) {
          scheduleSmartRefresh();
        }
      }

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = setTimeout(() => {
        isIdleRef.current = true;
        console.log('[Auth] User idle');
      }, IDLE_CONFIG.TIMEOUT);
    };

    // Set up activity listeners
    const events = IDLE_CONFIG.ACTIVITY_EVENTS;
    events.forEach(event => {
      window.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Initial idle timer
    resetIdleTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetIdleTimer);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [isAuthenticated, scheduleSmartRefresh]);

  /**
   * ENTERPRISE: Network status detection
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      isOnlineRef.current = true;
      console.log('[Auth] Network online');
      // Reschedule refresh when coming back online
      if (isAuthenticated) {
        scheduleSmartRefresh();
      }
    };

    const handleOffline = () => {
      isOnlineRef.current = false;
      console.log('[Auth] Network offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAuthenticated, scheduleSmartRefresh]);

  /**
   * Initial session check
   */
  useEffect(() => {
    // DEV MODE: Skip initial session check - we already have mock session
    if (DEV_AUTH_BYPASS) {
      return;
    }
    if (!initialSession) {
      setIsLoading(true);
      checkSession().finally(() => setIsLoading(false));
    }
  }, [initialSession, checkSession]);

  /**
   * ENTERPRISE: Smart refresh scheduling
   * Replaces fixed interval with precise scheduling based on session expiry
   */
  useEffect(() => {
    if (!isAuthenticated) {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    scheduleSmartRefresh();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [isAuthenticated, expiresAt, scheduleSmartRefresh]);

  /**
   * Handle visibility change - check session when tab becomes visible
   * ENTERPRISE: Includes debouncing and network/idle checks
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        const now = Date.now();
        const timeSinceLastCheck = now - lastSessionCheckRef.current;

        // Debounce: Only check if enough time has passed
        if (timeSinceLastCheck >= MIN_CHECK_INTERVAL_MS) {
          // Network check
          if (!isOnlineRef.current) {
            console.log('[Auth] Tab visible but offline, skipping check');
            return;
          }

          console.log('[Auth] Tab visible, checking session');
          checkSession();
        } else {
          console.log(`[Auth] Tab visible but debounced (${Math.round((MIN_CHECK_INTERVAL_MS - timeSinceLastCheck) / 1000)}s remaining)`);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, checkSession, MIN_CHECK_INTERVAL_MS]);

  /**
   * Login action
   */
  const login = useCallback((options?: { returnTo?: string; prompt?: 'login' | 'none' }) => {
    authLogin(options);
  }, []);

  /**
   * Logout action
   */
  const logout = useCallback((options?: { returnTo?: string }) => {
    authLogout(options);
  }, []);

  /**
   * Async logout action
   */
  const handleLogoutAsync = useCallback(async () => {
    await logoutAsync();
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Context value
   */
  const value = useMemo<AuthContextState>(() => ({
    user,
    isAuthenticated,
    isLoading,
    error,
    csrfToken,
    login,
    logout,
    logoutAsync: handleLogoutAsync,
    refreshSession: handleRefresh,
    clearError,
  }), [
    user,
    isAuthenticated,
    isLoading,
    error,
    csrfToken,
    login,
    logout,
    handleLogoutAsync,
    handleRefresh,
    clearError,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth(): AuthContextState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to get current user
 */
export function useUser(): SessionUser | null {
  const { user } = useAuth();
  return user;
}

/**
 * Hook to check if authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Hook to get CSRF token
 */
export function useCsrfToken(): string | null {
  const { csrfToken } = useAuth();
  return csrfToken;
}

/**
 * Hook to check if user has specific role(s)
 */
export function useHasRole(role: string | string[]): boolean {
  const { user } = useAuth();

  if (!user) {
    return false;
  }

  const roles = Array.isArray(role) ? role : [role];
  return roles.some(r => user.roles.includes(r));
}

/**
 * Hook to check if user has specific permission
 * This could be extended to check granular permissions
 */
export function useHasPermission(permission: string): boolean {
  const { user } = useAuth();

  if (!user) {
    return false;
  }

  // For now, check if user has admin or the specific role
  return user.roles.includes('admin') || user.roles.includes(permission);
}

export default AuthProvider;
