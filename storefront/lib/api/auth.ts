import { Customer } from '@/store/auth';

/**
 * Customer Authentication API
 *
 * This module provides authentication functions for storefront customers.
 * Authentication is handled by auth-bff which integrates with Keycloak's
 * customer realm (mark8ly-customer).
 *
 * Auth Flow:
 * 1. Customer clicks login -> redirect to /auth/login
 * 2. auth-bff redirects to Keycloak login page
 * 3. Customer authenticates
 * 4. Keycloak redirects back to /auth/callback
 * 5. auth-bff creates session cookie and redirects to returnTo URL
 * 6. Storefront uses /auth/session to get customer info
 *
 * For social login, use: /auth/login?kc_idp_hint=google (or facebook, apple)
 */

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  marketingOptIn?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    customer: Customer;
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  };
  message?: string;
}

export interface AuthError {
  success: false;
  error: string;
  code?: string;
}

/**
 * Session response from auth-bff /auth/session endpoint
 */
export interface SessionResponse {
  authenticated: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    tenantId?: string;
    tenantSlug?: string;
    roles?: string[];
  };
  expiresAt?: number;
  csrfToken?: string;
  error?: string;
}

/**
 * Get current session from auth-bff.
 * This checks if the user is authenticated via session cookie.
 */
export async function getSession(): Promise<SessionResponse> {
  try {
    const response = await fetch('/auth/session', {
      credentials: 'include',
    });

    if (!response.ok) {
      return { authenticated: false };
    }

    return response.json();
  } catch {
    return { authenticated: false };
  }
}

/**
 * Login options for initiateLogin
 */
export interface LoginOptions {
  /** URL to return to after successful login */
  returnTo?: string;
  /** Social login provider hint (google, facebook, apple, instagram) - skips Keycloak login page */
  provider?: 'google' | 'facebook' | 'apple' | 'instagram' | string;
  /** Pre-fill email in the login form */
  loginHint?: string;
  /** Tenant ID for multi-tenant authentication */
  tenantId?: string;
  /** Tenant slug for multi-tenant authentication */
  tenantSlug?: string;
}

/**
 * Registration options for initiateRegistration
 */
export interface RegistrationOptions {
  /** URL to return to after successful registration */
  returnTo?: string;
  /** Pre-fill email in the registration form */
  email?: string;
  /** Pre-fill first name */
  firstName?: string;
  /** Pre-fill last name */
  lastName?: string;
  /** Social login provider for registration (google, facebook, apple, instagram) */
  provider?: 'google' | 'facebook' | 'apple' | 'instagram' | string;
  /** Tenant ID for multi-tenant authentication */
  tenantId?: string;
  /** Tenant slug for multi-tenant authentication */
  tenantSlug?: string;
}

/**
 * Forgot password options
 */
export interface ForgotPasswordOptions {
  /** URL to return to after password reset */
  returnTo?: string;
  /** Pre-fill email in the reset form */
  email?: string;
  /** Tenant ID for multi-tenant authentication */
  tenantId?: string;
  /** Tenant slug for multi-tenant authentication */
  tenantSlug?: string;
}

/**
 * Initiate OIDC login flow by redirecting to auth-bff.
 * This will redirect the user to Keycloak for authentication.
 *
 * @param returnTo - URL to return to after successful login (or options object)
 * @param provider - Optional social login provider hint (google, facebook, apple, instagram)
 */
export function initiateLogin(
  returnTo: string | LoginOptions = '/account',
  provider?: string
): void {
  const params = new URLSearchParams();

  // Handle both simple (returnTo, provider) and options object format
  if (typeof returnTo === 'object') {
    const options = returnTo;
    params.set('returnTo', options.returnTo || '/account');

    if (options.provider) {
      params.set('kc_idp_hint', options.provider);
    }

    if (options.loginHint) {
      params.set('login_hint', options.loginHint);
    }

    // Pass tenant context for multi-tenant authentication
    // This ensures the session is scoped to this specific tenant
    if (options.tenantId) {
      params.set('tenant_id', options.tenantId);
    }
    if (options.tenantSlug) {
      params.set('tenant_slug', options.tenantSlug);
    }
  } else {
    params.set('returnTo', returnTo);

    // Use kc_idp_hint for social login (skips Keycloak login page)
    if (provider) {
      params.set('kc_idp_hint', provider);
    }
  }

  window.location.href = `/auth/login?${params.toString()}`;
}

