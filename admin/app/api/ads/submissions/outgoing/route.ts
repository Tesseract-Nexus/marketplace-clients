import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const ADS_SERVICE_URL = getServiceUrl('ADS');

export async function GET(request: NextRequest) {
  return proxyGet(ADS_SERVICE_URL, 'ads/submissions/outgoing', request);
}
