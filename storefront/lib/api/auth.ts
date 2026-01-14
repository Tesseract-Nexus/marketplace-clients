import { Customer } from '@/store/auth';

/**
 * Customer Authentication API
 *
 * This module provides authentication functions for storefront customers.
 * Authentication is handled by auth-bff which integrates with Keycloak's
 * customer realm (tesserix-customer).
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
