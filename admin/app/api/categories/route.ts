import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const CATEGORIES_SERVICE_URL = getServiceUrl('CATEGORIES');

export async function GET(request: NextRequest) {
  return proxyGet(CATEGORIES_SERVICE_URL, 'categories', request);
}

export async function POST(request: NextRequest) {
  return proxyPost(CATEGORIES_SERVICE_URL, 'categories', request);
}
