// POST /api/location/address/format-manual - Format a manually entered address
import { NextRequest } from 'next/server';
import { proxyPost, validateRequest, SERVICES } from '../../../lib/api-handler';

export async function POST(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  const endpoint = '/api/v1/address/format-manual';
  return proxyPost(SERVICES.LOCATION, endpoint, request);
}
