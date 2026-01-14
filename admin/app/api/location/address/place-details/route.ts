import { NextRequest } from 'next/server';
import { proxyRequest, SERVICES, validateRequest, errorResponse } from '../../../lib/api-handler';

export async function GET(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get('place_id');

  if (!placeId) {
    return errorResponse('place_id is required', 400);
  }

  return proxyRequest(
    SERVICES.LOCATION,
    `/api/v1/address/place-details?place_id=${encodeURIComponent(placeId)}`,
    request,
    { method: 'GET' }
  );
}
