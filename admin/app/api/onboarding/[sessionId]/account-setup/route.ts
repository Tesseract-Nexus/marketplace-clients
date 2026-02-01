/**
 * Account Setup API Route
 *
 * POST /api/onboarding/:sessionId/account-setup
 *
 * Creates the tenant and user account after email verification.
 * This is the final step of onboarding that provisions the actual tenant.
 */

import { NextRequest } from 'next/server';
import { proxyPost, SERVICES, validateRequest, errorResponse } from '../../../lib/api-handler';

interface AccountSetupRequest {
  password?: string;
  auth_method?: 'password' | 'google'; // Must match backend validation
  timezone?: string;
  currency?: string;
  business_model?: 'ONLINE_STORE' | 'MARKETPLACE';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  // Validate request
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) {
    return validationError;
  }

  try {
    const { sessionId } = await params;

    // Validate sessionId
    if (!sessionId || sessionId.length < 10) {
      return errorResponse('Invalid session ID', 400);
    }

    // Parse request body
    const body: AccountSetupRequest = await request.json();

    // Validate required fields (password required only for password auth)
    if (body.auth_method !== 'google' && (!body.password || body.password.length < 8)) {
      return errorResponse('Password must be at least 8 characters', 400);
    }

    // Proxy to tenant-service account-setup endpoint
    return proxyPost(
      SERVICES.TENANT,
      `/api/v1/onboarding/sessions/${sessionId}/account-setup`,
      request,
      {
        password: body.password,
        auth_method: body.auth_method || 'password',
        timezone: body.timezone || 'UTC',
        currency: body.currency || 'USD',
        business_model: body.business_model || 'ONLINE_STORE',
      }
    );
  } catch (error) {
    console.error('[Account Setup] Error:', error);
    return errorResponse(
      'Failed to complete account setup',
      500,
      process.env.NODE_ENV === 'development' ? { error: String(error) } : undefined
    );
  }
}