/**
 * Initiate registration flow by redirecting to Keycloak registration.
 * This requires Keycloak to have registration enabled on the customer realm.
 *
 * @param returnTo - URL to return to after successful registration (or options object)
 */
export function initiateRegistration(
  returnTo: string | RegistrationOptions = '/account'
): void {
  const params = new URLSearchParams();

  // Handle both simple (returnTo) and options object format
  if (typeof returnTo === 'object') {
    const options = returnTo;
    params.set('returnTo', options.returnTo || '/account');

    // Pre-fill registration form fields
    if (options.email) {
      params.set('login_hint', options.email);
    }

    if (options.firstName) {
      params.set('first_name', options.firstName);
    }

    if (options.lastName) {
      params.set('last_name', options.lastName);
    }

    // Social registration - redirect directly to provider
    if (options.provider) {
      params.set('kc_idp_hint', options.provider);
    }

    // Pass tenant context for multi-tenant authentication
    if (options.tenantId) {
      params.set('tenant_id', options.tenantId);
    }
    if (options.tenantSlug) {
      params.set('tenant_slug', options.tenantSlug);
    }
  } else {
    params.set('returnTo', returnTo);
  }

  // Use kc_action=register to go directly to registration page (if Keycloak supports it)
  // This is a Keycloak-specific parameter that triggers the registration flow
  params.set('kc_action', 'register');

  window.location.href = `/auth/login?${params.toString()}`;
}

/**
 * Initiate forgot password flow by redirecting to Keycloak.
 * This will trigger Keycloak's reset credentials flow.
 *
 * @param options - Options for forgot password (or just returnTo string)
 */
export function initiateForgotPassword(
  options: string | ForgotPasswordOptions = '/login'
): void {
  const params = new URLSearchParams();

  // Handle both simple (returnTo) and options object format
  if (typeof options === 'object') {
    params.set('returnTo', options.returnTo || '/login');

    // Pre-fill email in the reset form
    if (options.email) {
      params.set('login_hint', options.email);
    }

    // Pass tenant context for multi-tenant authentication
    if (options.tenantId) {
      params.set('tenant_id', options.tenantId);
    }
    if (options.tenantSlug) {
      params.set('tenant_slug', options.tenantSlug);
    }
  } else {
    params.set('returnTo', options);
  }

  // Use kc_action to trigger Keycloak's reset credentials flow
  // This tells Keycloak to show the forgot password / reset credentials page
  params.set('kc_action', 'UPDATE_PASSWORD');

  window.location.href = `/auth/login?${params.toString()}`;
}

/**
 * Logout the current user.
 * This clears the session cookie via auth-bff.
 */
export async function logout(): Promise<void> {
  try {
    // Call auth-bff logout endpoint
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
}

/**
 * Refresh the current session tokens.
 * Auth-bff handles token refresh automatically, but this can force a refresh.
 */
export async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get CSRF token for protected actions.
 * Some operations may require a CSRF token for security.
 */
export async function getCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch('/auth/csrf', {
      credentials: 'include',
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

// ============================================================================
// DIRECT AUTHENTICATION (Custom UI with Keycloak backend)
// These functions allow custom login/register forms without redirecting to Keycloak UI
// ============================================================================

/**
 * Response from direct login/register endpoints
 */
export interface DirectAuthResponse {
  success: boolean;
  authenticated?: boolean;
  registered?: boolean; // true if user was newly registered
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
    csrf_token?: string;
  };
  // MFA response
  mfa_required?: boolean;
  mfa_session?: string;
  mfa_methods?: string[];
  // Error response
  error?: string;
  message?: string;
  remaining_attempts?: number;
  locked_until?: string;
}

/**
 * Direct login with email/password (custom UI, no Keycloak redirect)
 * Uses auth-bff's direct auth flow which validates against Keycloak internally.
 *
 * @param email - User's email address
 * @param password - User's password
 * @param tenantSlug - Tenant slug (e.g., 'demo-store')
 * @param options - Additional options (rememberMe)
 */
export async function directLogin(
  email: string,
  password: string,
  tenantSlug: string,
  options?: { rememberMe?: boolean }
): Promise<DirectAuthResponse> {
  try {
    const response = await fetch('/auth/direct/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
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
      };
    }

    // Handle account locked
    if (response.status === 423) {
      return {
        success: false,
        error: 'ACCOUNT_LOCKED',
        message: data.message || 'Your account has been temporarily locked.',
        locked_until: data.locked_until,
      };
    }

    // Handle invalid credentials
    if (response.status === 401) {
      return {
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: data.message || 'Invalid email or password.',
        remaining_attempts: data.remaining_attempts,
      };
    }

    // Handle service unavailable
    if (response.status === 503) {
      return {
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'Authentication service is temporarily unavailable. Please try again later.',
      };
    }

    // Handle success or MFA required
    return data;
  } catch (error) {
    console.error('Direct login error:', error);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Unable to connect to authentication service. Please check your connection.',
    };
  }
}

