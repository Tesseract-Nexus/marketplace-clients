import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const MARKETING_SERVICE_URL = getServiceUrl('MARKETING');

export async function GET(request: NextRequest) {
  return proxyGet(MARKETING_SERVICE_URL, 'campaigns', request);
}

export async function POST(request: NextRequest) {
  return proxyPost(MARKETING_SERVICE_URL, 'campaigns', request);
}
