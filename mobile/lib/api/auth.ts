import { ENDPOINTS } from '../constants';

import { apiGet, apiPost } from './client';
import oidcClient, { getUserInfo, decodeAccessToken } from '../auth/oidc-client';
import { secureStorage } from '../utils/secure-storage';

import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  SetNewPasswordRequest,
  VerifyEmailRequest,
} from '@/types/api';
import type { User } from '@/types/entities';

export const authApi = {
  /**
   * Login with email and password using Keycloak OIDC
   * Uses Resource Owner Password Credentials (ROPC) grant for native login form
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    console.log('[Auth API] Starting login with OIDC...');

    // Authenticate directly with Keycloak using ROPC grant
    const tokens = await oidcClient.directLogin(data.email, data.password);

    // Decode access token to get basic user info
    const claims = decodeAccessToken(tokens.access_token);

    // Get full user info from Keycloak userinfo endpoint
    const userInfo = await getUserInfo(tokens.access_token);

    console.log('[Auth API] Got user info:', userInfo.email, 'sub:', userInfo.sub);

    // Build user object from Keycloak claims
    const user: User = {
      id: userInfo.sub,
      email: userInfo.email || data.email,
      first_name: userInfo.given_name || '',
      last_name: userInfo.family_name || '',
      role: 'customer',
      status: 'active',
      email_verified: userInfo.email_verified || false,
      phone_verified: false,
      two_factor_enabled: false,
      tenant_id: userInfo.tenant_id || claims.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return {
      user,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || '',
      expires_in: tokens.expires_in,
    };
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiPost<RegisterResponse>(ENDPOINTS.AUTH.REGISTER, data);
    // Auth API returns data directly, not wrapped in {data: ...}
    return response as unknown as RegisterResponse;
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    await apiPost(ENDPOINTS.AUTH.LOGOUT);
  },

  /**
   * Refresh access token using Keycloak
   */
  refresh: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    console.log('[Auth API] Refreshing token with OIDC...');
    const tokens = await oidcClient.refreshTokens(refreshToken);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || refreshToken,
      expires_in: tokens.expires_in,
    };
  },

  /**
   * Verify email with code
   */
  verifyEmail: async (data: VerifyEmailRequest): Promise<void> => {
    await apiPost(ENDPOINTS.AUTH.VERIFY_EMAIL, data);
  },

  /**
   * Resend verification email
   */
  resendVerification: async (): Promise<void> => {
    await apiPost(ENDPOINTS.AUTH.RESEND_VERIFICATION);
  },

  /**
   * Request password reset
   */
  forgotPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await apiPost(ENDPOINTS.AUTH.FORGOT_PASSWORD, data);
  },

  /**
   * Reset password with token
   */
  resetPassword: async (data: SetNewPasswordRequest): Promise<void> => {
    await apiPost(ENDPOINTS.AUTH.RESET_PASSWORD, data);
  },

  /**
   * Get current user from Keycloak userinfo
   */
  me: async (): Promise<User> => {
    console.log('[Auth API] Getting user info from OIDC...');

    // Get the stored access token
    const accessToken = await secureStorage.getItem('tesseract_access_token');
    if (!accessToken) {
      throw new Error('No access token available');
    }

    // Get user info from Keycloak
    const userInfo = await getUserInfo(accessToken);
    const claims = decodeAccessToken(accessToken);

    console.log('[Auth API] Got user info:', userInfo.email);

    // Build user object
    const user: User = {
      id: userInfo.sub,
      email: userInfo.email || '',
      first_name: userInfo.given_name || '',
      last_name: userInfo.family_name || '',
      role: 'customer',
      status: 'active',
      email_verified: userInfo.email_verified || false,
      phone_verified: false,
      two_factor_enabled: false,
      tenant_id: userInfo.tenant_id || claims.tenant_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return user;
  },
};
