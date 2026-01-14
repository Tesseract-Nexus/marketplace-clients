import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const MARKETING_SERVICE_URL = getServiceUrl('MARKETING');

export async function GET(request: NextRequest) {
  return proxyGet(MARKETING_SERVICE_URL, 'loyalty/customers', request);
}
