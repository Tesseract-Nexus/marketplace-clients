import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

// GrowthBook API configuration
const GROWTHBOOK_API_HOST = process.env.GROWTHBOOK_API_HOST || 'http://growthbook.growthbook.svc.cluster.local:3100';
const GROWTHBOOK_ADMIN_EMAIL = process.env.GROWTHBOOK_ADMIN_EMAIL || 'admin@tesserix.app';
const GROWTHBOOK_ADMIN_PASSWORD = process.env.GROWTHBOOK_ADMIN_PASSWORD;
const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://tenant-service.marketplace.svc.cluster.local:8080';

// Cache for GrowthBook auth token
let cachedToken: { token: string; expiry: number } | null = null;

/**
 * Get GrowthBook authentication token
 * Caches the token for reuse until expiry
 */
async function getGrowthBookToken(): Promise<string | null> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiry > Date.now()) {
    return cachedToken.token;
  }

  if (!GROWTHBOOK_ADMIN_PASSWORD) {
    console.error('[Feature Flags] GROWTHBOOK_ADMIN_PASSWORD not configured');
    return null;
  }

  try {
    const response = await fetch(`${GROWTHBOOK_API_HOST}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: GROWTHBOOK_ADMIN_EMAIL,
        password: GROWTHBOOK_ADMIN_PASSWORD,
      }),
    });

    const data = await response.json();
    if (data.token) {
      // Cache token for 25 minutes (tokens typically expire in 30 min)
      cachedToken = {
        token: data.token,
        expiry: Date.now() + 25 * 60 * 1000,
      };
      return data.token;
    }
  } catch (error) {
    console.error('[Feature Flags] Failed to get GrowthBook token:', error);
  }

  return null;
}

/**
 * Get GrowthBook organization ID from user's default org
 */
async function getDefaultOrganizationId(token: string): Promise<string | null> {
  try {
    const response = await fetch(`${GROWTHBOOK_API_HOST}/user`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await response.json();
    return data.organizations?.[0]?.id || null;
  } catch (error) {
    console.error('[Feature Flags] Failed to get organization:', error);
    return null;
  }
}

/**
 * Get tenant's GrowthBook organization ID from tenant service
 */
async function getTenantGrowthBookOrgId(tenantId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/tenants/${tenantId}/growthbook`,
      { method: 'GET' }
    );

    if (!response.ok) {
      console.log(`[Feature Flags] Tenant ${tenantId} has no GrowthBook org - using default`);
      return null;
    }

    const data = await response.json();
    return data.data?.org_id || null;
  } catch (error) {
    console.error('[Feature Flags] Failed to get tenant GrowthBook config:', error);
    return null;
  }
}

/**
 * Check if user has required role from JWT claims
 */
function hasRequiredRole(proxyHeaders: Record<string, string>): { hasRole: boolean; userRoles: string } {
  // Check multiple possible role headers (Keycloak uses realm_access.roles)
  const realmRoles = proxyHeaders['x-jwt-claim-realm-roles'] || '';
  const roles = proxyHeaders['x-jwt-claim-roles'] || '';
  const legacyRole = proxyHeaders['x-jwt-claim-role'] || proxyHeaders['x-user-role'] || '';

  // Combine all role sources
  const allRoles = [realmRoles, roles, legacyRole]
    .filter(Boolean)
    .join(',')
    .toLowerCase();

  // RBAC: Only admin or owner can update feature flags
  const allowedRoles = ['admin', 'owner', 'super_admin', 'platform_admin', 'tenant_owner', 'tenant_admin'];
  const hasRole = allowedRoles.some(role => allRoles.includes(role));

  return { hasRole, userRoles: allRoles || 'none' };
}

