import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const ANALYTICS_SERVICE_URL = getServiceUrl('ANALYTICS');

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();
  const path = queryString ? `/analytics/sales?${queryString}` : '/analytics/sales';
  return proxyGet(ANALYTICS_SERVICE_URL, path, request);
}
