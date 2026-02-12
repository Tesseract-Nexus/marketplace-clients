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
} from '../types/api-contracts';
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


// Enterprise reliability configuration
interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableStatusCodes: number[];
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

// Error types for better error handling
export class OnboardingAPIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'OnboardingAPIError';
  }

  static fromResponse(response: Response, data: Record<string, unknown>): OnboardingAPIError {
    // Backend sends error as a string in data.error, or as data.error.message, or as data.message
    let message: string;
    if (typeof data.error === 'string') {
      message = data.error;
    } else if (typeof data.error === 'object' && data.error !== null) {
      message = (data.error as Record<string, unknown>).message as string;
    } else if (data.message) {
      message = data.message as string;
    } else {
      message = OnboardingAPIError.getDefaultMessage(response.status);
    }

    const code = OnboardingAPIError.getErrorCode(response.status, data);
    return new OnboardingAPIError(message, code, response.status, data);
  }

  static getDefaultMessage(status: number): string {
    switch (status) {
      case 400: return 'Invalid request. Please check your input.';
      case 401: return 'Session expired. Please refresh and try again.';
      case 403: return 'Access denied. You may not have permission for this action.';
      case 404: return 'The requested resource was not found.';
      case 408: return 'Request timed out. Please try again.';
      case 409: return 'Conflict detected. Please refresh and try again.';
      case 429: return 'Too many requests. Please wait a moment and try again.';
      case 500: return 'Server error. Our team has been notified.';
      case 502: return 'Service temporarily unavailable. Please try again.';
      case 503: return 'Service is currently undergoing maintenance.';
      case 504: return 'Request timed out. Please try again.';
      default: return 'An unexpected error occurred. Please try again.';
    }
  }

  static getErrorCode(status: number, data: Record<string, unknown>): string {
    if (data.code) return data.code as string;
    switch (status) {
      case 400: return 'VALIDATION_ERROR';
      case 401: return 'SESSION_EXPIRED';
      case 403: return 'ACCESS_DENIED';
      case 404: return 'NOT_FOUND';
      case 408: return 'TIMEOUT';
      case 409: return 'CONFLICT';
      case 429: return 'RATE_LIMITED';
      case 500: return 'SERVER_ERROR';
      case 502: return 'BAD_GATEWAY';
      case 503: return 'SERVICE_UNAVAILABLE';
      case 504: return 'GATEWAY_TIMEOUT';
      default: return 'UNKNOWN_ERROR';
    }
  }

  isRetryable(): boolean {
    return ['TIMEOUT', 'BAD_GATEWAY', 'SERVICE_UNAVAILABLE', 'GATEWAY_TIMEOUT', 'SERVER_ERROR'].includes(this.code);
  }

  isSessionError(): boolean {
    return ['SESSION_EXPIRED', 'NOT_FOUND'].includes(this.code);
  }
}

class OnboardingAPI {
  private baseURL: string;
  private retryConfig: RetryConfig;
  private circuitBreaker: CircuitBreakerState;
  private readonly circuitBreakerThreshold = 5;
  private readonly circuitBreakerResetMs = 30000; // 30 seconds

  constructor() {
    this.baseURL = API_BASE_URL;
    this.retryConfig = {
      maxRetries: 3,
      baseDelayMs: 500,
      maxDelayMs: 5000,
      retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    };
    this.circuitBreaker = {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    };
  }

  private checkCircuitBreaker(): void {
    if (this.circuitBreaker.isOpen) {
      const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailure;
      if (timeSinceLastFailure >= this.circuitBreakerResetMs) {
        // Reset circuit breaker after cooldown
        this.circuitBreaker.isOpen = false;
        this.circuitBreaker.failures = 0;
        console.log('[OnboardingAPI] Circuit breaker reset');
      } else {
        throw new OnboardingAPIError(
          'Service is temporarily unavailable. Please wait a moment and try again.',
          'CIRCUIT_BREAKER_OPEN',
          503
        );
      }
    }
  }

  private recordSuccess(): void {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.isOpen = false;
  }

