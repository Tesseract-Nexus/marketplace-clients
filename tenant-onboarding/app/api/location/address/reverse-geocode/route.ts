// GET/POST /api/location/address/reverse-geocode - Convert coordinates to address
import { NextRequest } from 'next/server';
import { proxyGet, proxyPost, validateRequest, SERVICES, errorResponse } from '../../../lib/api-handler';

export async function GET(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const searchParams = request.nextUrl.searchParams;
  const latitude = searchParams.get('latitude');
  const longitude = searchParams.get('longitude');

  if (!latitude || !longitude) {
    return errorResponse('latitude and longitude are required', 400);
  }

  const endpoint = `/api/v1/address/reverse-geocode?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`;
  return proxyGet(SERVICES.LOCATION, endpoint, request);
}

export async function POST(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const endpoint = '/api/v1/address/reverse-geocode';
  return proxyPost(SERVICES.LOCATION, endpoint, request);
}