/**
 * Direct registration with email/password (custom UI, no Keycloak redirect)
 * Uses auth-bff's direct registration flow.
 *
 * @param email - User's email address
 * @param password - User's password
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param tenantSlug - Tenant slug (e.g., 'demo-store')
 * @param phone - Optional phone number
 * @param country - Optional country name (e.g., "Australia")
 * @param countryCode - Optional ISO 2-letter country code (e.g., "AU")
 */
export async function directRegister(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  tenantSlug: string,
  phone?: string,
  country?: string,
  countryCode?: string
): Promise<DirectAuthResponse> {
  try {
    const response = await fetch('/auth/direct/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        tenant_slug: tenantSlug,
        phone: phone || undefined,
        country: country || undefined,
        country_code: countryCode || undefined,
      }),
    });

    const data = await response.json();

    // Handle user already exists
    if (response.status === 409) {
      return {
        success: false,
        error: 'USER_EXISTS',
        message: data.message || 'An account with this email already exists.',
      };
    }

    // Handle validation errors
    if (response.status === 400) {
      return {
        success: false,
        error: 'VALIDATION_ERROR',
        message: data.message || 'Please check your registration details.',
      };
    }

    // Handle service unavailable
    if (response.status === 503) {
      return {
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: 'Registration service is temporarily unavailable. Please try again later.',
      };
    }

    return data;
  } catch (error) {
    console.error('Direct registration error:', error);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Unable to connect to registration service. Please check your connection.',
    };
  }
}

/**
 * Verify MFA code after direct login
 *
 * @param mfaSession - MFA session ID from login response
 * @param code - MFA verification code
 * @param method - MFA method (totp, email, sms)
 */
export async function verifyMfa(
  mfaSession: string,
  code: string,
  method: 'totp' | 'email' | 'sms' = 'totp'
): Promise<DirectAuthResponse> {
  try {
    const response = await fetch('/auth/direct/mfa/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        mfa_session: mfaSession,
        code,
        method,
      }),
    });

    return response.json();
  } catch (error) {
    console.error('MFA verification error:', error);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Unable to verify MFA code. Please try again.',
    };
  }
}

// ============================================================================
// ACCOUNT DEACTIVATION
// ============================================================================

/**
 * Response from account deactivation check
 */
export interface CheckDeactivatedResponse {
  success: boolean;
  is_deactivated: boolean;
  can_reactivate: boolean;
  days_until_purge?: number;
  deactivated_at?: string;
  purge_date?: string;
  error?: string;
  message?: string;
}

/**
 * Response from account deactivation
 */
export interface DeactivateAccountResponse {
  success: boolean;
  deactivated_at?: string;
  scheduled_purge_at?: string;
  days_until_purge?: number;
  message?: string;
  error?: string;
}

/**
 * Response from account reactivation
 */
export interface ReactivateAccountResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Check if an account is deactivated (used during login flow)
 *
 * @param email - User's email address
 * @param tenantSlug - Tenant slug (e.g., 'demo-store')
 */
export async function checkDeactivatedAccount(
  email: string,
  tenantSlug: string
): Promise<CheckDeactivatedResponse> {
  try {
    const response = await fetch('/auth/direct/check-deactivated', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        tenant_slug: tenantSlug,
      }),
    });

    return response.json();
  } catch (error) {
    console.error('Check deactivated error:', error);
    return {
      success: false,
      is_deactivated: false,
      can_reactivate: false,
      error: 'NETWORK_ERROR',
      message: 'Unable to check account status. Please try again.',
    };
  }
}

