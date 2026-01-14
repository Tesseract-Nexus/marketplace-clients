import { NextRequest } from 'next/server';
import { proxyRequest, SERVICES, validateRequest, errorResponse } from '../../../lib/api-handler';

export async function GET(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const { searchParams } = new URL(request.url);
  const latitude = searchParams.get('latitude');
  const longitude = searchParams.get('longitude');

  if (!latitude || !longitude) {
    return errorResponse('latitude and longitude are required', 400);
  }

  return proxyRequest(
    SERVICES.LOCATION,
    `/api/v1/address/reverse-geocode?latitude=${latitude}&longitude=${longitude}`,
    request,
    { method: 'GET' }
  );
}
