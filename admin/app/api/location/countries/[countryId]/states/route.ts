import { NextRequest } from 'next/server';
import { proxyRequest, SERVICES, validateRequest } from '../../../../lib/api-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ countryId: string }> }
) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const { countryId } = await params;
  const { searchParams } = new URL(request.url);

  const queryString = searchParams.toString();
  const endpoint = `/api/v1/countries/${countryId}/states${queryString ? `?${queryString}` : ''}`;

  return proxyRequest(SERVICES.LOCATION, endpoint, request, { method: 'GET' });
}
