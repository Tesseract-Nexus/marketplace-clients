import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyDelete } from '@/lib/utils/api-route-handler';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyDelete(STAFF_SERVICE_URL, `invitations/${id}`, request);
}
