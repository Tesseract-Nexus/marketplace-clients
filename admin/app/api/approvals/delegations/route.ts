import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPost } from '@/lib/utils/api-route-handler';

const APPROVAL_SERVICE_URL = getServiceUrl('APPROVAL');

/**
 * POST /api/approvals/delegations
 * Create a new delegation
 * Authorization is handled by the backend service via RBAC
 */
export async function POST(request: NextRequest) {
  return proxyPost(APPROVAL_SERVICE_URL, 'delegations', request);
}
