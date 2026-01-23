import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const TICKETS_SERVICE_URL = getServiceUrl('TICKETS');

// Authorization is handled by the backend service via RBAC
// BFF just proxies the request with proper headers
export async function GET(request: NextRequest) {
  return proxyGet(TICKETS_SERVICE_URL, 'tickets', request);
}

export async function POST(request: NextRequest) {
  return proxyPost(TICKETS_SERVICE_URL, 'tickets', request);
}
