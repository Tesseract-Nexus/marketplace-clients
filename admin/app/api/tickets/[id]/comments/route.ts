import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPost } from '@/lib/utils/api-route-handler';

const TICKETS_SERVICE_URL = getServiceUrl('TICKETS');

// POST /api/tickets/[id]/comments - Add comment to ticket
// Authorization is handled by the backend service via RBAC
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyPost(TICKETS_SERVICE_URL, `/tickets/${id}/comments`, request);
}
