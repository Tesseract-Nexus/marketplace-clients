import { NextRequest, NextResponse } from 'next/server';
import { cache, cacheKeys, cacheTTL } from '@/lib/cache/redis';
import { getAuthHeaders } from '@/app/api/lib/auth-helper';

// Tenant Service URL - connects to the backend Go service
const TENANT_SERVICE_URL = process.env.TENANT_SERVICE_URL || 'http://localhost:8082';

/**
 * Tenant details including business information from onboarding
 */
export interface TenantDetails {
  id: string;
  name: string;
  slug: string;
  display_name: string;
  status: string;

  // Business information from onboarding
  business_info?: {
    business_name: string;
    business_type: string;
    industry: string;
    business_description?: string;
    website?: string;
    registration_number?: string;
    tax_id?: string;
  };

  // Primary contact from onboarding
  contact_info?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    position?: string;
  };

  // Business address from onboarding
  address?: {
    street_address: string;
    address_line_2?: string;
    city: string;
    state_province?: string;
    postal_code?: string;
    country: string;
  };

  // Store setup from onboarding
  store_setup?: {
    subdomain: string;
    currency: string;
    timezone: string;
    language: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };

  created_at: string;
  updated_at: string;
}

/**
 * Response type from tenant-service /api/v1/tenants/:id/onboarding-data endpoint
 */
interface OnboardingDataResponse {
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;
  completed_at?: string;
  business?: {
    business_name: string;
    business_type: string;
    industry: string;
    description?: string;
    website?: string;
    registration_number?: string;
    tax_id?: string;
  };
  contact?: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    phone_country_code?: string;
    job_title?: string;
  };
  address?: {
    street_address: string;
    address_line_2?: string;
    city: string;
    state_province?: string;
    postal_code?: string;
    country: string;
  };
  store_setup?: {
    subdomain: string;
    currency: string;
    timezone: string;
    language?: string;
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
  };
}