  private recordFailure(): void {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailure = Date.now();
    if (this.circuitBreaker.failures >= this.circuitBreakerThreshold) {
      this.circuitBreaker.isOpen = true;
      console.warn(`[OnboardingAPI] Circuit breaker opened after ${this.circuitBreaker.failures} failures`);
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private calculateBackoff(attempt: number): number {
    const delay = this.retryConfig.baseDelayMs * Math.pow(2, attempt);
    const jitter = Math.random() * 100; // Add jitter to prevent thundering herd
    return Math.min(delay + jitter, this.retryConfig.maxDelayMs);
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    // Check circuit breaker before making request
    this.checkCircuitBreaker();

    const url = `${this.baseURL}${endpoint}`;
    const requestId = this.generateRequestId();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...options.headers,
      },
      ...options,
    };

    try {
      // Add timeout using AbortController
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let responseData: Record<string, unknown>;
      try {
        responseData = await response.json();
      } catch {
        responseData = {};
      }

      if (!response.ok) {
        const error = OnboardingAPIError.fromResponse(response, responseData);

        // Check if we should retry
        if (
          error.isRetryable() &&
          retryCount < this.retryConfig.maxRetries
        ) {
          const backoffMs = this.calculateBackoff(retryCount);
          console.log(`[OnboardingAPI] Retrying request (attempt ${retryCount + 1}/${this.retryConfig.maxRetries}) after ${backoffMs}ms`);
          await this.delay(backoffMs);
          return this.makeRequest<T>(endpoint, options, retryCount + 1);
        }

        this.recordFailure();
        throw error;
      }

      // Success - record it for circuit breaker
      this.recordSuccess();

      // Unwrap the data field if it exists (backend response format)
      return (responseData.data !== undefined ? responseData.data : responseData) as T;
    } catch (error) {
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new OnboardingAPIError(
          'Request timed out. Please check your connection and try again.',
          'TIMEOUT',
          408
        );

        // Retry on timeout
        if (retryCount < this.retryConfig.maxRetries) {
          const backoffMs = this.calculateBackoff(retryCount);
          console.log(`[OnboardingAPI] Request timed out, retrying (attempt ${retryCount + 1}/${this.retryConfig.maxRetries}) after ${backoffMs}ms`);
          await this.delay(backoffMs);
          return this.makeRequest<T>(endpoint, options, retryCount + 1);
        }

        this.recordFailure();
        throw timeoutError;
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError = new OnboardingAPIError(
          'Network error. Please check your internet connection.',
          'NETWORK_ERROR'
        );

        // Retry on network error
        if (retryCount < this.retryConfig.maxRetries) {
          const backoffMs = this.calculateBackoff(retryCount);
          console.log(`[OnboardingAPI] Network error, retrying (attempt ${retryCount + 1}/${this.retryConfig.maxRetries}) after ${backoffMs}ms`);
          await this.delay(backoffMs);
          return this.makeRequest<T>(endpoint, options, retryCount + 1);
        }

        this.recordFailure();
        throw networkError;
      }

      // Re-throw OnboardingAPIError as-is
      if (error instanceof OnboardingAPIError) {
        throw error;
      }

      // Wrap unknown errors
      console.error('[OnboardingAPI] Unexpected error:', error);
      throw new OnboardingAPIError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
        'UNKNOWN_ERROR'
      );
    }
  }

  private generateRequestId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Health check endpoint for monitoring
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Reset circuit breaker manually (useful for testing or manual recovery)
  resetCircuitBreaker(): void {
    this.circuitBreaker = {
      failures: 0,
      lastFailure: 0,
      isOpen: false,
    };
    console.log('[OnboardingAPI] Circuit breaker manually reset');
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
    // Include contact_information and business_information to ensure all required data is loaded
    const response = await this.makeRequest<OnboardingSession>(
      `/onboarding/${sessionId}?include=contact_information&include=business_information`
    );
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
    authMethod: string = 'password',
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

  // SECURITY: Token is sent in request body (POST) instead of URL to prevent
  // exposure in browser history, referrer headers, and server logs
  async getTokenInfo(token: string): Promise<{
    valid: boolean;
    email: string;
    session_id: string;
    expires_at: string;
  } | null> {
    try {
      const response = await this.makeRequest<any>('/verify/token-info', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
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

  // TOTP Authenticator App Methods

  async initiateTotpSetup(sessionId: string, email: string, tenantName?: string): Promise<{
    setup_session: string;
    totp_uri: string;
    manual_entry_key: string;
    backup_codes: string[];
  }> {
    return this.makeRequest('/auth/totp/setup/initiate', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId, email, tenant_name: tenantName }),
    });
  }

  async confirmTotpSetup(setupSession: string, code: string, sessionId: string): Promise<{
    success: boolean;
    message: string;
    totp_secret_encrypted?: string;
    backup_code_hashes?: string[];
  }> {
    return this.makeRequest('/auth/totp/setup/confirm', {
      method: 'POST',
      body: JSON.stringify({ setup_session: setupSession, code, session_id: sessionId }),
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
