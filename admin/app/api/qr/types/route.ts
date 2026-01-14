import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const QR_SERVICE_URL = getServiceUrl('QR');

export async function GET(request: NextRequest) {
  return proxyGet(QR_SERVICE_URL, 'qr/types', request);
}
