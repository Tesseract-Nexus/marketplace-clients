import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPut } from '@/lib/utils/api-route-handler';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id, contactId } = await params;
  return proxyPut(STAFF_SERVICE_URL, `staff/${id}/emergency-contacts/${contactId}/primary`, request);
}
