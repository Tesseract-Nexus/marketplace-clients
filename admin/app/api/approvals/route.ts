import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const APPROVAL_SERVICE_URL = getServiceUrl('APPROVAL');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  // Route to the correct backend endpoint based on status
  // approval-service has /approvals/pending and /approvals/my-requests, not a generic /approvals
  let path = 'approvals/pending'; // default to pending
  if (status === 'my-requests') {
    path = 'approvals/my-requests';
  }

  return proxyGet(APPROVAL_SERVICE_URL, path, request);
}

export async function POST(request: NextRequest) {
  return proxyPost(APPROVAL_SERVICE_URL, 'approvals', request);
}
