import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPut } from '@/lib/utils/api-route-handler';

const TICKETS_SERVICE_URL = getServiceUrl('TICKETS');

// PUT /api/tickets/[id]/status - Update ticket status
// Authorization is handled by the backend service via RBAC
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyPut(TICKETS_SERVICE_URL, `/tickets/${id}/status`, request);
}
