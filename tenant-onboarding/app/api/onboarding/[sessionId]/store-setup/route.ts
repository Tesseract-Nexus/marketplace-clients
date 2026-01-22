/**
 * Store Setup API Route
 *
 * POST/PUT /api/onboarding/:sessionId/store-setup
 *
 * Saves store setup configuration (currency, timezone, etc.) to the backend.
 * This data is persisted in application_configurations and used during
 * account setup to configure the tenant.
 */

import { NextRequest } from 'next/server';
import { proxyPost, proxyPut, SERVICES, validateRequest, errorResponse } from '../../../lib/api-handler';

interface StoreSetupRequest {
  subdomain?: string;
  storefront_slug?: string;
  currency?: string;
  timezone?: string;
  language?: string;
  business_model?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  // Custom domain fields
  use_custom_domain?: boolean;
  custom_domain?: string;
  custom_admin_subdomain?: string;
  custom_storefront_subdomain?: string;
}

/**
 * Validates storefront subdomain format (apex domains are now supported via A records)
 * Returns error message if invalid, undefined if valid
 */
function validateStorefrontSubdomain(subdomain: string | undefined): string | undefined {
  // Apex domain (empty subdomain) is now allowed - we use A records for apex domains
  if (!subdomain || subdomain.trim() === '') {
    return undefined; // Apex domains are supported
  }

  // Check for valid subdomain characters
  const trimmed = subdomain.trim().toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(trimmed)) {
    return 'Subdomain can only contain letters, numbers, and hyphens (cannot start or end with hyphen)';
  }

  // Max length check
  if (trimmed.length > 63) {
    return 'Subdomain cannot exceed 63 characters';
  }

  return undefined;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) {
    return validationError;
  }

  try {
    const { sessionId } = await params;

    if (!sessionId || sessionId.length < 10) {
      return errorResponse('Invalid session ID', 400);
    }

    const body: StoreSetupRequest = await request.json();

    // Validate storefront subdomain if custom domain is enabled
    if (body.use_custom_domain && body.custom_domain) {
      const subdomainError = validateStorefrontSubdomain(body.custom_storefront_subdomain);
      if (subdomainError) {
        return errorResponse(subdomainError, 400);
      }
    }

    return proxyPost(
      SERVICES.TENANT,
      `/api/v1/onboarding/sessions/${sessionId}/store-setup`,
      request,
      body
    );
  } catch (error) {
    console.error('[Store Setup] Error:', error);
    return errorResponse(
      'Failed to save store setup',
      500,
      process.env.NODE_ENV === 'development' ? { error: String(error) } : undefined
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) {
    return validationError;
  }

  try {
    const { sessionId } = await params;

    if (!sessionId || sessionId.length < 10) {
      return errorResponse('Invalid session ID', 400);
    }

    const body: StoreSetupRequest = await request.json();

    // Validate storefront subdomain if custom domain is enabled
    if (body.use_custom_domain && body.custom_domain) {
      const subdomainError = validateStorefrontSubdomain(body.custom_storefront_subdomain);
      if (subdomainError) {
        return errorResponse(subdomainError, 400);
      }
    }

    return proxyPut(
      SERVICES.TENANT,
      `/api/v1/onboarding/sessions/${sessionId}/store-setup`,
      request,
      body
    );
  } catch (error) {
    console.error('[Store Setup] Error:', error);
    return errorResponse(
      'Failed to save store setup',
      500,
      process.env.NODE_ENV === 'development' ? { error: String(error) } : undefined
    );
  }
}
