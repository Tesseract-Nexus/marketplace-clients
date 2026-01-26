import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPost } from '@/lib/utils/api-route-handler';

const ORDERS_SERVICE_URL = getServiceUrl('ORDERS');

/**
 * POST /api/payments/configs/[code]/test
 * Test the connection to a payment provider
 * Requires: payments:methods:test permission (Owner + Admin)
 *
 * Returns:
 * {
 *   success: boolean,
 *   message: string,
 *   testedAt: string,
 *   provider: string,
 *   isTestMode: boolean
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  return proxyPost(ORDERS_SERVICE_URL, `/payments/configs/${code}/test`, request);
}
