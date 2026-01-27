import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPut } from '@/lib/utils/api-route-handler';

const REVIEWS_SERVICE_URL = getServiceUrl('REVIEWS');

// PUT /api/reviews/[id]/status - Update review status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return proxyPut(REVIEWS_SERVICE_URL, `/reviews/${id}/status`, request);
}
