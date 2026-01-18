/**
 * Tenant Service - handles tenant management API calls
 * Uses BFF pattern - calls Next.js API routes which proxy to tenant-service
 */

interface DeleteTenantRequest {
  confirmation_text: string;
  reason?: string;
}

interface DeleteTenantResponse {
  message: string;
  tenant_id: string;
  archived_record_id: string;
  archived_at: string;
}

interface TenantDeletionInfo {
  tenant_id: string;
  name: string;
  slug: string;
  member_count: number;
  created_at: string;
  is_owner: boolean;
  confirmation_required: string;
}

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

class TenantService {
  private getHeaders(): HeadersInit {
    // Auth is handled by BFF via secure HttpOnly cookies
    // No need to manually add Authorization header - BFF proxies requests with auth
    return {
      'Content-Type': 'application/json',
    };
  }

  private getRequestOptions(options: RequestInit = {}): RequestInit {
    return {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
      // Include credentials to send cookies for BFF authentication
      credentials: 'include' as RequestCredentials,
    };
  }

  /**
   * Get information needed for tenant deletion UI
   */
  async getDeletionInfo(tenantId: string): Promise<TenantDeletionInfo> {
    const response = await fetch(
      `/api/tenants/${tenantId}`,
      this.getRequestOptions({ method: 'GET' })
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get deletion info' }));
      throw new Error(error.message || error.error || 'Failed to get deletion info');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Delete a tenant (owner only)
   * This archives all data and publishes NATS event for K8s cleanup
   */
  async deleteTenant(
    tenantId: string,
    confirmationText: string,
    reason?: string
  ): Promise<DeleteTenantResponse> {
    const body: DeleteTenantRequest = {
      confirmation_text: confirmationText,
    };

    if (reason) {
      body.reason = reason;
    }

    const response = await fetch(
      `/api/tenants/${tenantId}`,
      this.getRequestOptions({
        method: 'DELETE',
        body: JSON.stringify(body),
      })
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete tenant' }));
      throw new Error(error.message || error.error || 'Failed to delete tenant');
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Get full tenant details including business info from onboarding
   * Used to auto-populate settings pages with data collected during onboarding
   * @param tenantId - The tenant ID
   * @param userId - Optional user ID to pass for auth (workaround for BFF cookie issues)
   */
  async getTenantDetails(tenantId: string, userId?: string): Promise<TenantDetails> {
    const options = this.getRequestOptions({ method: 'GET' });

    // Pass user ID as header if provided (helps with auth when BFF cookies don't propagate)
    if (userId) {
      options.headers = {
        ...options.headers,
        'x-jwt-claim-sub': userId,
      };
    }

    const response = await fetch(
      `/api/tenants/${tenantId}/details`,
      options
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get tenant details' }));
      throw new Error(error.message || error.error || 'Failed to get tenant details');
    }

    const data = await response.json();
    return data.data;
  }
}

export const tenantService = new TenantService();
