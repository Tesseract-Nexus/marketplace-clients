import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const ANALYTICS_SERVICE_URL = getServiceUrl('ANALYTICS');

export async function GET(request: NextRequest) {
  return proxyGet(ANALYTICS_SERVICE_URL, '/analytics/inventory', request);
}
