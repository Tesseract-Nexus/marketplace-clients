import { ENDPOINTS } from '../constants';

import { apiGet, apiPost } from './client';

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
   * Login with email and password
   * Note: Auth endpoints return data directly, not wrapped in ApiResponse
   */
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiPost<LoginResponse>(ENDPOINTS.AUTH.LOGIN, data);
    // Auth API returns data directly, not wrapped in {data: ...}
    return (response as unknown as LoginResponse);
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiPost<RegisterResponse>(ENDPOINTS.AUTH.REGISTER, data);
    // Auth API returns data directly, not wrapped in {data: ...}
    return (response as unknown as RegisterResponse);
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    await apiPost(ENDPOINTS.AUTH.LOGOUT);
  },

  /**
   * Refresh access token
   */
  refresh: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await apiPost<RefreshTokenResponse>(ENDPOINTS.AUTH.REFRESH, {
      refresh_token: refreshToken,
    });
    // Auth API returns data directly, not wrapped in {data: ...}
    return (response as unknown as RefreshTokenResponse);
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
   * Get current user
   */
  me: async (): Promise<User> => {
    const response = await apiGet<User>(ENDPOINTS.AUTH.ME);
    // Auth API returns data directly, not wrapped in {data: ...}
    return (response as unknown as User);
  },
};
