/**
 * Authentication Configuration
 *
 * BFF-based authentication using Keycloak OIDC.
 * Web apps never store tokens directly - all auth is handled via
 * secure HttpOnly cookies managed by the BFF.
 *
 * PERFORMANCE NOTES:
 * - sessionCheckInterval: How often to check if session needs refresh (5 min)
 * - sessionRefreshThreshold: Start refreshing this many seconds before expiry (5 min)
 * - With 5-minute Keycloak access token expiry (300s), refresh starts at 10 min remaining
 * - The periodic check only makes API calls when session is actually expiring
 * - Visibility change handler provides immediate check when user returns to tab
 */

// Environment-based configuration
const ENVIRONMENT = process.env.NODE_ENV || 'development';

interface AuthConfig {
  // BFF service URLs
  bffBaseUrl: string;
  bffInternalUrl: string;

  // Auth endpoints
  loginUrl: string;
  logoutUrl: string;
  callbackUrl: string;
  sessionUrl: string;
  refreshUrl: string;
  csrfUrl: string;

  // Session settings
  sessionCheckInterval: number; // ms - how often to check if refresh needed
  sessionRefreshThreshold: number; // seconds before expiry to start refreshing

  // Keycloak URLs (for reference/debugging)
  keycloakUrl: string;
  keycloakRealm: string;
}

const configs: Record<string, AuthConfig> = {
  development: {
    bffBaseUrl: 'http://localhost:8080',
    bffInternalUrl: 'http://localhost:8080',
    loginUrl: '/auth/login',
    logoutUrl: '/auth/logout',
    callbackUrl: '/auth/callback',
    sessionUrl: '/auth/session',
    refreshUrl: '/auth/refresh',
    csrfUrl: '/auth/csrf',
    sessionCheckInterval: 300000, // 5 minutes (PERFORMANCE: reduced from 1 min)
    sessionRefreshThreshold: 300, // 5 minutes before expiry
    // Admin dashboard uses INTERNAL realm for staff/admin authentication
    keycloakUrl: 'https://devtest-internal-idp.tesserix.app',
    keycloakRealm: 'tesserix-internal',
  },
  staging: {
    bffBaseUrl: '',
    bffInternalUrl: 'http://auth-bff.identity.svc.cluster.local:8080',
    loginUrl: '/auth/login',
    logoutUrl: '/auth/logout',
    callbackUrl: '/auth/callback',
    sessionUrl: '/auth/session',
    refreshUrl: '/auth/refresh',
    csrfUrl: '/auth/csrf',
    sessionCheckInterval: 300000, // 5 minutes (PERFORMANCE: reduced from 1 min)
    sessionRefreshThreshold: 300, // 5 minutes before expiry
    keycloakUrl: 'https://staging-internal-idp.tesserix.app',
    keycloakRealm: 'tesserix-internal',
  },
  production: {
    bffBaseUrl: '',
    bffInternalUrl: 'http://auth-bff.identity.svc.cluster.local:8080',
    loginUrl: '/auth/login',
    logoutUrl: '/auth/logout',
    callbackUrl: '/auth/callback',
    sessionUrl: '/auth/session',
    refreshUrl: '/auth/refresh',
    csrfUrl: '/auth/csrf',
    sessionCheckInterval: 300000, // 5 minutes (PERFORMANCE: reduced from 1 min)
    sessionRefreshThreshold: 300, // 5 minutes before expiry
    keycloakUrl: 'https://internal-idp.tesserix.app',
    keycloakRealm: 'tesserix-internal',
  },
};

export const authConfig: AuthConfig = configs[ENVIRONMENT] || configs.development;

/**
 * Public paths that don't require authentication
 */
export const PUBLIC_PATHS = [
  '/login',
  '/auth/login',
  '/auth/callback',
  '/auth/logout',
  '/auth/error',
  '/forgot-password',
  '/reset-password',
  '/welcome',
  '/onboarding',
  '/tenant-not-found',
  '/api/health',
  '/_next',
  '/favicon.ico',
];

/**
 * Check if a path is public (doesn't require auth)
 */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

export default authConfig;
