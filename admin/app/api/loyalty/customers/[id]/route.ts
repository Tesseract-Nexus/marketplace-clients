import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost, proxyDelete } from '@/lib/utils/api-route-handler';

const MARKETING_SERVICE_URL = getServiceUrl('MARKETING');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyGet(MARKETING_SERVICE_URL, `loyalty/customers/${id}`, request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Enroll customer
  const { id } = await params;
  return proxyPost(MARKETING_SERVICE_URL, `loyalty/customers/${id}/enroll`, request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyDelete(MARKETING_SERVICE_URL, `loyalty/customers/${id}`, request);
}
