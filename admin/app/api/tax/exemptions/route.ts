import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const TAX_SERVICE_URL = getServiceUrl('TAX');

export async function GET(request: NextRequest) {
  return proxyGet(TAX_SERVICE_URL, 'exemptions', request);
}

export async function POST(request: NextRequest) {
  return proxyPost(TAX_SERVICE_URL, 'exemptions', request);
}
