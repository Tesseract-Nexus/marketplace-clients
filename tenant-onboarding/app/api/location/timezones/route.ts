// GET /api/location/timezones - Get all timezones
import { NextRequest } from 'next/server';
import { proxyGet, validateRequest, SERVICES } from '../../lib/api-handler';

export async function GET(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/v1/timezones?${queryString}` : '/api/v1/timezones';

  return proxyGet(SERVICES.LOCATION, endpoint, request);
}
