import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const APPROVAL_SERVICE_URL = getServiceUrl('APPROVAL');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  // Route to the correct backend endpoint based on status
  // approval-service uses /approvals/pending endpoint which now supports status filtering
  let path = 'approvals/pending';
  if (status === 'my-requests') {
    path = 'approvals/my-requests';
  }

  // Build query string with all params (status, limit, offset, etc.)
  // The backend now accepts status filter as query param
  const queryParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    // Pass through all query params except 'my-requests' which is a special path
    if (key !== 'status' || (value !== 'my-requests')) {
      queryParams.append(key, value);
    }
  });

  const queryString = queryParams.toString();
  const fullPath = queryString ? `${path}?${queryString}` : path;

  return proxyGet(APPROVAL_SERVICE_URL, fullPath, request);
}

export async function POST(request: NextRequest) {
  return proxyPost(APPROVAL_SERVICE_URL, 'approvals', request);
}
