// POST /api/location/address/parse - Parse a raw address string into components
import { NextRequest } from 'next/server';
import { proxyPost, validateRequest, SERVICES } from '../../../lib/api-handler';

export async function POST(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const endpoint = '/api/v1/address/parse';
  return proxyPost(SERVICES.LOCATION, endpoint, request);
}
