import { NextRequest } from 'next/server';
import { proxyRequest, SERVICES, validateRequest, errorResponse } from '../../../lib/api-handler';

export async function GET(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input');

  if (!input || input.length < 3) {
    return errorResponse('Input must be at least 3 characters', 400);
  }

  const queryString = searchParams.toString();
  return proxyRequest(
    SERVICES.LOCATION,
    `/api/v1/address/autocomplete?${queryString}`,
    request,
    { method: 'GET' }
  );
}
