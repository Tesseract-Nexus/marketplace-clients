import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

export async function GET(request: NextRequest) {
  return proxyGet(STAFF_SERVICE_URL, 'documents/expiring', request);
}
