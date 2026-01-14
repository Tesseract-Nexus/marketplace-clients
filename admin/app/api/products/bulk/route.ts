import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyDelete } from '@/lib/utils/api-route-handler';

const PRODUCTS_SERVICE_URL = getServiceUrl('PRODUCTS');

export async function DELETE(request: NextRequest) {
  return proxyDelete(PRODUCTS_SERVICE_URL, 'products/bulk', request);
}
