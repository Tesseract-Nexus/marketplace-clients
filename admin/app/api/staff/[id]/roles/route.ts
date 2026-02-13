import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(id);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid staff ID' }, { status: 400 });
  }
  return proxyGet(STAFF_SERVICE_URL, `staff/${id}/roles`, request);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid staff ID' }, { status: 400 });
  }
  return proxyPost(STAFF_SERVICE_URL, `staff/${id}/roles`, request);
}
