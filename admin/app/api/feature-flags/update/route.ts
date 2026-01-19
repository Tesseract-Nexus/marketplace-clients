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
 * POST /api/feature-flags/update
 * Update a feature flag's default value in GrowthBook
 *
 * Required RBAC: Admin or Owner role
 *
 * Request body:
 * {
 *   featureId: string,    // The feature flag ID
 *   enabled: boolean      // New enabled/disabled state
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get proxy headers for RBAC validation
    const proxyHeaders = await getProxyHeaders(request) as Record<string, string>;
    const userRole = proxyHeaders['x-jwt-claim-role'] || proxyHeaders['x-user-role'];
    const userId = proxyHeaders['x-jwt-claim-sub'] || proxyHeaders['x-user-id'];

    // RBAC: Only admin or owner can update feature flags
    const allowedRoles = ['admin', 'owner', 'super_admin', 'platform_admin'];
    if (!userRole || !allowedRoles.includes(userRole.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          message: 'Insufficient permissions. Only admins and owners can update feature flags.',
          requiredRole: 'admin or owner',
          currentRole: userRole || 'none'
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { featureId, enabled } = body;

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

    // Update the feature flag in GrowthBook
    // GrowthBook API: POST /feature/{id} to update
    const updateResponse = await fetch(`${GROWTHBOOK_API_HOST}/feature/${featureId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-organization': orgId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        defaultValue: enabled,
      }),
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
    console.log(`[Feature Flags] Flag "${featureId}" updated to ${enabled} by user ${userId} (role: ${userRole})`);

    return NextResponse.json({
      success: true,
      message: `Feature flag "${featureId}" has been ${enabled ? 'enabled' : 'disabled'}`,
      data: {
        featureId,
        enabled,
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
