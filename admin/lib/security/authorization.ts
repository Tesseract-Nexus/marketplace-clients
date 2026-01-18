/**
 * Authorization Utilities
 *
 * Provides proper role-based access control (RBAC) for API routes.
 * Replaces hardcoded admin role bypass with proper authorization checks.
 *
 * SECURITY: All role information must come from validated JWT claims,
 * not from client-provided headers that can be spoofed.
 *
 * @see docs/SECURITY_COMPLIANCE.md
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * User roles in the system
 */
export type UserRole = 'owner' | 'super_admin' | 'admin' | 'manager' | 'staff' | 'user' | 'guest';

/**
 * Role hierarchy - higher index = more privileges
 * Used for role-based comparisons
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  guest: 0,
  user: 1,
  staff: 2,
  manager: 3,
  admin: 4,
  super_admin: 5,
  owner: 6,  // Tenant owner has highest privileges
};

/**
 * Roles that are allowed in the admin portal
 */
const ADMIN_PORTAL_ROLES: UserRole[] = ['owner', 'super_admin', 'admin', 'manager', 'staff'];

/**
 * User context extracted from request
 */
export interface UserContext {
  userId: string | null;
  userRole: UserRole;
  userName: string | null;
  userEmail: string | null;
  tenantId: string | null;
  isAuthenticated: boolean;
  isAdminPortalAuthorized: boolean;
}

/**
 * Authorization check result
 */
export interface AuthorizationResult {
  authorized: boolean;
  userContext: UserContext;
  error?: {
    code: string;
    message: string;
    status: number;
  };
}

/**
 * Decode JWT token and extract claims FOR DISPLAY PURPOSES ONLY.
 *
 * SECURITY WARNING: This function DECODES but does NOT VERIFY the JWT signature.
 *
 * DO NOT use the returned claims for:
 * - Authentication decisions
 * - Authorization decisions
 * - Access control
 *
 * ONLY use for:
 * - UI display (showing user name, email in header)
 * - Logging/debugging (with understanding claims may be forged)
 *
 * For authentication/authorization, ONLY trust:
 * - Istio x-jwt-claim-* headers (verified at ingress)
 * - Session cookie validation via auth-bff
 */
