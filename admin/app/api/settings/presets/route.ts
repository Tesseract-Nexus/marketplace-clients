import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet } from '@/lib/utils/api-route-handler';

const SETTINGS_SERVICE_URL = getServiceUrl('SETTINGS');

/**
 * GET /api/settings/presets
 * Fetch settings presets
 * Uses proxyGet which properly extracts JWT claims and forwards Istio headers
 */
export async function GET(request: NextRequest) {
  return proxyGet(SETTINGS_SERVICE_URL, 'presets', request);
}
