// GET/POST /api/location/address/validate - Validate an address
import { NextRequest } from 'next/server';
import { proxyGet, proxyPost, validateRequest, SERVICES, errorResponse } from '../../../lib/api-handler';

export async function GET(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const searchParams = request.nextUrl.searchParams;
  const address = searchParams.get('address');

  if (!address) {
    return errorResponse('address is required', 400);
  }

  const endpoint = `/api/v1/address/validate?address=${encodeURIComponent(address)}`;
  return proxyGet(SERVICES.LOCATION, endpoint, request);
}

export async function POST(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const endpoint = '/api/v1/address/validate';
  return proxyPost(SERVICES.LOCATION, endpoint, request);
}
