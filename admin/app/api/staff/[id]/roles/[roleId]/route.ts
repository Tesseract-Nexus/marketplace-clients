import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyDelete } from '@/lib/utils/api-route-handler';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roleId: string }> }
) {
  const { id, roleId } = await params;
  return proxyDelete(STAFF_SERVICE_URL, `staff/${id}/roles/${roleId}`, request);
}