/**
 * Deactivate the current user's account (self-service)
 * User must be logged in. After deactivation, session is destroyed.
 *
 * @param reason - Optional reason for deactivation
 */
export async function deactivateAccount(
  reason?: string
): Promise<DeactivateAccountResponse> {
  try {
    const response = await fetch('/auth/direct/deactivate-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        reason: reason || 'self_service',
      }),
    });

    // Check for auth errors first
    if (response.status === 401) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'You must be logged in to deactivate your account.',
      };
    }

    // Try to parse the response
    let data;
    try {
      data = await response.json();
    } catch {
      // If we can't parse JSON but the response was successful (2xx), treat as success
      if (response.ok) {
        return {
          success: true,
          message: 'Your account has been deactivated.',
        };
      }
      throw new Error('Invalid response from server');
    }

    // Handle non-OK responses with error data
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'DEACTIVATION_FAILED',
        message: data.message || 'Failed to deactivate account. Please try again.',
      };
    }

    return data;
  } catch (error) {
    console.error('Deactivate account error:', error);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Unable to deactivate account. Please try again.',
    };
  }
}

/**
 * Reactivate a deactivated account within the 90-day retention period
 *
 * @param email - User's email address
 * @param password - User's password (for verification)
 * @param tenantSlug - Tenant slug (e.g., 'demo-store')
 */
export async function reactivateAccount(
  email: string,
  password: string,
  tenantSlug: string
): Promise<ReactivateAccountResponse> {
  try {
    const response = await fetch('/auth/direct/reactivate-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        password,
        tenant_slug: tenantSlug,
      }),
    });

    const data = await response.json();

    if (response.status === 401) {
      return {
        success: false,
        error: 'INVALID_PASSWORD',
        message: 'Invalid password. Please try again.',
      };
    }

    if (response.status === 410) {
      return {
        success: false,
        error: 'CANNOT_REACTIVATE',
        message: 'Account cannot be reactivated. The retention period has expired.',
      };
    }

    if (response.status === 429) {
      return {
        success: false,
        error: 'RATE_LIMITED',
        message: 'Too many attempts. Please try again later.',
      };
    }

    return data;
  } catch (error) {
    console.error('Reactivate account error:', error);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Unable to reactivate account. Please try again.',
    };
  }
}

// ============================================================================
// PASSWORD RESET (Direct auth flow)
// ============================================================================

/**
 * Response from password reset request
 */
export interface RequestPasswordResetResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Response from reset token validation
 */
export interface ValidateResetTokenResponse {
  success: boolean;
  valid: boolean;
  email?: string;
  expires_at?: string;
  message?: string;
  error?: string;
}

/**
 * Response from password reset
 */
export interface ResetPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Request a password reset email
 * Always returns success to not reveal if email exists (security best practice)
 *
 * @param email - User's email address
 * @param tenantSlug - Tenant slug (e.g., 'demo-store')
 */
export async function directRequestPasswordReset(
  email: string,
  tenantSlug: string
): Promise<RequestPasswordResetResponse> {
  try {
    const response = await fetch('/auth/direct/request-password-reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email,
        tenant_slug: tenantSlug,
      }),
    });

    return response.json();
  } catch (error) {
    console.error('Password reset request error:', error);
    // Return success to not reveal if email exists
    return {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link shortly.',
    };
  }
}

/**
 * Validate a password reset token
 * Returns whether the token is valid and the masked email
 *
 * @param token - Reset token from email link
 */
