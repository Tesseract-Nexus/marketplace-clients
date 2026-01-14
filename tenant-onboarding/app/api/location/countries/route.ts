// GET /api/location/countries - Get list of countries
import { NextRequest } from 'next/server';
import { proxyGet, validateRequest, SERVICES } from '../../lib/api-handler';

export async function GET(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  // Forward query params (search, region, limit, offset)
  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/v1/countries?${queryString}` : '/api/v1/countries';

  return proxyGet(SERVICES.LOCATION, endpoint, request);
}
