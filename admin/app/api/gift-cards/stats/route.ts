import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const GIFT_CARDS_SERVICE_URL = getServiceUrl('GIFT_CARDS');

export async function GET(request: NextRequest) {
  return proxyGet(GIFT_CARDS_SERVICE_URL, 'gift-cards/stats', request);
}
