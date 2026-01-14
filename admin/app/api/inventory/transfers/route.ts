import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const INVENTORY_SERVICE_URL = getServiceUrl('INVENTORY');

export async function GET(request: NextRequest) {
  return proxyGet(INVENTORY_SERVICE_URL, 'transfers', request);
}

export async function POST(request: NextRequest) {
  return proxyPost(INVENTORY_SERVICE_URL, 'transfers', request);
}