export async function directValidateResetToken(
  token: string
): Promise<ValidateResetTokenResponse> {
  try {
    const response = await fetch('/auth/direct/validate-reset-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ token }),
    });

    return response.json();
  } catch (error) {
    console.error('Reset token validation error:', error);
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
 *
 * @param token - Reset token from email link
 * @param newPassword - New password to set
 */
export async function directResetPassword(
  token: string,
  newPassword: string
): Promise<ResetPasswordResponse> {
  try {
    const response = await fetch('/auth/direct/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        token,
        new_password: newPassword,
      }),
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
    console.error('Password reset error:', error);
    return {
      success: false,
      error: 'NETWORK_ERROR',
      message: 'Unable to reset password. Please try again.',
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
    const response = await fetch('/auth/totp/status', {
      credentials: 'include',
    });
    return await response.json();
  } catch {
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
    const response = await fetch('/auth/totp/setup/initiate', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return await response.json();
  } catch {
    return { success: false, message: 'Failed to start TOTP setup' };
  }
}

export async function confirmTotpSetup(
  setupSession: string,
  code: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch('/auth/totp/setup/confirm', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ setup_session: setupSession, code }),
    });
    return await response.json();
  } catch {
    return { success: false, message: 'Failed to confirm TOTP setup' };
  }
}

export async function disableTotp(code: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch('/auth/totp/disable', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    return await response.json();
  } catch {
    return { success: false, message: 'Failed to disable TOTP' };
  }
}

export async function regenerateBackupCodes(code: string): Promise<{
  success: boolean;
  backup_codes?: string[];
  message?: string;
}> {
  try {
    const response = await fetch('/auth/totp/backup-codes/regenerate', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    return await response.json();
  } catch {
    return { success: false, message: 'Failed to regenerate backup codes' };
  }
}

// ============================================================================
// DEPRECATED: The following functions are kept for backwards compatibility
// but will not work as the underlying endpoints have been removed.
// Use the OIDC-based functions above instead.
// ============================================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * @deprecated Use initiateRegistration() instead.
 * This endpoint has been removed (returns 410 Gone).
 */
export async function register(
  tenantId: string,
  storefrontId: string,
  data: RegisterRequest
): Promise<AuthResponse> {
  console.warn(
    'register() is deprecated. The local auth endpoint has been removed.',
    'Use initiateRegistration() for OIDC-based registration via Keycloak.'
  );

  const response = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || 'Registration failed. Please use the login page to register.');
  }

  return response.json();
}

/**
 * @deprecated Use initiateLogin() instead.
 * This endpoint has been removed (returns 410 Gone).
 */
export async function login(
  tenantId: string,
  storefrontId: string,
  data: LoginRequest
): Promise<AuthResponse> {
  console.warn(
    'login() is deprecated. The local auth endpoint has been removed.',
    'Use initiateLogin() for OIDC-based login via Keycloak.'
  );

  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || 'Login failed. Please use the Keycloak login page.');
  }

  return response.json();
}

/**
 * @deprecated Profile access should use getSession() and customers-service API.
 */
export async function getProfile(
  tenantId: string,
  storefrontId: string,
  accessToken: string
): Promise<Customer | null> {
  console.warn(
    'getProfile() is deprecated. Use getSession() for authentication status.',
    'For full customer profile, call customers-service API directly.'
  );

  try {
    const response = await fetch(`${API_BASE}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data;
  } catch {
    return null;
  }
}

/**
 * @deprecated Profile updates should go directly to customers-service API.
 */
export async function updateProfile(
  tenantId: string,
  storefrontId: string,
  accessToken: string,
  updates: Partial<Customer>
): Promise<Customer> {
  console.warn(
    'updateProfile() is deprecated.',
    'Use customers-service API directly for profile updates.'
  );

  const response = await fetch(`${API_BASE}/api/auth/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
    body: JSON.stringify(updates),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile');
  }

  const data = await response.json();
  return data.data;
}

/**
 * @deprecated Password changes should go through Keycloak.
 */
export async function changePassword(
  accessToken: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  console.warn(
    'changePassword() is deprecated.',
    'Password changes should be done through Keycloak account management.'
  );

  const response = await fetch(`${API_BASE}/api/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to change password');
  }
}

/**
 * @deprecated Password reset should go through Keycloak.
 */
export async function requestPasswordReset(
  tenantId: string,
  storefrontId: string,
  email: string
): Promise<void> {
  console.warn(
    'requestPasswordReset() is deprecated.',
    'Password reset should be done through Keycloak forgot password flow.'
  );

  const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
      'X-Storefront-ID': storefrontId,
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send reset email');
  }
}

/**
 * @deprecated Password reset should go through Keycloak.
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  console.warn(
    'resetPassword() is deprecated.',
    'Password reset should be done through Keycloak.'
  );

  const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, newPassword }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to reset password');
  }
}
