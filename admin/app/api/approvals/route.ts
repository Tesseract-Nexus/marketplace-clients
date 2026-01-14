import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const APPROVAL_SERVICE_URL = getServiceUrl('APPROVAL');

export async function GET(request: NextRequest) {
  return proxyGet(APPROVAL_SERVICE_URL, 'approvals', request);
}

export async function POST(request: NextRequest) {
  return proxyPost(APPROVAL_SERVICE_URL, 'approvals', request);
}
