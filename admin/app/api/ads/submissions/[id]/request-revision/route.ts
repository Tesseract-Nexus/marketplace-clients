import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPost } from '@/lib/utils/api-route-handler';

const ADS_SERVICE_URL = getServiceUrl('ADS');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyPost(ADS_SERVICE_URL, `ads/submissions/${id}/request-revision`, request);
}
