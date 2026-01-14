import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost, proxyDelete } from '@/lib/utils/api-route-handler';

const CUSTOMERS_SERVICE_URL = getServiceUrl('CUSTOMERS');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyGet(CUSTOMERS_SERVICE_URL, `customers/segments/${id}/customers`, request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyPost(CUSTOMERS_SERVICE_URL, `customers/segments/${id}/customers`, request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyDelete(CUSTOMERS_SERVICE_URL, `customers/segments/${id}/customers`, request);
}
