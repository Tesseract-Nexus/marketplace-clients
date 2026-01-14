import { NextRequest, NextResponse } from 'next/server';
import { getAuthHeaders } from '../../lib/auth-helper';

// Tenant Service URL - connects to the backend Go service
const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8082';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: string;
  isDefault: boolean;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  displayName?: string;
  businessModel?: 'ONLINE_STORE' | 'MARKETPLACE';
}

interface ApiResponse {
  success: boolean;
  tenants?: Tenant[];
  message?: string;
}

/**
 * GET /api/tenants/user-tenants
 * Get all tenants accessible by the current user
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { userId, authToken } = await getAuthHeaders(request);

    // Require authentication - return 401 if no user ID found
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Try to fetch from Tenant Service
    // Uses /users/me/tenants with X-User-ID header
    const response = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/users/me/tenants`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
          ...(authToken && { 'Authorization': authToken }),
        },
        // Short cache for tenant data
        next: { revalidate: 30 },
      }
    );

    if (response.ok) {
      const result = await response.json();
      // Response format: { success: true, data: { tenants: [...], count: N } }
      if (result.success && result.data?.tenants) {
        // Transform the response to match our Tenant interface
        const tenants: Tenant[] = result.data.tenants.map((t: Record<string, unknown>) => ({
          id: t.tenant_id || t.id,
          name: t.name || t.tenant_name,
          slug: t.slug,
          role: t.role,
          isDefault: t.is_default || false,
          logoUrl: t.logo_url,
          primaryColor: t.primary_color || '#6366f1',
          secondaryColor: t.secondary_color || '#8b5cf6',
          displayName: t.display_name,
          businessModel: t.business_model as 'ONLINE_STORE' | 'MARKETPLACE' | undefined,
        }));

        return NextResponse.json({
          success: true,
          tenants,
        });
      }
    }

    // Return error when tenant service is unavailable
    console.error('Tenant service unavailable or returned invalid response');
    return NextResponse.json(
      { success: false, message: 'Tenant service unavailable' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Error fetching user tenants:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tenants' },
      { status: 500 }
    );
  }
}
