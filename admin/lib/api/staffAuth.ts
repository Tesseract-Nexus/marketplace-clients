import {
  StaffLoginRequest,
  StaffLoginResponse,
  StaffSSOLoginRequest,
  StaffInviteRequest,
  StaffActivationRequest,
  StaffActivationResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  InvitationVerifyResponse,
  InvitationCreateResponse,
  SessionListResponse,
  InvitationListResponse,
  LoginAuditListResponse,
  OAuthProviderListResponse,
  SSOConfigPublic,
  TenantSSOConfig,
  SSOConfigUpdateRequest,
} from './staffAuthTypes';

const API_BASE = '/api/staff/auth';

// ===========================================
// Authentication Service
// ===========================================

class StaffAuthService {
  // ===========================================
  // Public Auth Endpoints (No Auth Required)
  // ===========================================

  async login(data: StaffLoginRequest): Promise<StaffLoginResponse> {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Login failed');
    }

    return response.json();
  }

  async ssoLogin(data: StaffSSOLoginRequest): Promise<StaffLoginResponse> {
    const response = await fetch(`${API_BASE}/sso/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'SSO login failed');
    }

    return response.json();
  }

  async getSSOConfig(): Promise<SSOConfigPublic> {
    const response = await fetch(`${API_BASE}/sso/config`);

    if (!response.ok) {
      throw new Error('Failed to fetch SSO configuration');
    }

    const result = await response.json();
    return result.data;
  }


  async verifyInvitation(token: string): Promise<InvitationVerifyResponse> {
    const response = await fetch(`${API_BASE}/invitation/verify?token=${encodeURIComponent(token)}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Invalid invitation');
    }

    return response.json();
  }

  async activateAccount(data: StaffActivationRequest): Promise<StaffActivationResponse> {
    const response = await fetch(`${API_BASE}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Account activation failed');
    }

    return response.json();
  }

  async refreshToken(data: TokenRefreshRequest): Promise<TokenRefreshResponse> {
    const response = await fetch(`${API_BASE}/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Token refresh failed');
    }

    return response.json();
  }

  // ===========================================
  // Protected Auth Endpoints (Auth Required)
  // ===========================================

  async logout(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/logout`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Logout failed');
    }

    return response.json();
  }

  async logoutAll(): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/logout-all`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Logout from all devices failed');
    }

    return response.json();
  }


  // ===========================================
  // Session Management
  // ===========================================

  async getSessions(): Promise<SessionListResponse> {
    const response = await fetch(`${API_BASE}/sessions`);

    if (!response.ok) {
      throw new Error('Failed to fetch sessions');
    }

    return response.json();
  }

  async revokeSession(sessionId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to revoke session');
    }

    return response.json();
  }

  // ===========================================
  // OAuth Provider Management
  // ===========================================

  async getLinkedProviders(): Promise<OAuthProviderListResponse> {
    const response = await fetch(`${API_BASE}/providers`);

    if (!response.ok) {
      throw new Error('Failed to fetch linked providers');
    }

    return response.json();
  }

  async unlinkProvider(provider: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/providers/${provider}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to unlink provider');
    }

    return response.json();
  }

  // ===========================================
  // SSO Configuration (Admin Only)
  // ===========================================

  async updateSSOConfig(data: SSOConfigUpdateRequest): Promise<{ success: boolean; data: TenantSSOConfig }> {
    const response = await fetch(`${API_BASE}/sso/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update SSO configuration');
    }

    return response.json();
  }
}

// ===========================================
// Invitation Service
// ===========================================

class StaffInvitationService {
  async create(data: StaffInviteRequest): Promise<InvitationCreateResponse> {
    const response = await fetch('/api/staff/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create invitation');
    }

    return response.json();
  }

  async getPending(): Promise<InvitationListResponse> {
    const response = await fetch('/api/staff/invitations/pending');

    if (!response.ok) {
      throw new Error('Failed to fetch pending invitations');
    }

    return response.json();
  }

  async resend(invitationId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`/api/staff/invitations/${invitationId}/resend`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to resend invitation');
    }

    return response.json();
  }

  async revoke(invitationId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`/api/staff/invitations/${invitationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to revoke invitation');
    }

    return response.json();
  }
}

