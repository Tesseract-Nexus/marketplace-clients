import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

export async function GET(request: NextRequest) {
  // Proxy to staff-service /me/permissions endpoint
  // This endpoint doesn't require prior permissions - used for bootstrap
  return proxyGet(STAFF_SERVICE_URL, 'me/permissions', request);
}
