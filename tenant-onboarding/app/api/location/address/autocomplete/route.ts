// GET /api/location/address/autocomplete - Get address suggestions
import { NextRequest } from 'next/server';
import { proxyGet, validateRequest, SERVICES } from '../../../lib/api-handler';

export async function GET(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  // Build query string from search params
  const searchParams = request.nextUrl.searchParams;
  const params = new URLSearchParams();

  // Required parameter
  const input = searchParams.get('input');
  if (input) params.append('input', input);

  // Optional parameters
  const sessionToken = searchParams.get('session_token');
  if (sessionToken) params.append('session_token', sessionToken);

  const components = searchParams.get('components');
  if (components) params.append('components', components);

  const language = searchParams.get('language');
  if (language) params.append('language', language);

  const latitude = searchParams.get('latitude');
  if (latitude) params.append('latitude', latitude);

  const longitude = searchParams.get('longitude');
  if (longitude) params.append('longitude', longitude);

  const radius = searchParams.get('radius');
  if (radius) params.append('radius', radius);

  const endpoint = `/api/v1/address/autocomplete?${params.toString()}`;
  return proxyGet(SERVICES.LOCATION, endpoint, request);
}
