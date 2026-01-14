// GET /api/location/currencies - Get all currencies
import { NextRequest } from 'next/server';
import { proxyGet, validateRequest, SERVICES } from '../../lib/api-handler';

export async function GET(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/v1/currencies?${queryString}` : '/api/v1/currencies';

  return proxyGet(SERVICES.LOCATION, endpoint, request);
}
