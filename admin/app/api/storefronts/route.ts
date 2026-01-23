import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost, getProxyHeaders, handleApiError } from '@/lib/utils/api-route-handler';

const VENDORS_SERVICE_URL = getServiceUrl('VENDORS');
const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://tenant-service.marketplace.svc.cluster.local:8082';

interface TenantInfo {
  storefront_url?: string;
  custom_domain?: string;
  use_custom_domain?: boolean;
}

interface Storefront {
  id: string;
  vendorId: string;
  slug: string;
  name: string;
  customDomain?: string;
  storefrontUrl?: string;
  [key: string]: unknown;
}

/**
 * Fetch tenant info from tenant-service to get the storefront_url
 * The tenant-service stores the storefront URL set during onboarding
 */
async function fetchTenantStorefrontUrl(
  tenantId: string
): Promise<{ storefrontUrl?: string; customDomain?: string } | null> {
  try {
    // Use internal endpoint which returns full tenant data including URL fields
    // Internal endpoints use X-Internal-Service header instead of user auth
    const response = await fetch(
      `${TENANT_SERVICE_URL}/internal/tenants/${tenantId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service': 'admin-portal',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.log(`[storefronts] Failed to fetch tenant ${tenantId}: ${response.status}`);
      return null;
    }

    const result = await response.json();
    const tenant: TenantInfo = result.data || result;

    console.log(`[storefronts] Tenant ${tenantId} - storefront_url: ${tenant.storefront_url}, custom_domain: ${tenant.custom_domain}, use_custom_domain: ${tenant.use_custom_domain}`);

    // Only use custom domain URL if use_custom_domain is true and storefront_url is set
    if (tenant.use_custom_domain && tenant.storefront_url) {
      return {
        storefrontUrl: tenant.storefront_url,
        customDomain: tenant.custom_domain,
      };
    }

    return null;
  } catch (error) {
    console.error(`[storefronts] Error fetching tenant ${tenantId}:`, error);
    return null;
  }
}

/**
 * GET /api/storefronts
 * List all storefronts with optional pagination and filters
 * Enriches storefront data with custom domain URLs if configured
 */
export async function GET(request: NextRequest) {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = headers['x-jwt-claim-tenant-id'];

    // Fetch storefronts from vendor service
    const { searchParams } = new URL(request.url);
    const vendorResponse = await fetch(
      `${VENDORS_SERVICE_URL}/storefronts?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!vendorResponse.ok) {
      const errorData = await vendorResponse.json().catch(() => ({}));
      return NextResponse.json(errorData, { status: vendorResponse.status });
    }

    const result = await vendorResponse.json();

    // If no tenant ID or no storefronts, return as-is
    if (!tenantId || !result.data || !Array.isArray(result.data)) {
      return NextResponse.json(result);
    }

    // Fetch tenant info to get the storefront URL
    const domainInfo = await fetchTenantStorefrontUrl(tenantId);

    if (domainInfo?.storefrontUrl) {
      // Enrich storefronts with the custom domain URL
      result.data = result.data.map((storefront: Storefront) => ({
        ...storefront,
        storefrontUrl: domainInfo.storefrontUrl,
        customDomain: domainInfo.customDomain,
      }));
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, 'GET storefronts');
  }
}

/**
 * POST /api/storefronts
 * Create a new storefront
 */
export async function POST(request: NextRequest) {
  return proxyPost(VENDORS_SERVICE_URL, 'storefronts', request);
}
