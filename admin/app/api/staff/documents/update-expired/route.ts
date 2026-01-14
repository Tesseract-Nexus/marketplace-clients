import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPost } from '@/lib/utils/api-route-handler';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

export async function POST(request: NextRequest) {
  return proxyPost(STAFF_SERVICE_URL, 'documents/update-expired', request);
}
