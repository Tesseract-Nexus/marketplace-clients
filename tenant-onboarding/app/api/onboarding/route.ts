// POST /api/onboarding - Start new onboarding session
import { NextRequest } from 'next/server';
import { proxyPost, validateRequest, SERVICES } from '../lib/api-handler';

export async function POST(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  return proxyPost(SERVICES.TENANT, '/api/v1/onboarding/sessions', request);
}
