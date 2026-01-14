import { config } from '../config/app';

const API_BASE = config.api.baseUrl;

export interface SendOtpRequest {
  phone: string;
  countryCode: string;
  method: 'sms' | 'whatsapp';
}

export interface VerifyOtpRequest {
  phone: string;
  countryCode: string;
  otp: string;
}

export interface SocialAuthResponse {
  user: {
    id: string;
    email?: string;
    name?: string;
    avatar?: string;
    provider: 'google' | 'facebook';
    onboardingComplete: boolean;
  };
  token: string;
  isNewUser: boolean;
}

export interface PhoneAuthResponse {
  user: {
    id: string;
    phone: string;
    provider: 'phone' | 'whatsapp';
    onboardingComplete: boolean;
  };
  token: string;
  isNewUser: boolean;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  expiresIn: number; // seconds
}

export const authApi = {
  // Send OTP to phone
  async sendOtp(data: SendOtpRequest): Promise<OtpResponse> {
    const response = await fetch(`${API_BASE}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to send OTP' }));
      throw new Error(error.message || 'Failed to send OTP');
    }

    return response.json();
  },

  // Verify OTP
  async verifyOtp(data: VerifyOtpRequest): Promise<PhoneAuthResponse> {
    const response = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Invalid OTP' }));
      throw new Error(error.message || 'Invalid OTP');
    }

    return response.json();
  },

  // Google OAuth - get auth URL
  getGoogleAuthUrl(): string {
    const redirectUri = typeof window !== 'undefined'
      ? `${window.location.origin}/api/auth/callback/google`
      : '';
    return `${API_BASE}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
  },

  // Facebook OAuth - get auth URL
  getFacebookAuthUrl(): string {
    const redirectUri = typeof window !== 'undefined'
      ? `${window.location.origin}/api/auth/callback/facebook`
      : '';
    return `${API_BASE}/auth/facebook?redirect_uri=${encodeURIComponent(redirectUri)}`;
  },

  // Exchange auth code for token (called after OAuth redirect)
  async exchangeCode(provider: 'google' | 'facebook', code: string): Promise<SocialAuthResponse> {
    const response = await fetch(`${API_BASE}/auth/${provider}/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Authentication failed' }));
      throw new Error(error.message || 'Authentication failed');
    }

    return response.json();
  },

  // Check if user has completed onboarding
  async checkOnboardingStatus(userId: string): Promise<{ complete: boolean; step?: number }> {
    const response = await fetch(`${API_BASE}/users/${userId}/onboarding-status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return { complete: false };
    }

    return response.json();
  },

  // Get current user profile
  async getCurrentUser(token: string): Promise<SocialAuthResponse['user'] | PhoneAuthResponse['user']> {
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }

    return response.json();
  },

  // Logout - redirect to BFF logout endpoint
  logout(): void {
    // BFF handles session cleanup via secure cookies
    window.location.href = '/auth/logout';
  },
};
