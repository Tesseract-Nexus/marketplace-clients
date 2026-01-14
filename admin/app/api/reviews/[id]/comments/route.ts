import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPost } from '@/lib/utils/api-route-handler';

const REVIEWS_SERVICE_URL = getServiceUrl('REVIEWS');

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyPost(REVIEWS_SERVICE_URL, `/reviews/${id}/comments`, request);
}
