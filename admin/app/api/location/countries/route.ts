import { NextRequest } from 'next/server';
import { proxyRequest, SERVICES, validateRequest } from '../../lib/api-handler';

export async function GET(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const { searchParams } = new URL(request.url);

  // Pass through query params
  const queryString = searchParams.toString();
  const endpoint = `/api/v1/countries${queryString ? `?${queryString}` : ''}`;

  return proxyRequest(SERVICES.LOCATION, endpoint, request, { method: 'GET' });
}
