/**
 * Authentication Module
 *
 * BFF-based authentication for the admin dashboard using Keycloak OIDC.
 */

// Configuration
export { authConfig, PUBLIC_PATHS, isPublicPath } from './config';
export type { default as AuthConfig } from './config';

// Auth client functions
export {
  getSession,
  getCsrfToken,
  refreshSession,
  login,
  logout,
  logoutAsync,
  isSessionExpiring,
  AuthError,
} from './auth-client';
export type { SessionUser, SessionResponse } from './auth-client';

// React context and hooks
export {
  AuthProvider,
  useAuth,
  useUser,
  useIsAuthenticated,
  useCsrfToken,
  useHasRole,
  useHasPermission,
} from './auth-context';
