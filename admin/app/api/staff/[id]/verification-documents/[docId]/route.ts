import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPut, proxyDelete } from '@/lib/utils/api-route-handler';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params;
  return proxyGet(STAFF_SERVICE_URL, `staff/${id}/verification-documents/${docId}`, request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params;
  return proxyPut(STAFF_SERVICE_URL, `staff/${id}/verification-documents/${docId}`, request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params;
  return proxyDelete(STAFF_SERVICE_URL, `staff/${id}/verification-documents/${docId}`, request);
}
