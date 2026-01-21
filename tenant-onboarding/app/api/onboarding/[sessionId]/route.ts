// GET /api/onboarding/[sessionId] - Get onboarding session details
import { NextRequest } from 'next/server';
import { proxyGet, validateRequest, SERVICES } from '../../lib/api-handler';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const params = await context.params;

  // Forward query parameters (e.g., ?include=contact_information) to backend
  const url = new URL(request.url);
  const queryString = url.search;

  return proxyGet(SERVICES.TENANT, `/api/v1/onboarding/sessions/${params.sessionId}${queryString}`, request);
}
