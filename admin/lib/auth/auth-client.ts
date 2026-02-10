/**
 * Auth Client for BFF Communication
 *
 * Handles client-side authentication operations via the BFF.
 * All actual token management is done server-side in the BFF.
 *
 * Supports two authentication modes:
 * 1. OIDC Flow - Redirect to Keycloak for SSO (legacy)
 * 2. Direct Flow - Email/password with tenant selection (multi-tenant credential isolation)
 */

import { authConfig } from './config';
import { logger } from '../logger';
import { browserSupportsWebAuthn, startRegistration, startAuthentication } from '@simplewebauthn/browser';

/**
 * Session user information returned by BFF
 */
export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  tenantId?: string;
  tenantSlug?: string;
  roles: string[];
}

/**
 * Session response from BFF
 */
export interface SessionResponse {
  authenticated: boolean;
  user?: SessionUser;
  expiresAt?: number;
  csrfToken?: string;
  error?: string;
}

/**
 * Auth error class
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Get current session from BFF
 */
export async function getSession(): Promise<SessionResponse> {
  try {
    const response = await fetch(authConfig.sessionUrl, {
      method: 'GET',
      credentials: 'include', // Include cookies
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { authenticated: false };
      }
      // Handle rate limit - don't throw, just return current state (unknown)
      if (response.status === 429) {
        logger.warn('[Auth] Rate limited - will retry later');
        return { authenticated: false, error: 'rate_limited' };
      }
      throw new AuthError(
        'Failed to get session',
        'session_error',
        response.status
      );
    }

    const data = await response.json();
    return data as SessionResponse;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    // Network error - assume not authenticated
    logger.error('[Auth] Session check failed:', error);
    return { authenticated: false, error: 'network_error' };
  }
}

/**
 * Get CSRF token for protected operations
 */
export async function getCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch(authConfig.csrfUrl, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.csrfToken || null;
  } catch {
    return null;
  }
}

/**
 * Refresh session tokens
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const csrfToken = await getCsrfToken();

    const response = await fetch(authConfig.refreshUrl, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      },
      body: JSON.stringify({}), // Fastify requires body when Content-Type is json
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Initiate login flow
 * Redirects to BFF which handles the Keycloak redirect
 */
export function login(options?: {
  returnTo?: string;
  prompt?: 'login' | 'none';
}): void {
  const params = new URLSearchParams();

  if (options?.returnTo) {
    params.set('returnTo', options.returnTo);
  }
  if (options?.prompt) {
    params.set('prompt', options.prompt);
  }

  const queryString = params.toString();
  const loginUrl = queryString
    ? `${authConfig.loginUrl}?${queryString}`
    : authConfig.loginUrl;

  // Redirect to BFF login endpoint
  window.location.href = loginUrl;
}

/**
 * Initiate logout flow
 * Redirects to BFF which handles Keycloak logout
 */
export function logout(options?: {
  returnTo?: string;
}): void {
  // Unregister push subscription (fire-and-forget)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) {
          fetch('/api/push-token', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ endpoint: sub.endpoint }),
          }).catch(() => {});
          sub.unsubscribe().catch(() => {});
        }
      })
      .catch(() => {});
  }

  const params = new URLSearchParams();

  if (options?.returnTo) {
    params.set('returnTo', options.returnTo);
  }

  const queryString = params.toString();
  const logoutUrl = queryString
    ? `${authConfig.logoutUrl}?${queryString}`
    : authConfig.logoutUrl;

  // Redirect to BFF logout endpoint
  window.location.href = logoutUrl;
}

/**
 * Perform logout via POST (for programmatic logout)
 */
export async function logoutAsync(): Promise<void> {
  const csrfToken = await getCsrfToken();

  const response = await fetch(authConfig.logoutUrl, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    },
  });

  // Logout always succeeds - redirect to home even if API call fails
  if (response.redirected) {
    window.location.href = response.url;
  } else {
    window.location.href = '/';
  }
}

/**
 * Check if session is about to expire
 */
export function isSessionExpiring(expiresAt: number, thresholdSeconds: number = 300): boolean {
  const now = Math.floor(Date.now() / 1000);
  return expiresAt - thresholdSeconds <= now;
}

// =============================================================================
// Direct Authentication (Multi-Tenant Credential Isolation)
// =============================================================================

/**
 * Tenant information for login selection
 */
export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  logo_url?: string;
}

/**
 * Response from tenant lookup
 */
