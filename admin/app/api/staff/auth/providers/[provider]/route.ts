import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyDelete } from '@/lib/utils/api-route-handler';

const STAFF_SERVICE_URL = getServiceUrl('STAFF');

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  return proxyDelete(STAFF_SERVICE_URL, `auth/providers/${provider}`, request);
}
