import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPut } from '@/lib/utils/api-route-handler';

const INVENTORY_SERVICE_URL = getServiceUrl('INVENTORY');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyGet(INVENTORY_SERVICE_URL, `purchase-orders/${id}`, request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyPut(INVENTORY_SERVICE_URL, `purchase-orders/${id}/status`, request);
}
