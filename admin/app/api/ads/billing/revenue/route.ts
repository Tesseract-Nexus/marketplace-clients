import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const PAYMENTS_SERVICE_URL = getServiceUrl('PAYMENTS');

export async function GET(request: NextRequest) {
  return proxyGet(PAYMENTS_SERVICE_URL, 'ads/billing/revenue', request);
}
