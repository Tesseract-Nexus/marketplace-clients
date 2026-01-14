import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const VENDORS_SERVICE_URL = getServiceUrl('VENDORS');

export async function GET(request: NextRequest) {
  return proxyGet(VENDORS_SERVICE_URL, 'vendors', request);
}

export async function POST(request: NextRequest) {
  return proxyPost(VENDORS_SERVICE_URL, 'vendors', request);
}
