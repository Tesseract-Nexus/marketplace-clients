// GET /api/location/countries/[countryId] - Get country details
import { NextRequest } from 'next/server';
import { proxyGet, validateRequest, SERVICES } from '../../../lib/api-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ countryId: string }> }
) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const { countryId } = await params;
  return proxyGet(SERVICES.LOCATION, `/api/v1/countries/${countryId}`, request);
}