export interface LookupTenantsResponse {
  success: boolean;
  data?: {
    tenants: TenantInfo[];
    count: number;
    single_tenant?: boolean;
  };
  error?: string;
  message?: string;
}

/**
 * Response from direct login
 */
export interface DirectLoginResponse {
  success: boolean;
  authenticated?: boolean;
  mfa_required?: boolean;
  mfa_session?: string;
  mfa_methods?: string[];
  user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    tenant_id: string;
    tenant_slug: string;
    role?: string;
  };
  session?: {
    expires_at: number;
    csrf_token: string;
  };
  error?: string;
  message?: string;
  remaining_attempts?: number;
  locked_until?: string;
  retry_after?: number;
}

/**
 * Response from account status check
 */
export interface AccountStatusResponse {
  success: boolean;
  account_locked: boolean;
  locked_until?: string;
  message?: string;
}

/**
 * Look up available tenants for an email address
 * Used for tenant selection during the login flow
 */
export async function lookupTenants(email: string): Promise<LookupTenantsResponse> {
  try {
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/direct/lookup-tenants`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (response.status === 429) {
      const data = await response.json();
      return {
        success: false,
        error: 'RATE_LIMITED',
        message: data.message || 'Too many requests. Please try again later.',
      };
    }

    const data = await response.json();
    return data as LookupTenantsResponse;
  } catch (error) {
    logger.error('[Auth] Tenant lookup failed:', error);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Unable to connect. Please check your internet connection.',
    };
  }
}

/**
 * Authenticate directly with email, password, and tenant
 * This is the multi-tenant credential isolation login flow
 *
 * For admin portal, uses /auth/direct/admin/login (staff context)
 * For storefront, uses /auth/direct/login (customer context)
 */
export async function directLogin(
  email: string,
  password: string,
  tenantSlug: string,
  options?: {
    rememberMe?: boolean;
  }
): Promise<DirectLoginResponse> {
  try {
    // Admin portal uses staff login endpoint (auth_context: 'staff')
    // This allows staff members to login with their credentials
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/direct/admin/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        tenant_slug: tenantSlug,
        remember_me: options?.rememberMe ?? false,
      }),
    });

    const data = await response.json();

    // Handle rate limiting
    if (response.status === 429) {
      return {
        success: false,
        error: 'RATE_LIMITED',
        message: data.message || 'Too many login attempts. Please try again later.',
        retry_after: data.retry_after,
      };
    }

    // Handle account locked
    if (response.status === 423) {
      return {
        success: false,
        error: 'ACCOUNT_LOCKED',
        message: data.message,
        locked_until: data.locked_until,
      };
    }

    // Handle invalid credentials
    if (response.status === 401) {
      return {
        success: false,
        error: data.error || 'INVALID_CREDENTIALS',
        message: data.message || 'Invalid email or password.',
        remaining_attempts: data.remaining_attempts,
      };
    }

    // Handle service unavailable
    if (response.status === 503) {
      return {
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'Authentication service is temporarily unavailable.',
      };
    }

    // Success
    return data as DirectLoginResponse;
  } catch (error) {
    logger.error('[Auth] Direct login failed:', error);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Unable to connect. Please check your internet connection.',
    };
  }
}

/**
 * Check account status (locked/unlocked) before password entry
 */
export async function checkAccountStatus(
  email: string,
  tenantSlug: string
): Promise<AccountStatusResponse> {
  try {
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/direct/account-status`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, tenant_slug: tenantSlug }),
    });

    const data = await response.json();
    return data as AccountStatusResponse;
  } catch (error) {
    logger.error('[Auth] Account status check failed:', error);
    return {
      success: false,
      account_locked: false,
    };
  }
}

/**
 * Verify MFA code during step-up authentication
 */
export async function verifyMfa(
  mfaSession: string,
  code: string,
  method: 'totp' | 'email' | 'sms' = 'totp',
  trustDevice: boolean = false
): Promise<DirectLoginResponse> {
  try {
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/direct/mfa/verify`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mfa_session: mfaSession,
        code,
        method,
        trust_device: trustDevice,
      }),
    });

    const data = await response.json();
    return data as DirectLoginResponse;
  } catch (error) {
    logger.error('[Auth] MFA verification failed:', error);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Unable to verify. Please try again.',
    };
  }
}

/**
 * Request MFA code to be sent via email or SMS
 */
export async function sendMfaCode(
  mfaSession: string,
  method: 'email' | 'sms'
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/direct/mfa/send-code`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mfa_session: mfaSession,
        method,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('[Auth] MFA code send failed:', error);
    return {
      success: false,
      message: 'Unable to send code. Please try again.',
    };
  }
}

