import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPost } from '@/lib/utils/api-route-handler';

const PAYMENTS_SERVICE_URL = getServiceUrl('PAYMENTS');

export async function POST(request: NextRequest) {
  return proxyPost(PAYMENTS_SERVICE_URL, 'ads/billing/payments/direct', request);
}
