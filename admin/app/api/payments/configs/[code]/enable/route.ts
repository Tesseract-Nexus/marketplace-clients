import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPost } from '@/lib/utils/api-route-handler';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

/**
 * POST /api/payments/configs/[code]/enable
 * Enable or disable a payment method
 * Requires: payments:methods:enable permission (Owner + Admin)
 *
 * Request body:
 * {
 *   enabled: boolean
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  return proxyPost(ORDERS_SERVICE_URL, `/payments/configs/${code}/enable`, request);
}
