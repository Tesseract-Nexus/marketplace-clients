import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPut } from '@/lib/utils/api-route-handler';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

export async function GET(request: NextRequest) {
  return proxyGet(STAFF_SERVICE_URL, 'auth/sso/config', request);
}

export async function PUT(request: NextRequest) {
  return proxyPut(STAFF_SERVICE_URL, 'auth/sso/config', request);
}
