import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost, getProxyHeaders, handleApiError } from '@/lib/utils/api-route-handler';

const VENDORS_SERVICE_URL = getServiceUrl('VENDORS');
const CUSTOM_DOMAIN_SERVICE_URL = process.env.CUSTOM_DOMAIN_SERVICE_URL || 'http://custom-domain-service.marketplace.svc.cluster.local:8093';

interface CustomDomain {
  id: string;
  domain: string;
  target_type: 'admin' | 'storefront' | 'api';
  status: string;
  tenant_id: string;
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
 * Fetch storefront domain for a tenant from the custom-domain-service
 * Returns the storefront URL if a custom storefront domain is configured and active
 */
async function fetchStorefrontDomainForTenant(
  tenantId: string,
  headers: Record<string, string>
): Promise<{ storefrontUrl?: string; customDomain?: string } | null> {
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
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      console.log(`[storefronts] No custom domains found for tenant ${tenantId}`);
      return null;
    }

    const result = await response.json();
    const domains: CustomDomain[] = result.domains || result.data?.domains || [];

    // Find an active storefront domain
    const storefrontDomain = domains.find(
      (d) => d.target_type === 'storefront' && d.status === 'active'
    );

    if (storefrontDomain) {
      return {
        storefrontUrl: `https://${storefrontDomain.domain}`,
        customDomain: storefrontDomain.domain,
      };
    }

    return null;
  } catch (error) {
    console.error(`[storefronts] Error fetching storefront domain for tenant ${tenantId}:`, error);
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

    // Fetch custom storefront domain for the current tenant
    const domainInfo = await fetchStorefrontDomainForTenant(tenantId, headers);

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
