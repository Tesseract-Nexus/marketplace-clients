import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPut, proxyDelete } from '@/lib/utils/api-route-handler';

const GIFT_CARDS_SERVICE_URL = getServiceUrl('GIFT_CARDS');

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{2,64}$/.test(id);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid gift card ID' }, { status: 400 });
  }
  return proxyGet(GIFT_CARDS_SERVICE_URL, `gift-cards/${id}`, request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid gift card ID' }, { status: 400 });
  }
  return proxyPut(GIFT_CARDS_SERVICE_URL, `gift-cards/${id}`, request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!isValidId(id)) {
    return NextResponse.json({ success: false, message: 'Invalid gift card ID' }, { status: 400 });
  }
  return proxyDelete(GIFT_CARDS_SERVICE_URL, `gift-cards/${id}`, request);
}