/**
 * POST /api/feature-flags/update
 * Toggle a feature flag for the current tenant in GrowthBook
 *
 * Multi-tenant support:
 * - If tenant has their own GrowthBook org, toggles in that org
 * - Otherwise falls back to default/shared org
 *
 * Required RBAC: Admin or Owner role
 *
 * Request body:
 * {
 *   featureId: string,    // The feature flag ID
 *   enabled: boolean,     // New enabled/disabled state
 *   tenantId?: string     // Optional: specific tenant ID (defaults to JWT claim)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get proxy headers for RBAC validation
    const proxyHeaders = await getProxyHeaders(request) as Record<string, string>;
    const userId = proxyHeaders['x-jwt-claim-sub'] || proxyHeaders['x-user-id'];
    const headerTenantId = proxyHeaders['x-jwt-claim-tenant-id'];

    // Check RBAC
    const { hasRole, userRoles } = hasRequiredRole(proxyHeaders);
    if (!hasRole) {
      console.log(`[Feature Flags] RBAC denied - user roles: ${userRoles}`);
      return NextResponse.json(
        {
          success: false,
          message: 'Insufficient permissions. Only admins and owners can update feature flags.',
          requiredRole: 'admin or owner',
          currentRoles: userRoles
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { featureId, enabled, tenantId: bodyTenantId } = body;

    // Use tenant ID from body or header
    const tenantId = bodyTenantId || headerTenantId;

    if (!featureId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: featureId and enabled' },
        { status: 400 }
      );
    }

    // Get GrowthBook auth token
    const token = await getGrowthBookToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Failed to authenticate with GrowthBook' },
        { status: 503 }
      );
    }

    // Try to get tenant-specific GrowthBook org, fall back to default
    let orgId: string | null = null;
    let usingTenantOrg = false;

    if (tenantId) {
      orgId = await getTenantGrowthBookOrgId(tenantId);
      if (orgId) {
        usingTenantOrg = true;
        console.log(`[Feature Flags] Using tenant-specific GrowthBook org: ${orgId}`);
      }
    }

    // Fall back to default org if no tenant org
    if (!orgId) {
      orgId = await getDefaultOrganizationId(token);
    }

    if (!orgId) {
      return NextResponse.json(
        { success: false, message: 'Failed to get GrowthBook organization' },
        { status: 503 }
      );
    }

    let updateMessage: string;

    // Determine the environment to toggle (default to production)
    const environment = 'production';

    // Use the toggle endpoint which is the correct way to enable/disable features
    // POST /api/v1/features/:id/toggle
    const togglePayload = {
      environment,
      enabled,
      reason: `Toggled by ${userId || 'admin'} via admin UI`,
    };

    console.log(`[Feature Flags] Toggling feature "${featureId}" to ${enabled} in environment "${environment}" (org: ${orgId})`);

    const updateResponse = await fetch(`${GROWTHBOOK_API_HOST}/api/v1/features/${featureId}/toggle`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-organization': orgId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(togglePayload),
    });

    const updateData = await updateResponse.json();

    if (!updateResponse.ok) {
      console.error('[Feature Flags] Toggle failed:', updateData);
      return NextResponse.json(
        {
          success: false,
          message: updateData.message || 'Failed to toggle feature flag',
          error: updateData
        },
        { status: updateResponse.status }
      );
    }

    if (usingTenantOrg) {
      updateMessage = `Feature flag "${featureId}" has been ${enabled ? 'enabled' : 'disabled'} for tenant "${tenantId}"`;
    } else if (tenantId) {
      updateMessage = `Feature flag "${featureId}" has been ${enabled ? 'enabled' : 'disabled'} for tenant "${tenantId}" (shared org)`;
    } else {
      updateMessage = `Feature flag "${featureId}" has been ${enabled ? 'enabled' : 'disabled'} globally`;
    }

    // Log the change for audit
    console.log(`[Feature Flags] Flag "${featureId}" updated to ${enabled} by user ${userId} (roles: ${userRoles})${tenantId ? ` for tenant ${tenantId}` : ' (global)'} [org: ${orgId}]`);

    return NextResponse.json({
      success: true,
      message: updateMessage,
      data: {
        featureId,
        enabled,
        tenantId: tenantId || null,
        scope: usingTenantOrg ? 'tenant-org' : (tenantId ? 'shared-org' : 'global'),
        organizationId: orgId,
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[Feature Flags] Update error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update feature flag',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