// ============================================================================
// Password Reset & Change Functions
// ============================================================================

/**
 * Request a password reset email
 * Always returns success to not reveal if email exists
 */
export async function directRequestPasswordReset(
  email: string,
  tenantSlug: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/direct/request-password-reset`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, tenant_slug: tenantSlug, context: 'admin' }),
    });

    const data = await response.json();

    // Surface rate limit errors to the UI
    if (response.status === 429) {
      return {
        success: false,
        error: data.error || 'RATE_LIMITED',
        message: data.message || 'Too many password reset requests. Please try again later.',
      };
    }

    return data;
  } catch (error) {
    logger.error('[Auth] Password reset request failed:', error);
    return {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link shortly.',
    };
  }
}

/**
 * Validate a password reset token
 */
export async function directValidateResetToken(
  token: string
): Promise<{ success: boolean; valid: boolean; email?: string; expires_at?: string; message?: string; error?: string }> {
  try {
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/direct/validate-reset-token`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    return response.json();
  } catch (error) {
    logger.error('[Auth] Reset token validation failed:', error);
    return {
      success: false,
      valid: false,
      error: 'NETWORK_ERROR',
      message: 'Unable to validate reset link. Please try again.',
    };
  }
}

/**
 * Reset password using a valid token
 */
export async function directResetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/direct/reset-password`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, new_password: newPassword }),
    });

    const data = await response.json();

    if (response.status === 400) {
      return {
        success: false,
        error: 'INVALID_TOKEN',
        message: data.message || 'Invalid or expired reset link. Please request a new one.',
      };
    }

    return data;
  } catch (error) {
    logger.error('[Auth] Password reset failed:', error);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Unable to reset password. Please try again.',
    };
  }
}

/**
 * Change password for the currently authenticated user
 * Requires a valid session
 */
export async function directChangePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/direct/change-password`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    const data = await response.json();

    if (response.status === 401) {
      return {
        success: false,
        error: data.error || 'INVALID_PASSWORD',
        message: data.message || 'Current password is incorrect.',
      };
    }

    if (response.status === 429) {
      return {
        success: false,
        error: 'RATE_LIMITED',
        message: data.message || 'Too many attempts. Please try again later.',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'CHANGE_PASSWORD_FAILED',
        message: data.message || 'Failed to change password.',
      };
    }

    return data;
  } catch (error) {
    logger.error('[Auth] Change password failed:', error);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Unable to change password. Please try again.',
    };
  }
}

// ============================================================================
// TOTP Authenticator App Functions
// ============================================================================

export async function getTotpStatus(): Promise<{
  success: boolean;
  totp_enabled: boolean;
  backup_codes_remaining: number;
  message?: string;
}> {
  try {
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/totp/status`, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    });
    return await response.json();
  } catch (error) {
    logger.error('[Auth] TOTP status fetch failed:', error);
    return { success: false, totp_enabled: false, backup_codes_remaining: 0, message: 'Failed to check TOTP status' };
  }
}

export async function initiateTotpSetup(): Promise<{
  success: boolean;
  setup_session?: string;
  totp_uri?: string;
  manual_entry_key?: string;
  backup_codes?: string[];
  message?: string;
}> {
  try {
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/totp/setup/initiate`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    return await response.json();
  } catch (error) {
    logger.error('[Auth] TOTP setup initiation failed:', error);
    return { success: false, message: 'Failed to start TOTP setup' };
  }
}

export async function confirmTotpSetup(
  setupSession: string,
  code: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/totp/setup/confirm`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ setup_session: setupSession, code }),
    });
    return await response.json();
  } catch (error) {
    logger.error('[Auth] TOTP setup confirmation failed:', error);
    return { success: false, message: 'Failed to confirm TOTP setup' };
  }
}

export async function disableTotp(code: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/totp/disable`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    return await response.json();
  } catch (error) {
    logger.error('[Auth] TOTP disable failed:', error);
    return { success: false, message: 'Failed to disable TOTP' };
  }
}

