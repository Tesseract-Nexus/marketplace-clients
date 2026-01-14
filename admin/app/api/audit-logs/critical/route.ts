import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, CACHE_CONFIG } from '@/lib/utils/api-route-handler';

const AUDIT_SERVICE_URL = getServiceUrl('AUDIT');

/**
 * GET /api/audit-logs/critical
 * Get recent critical events
 *
 * Query parameters:
 * - hours: Number of hours to look back (default: 24)
 *
 * Returns critical and high severity events from the specified time window
 */
export async function GET(request: NextRequest) {
  return proxyGet(AUDIT_SERVICE_URL, '/audit-logs/critical', request, {
    cacheConfig: CACHE_CONFIG.DYNAMIC,
  });
}
