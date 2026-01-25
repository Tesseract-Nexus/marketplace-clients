/**
 * OTP API Client
 *
 * Handles communication with the verification service for email OTP verification
 */

import { getAuthBffUrl } from './auth';

export interface SendOTPRequest {
  email: string;
  purpose: 'customer_email_verification';
  businessName?: string;
  tenantSlug?: string;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    recipient: string;
    channel: string;
    purpose: string;
    expiresAt: string;
    expiresIn: number; // seconds
  };
  error?: string;
}

export interface VerifyOTPRequest {
  email: string;
  code: string;
  purpose: 'customer_email_verification';
}

export interface VerifyOTPResponse {
  success: boolean;
  verified: boolean;
  message: string;
  data?: {
    verifiedAt: string;
    sessionId?: string;
  };
  error?: string;
  remainingAttempts?: number;
}

export interface OTPStatusResponse {
  success: boolean;
  data: {
    recipient: string;
    purpose: string;
    isVerified: boolean;
    verifiedAt?: string;
    pendingCode: boolean;
    expiresAt?: string;
    canResend: boolean;
    attemptsLeft: number;
  };
}

/**
 * Send OTP to customer email
 */
export async function sendOTP(request: SendOTPRequest): Promise<SendOTPResponse> {
  const authBffUrl = getAuthBffUrl();

  try {
    const response = await fetch(`${authBffUrl}/auth/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: request.email,
        channel: 'email',
        purpose: request.purpose,
        metadata: {
          businessName: request.businessName,
          tenantSlug: request.tenantSlug,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to send verification code',
        error: data.error || 'SEND_FAILED',
      };
    }

    return {
      success: true,
      message: data.message || 'Verification code sent successfully',
      data: data.data,
    };
  } catch (error) {
    console.error('Send OTP error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
      error: 'NETWORK_ERROR',
    };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOTP(request: VerifyOTPRequest): Promise<VerifyOTPResponse> {
  const authBffUrl = getAuthBffUrl();

  try {
    const response = await fetch(`${authBffUrl}/auth/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: request.email,
        code: request.code,
        purpose: request.purpose,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        verified: false,
        message: data.message || 'Invalid verification code',
        error: data.error,
        remainingAttempts: data.remainingAttempts,
      };
    }

    return {
      success: true,
      verified: data.data?.verified || data.verified || false,
      message: data.message || 'Verification successful',
      data: data.data,
    };
  } catch (error) {
    console.error('Verify OTP error:', error);
    return {
      success: false,
      verified: false,
      message: 'Network error. Please try again.',
      error: 'NETWORK_ERROR',
    };
  }
}

/**
 * Resend OTP code
 */
export async function resendOTP(request: SendOTPRequest): Promise<SendOTPResponse> {
  const authBffUrl = getAuthBffUrl();

  try {
    const response = await fetch(`${authBffUrl}/auth/otp/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: request.email,
        channel: 'email',
        purpose: request.purpose,
        metadata: {
          businessName: request.businessName,
          tenantSlug: request.tenantSlug,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to resend verification code',
        error: data.error || 'RESEND_FAILED',
      };
    }

    return {
      success: true,
      message: data.message || 'Verification code resent successfully',
      data: data.data,
    };
  } catch (error) {
    console.error('Resend OTP error:', error);
    return {
      success: false,
      message: 'Network error. Please try again.',
      error: 'NETWORK_ERROR',
    };
  }
}

/**
 * Get OTP status
 */
export async function getOTPStatus(email: string, purpose: string): Promise<OTPStatusResponse> {
  const authBffUrl = getAuthBffUrl();

  try {
    const params = new URLSearchParams({ email, purpose });
    const response = await fetch(`${authBffUrl}/auth/otp/status?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();

    return {
      success: response.ok,
      data: data.data || {
        recipient: email,
        purpose,
        isVerified: false,
        pendingCode: false,
        canResend: true,
        attemptsLeft: 5,
      },
    };
  } catch (error) {
    console.error('Get OTP status error:', error);
    return {
      success: false,
      data: {
        recipient: email,
        purpose,
        isVerified: false,
        pendingCode: false,
        canResend: true,
        attemptsLeft: 5,
      },
    };
  }
}
