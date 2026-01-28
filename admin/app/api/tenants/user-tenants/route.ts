import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders, handleApiError } from '@/lib/utils/api-route-handler';

// Service URLs
const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8082';
const CUSTOM_DOMAIN_SERVICE_URL = process.env.CUSTOM_DOMAIN_SERVICE_URL || 'http://custom-domain-service.marketplace.svc.cluster.local:8093';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: string;
  isDefault: boolean;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  displayName?: string;
  businessModel?: 'ONLINE_STORE' | 'MARKETPLACE';
  createdAt?: string;
  // Custom domain support
  adminUrl?: string;
  customDomain?: string;
  useCustomDomain?: boolean;
}

interface CustomDomain {
  id: string;
  domain: string;
  target_type: 'admin' | 'storefront' | 'api';
  status: string;
  tenant_id: string;
}

interface ApiResponse {
  success: boolean;
  tenants?: Tenant[];
  message?: string;
}

/**
 * Fetch admin domain for a tenant from the custom-domain-service
 * Returns the admin URL if a custom admin domain is configured and active
 */
async function fetchAdminDomainForTenant(
  tenantId: string,
  headers: Record<string, string>
): Promise<{ adminUrl?: string; customDomain?: string } | null> {
  try {
    const response = await fetch(
      `${CUSTOM_DOMAIN_SERVICE_URL}/api/v1/domains?limit=10`,
      {
        method: 'GET',
        headers: {
          ...headers,
          'X-Tenant-ID': tenantId,
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json',
        },
        // Don't cache custom domain lookups during tenant switching
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.log(`[user-tenants] No custom domains found for tenant ${tenantId}`);
      return null;
    }

    const result = await response.json();
    // Find an active admin domain
    const domains: CustomDomain[] = result.domains || result.data?.domains || [];

    const adminDomain = domains.find(
      (d) => d.target_type === 'admin' && d.status === 'active'
    );

    if (adminDomain) {
      return {
        adminUrl: `https://${adminDomain.domain}`,
        customDomain: adminDomain.domain,
      };
    }

    return null;
  } catch (error) {
    console.error(`[user-tenants] Error fetching admin domain for tenant ${tenantId}:`, error);
    return null;
  }
}

/**
 * GET /api/tenants/user-tenants
 * Get all tenants accessible by the current user
 * Enriches tenant data with custom admin domain URLs if configured
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const userId = headers['x-jwt-claim-sub'];

    // Require authentication - return 401 if no user ID found
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Try to fetch from Tenant Service
    // Uses /users/me/tenants with Istio JWT headers
    const response = await fetch(
      `${TENANT_SERVICE_URL}/api/v1/users/me/tenants`,
      {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
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
          faviconUrl: t.favicon_url as string | undefined,
          primaryColor: t.primary_color || '#6366f1',
          secondaryColor: t.secondary_color || '#8b5cf6',
          displayName: t.display_name,
          businessModel: t.business_model as 'ONLINE_STORE' | 'MARKETPLACE' | undefined,
          createdAt: t.created_at as string | undefined,
          // Custom domain support - map from backend fields (if available)
          adminUrl: t.admin_url as string | undefined,
          customDomain: t.custom_domain as string | undefined,
          useCustomDomain: t.use_custom_domain as boolean | undefined,
        }));

        // Enrich tenants with custom admin domain URLs
        // Fetch custom domains for each tenant in parallel
        const enrichedTenants = await Promise.all(
          tenants.map(async (tenant) => {
            // Skip if tenant already has an admin URL from backend
            if (tenant.adminUrl) {
              return tenant;
            }

            // Fetch admin domain from custom-domain-service
            const domainInfo = await fetchAdminDomainForTenant(tenant.id, headers);

            if (domainInfo) {
              return {
                ...tenant,
                adminUrl: domainInfo.adminUrl,
                customDomain: domainInfo.customDomain,
                useCustomDomain: true,
              };
            }

            return tenant;
          })
        );

        return NextResponse.json({
          success: true,
          tenants: enrichedTenants,
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
    return handleApiError(error, 'GET tenants/user-tenants');
  }
}
