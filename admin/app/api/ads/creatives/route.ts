import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const ADS_SERVICE_URL = getServiceUrl('ADS');

export async function GET(request: NextRequest) {
  return proxyGet(ADS_SERVICE_URL, 'ads/creatives', request);
}

export async function POST(request: NextRequest) {
  return proxyPost(ADS_SERVICE_URL, 'ads/creatives', request);
}
