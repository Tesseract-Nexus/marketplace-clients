// PUT /api/onboarding/[sessionId]/business - Update business information
import { NextRequest } from 'next/server';
import { proxyPut, validateRequest, SERVICES } from '../../../lib/api-handler';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const params = await context.params;
  return proxyPut(SERVICES.TENANT, `/api/v1/onboarding/sessions/${params.sessionId}/business-information`, request);
}

// Also support POST for flexibility
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  return PUT(request, context);
}