export async function regenerateBackupCodes(code: string): Promise<{
  success: boolean;
  backup_codes?: string[];
  message?: string;
}> {
  try {
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/totp/backup-codes/regenerate`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    return await response.json();
  } catch (error) {
    logger.error('[Auth] Backup code regeneration failed:', error);
    return { success: false, message: 'Failed to regenerate backup codes' };
  }
}

// ============================================================================
// Passkey (WebAuthn) Functions
// ============================================================================

export interface PasskeyInfo {
  credential_id: string;
  name: string;
  created_at: string;
  last_used_at?: string;
  device_type: string;
  backed_up: boolean;
}

export function isPasskeySupported(): boolean {
  try {
    return browserSupportsWebAuthn();
  } catch {
    return false;
  }
}

export async function registerPasskey(name: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const optionsRes = await fetch(`${authConfig.bffBaseUrl}/auth/passkeys/registration/options`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!optionsRes.ok) {
      const data = await optionsRes.json();
      return { success: false, error: data.error, message: data.message || 'Failed to get registration options.' };
    }

    const { options, challengeId } = await optionsRes.json();

    const credential = await startRegistration({ optionsJSON: options });

    const verifyRes = await fetch(`${authConfig.bffBaseUrl}/auth/passkeys/registration/verify`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, credential, name }),
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.success) {
      return { success: false, error: verifyData.error, message: verifyData.message || 'Failed to verify passkey.' };
    }

    return { success: true, message: 'Passkey registered successfully.' };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'NotAllowedError') {
      return { success: false, error: 'CANCELLED', message: 'Passkey registration was cancelled.' };
    }
    logger.error('[Auth] Register passkey error:', error);
    return { success: false, error: 'REGISTRATION_ERROR', message: 'Failed to register passkey.' };
  }
}

export async function authenticateWithPasskey(): Promise<DirectLoginResponse> {
  try {
    const optionsRes = await fetch(`${authConfig.bffBaseUrl}/auth/passkeys/authentication/options`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    if (!optionsRes.ok) {
      const data = await optionsRes.json();
      return { success: false, error: data.error, message: data.message || 'Failed to get authentication options.' };
    }

    const { options, challengeId } = await optionsRes.json();

    const credential = await startAuthentication({ optionsJSON: options });

    const verifyRes = await fetch(`${authConfig.bffBaseUrl}/auth/passkeys/authentication/verify`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, credential }),
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.success) {
      return { success: false, error: verifyData.error, message: verifyData.message || 'Passkey authentication failed.' };
    }

    return verifyData;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'NotAllowedError') {
      return {
        success: false,
        error: 'NO_PASSKEY',
        message: 'No passkey found for this site, or the prompt was dismissed. Please register a passkey first from your profile.',
      };
    }
    logger.error('[Auth] Authenticate with passkey error:', error);
    return { success: false, error: 'AUTHENTICATION_ERROR', message: 'Passkey authentication failed.' };
  }
}

export async function getPasskeys(): Promise<{ success: boolean; passkeys: PasskeyInfo[]; message?: string }> {
  try {
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/passkeys/list`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return { success: false, passkeys: [], message: 'Failed to load passkeys.' };
    }

    return response.json();
  } catch {
    return { success: false, passkeys: [], message: 'Failed to load passkeys.' };
  }
}

export async function renamePasskey(
  credentialId: string,
  name: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/passkeys/rename`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential_id: credentialId, name }),
    });

    return response.json();
  } catch {
    return { success: false, message: 'Failed to rename passkey.' };
  }
}

export async function deletePasskey(
  credentialId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${authConfig.bffBaseUrl}/auth/passkeys/delete`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential_id: credentialId }),
    });

    return response.json();
  } catch {
    return { success: false, message: 'Failed to delete passkey.' };
  }
}

export default {
  // Session management
  getSession,
  getCsrfToken,
  refreshSession,
  isSessionExpiring,
  // OIDC flow (legacy)
  login,
  logout,
  logoutAsync,
  // Direct authentication (multi-tenant)
  lookupTenants,
  directLogin,
  checkAccountStatus,
  verifyMfa,
  sendMfaCode,
  // Password reset & change
  directRequestPasswordReset,
  directValidateResetToken,
  directResetPassword,
  directChangePassword,
  // TOTP
  getTotpStatus,
  initiateTotpSetup,
  confirmTotpSetup,
  disableTotp,
  regenerateBackupCodes,
  // Passkeys
  isPasskeySupported,
  registerPasskey,
  authenticateWithPasskey,
  getPasskeys,
  renamePasskey,
  deletePasskey,
};
