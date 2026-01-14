import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const CUSTOMERS_SERVICE_URL = getServiceUrl('CUSTOMERS');

export async function GET(request: NextRequest) {
  return proxyGet(CUSTOMERS_SERVICE_URL, 'customers/segments', request);
}

export async function POST(request: NextRequest) {
  return proxyPost(CUSTOMERS_SERVICE_URL, 'customers/segments', request);
}
