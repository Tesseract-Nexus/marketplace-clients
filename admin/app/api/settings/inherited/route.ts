import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const SETTINGS_SERVICE_URL = getServiceUrl('SETTINGS');

/**
 * GET /api/settings/inherited
 * Fetch inherited settings
 * Uses proxyGet which properly extracts JWT claims and forwards Istio headers
 */
export async function GET(request: NextRequest) {
  return proxyGet(SETTINGS_SERVICE_URL, 'settings/inherited', request);
}
