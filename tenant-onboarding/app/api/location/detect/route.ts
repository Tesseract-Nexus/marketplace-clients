// GET /api/location/detect - Auto-detect user location
import { NextRequest } from 'next/server';
import { proxyGet, validateRequest, SERVICES } from '../../lib/api-handler';

export async function GET(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  // Extract IP from query params or headers
  const searchParams = request.nextUrl.searchParams;
  const ip = searchParams.get('ip');
  const endpoint = ip ? `/api/v1/location/detect?ip=${ip}` : '/api/v1/location/detect';

  return proxyGet(SERVICES.LOCATION, endpoint, request);
}
