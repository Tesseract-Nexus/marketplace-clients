import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const PAYMENTS_SERVICE_URL = getServiceUrl('PAYMENTS');

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
  }
  return proxyGet(PAYMENTS_SERVICE_URL, `ads/billing/payments/${id}`, request);
}
