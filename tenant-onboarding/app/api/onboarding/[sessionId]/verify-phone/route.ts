// POST /api/onboarding/[sessionId]/verify-phone - Verify phone
import { NextRequest } from 'next/server';
import { proxyPost, validateRequest, SERVICES } from '../../../lib/api-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const { sessionId } = await params;
  return proxyPost(SERVICES.TENANT, `/api/onboarding/${sessionId}/verify-phone`, request);
}
