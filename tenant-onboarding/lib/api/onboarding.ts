// API integration for tenant-service using generated types
import type {
  // Onboarding App Types
  InitializeSessionRequest,
  SessionResponse,
  BusinessInfoRequest,
  BusinessInfoResponse,
  ContactDetailsRequest,
  ContactDetailsResponse,
  BusinessAddressRequest,
  BusinessAddressResponse,

  // Tenant Service Types
  OnboardingTemplate,
  OnboardingSession as TenantOnboardingSession,
  BusinessInformation,
  ContactInformation,
  BusinessAddress as TenantBusinessAddress,
  CreateOnboardingSessionRequest,
  UpdateOnboardingSessionRequest,
  CreateBusinessInformationRequest,
  UpdateBusinessInformationRequest,
  CreateContactInformationRequest,
  CreateBusinessAddressRequest,
} from '@workspace/api-contracts';
import type { AccountSetupResponse } from '../types/tenant';

// Use Next.js API routes (BFF pattern) instead of direct backend calls
const API_BASE_URL = '/api';

// Type aliases for convenience
export type BusinessInfo = BusinessInfoRequest;
export type ContactDetails = ContactDetailsRequest;
export type BusinessAddress = BusinessAddressRequest;

// Re-export the generated types for convenience and backward compatibility
export type {
  InitializeSessionRequest,
  SessionResponse,
  BusinessInfoResponse,
  ContactDetailsResponse,
  BusinessAddressResponse,

  // Tenant service types
  OnboardingTemplate,
  TenantOnboardingSession,
  BusinessInformation,
  ContactInformation,
  TenantBusinessAddress,
};

// Legacy interface for backward compatibility - extends SessionResponse
export interface OnboardingSession extends SessionResponse {
  // Additional legacy fields if needed for backward compatibility
}

// Supporting types for API responses
export interface ValidationResult {
  available: boolean;
  message?: string;
  suggestions?: string[];
}


class OnboardingAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': this.generateRequestId(),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error?.message || responseData.message || 'API request failed');
      }

      // Unwrap the data field if it exists (backend response format)
      // Otherwise return the data as-is (for direct responses)
      return (responseData.data !== undefined ? responseData.data : responseData) as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Onboarding session management
  async startOnboarding(applicationType: string = 'ecommerce'): Promise<OnboardingSession> {
    const response = await this.makeRequest<OnboardingSession>('/onboarding', {
      method: 'POST',
      body: JSON.stringify({
        application_type: applicationType
      }),
    });
    return response;
  }

  async getOnboardingSession(sessionId: string): Promise<OnboardingSession> {
    const response = await this.makeRequest<OnboardingSession>(`/onboarding/${sessionId}`);
    return response;
  }

  async updateBusinessInformation(sessionId: string, businessInfo: BusinessInfo): Promise<OnboardingSession> {
    const response = await this.makeRequest<OnboardingSession>(`/onboarding/${sessionId}/business`, {
      method: 'PUT',
      body: JSON.stringify(businessInfo),
    });
    return response;
  }

  async updateContactDetails(sessionId: string, contactDetails: ContactDetails): Promise<OnboardingSession> {
    const response = await this.makeRequest<OnboardingSession>(`/onboarding/${sessionId}/contact`, {
      method: 'PUT',
      body: JSON.stringify(contactDetails),
    });
    return response;
  }

  async updateBusinessAddress(sessionId: string, businessAddress: BusinessAddress): Promise<OnboardingSession> {
    const response = await this.makeRequest<OnboardingSession>(`/onboarding/${sessionId}/address`, {
      method: 'PUT',
      body: JSON.stringify(businessAddress),
    });
    return response;
  }

  async completeOnboarding(sessionId: string): Promise<OnboardingSession> {
    const response = await this.makeRequest<OnboardingSession>(`/onboarding/${sessionId}/complete`, {
      method: 'POST',
    });
    return response;
  }

  /**
   * Complete account setup - creates the tenant and user account
   * This is called after email verification is complete
   */
  async completeAccountSetup(
    sessionId: string,
    password: string,
    authMethod: string = 'new_user',
    storeSetup?: { timezone?: string; currency?: string; business_model?: string }
  ): Promise<AccountSetupResponse> {
    const response = await this.makeRequest<AccountSetupResponse>(`/onboarding/${sessionId}/account-setup`, {
      method: 'POST',
      body: JSON.stringify({
        password,
        auth_method: authMethod,
        timezone: storeSetup?.timezone || 'UTC',
        currency: storeSetup?.currency || 'USD',
        business_model: storeSetup?.business_model || 'ONLINE_STORE',
      }),
    });
    return response;
  }

  // Validation endpoints
  async validateBusinessName(businessName: string): Promise<ValidationResult> {
    // Mock validation - replace with actual API call when backend is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          available: true,
          message: undefined,
        });
      }, 300);
    });
  }

  // Alias for backward compatibility
  async validateBusiness(businessName: string): Promise<ValidationResult> {
    return this.validateBusinessName(businessName);
  }

  async validateEmail(email: string): Promise<ValidationResult> {
    // Mock validation - replace with actual API call when backend is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          available: true,
          message: undefined,
        });
      }, 300);
    });
  }

  async validateSubdomain(subdomain: string, sessionId?: string, storefrontSlug?: string): Promise<ValidationResult> {
    const body: { subdomain: string; session_id?: string; storefront_slug?: string } = { subdomain };
    if (sessionId) {
      body.session_id = sessionId;
    }
    if (storefrontSlug) {
      body.storefront_slug = storefrontSlug;
    }
    const response = await this.makeRequest<ValidationResult>('/onboarding/validate/subdomain', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response;
  }

  async validateDomain(domain: string): Promise<ValidationResult> {
    const response = await this.makeRequest<ValidationResult>('/onboarding/validate/domain', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
    return response;
  }

  async validateStorefrontSlug(storefrontSlug: string, sessionId?: string): Promise<ValidationResult> {
    const body: { storefront_slug: string; session_id?: string } = { storefront_slug: storefrontSlug };
    if (sessionId) {
      body.session_id = sessionId;
    }
    const response = await this.makeRequest<ValidationResult>('/onboarding/validate/storefront', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return response;
  }

  // Verification endpoints
  async sendEmailVerification(sessionId: string, email: string): Promise<{
    id: string;
    expires_at: string;
    expires_in_seconds: number;
  }> {
    const response = await this.makeRequest<any>(`/onboarding/${sessionId}/verification/email`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    // Calculate expires_in_seconds from expires_at
    const expiresAt = new Date(response.expires_at);
    const now = new Date();
    const expires_in_seconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    return {
      id: response.id,
      expires_at: response.expires_at,
      expires_in_seconds
    };
  }

  async verifyEmail(sessionId: string, email: string, code: string): Promise<{ verified: boolean; message?: string }> {
    try {
      const response = await this.makeRequest<any>(`/onboarding/${sessionId}/verification/verify`, {
        method: 'POST',
        body: JSON.stringify({
          code
        }),
      });
      return {
        verified: response.status === 'verified',
        message: 'Verification successful'
      };
    } catch (error) {
      return {
        verified: false,
        message: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  async resendVerificationCode(sessionId: string, email: string): Promise<{
    id: string;
    expires_at: string;
    expires_in_seconds: number;
  }> {
    const response = await this.makeRequest<any>(`/onboarding/${sessionId}/verification/resend`, {
      method: 'POST',
      body: JSON.stringify({
        verification_type: 'email',
        target_value: email
      }),
    });

    // Calculate expires_in_seconds from expires_at
    const expiresAt = new Date(response.expires_at);
    const now = new Date();
    const expires_in_seconds = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));

    return {
      id: response.id,
      expires_at: response.expires_at,
      expires_in_seconds
    };
  }

  async getVerificationStatus(sessionId: string, email: string): Promise<{
    is_verified: boolean;
    verified_at?: string;
    pending_code: boolean;
    expires_at?: string;
    can_resend: boolean;
    attempts_left: number;
  }> {
    const response = await this.makeRequest<any>(`/onboarding/${sessionId}/verification/status?recipient=${encodeURIComponent(email)}&purpose=email_verification`);
    return response;
  }

  // Link-based verification endpoints
  async getVerificationMethod(): Promise<{ method: 'otp' | 'link' }> {
    const response = await this.makeRequest<{ method: 'otp' | 'link' }>('/verify/method');
    return response;
  }

  async verifyByToken(token: string): Promise<{
    verified: boolean;
    email: string;
    session_id: string;
    message?: string;
  }> {
    try {
      const response = await this.makeRequest<any>('/verify/token', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      return {
        verified: response.status === 'verified',
        email: response.email,
        session_id: response.session_id,
        message: 'Email verified successfully'
      };
    } catch (error) {
      return {
        verified: false,
        email: '',
        session_id: '',
        message: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  async getTokenInfo(token: string): Promise<{
    valid: boolean;
    email: string;
    session_id: string;
    expires_at: string;
  } | null> {
    try {
      const response = await this.makeRequest<any>(`/verify/token-info?token=${encodeURIComponent(token)}`);
      return {
        valid: response.valid,
        email: response.email,
        session_id: response.session_id,
        expires_at: response.expires_at
      };
    } catch (error) {
      return null;
    }
  }

  async verifyPhone(sessionId: string, code: string): Promise<void> {
    await this.makeRequest(`/onboarding/${sessionId}/verify-phone`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  // Legacy methods for backward compatibility
  async sendVerification(email: string): Promise<{ success: boolean }> {
    console.warn('sendVerification(email) is deprecated. Use sendEmailVerification(sessionId, email) instead.');
    return { success: true };
  }


  // Progress tracking
  async getProgress(sessionId: string): Promise<{ completed: number; total: number; percentage: number }> {
    const response = await this.makeRequest<{ completed: number; total: number; percentage: number }>(`/onboarding/${sessionId}/progress`);
    return response;
  }

  // Task management
  async getTasks(sessionId: string): Promise<any[]> {
    const response = await this.makeRequest<any[]>(`/onboarding/${sessionId}/tasks`);
    return response;
  }

  async updateTaskStatus(sessionId: string, taskId: string, status: string): Promise<void> {
    await this.makeRequest(`/onboarding/${sessionId}/tasks/${taskId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
}

// Export singleton instance
export const onboardingApi = new OnboardingAPI();
