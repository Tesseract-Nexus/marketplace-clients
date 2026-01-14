import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPut, proxyDelete } from '@/lib/utils/api-route-handler';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id, contactId } = await params;
  return proxyGet(STAFF_SERVICE_URL, `staff/${id}/emergency-contacts/${contactId}`, request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id, contactId } = await params;
  return proxyPut(STAFF_SERVICE_URL, `staff/${id}/emergency-contacts/${contactId}`, request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { id, contactId } = await params;
  return proxyDelete(STAFF_SERVICE_URL, `staff/${id}/emergency-contacts/${contactId}`, request);
}
