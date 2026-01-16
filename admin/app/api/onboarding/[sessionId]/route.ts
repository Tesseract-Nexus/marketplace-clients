// GET /api/onboarding/[sessionId] - Get onboarding session details
import { NextRequest } from 'next/server';
import { proxyGet, validateRequest, SERVICES, errorResponse } from '../../lib/api-handler';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const params = await context.params;

  // Validate sessionId format
  if (!params.sessionId || params.sessionId.length < 10) {
    return errorResponse('Invalid session ID', 400);
  }

  return proxyGet(SERVICES.TENANT, `/api/v1/onboarding/sessions/${params.sessionId}`, request);
}
