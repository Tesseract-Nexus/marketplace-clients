// GET /api/onboarding/validate/business-name - Validate business name availability
import { NextRequest } from 'next/server';
import { proxyGet, validateRequest, SERVICES } from '../../../lib/api-handler';

export async function GET(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const { searchParams } = new URL(request.url);
  const businessName = searchParams.get('business_name');
  const sessionId = searchParams.get('session_id');

  if (!businessName) {
    return new Response(JSON.stringify({ error: 'business_name is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let endpoint = `/api/v1/validation/business-name?business_name=${encodeURIComponent(businessName)}`;
  if (sessionId) {
    endpoint += `&session_id=${encodeURIComponent(sessionId)}`;
  }

  return proxyGet(SERVICES.TENANT, endpoint, request);
}
