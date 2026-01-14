import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams.toString();
  const endpoint = searchParams ? `audit/logins?${searchParams}` : 'audit/logins';
  return proxyGet(STAFF_SERVICE_URL, endpoint, request);
}
