import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyPost } from '@/lib/utils/api-route-handler';

const CUSTOMERS_SERVICE_URL = getServiceUrl('CUSTOMERS');

/**
 * POST /api/carts/abandoned/send-reminders
 * Trigger sending reminder emails
 */
export async function POST(request: NextRequest) {
  return proxyPost(CUSTOMERS_SERVICE_URL, 'abandoned-carts/send-reminders', request);
}
