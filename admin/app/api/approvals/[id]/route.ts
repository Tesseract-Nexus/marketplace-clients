import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost, proxyDelete } from '@/lib/utils/api-route-handler';

const APPROVAL_SERVICE_URL = getServiceUrl('APPROVAL');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyGet(APPROVAL_SERVICE_URL, `approvals/${id}`, request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyDelete(APPROVAL_SERVICE_URL, `approvals/${id}`, request);
}
