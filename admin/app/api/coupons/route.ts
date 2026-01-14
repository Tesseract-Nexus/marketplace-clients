import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const COUPONS_SERVICE_URL = getServiceUrl('COUPONS');

export async function GET(request: NextRequest) {
  return proxyGet(COUPONS_SERVICE_URL, 'coupons', request);
}

export async function POST(request: NextRequest) {
  return proxyPost(COUPONS_SERVICE_URL, 'coupons', request);
}
