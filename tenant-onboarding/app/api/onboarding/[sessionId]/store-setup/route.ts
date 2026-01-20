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
