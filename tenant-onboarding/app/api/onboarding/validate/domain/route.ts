// POST /api/onboarding/validate/domain - Validate domain availability
import { NextRequest } from 'next/server';
import { proxyGet, validateRequest, SERVICES } from '../../../lib/api-handler';

export async function POST(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const body = await request.json();
  const domain = body.domain;
  
  // Backend expects GET with query param
  const endpoint = `/api/v1/validation/business-name?business_name=${encodeURIComponent(domain)}`;
  return proxyGet(SERVICES.TENANT, endpoint, request);
}