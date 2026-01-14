import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPut, proxyDelete } from '@/lib/utils/api-route-handler';

const CUSTOMERS_SERVICE_URL = getServiceUrl('CUSTOMERS');

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addressId: string }> }
) {
  const { id, addressId } = await params;
  return proxyPut(CUSTOMERS_SERVICE_URL, `customers/${id}/addresses/${addressId}`, request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addressId: string }> }
) {
  const { id, addressId } = await params;
  return proxyDelete(CUSTOMERS_SERVICE_URL, `customers/${id}/addresses/${addressId}`, request);
}