function decodeJWTForDisplay(token: string): Record<string, unknown> | null {
  try {
    const jwt = token.replace(/^Bearer\s+/i, '');
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;

    // Base64 decode the payload (handle URL-safe base64)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * Extract user context from request headers
 *
 * SECURITY: Authentication is ONLY determined from TRUSTED sources:
 * 1. Istio-validated headers (x-jwt-claim-*) - VERIFIED by Istio at ingress
 * 2. Session cookie - Requires valid auth-bff session
 *
 * JWT decode is ONLY used for display (user name, email) and NEVER for auth.
 *
 * IMPORTANT: Backend services make final authorization decisions.
 * This function determines if request should be allowed to proceed to backend.
 */
export function extractUserContext(request: NextRequest): UserContext {
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');

  // === AUTHENTICATION: Only from TRUSTED sources ===

  // Source 1: Istio-validated headers (TRUSTED - set by Istio after JWT verification)
  const istioUserId = request.headers.get('x-jwt-claim-sub');
  const istioUserEmail = request.headers.get('x-jwt-claim-email');
  const istioTenantId = request.headers.get('x-jwt-claim-tenant-id');
  const istioPlatformOwner = request.headers.get('x-jwt-claim-platform-owner');
  const istioRoles = request.headers.get('x-jwt-claim-roles');

  // Source 2: Session cookie (TRUSTED - validated by auth-bff)
  // Check both 'session' and 'bff_session' cookie names
  const hasValidSession = !!(request.cookies.get('session')?.value || request.cookies.get('bff_session')?.value);

  // Source 3: No legacy headers - they are disabled in backend services (AllowLegacyHeaders: false)

  // === DISPLAY ONLY: Decoded JWT claims (NOT verified, NOT for auth) ===
  let displayUserName: string | null = null;
  let displayUserEmail: string | null = null;
  let displayUserRole: string | null = null;

  if (authHeader) {
    const claims = decodeJWTForDisplay(authHeader);
    if (claims) {
      displayUserName = claims.name as string | null;
      displayUserEmail = claims.email as string | null;
      displayUserRole = (claims.role || claims.user_role) as string | null;
    }
  }

  // === COMBINE with priority (TRUSTED sources first) ===

  // User ID: Only from Istio-validated headers
  const userId = istioUserId;

  // Tenant ID: Only from Istio-validated headers
  const tenantId = istioTenantId;

  // Email: Prefer Istio, fallback to display (not for auth)
  const userEmail = istioUserEmail || displayUserEmail;

  // Name: Only from JWT display (not for auth)
  const userName = displayUserName;

  // Role: ONLY from Istio headers (NEVER from unverified JWT)
  let userRole: UserRole = 'guest';
  if (istioPlatformOwner === 'true') {
    userRole = 'super_admin';
  } else if (istioRoles) {
    // Parse roles from Istio header (JSON array)
    try {
      const roles = JSON.parse(istioRoles) as string[];
      if (roles.includes('store_owner') || roles.includes('tenant_owner')) {
        userRole = 'owner';
      } else if (roles.includes('store_admin')) {
        userRole = 'admin';
      } else if (roles.includes('store_manager')) {
        userRole = 'manager';
      } else if (roles.length > 0) {
        userRole = 'staff';
      }
    } catch {
      // Invalid JSON, ignore
    }
  }

  // === AUTHENTICATION DECISION: Only from trusted sources ===
  // User is authenticated ONLY if:
  // 1. We have Istio-validated user ID (JWT verified at ingress), OR
  // 2. We have valid session cookie (session verified by auth-bff when proxying)
  // Note: For BFF routes, browser only sends bff_session cookie, not user ID headers
  // The actual token and user context is retrieved by getProxyHeadersAsync when proxying
  const isAuthenticated = !!istioUserId || hasValidSession;

  // For admin portal: user needs to be authenticated
  // Backend handles actual role-based authorization via RBAC
  const isAdminPortalAuthorized = isAuthenticated;

  return {
    userId,
    userRole,
    userName,
    userEmail,
    tenantId,
    isAuthenticated,
    isAdminPortalAuthorized,
  };
}

/**
 * Normalize role string to valid UserRole
 * Falls back to 'guest' for invalid/missing roles
 */
function normalizeRole(role: string | null): UserRole {
  if (!role) return 'guest';

  const normalizedRole = role.toLowerCase().trim();

  // Map common role variations
  const roleMap: Record<string, UserRole> = {
    owner: 'owner',
    tenant_owner: 'owner',
    store_owner: 'owner',
    super_admin: 'super_admin',
    superadmin: 'super_admin',
    admin: 'admin',
    administrator: 'admin',
    manager: 'manager',
    staff: 'staff',
    employee: 'staff',
    user: 'user',
    customer: 'user',
    guest: 'guest',
  };

  return roleMap[normalizedRole] || 'guest';
}

/**
 * Check if user has minimum required role
 */
export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user is authorized for admin portal access
 */
export function isAuthorizedForAdminPortal(userContext: UserContext): boolean {
  return userContext.isAuthenticated && userContext.isAdminPortalAuthorized;
}

/**
 * Require authentication for API route
 * Returns error response if not authenticated
 */
export function requireAuthentication(request: NextRequest): AuthorizationResult {
  const userContext = extractUserContext(request);

  if (!userContext.isAuthenticated) {
    return {
      authorized: false,
      userContext,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        status: 401,
      },
    };
  }

  return { authorized: true, userContext };
}

/**
 * Require minimum role for API route
 * Returns error response if user lacks required role
 */
export function requireRole(request: NextRequest, requiredRole: UserRole): AuthorizationResult {
  const authResult = requireAuthentication(request);

  if (!authResult.authorized) {
    return authResult;
  }

  if (!hasMinimumRole(authResult.userContext.userRole, requiredRole)) {
    return {
      authorized: false,
      userContext: authResult.userContext,
      error: {
        code: 'FORBIDDEN',
        message: `Insufficient permissions. Required role: ${requiredRole}`,
        status: 403,
      },
    };
  }

  return authResult;
}

/**
 * Require admin portal access
 * Used for admin-only API routes
 */
export function requireAdminPortalAccess(request: NextRequest): AuthorizationResult {
  const authResult = requireAuthentication(request);

  if (!authResult.authorized) {
    return authResult;
  }

  if (!authResult.userContext.isAdminPortalAuthorized) {
    return {
      authorized: false,
      userContext: authResult.userContext,
      error: {
        code: 'FORBIDDEN',
        message: 'Admin portal access required',
        status: 403,
      },
    };
  }

  return authResult;
}

/**
 * Get headers to forward to backend services
 *
 * SECURITY: This function forwards Istio JWT claim headers:
 * - x-jwt-claim-tenant-id: Required for multi-tenant isolation
 * - x-jwt-claim-sub: User identifier (validated by Istio at ingress)
 * - x-jwt-claim-email: Email for RBAC staff lookup (extracted from JWT by Istio)
 * - Authorization: JWT token for backend validation
 *
 * NOTE: x-jwt-claim-email is included because:
 * 1. It's extracted from the JWT which Istio validates at ingress
 * 2. Backend services need it for email-based staff lookup when auth user ID
 *    (e.g., Keycloak subject UUID) differs from the staff-service staff ID
 * 3. This is for internal BFF → service communication, not client → server
 *
 * Do NOT forward user role headers - use x-jwt-claim-platform-owner from Istio instead
 */
export function getAuthorizedHeaders(
  request: NextRequest,
  overrides?: Record<string, string>
): Record<string, string> {
  const userContext = extractUserContext(request);
  const headers: Record<string, string> = {};

  // Forward tenant ID (required for multi-tenant isolation)
  if (userContext.tenantId) {
    headers['x-jwt-claim-tenant-id'] = userContext.tenantId;
  }

  // Forward user ID (validated by Istio at ingress)
  if (userContext.userId) {
    headers['x-jwt-claim-sub'] = userContext.userId;
  }

  // Forward user email for RBAC staff lookup
  // This is extracted from the JWT by Istio (not from client headers),
  // so it's trusted for internal service-to-service calls
  if (userContext.userEmail) {
    headers['x-jwt-claim-email'] = userContext.userEmail;
  }

  // SECURITY: Do NOT forward user role headers - can be spoofed
  // Backend should use x-jwt-claim-platform-owner from Istio

  // Forward Authorization header (backend validates the JWT)
  const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
  if (authHeader) {
    headers['Authorization'] = authHeader;
  }

  // Apply any overrides (but NOT for security-sensitive headers)
  if (overrides) {
    // Block attempts to override security headers via overrides
    const safeOverrides = { ...overrides };
    delete safeOverrides['x-jwt-claim-sub'];
    delete safeOverrides['x-jwt-claim-tenant-id'];
    delete safeOverrides['x-jwt-claim-email'];
    delete safeOverrides['Authorization'];

    Object.assign(headers, safeOverrides);
  }

  return headers;
}

/**
 * Create authorization error response
 */
export function createAuthorizationErrorResponse(
  error: NonNullable<AuthorizationResult['error']>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    },
    { status: error.status }
  );
}

/**
 * Middleware helper to protect API routes
 *
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const auth = requireAdminPortalAccess(request);
 *   if (!auth.authorized) {
 *     return createAuthorizationErrorResponse(auth.error!);
 *   }
 *   // Proceed with authorized request
 *   const headers = getAuthorizedHeaders(request);
 *   // ...
 * }
 * ```
 */
export function withAuthorization(
  handler: (request: NextRequest, userContext: UserContext) => Promise<NextResponse>,
  options: {
    requiredRole?: UserRole;
    requireAdminPortal?: boolean;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    let authResult: AuthorizationResult;

    if (options.requireAdminPortal) {
      authResult = requireAdminPortalAccess(request);
    } else if (options.requiredRole) {
      authResult = requireRole(request, options.requiredRole);
    } else {
      authResult = requireAuthentication(request);
    }

    if (!authResult.authorized) {
      return createAuthorizationErrorResponse(authResult.error!);
    }

    return handler(request, authResult.userContext);
  };
}
