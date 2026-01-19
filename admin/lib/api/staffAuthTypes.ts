// ===========================================
// Staff Authentication Types
// ===========================================

// Authentication Methods
export type StaffAuthMethod =
  | 'password'
  | 'google_sso'
  | 'microsoft_sso'
  | 'invitation_pending'
  | 'sso_pending';

// Account Status
export type StaffAccountStatus =
  | 'pending_activation'
  | 'pending_password'
  | 'active'
  | 'suspended'
  | 'locked'
  | 'deactivated';

// Invitation Status
export type InvitationStatus =
  | 'pending'
  | 'sent'
  | 'opened'
  | 'accepted'
  | 'expired'
  | 'revoked';

// ===========================================
// Request Types
// ===========================================

export interface StaffLoginRequest {
  email: string;
  password: string;
  deviceFingerprint?: string;
  deviceName?: string;
  rememberMe?: boolean;
}

export interface StaffSSOLoginRequest {
  provider: 'google' | 'microsoft';
  idToken: string;
  accessToken?: string;
  deviceFingerprint?: string;
  deviceName?: string;
}

export interface StaffPasswordResetRequest {
  email: string;
}

export interface StaffPasswordResetConfirmRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface StaffChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface StaffInviteRequest {
  staffId: string;
  authMethodOptions?: StaffAuthMethod[];
  customMessage?: string;
  sendEmail: boolean;
  expiresInHours?: number;
  activationBaseUrl?: string; // Base URL for activation link (e.g., https://store-admin.tesserix.app)
  businessName?: string; // Store/business name for email
}

export interface StaffActivationRequest {
  token: string;
  authMethod: StaffAuthMethod;
  password?: string;
  confirmPassword?: string;
  googleIdToken?: string;
  microsoftIdToken?: string;
  deviceFingerprint?: string;
  deviceName?: string;
}

export interface TokenRefreshRequest {
  refreshToken: string;
}

export interface SSOConfigUpdateRequest {
  googleEnabled?: boolean;
  googleClientId?: string;
  googleClientSecret?: string;
  googleAllowedDomains?: string[];
  microsoftEnabled?: boolean;
  microsoftTenantId?: string;
  microsoftClientId?: string;
  microsoftClientSecret?: string;
  microsoftAllowedGroups?: string[];
  allowPasswordAuth?: boolean;
  enforceSSO?: boolean;
  autoProvisionUsers?: boolean;
  defaultRoleId?: string;
  sessionDurationHours?: number;
  refreshTokenDays?: number;
  maxSessionsPerUser?: number;
  requireMFA?: boolean;
}

// ===========================================
// Response Types
// ===========================================

export interface StaffLoginResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  tokenType: string;
  staff: StaffWithAuth;
  mustResetPassword: boolean;
  sessionId: string;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
  tokenType: string;
}

export interface StaffActivationResponse {
  success: boolean;
  staff?: StaffWithAuth;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  message: string;
}

export interface InvitationVerifyResponse {
  valid: boolean;
  staff?: StaffWithAuth;
  activationToken?: string; // Token to use for activation
  authMethodOptions?: StaffAuthMethod[];
  expiresAt?: string;
  message?: string;
  googleEnabled: boolean;
  microsoftEnabled: boolean;
  passwordAuthEnabled: boolean;
}

export interface InvitationCreateResponse {
  success: boolean;
  data: {
    invitationId: string;
    invitationToken: string;
    activationToken: string;
    expiresAt: string;
  };
}

// ===========================================
// Model Types
// ===========================================

