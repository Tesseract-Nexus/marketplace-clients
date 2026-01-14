// POST /api/onboarding/[sessionId]/complete - Complete onboarding
import { NextRequest } from 'next/server';
import { proxyPost, validateRequest, SERVICES } from '../../../lib/api-handler';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const params = await context.params;
  return proxyPost(SERVICES.TENANT, `/api/v1/onboarding/sessions/${params.sessionId}/complete`, request);
}