// ===========================================
// Login Audit Service
// ===========================================

class LoginAuditService {
  async getHistory(params?: {
    staffId?: string;
    page?: number;
    limit?: number;
  }): Promise<LoginAuditListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.staffId) searchParams.set('staffId', params.staffId);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const response = await fetch(`/api/staff/audit/logins?${searchParams.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to fetch login audit history');
    }

    return response.json();
  }
}

// ===========================================
// Export Singleton Instances
// ===========================================

export const staffAuthService = new StaffAuthService();
export const staffInvitationService = new StaffInvitationService();
export const loginAuditService = new LoginAuditService();

// ===========================================
// Token Storage Helpers - DEPRECATED
// ===========================================
// NOTE: Token storage in localStorage is deprecated.
// Authentication is now handled by auth-bff with secure HttpOnly cookies.
// Session state should be checked via /auth/session endpoint.
// This object is kept for backwards compatibility but should not be used.

/**
 * @deprecated Use auth-bff session management instead.
 * Tokens are no longer stored in localStorage for security.
 * Check session via /auth/session endpoint.
 */
export const tokenStorage = {
  /** @deprecated */
  getAccessToken(): string | null {
    console.warn('tokenStorage.getAccessToken is deprecated. Use /auth/session to check auth state.');
    return null;
  },

  /** @deprecated */
  setAccessToken(_token: string): void {
    console.warn('tokenStorage.setAccessToken is deprecated. Auth is managed by BFF.');
  },

  /** @deprecated */
  getRefreshToken(): string | null {
    console.warn('tokenStorage.getRefreshToken is deprecated. Use /auth/session to check auth state.');
    return null;
  },

  /** @deprecated */
  setRefreshToken(_token: string): void {
    console.warn('tokenStorage.setRefreshToken is deprecated. Auth is managed by BFF.');
  },

  /** @deprecated */
  getSessionId(): string | null {
    console.warn('tokenStorage.getSessionId is deprecated. Use /auth/session to check auth state.');
    return null;
  },

  /** @deprecated */
  setSessionId(_sessionId: string): void {
    console.warn('tokenStorage.setSessionId is deprecated. Auth is managed by BFF.');
  },

  /** @deprecated */
  setTokens(_response: StaffLoginResponse): void {
    console.warn('tokenStorage.setTokens is deprecated. Auth is managed by BFF.');
  },

  /** @deprecated */
  clearTokens(): void {
    console.warn('tokenStorage.clearTokens is deprecated. Use /auth/logout to sign out.');
  },

  /** @deprecated Check session via /auth/session instead */
  isAuthenticated(): boolean {
    console.warn('tokenStorage.isAuthenticated is deprecated. Use /auth/session to check auth state.');
    return false;
  },
};

// ===========================================
// Google SSO Helper
// ===========================================

export async function initGoogleSSO(clientId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google SSO can only be initialized in browser'));
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // @ts-expect-error - Google Identity Services global
      window.google?.accounts?.id?.initialize({
        client_id: clientId,
        callback: () => {}, // Will be overridden in component
      });
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Google SSO'));
    document.head.appendChild(script);
  });
}

// ===========================================
// Microsoft SSO Helper
// ===========================================

export async function initMicrosoftSSO(clientId: string, tenantId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Microsoft SSO can only be initialized in browser'));
      return;
    }

    // Load MSAL script
    const script = document.createElement('script');
    script.src = 'https://alcdn.msauth.net/browser/2.30.0/js/msal-browser.min.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // MSAL will be available on window
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Microsoft SSO'));
    document.head.appendChild(script);
  });
}

// ===========================================
// Device Fingerprint Helper
// ===========================================

export function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') return '';

  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    // @ts-expect-error - deviceMemory might not exist
    navigator.deviceMemory || 0,
  ];

  // Simple hash function
  let hash = 0;
  const str = components.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16);
}

export function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Unknown';

  const ua = navigator.userAgent;

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Detect browser
  let browser = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';

  return `${browser} on ${os}`;
}
