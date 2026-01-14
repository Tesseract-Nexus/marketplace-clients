import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPut } from '@/lib/utils/api-route-handler';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roleId: string }> }
) {
  const { id, roleId } = await params;
  return proxyPut(STAFF_SERVICE_URL, `staff/${id}/roles/${roleId}/primary`, request);
}
