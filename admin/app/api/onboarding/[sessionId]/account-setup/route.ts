/**
 * Account Setup API Route
 *
 * POST /api/onboarding/:sessionId/account-setup
 *
 * Creates the tenant and user account after email verification.
 * This is the final step of onboarding that provisions the actual tenant.
 */

import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { SERVICES, validateRequest, errorResponse, generateRequestId } from '../../../lib/api-handler';
import { cache } from '@/lib/cache/redis';

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
    if (body.auth_method !== 'google' && (!body.password || body.password.length < 10)) {
      return errorResponse('Password must be at least 10 characters', 400);
    }

    const payload = {
      password: body.password,
      auth_method: body.auth_method || 'password',
      timezone: body.timezone || 'UTC',
      currency: body.currency || 'USD',
      business_model: body.business_model || 'ONLINE_STORE',
    };

    // Call tenant-service directly so we can invalidate admin tenant-details cache on success.
    const response = await fetch(
      `${SERVICES.TENANT}/api/v1/onboarding/sessions/${sessionId}/account-setup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': generateRequestId(),
          'X-Forwarded-For': request.headers.get('x-forwarded-for') || 'unknown',
          'User-Agent': request.headers.get('user-agent') || 'admin-bff',
          ...(request.headers.get('authorization')
            ? { Authorization: request.headers.get('authorization') as string }
            : {}),
        },
        body: JSON.stringify(payload),
      }
    );

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = responseData?.error?.message || responseData?.message || 'Account setup failed';
      return errorResponse(message, response.status, responseData);
    }

    // Invalidate tenant-details cache so Admin reflects onboarding store_setup immediately.
    const tenantData = responseData?.data || responseData;
    const tenantId = tenantData?.tenant_id || tenantData?.tenant?.id;
    const tenantSlug = tenantData?.tenant_slug || tenantData?.tenant?.slug;

    if (tenantId) {
      await cache.delPattern(`tenant:details:${tenantId}:*`);
    }
    if (tenantSlug) {
      await cache.delPattern(`tenant:details:${tenantSlug}:*`);
    }

    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error('[Account Setup] Error:', error);
    return errorResponse(
      'Failed to complete account setup',
      500,
      process.env.NODE_ENV === 'development' ? { error: String(error) } : undefined
    );
  }
}
