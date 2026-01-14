import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const REVIEWS_SERVICE_URL = getServiceUrl('REVIEWS');

export async function GET(request: NextRequest) {
  return proxyGet(REVIEWS_SERVICE_URL, 'reviews', request);
}

export async function POST(request: NextRequest) {
  return proxyPost(REVIEWS_SERVICE_URL, 'reviews', request);
}
