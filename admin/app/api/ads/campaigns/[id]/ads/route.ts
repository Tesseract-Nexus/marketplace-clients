import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost } from '@/lib/utils/api-route-handler';

const ADS_SERVICE_URL = getServiceUrl('ADS');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyGet(ADS_SERVICE_URL, `ads/campaigns/${id}/ads`, request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyPost(ADS_SERVICE_URL, `ads/campaigns/${id}/ads`, request);
}