/**
 * GET /api/tenants/[id]/details
 * Get full tenant details including business info from onboarding
 *
 * This endpoint returns all tenant data needed for auto-populating
 * settings pages with data collected during tenant onboarding.
 *
 * Flow:
 * 1. Fetch basic tenant info from internal endpoint
 * 2. Fetch onboarding data from secure /api/v1/tenants/:id/onboarding-data endpoint
 * 3. Merge both to create complete TenantDetails
 *
 * Security: The onboarding-data endpoint enforces multi-tenant isolation
 * by verifying user membership before returning any PII data.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { userId, authToken } = await getAuthHeaders(request);

    // Note: userId is optional - we can still fetch basic tenant config
    // Sensitive PII data (contact, address) requires auth via backend endpoint

    // Check cache first (keyed by both tenant and user for security)
    const cacheKey = `tenant:details:${id}:${userId}`;
    const cached = await cache.get<TenantDetails>(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true
      });
    }

    // Determine if id is UUID or slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // Step 1: Fetch basic tenant info
    const internalEndpoint = isUUID
      ? `${TENANT_SERVICE_URL}/internal/tenants/${id}`
      : `${TENANT_SERVICE_URL}/internal/tenants/by-slug/${id}`;

    const tenantResponse = await fetch(internalEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service': 'admin-portal',
      },
    });

    let tenantData: Record<string, unknown> | null = null;
    let tenantId = id;

    if (tenantResponse.ok) {
      const responseData = await tenantResponse.json();
      tenantData = responseData.data || responseData;
      // Get the actual tenant ID if we queried by slug
      if (tenantData?.id) {
        tenantId = String(tenantData.id);
      }
    } else {
      // Fallback: try the context endpoint which requires user auth
      const contextResponse = await fetch(
        `${TENANT_SERVICE_URL}/api/v1/tenants/${id}/context`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': userId,
            ...(authToken && { 'Authorization': authToken }),
          },
        }
      );

      if (contextResponse.ok) {
        const contextData = await contextResponse.json();
        tenantData = contextData.data?.context || contextData.data || contextData;
        if (tenantData?.id || tenantData?.tenant_id) {
          tenantId = String(tenantData.id || tenantData.tenant_id);
        }
      }
    }

    if (!tenantData) {
      console.error(`[Tenant Details] Failed to fetch tenant ${id}`);
      return NextResponse.json(
        { success: false, message: 'Failed to get tenant details' },
        { status: 404 }
      );
    }

    // Step 2: Fetch onboarding data with multi-tenant access control
    // This endpoint verifies user membership before returning PII data
    let onboardingData: OnboardingDataResponse | null = null;

    try {
      const onboardingResponse = await fetch(
        `${TENANT_SERVICE_URL}/api/v1/tenants/${tenantId}/onboarding-data`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': userId,
            ...(authToken && { 'Authorization': authToken }),
          },
        }
      );

      if (onboardingResponse.ok) {
        const responseData = await onboardingResponse.json();
        onboardingData = responseData.data || null;
      } else if (onboardingResponse.status === 403) {
        // Access denied - user doesn't have access to this tenant
        console.warn(`[Tenant Details] Access denied for user ${userId} to tenant ${tenantId}`);
        return NextResponse.json(
          { success: false, message: 'Access denied to this tenant' },
          { status: 403 }
        );
      } else {
        // Log but continue - onboarding data might not exist for all tenants
        console.log(`[Tenant Details] No onboarding data for tenant ${tenantId}: ${onboardingResponse.status}`);
      }
    } catch (onboardingError) {
      // Log but continue - fallback to basic tenant data
      console.warn(`[Tenant Details] Failed to fetch onboarding data:`, onboardingError);
    }

    // Step 3: Build complete TenantDetails by merging tenant info and onboarding data
    const details: TenantDetails = {
      id: String(tenantData.id || tenantData.tenant_id || tenantId),
      name: String(tenantData.name || ''),
      slug: String(tenantData.slug || tenantData.subdomain || ''),
      display_name: String(tenantData.display_name || tenantData.name || ''),
      status: String(tenantData.status || 'active'),
      created_at: String(tenantData.created_at || ''),
      updated_at: String(tenantData.updated_at || ''),

      // Use onboarding data if available, otherwise fall back to tenant model data
      business_info: onboardingData?.business ? {
        business_name: onboardingData.business.business_name || '',
        business_type: onboardingData.business.business_type || '',
        industry: onboardingData.business.industry || '',
        business_description: onboardingData.business.description || '',
        website: onboardingData.business.website || '',
        registration_number: onboardingData.business.registration_number || '',
        tax_id: onboardingData.business.tax_id || '',
      } : {
        business_name: String(tenantData.name || tenantData.display_name || ''),
        business_type: String(tenantData.business_type || ''),
        industry: String(tenantData.industry || ''),
        business_description: '',
        website: '',
        registration_number: '',
        tax_id: '',
      },

      // Contact info from onboarding (PII - only available via secure endpoint)
      contact_info: onboardingData?.contact ? {
        first_name: onboardingData.contact.first_name || '',
        last_name: onboardingData.contact.last_name || '',
        email: onboardingData.contact.email || '',
        phone: onboardingData.contact.phone || '',
        position: onboardingData.contact.job_title || '',
      } : (tenantData.billing_email ? {
        first_name: '',
        last_name: '',
        email: String(tenantData.billing_email),
        phone: '',
        position: '',
      } : undefined),

      // Business address from onboarding (PII - only available via secure endpoint)
      address: onboardingData?.address ? {
        street_address: onboardingData.address.street_address || '',
        address_line_2: onboardingData.address.address_line_2 || '',
        city: onboardingData.address.city || '',
        state_province: onboardingData.address.state_province || '',
        postal_code: onboardingData.address.postal_code || '',
        country: onboardingData.address.country || '',
      } : undefined,

      // Store setup - merge onboarding data with tenant defaults
      store_setup: {
        subdomain: onboardingData?.store_setup?.subdomain || String(tenantData.subdomain || tenantData.slug || ''),
        currency: onboardingData?.store_setup?.currency || String(tenantData.default_currency || 'USD'),
        timezone: onboardingData?.store_setup?.timezone || String(tenantData.default_timezone || 'America/Los_Angeles'),
        language: onboardingData?.store_setup?.language || 'en',
        logo_url: onboardingData?.store_setup?.logo_url || String(tenantData.logo_url || ''),
        primary_color: onboardingData?.store_setup?.primary_color || String(tenantData.primary_color || '#6366f1'),
        secondary_color: onboardingData?.store_setup?.secondary_color || String(tenantData.secondary_color || '#8b5cf6'),
      },
    };

    // Cache for 5 minutes (keyed by user to ensure tenant isolation)
    await cache.set(cacheKey, details, cacheTTL.tenant);

    return NextResponse.json({ success: true, data: details });
  } catch (error) {
    console.error('Error getting tenant details:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get tenant details' },
      { status: 500 }
    );
  }
}