export interface StaffWithAuth {
  id: string;
  tenantId: string;
  vendorId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  employeeId?: string;
  role: string;
  employmentType: string;
  departmentId?: string;
  isActive: boolean;
  profilePhotoUrl?: string;
  // Auth fields
  authMethod?: StaffAuthMethod;
  accountStatus?: StaffAccountStatus;
  mustResetPassword?: boolean;
  isEmailVerified?: boolean;
  invitedAt?: string;
  invitationAcceptedAt?: string;
  lastPasswordChange?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffSession {
  id: string;
  tenantId: string;
  vendorId?: string;
  staffId: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt?: string;
  deviceFingerprint?: string;
  deviceName?: string;
  deviceType?: string;
  osName?: string;
  osVersion?: string;
  browserName?: string;
  browserVersion?: string;
  ipAddress?: string;
  location?: string;
  isActive: boolean;
  isTrusted: boolean;
  lastActivityAt: string;
  createdAt: string;
  revokedAt?: string;
  revokedReason?: string;
}

export interface StaffOAuthProvider {
  id: string;
  tenantId: string;
  staffId: string;
  provider: string;
  providerUserId: string;
  providerEmail?: string;
  providerName?: string;
  providerAvatar?: string;
  isPrimary: boolean;
  lastUsedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffInvitation {
  id: string;
  tenantId: string;
  vendorId?: string;
  staffId: string;
  invitationType: string;
  authMethodOptions?: StaffAuthMethod[];
  sentToEmail?: string;
  sentToPhone?: string;
  status: InvitationStatus;
  sentAt?: string;
  openedAt?: string;
  acceptedAt?: string;
  expiresAt: string;
  sentBy?: string;
  sendCount: number;
  lastSentAt?: string;
  customMessage?: string;
  createdAt: string;
  updatedAt: string;
  staff?: StaffWithAuth;
}

export interface StaffLoginAudit {
  id: string;
  tenantId: string;
  vendorId?: string;
  staffId?: string;
  email?: string;
  authMethod?: string;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceFingerprint?: string;
  location?: string;
  riskScore?: number;
  riskFactors?: Record<string, unknown>;
  attemptedAt: string;
}

export interface TenantSSOConfig {
  id: string;
  tenantId: string;
  googleEnabled: boolean;
  googleClientId?: string;
  googleAllowedDomains?: string[];
  microsoftEnabled: boolean;
  microsoftTenantId?: string;
  microsoftClientId?: string;
  microsoftAllowedGroups?: string[];
  allowPasswordAuth: boolean;
  enforceSSO: boolean;
  autoProvisionUsers: boolean;
  defaultRoleId?: string;
  sessionDurationHours: number;
  refreshTokenDays: number;
  maxSessionsPerUser: number;
  requireMFA: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SSOConfigPublic {
  googleEnabled: boolean;
  microsoftEnabled: boolean;
  passwordAuthEnabled: boolean;
  enforceSSO: boolean;
}

// ===========================================
// List Response Types
// ===========================================

export interface SessionListResponse {
  success: boolean;
  data: StaffSession[];
  total: number;
}

export interface InvitationListResponse {
  success: boolean;
  data: StaffInvitation[];
  total: number;
}

export interface LoginAuditListResponse {
  success: boolean;
  data: StaffLoginAudit[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface OAuthProviderListResponse {
  success: boolean;
  data: StaffOAuthProvider[];
}

// ===========================================
// Constants and Helpers
// ===========================================

export const AUTH_METHOD_LABELS: Record<StaffAuthMethod, string> = {
  password: 'Password',
  google_sso: 'Google SSO',
  microsoft_sso: 'Microsoft SSO',
  invitation_pending: 'Invitation Pending',
  sso_pending: 'SSO Pending',
};

export const ACCOUNT_STATUS_LABELS: Record<StaffAccountStatus, string> = {
  pending_activation: 'Pending Activation',
  pending_password: 'Pending Password',
  active: 'Active',
  suspended: 'Suspended',
  locked: 'Locked',
  deactivated: 'Deactivated',
};

export const ACCOUNT_STATUS_COLORS: Record<StaffAccountStatus, string> = {
  pending_activation: 'bg-yellow-100 text-yellow-800',
  pending_password: 'bg-orange-100 text-orange-800',
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
  locked: 'bg-red-100 text-red-800',
  deactivated: 'bg-gray-100 text-gray-800',
};

export const INVITATION_STATUS_LABELS: Record<InvitationStatus, string> = {
  pending: 'Pending',
  sent: 'Sent',
  opened: 'Opened',
  accepted: 'Accepted',
  expired: 'Expired',
  revoked: 'Revoked',
};

export const INVITATION_STATUS_COLORS: Record<InvitationStatus, string> = {
  pending: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  opened: 'bg-purple-100 text-purple-800',
  accepted: 'bg-green-100 text-green-800',
  expired: 'bg-orange-100 text-orange-800',
  revoked: 'bg-red-100 text-red-800',
};

export function getDeviceIcon(deviceType?: string): string {
  switch (deviceType) {
    case 'mobile':
      return 'Smartphone';
    case 'tablet':
      return 'Tablet';
    case 'desktop':
    default:
      return 'Monitor';
  }
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}
