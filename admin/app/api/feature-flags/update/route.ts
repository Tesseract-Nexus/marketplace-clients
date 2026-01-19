import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

// GrowthBook API configuration
const GROWTHBOOK_API_HOST = process.env.GROWTHBOOK_API_HOST || 'http://growthbook.growthbook.svc.cluster.local:3100';
const GROWTHBOOK_ADMIN_EMAIL = process.env.GROWTHBOOK_ADMIN_EMAIL || 'admin@tesserix.app';
const GROWTHBOOK_ADMIN_PASSWORD = process.env.GROWTHBOOK_ADMIN_PASSWORD;

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
 * Get GrowthBook organization ID
 */
async function getOrganizationId(token: string): Promise<string | null> {
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
 * Get current feature flag from GrowthBook
 */
async function getFeatureFlag(
  token: string,
  orgId: string,
  featureId: string
): Promise<Record<string, unknown> | null> {
  try {
    const response = await fetch(`${GROWTHBOOK_API_HOST}/feature/${featureId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-organization': orgId,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.feature || data;
  } catch (error) {
    console.error('[Feature Flags] Failed to get feature:', error);
    return null;
  }
}

/**
 * POST /api/feature-flags/update
 * Update a feature flag for the current tenant in GrowthBook
 *
 * Multi-tenant support:
 * - If tenantId is provided, creates/updates a targeting rule for that tenant
 * - If no tenantId, updates the global default value
 *
 * Required RBAC: Admin or Owner role
 *
 * Request body:
 * {
 *   featureId: string,    // The feature flag ID
 *   enabled: boolean,     // New enabled/disabled state
 *   tenantId?: string     // Optional: specific tenant to update (for per-tenant overrides)
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

    // Get organization ID
    const orgId = await getOrganizationId(token);
    if (!orgId) {
      return NextResponse.json(
        { success: false, message: 'Failed to get GrowthBook organization' },
        { status: 503 }
      );
    }

    let updatePayload: Record<string, unknown>;
    let updateMessage: string;

    if (tenantId) {
      // Multi-tenant: Update using targeting rules for specific tenant
      // Get current feature to preserve existing rules
      const currentFeature = await getFeatureFlag(token, orgId, featureId);

      // Get existing environment settings or create new
      const envSettings = (currentFeature?.environmentSettings as Record<string, unknown>) || {};
      const prodSettings = (envSettings.production as Record<string, unknown>) || { enabled: true, rules: [] };
      const existingRules = (prodSettings.rules as Array<Record<string, unknown>>) || [];

      // Find existing rule for this tenant or create new one
      const tenantRuleIndex = existingRules.findIndex(
        (rule) => {
          const condition = rule.condition as string | undefined;
          return condition?.includes(`tenantId`) && condition?.includes(tenantId);
        }
      );

      // Create the tenant-specific rule
      const tenantRule = {
        condition: JSON.stringify({ tenantId: { $eq: tenantId } }),
        force: enabled,
        description: `Override for tenant: ${tenantId}`,
        enabled: true,
      };

      // Update or add the rule
      if (tenantRuleIndex >= 0) {
        existingRules[tenantRuleIndex] = tenantRule;
      } else {
        existingRules.unshift(tenantRule); // Add at beginning so it takes precedence
      }

      updatePayload = {
        environmentSettings: {
          production: {
            enabled: true,
            rules: existingRules,
          },
        },
      };

      updateMessage = `Feature flag "${featureId}" has been ${enabled ? 'enabled' : 'disabled'} for tenant "${tenantId}"`;
    } else {
      // Global: Update the default value
      updatePayload = {
        defaultValue: enabled,
      };
      updateMessage = `Feature flag "${featureId}" has been ${enabled ? 'enabled' : 'disabled'} globally`;
    }

    // Update the feature flag in GrowthBook
    const updateResponse = await fetch(`${GROWTHBOOK_API_HOST}/feature/${featureId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-organization': orgId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatePayload),
    });

    const updateData = await updateResponse.json();

    if (!updateResponse.ok) {
      console.error('[Feature Flags] Update failed:', updateData);
      return NextResponse.json(
        {
          success: false,
          message: updateData.message || 'Failed to update feature flag',
          error: updateData
        },
        { status: updateResponse.status }
      );
    }

    // Log the change for audit
    console.log(`[Feature Flags] Flag "${featureId}" updated to ${enabled} by user ${userId} (roles: ${userRoles})${tenantId ? ` for tenant ${tenantId}` : ' (global)'}`);

    return NextResponse.json({
      success: true,
      message: updateMessage,
      data: {
        featureId,
        enabled,
        tenantId: tenantId || null,
        scope: tenantId ? 'tenant' : 'global',
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
