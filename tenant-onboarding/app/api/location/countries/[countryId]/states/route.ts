// GET /api/location/countries/[countryId]/states - Get states for a country
import { NextRequest } from 'next/server';
import { proxyGet, validateRequest, SERVICES } from '../../../../lib/api-handler';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ countryId: string }> }
) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  // In Next.js 15+, params is a Promise
  const params = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();
  const endpoint = queryString
    ? `/api/v1/countries/${params.countryId}/states?${queryString}`
    : `/api/v1/countries/${params.countryId}/states`;

  return proxyGet(SERVICES.LOCATION, endpoint, request);
}
