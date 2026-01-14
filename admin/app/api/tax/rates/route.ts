import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPost } from '@/lib/utils/api-route-handler';

const TAX_SERVICE_URL = getServiceUrl('TAX');

export async function POST(request: NextRequest) {
  return proxyPost(TAX_SERVICE_URL, 'rates', request);
}
