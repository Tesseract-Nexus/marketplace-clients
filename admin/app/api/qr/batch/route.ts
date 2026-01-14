import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPost } from '@/lib/utils/api-route-handler';

const QR_SERVICE_URL = getServiceUrl('QR');

export async function POST(request: NextRequest) {
  return proxyPost(QR_SERVICE_URL, 'qr/batch', request);
}
