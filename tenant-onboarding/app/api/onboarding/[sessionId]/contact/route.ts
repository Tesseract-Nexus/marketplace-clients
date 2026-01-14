// PUT /api/onboarding/[sessionId]/contact - Update contact information
import { NextRequest } from 'next/server';
import { proxyPost, validateRequest, SERVICES } from '../../../lib/api-handler';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const params = await context.params;
  return proxyPost(SERVICES.TENANT, `/api/v1/onboarding/sessions/${params.sessionId}/contact-information`, request);
}

// Also support POST for flexibility
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  return PUT(request, context);
}
