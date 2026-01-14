// GET /api/location/address/place-details - Get full address details from place ID
import { NextRequest } from 'next/server';
import { proxyGet, validateRequest, SERVICES, errorResponse } from '../../../lib/api-handler';

export async function GET(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get('place_id');

  if (!placeId) {
    return errorResponse('place_id is required', 400);
  }

  const endpoint = `/api/v1/address/place-details?place_id=${encodeURIComponent(placeId)}`;
  return proxyGet(SERVICES.LOCATION, endpoint, request);
}
