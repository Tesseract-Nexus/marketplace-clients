import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, CACHE_CONFIG } from '@/lib/utils/api-route-handler';

const AUDIT_SERVICE_URL = getServiceUrl('AUDIT');

/**
 * GET /api/audit-logs/summary
 * Get audit log summary statistics
 *
 * Query parameters:
 * - from_date: Start date (RFC3339 format, default: 30 days ago)
 * - to_date: End date (RFC3339 format, default: now)
 *
 * Returns:
 * {
 *   totalLogs: number,
 *   byAction: { [action: string]: number },
 *   byResource: { [resource: string]: number },
 *   byStatus: { [status: string]: number },
 *   bySeverity: { [severity: string]: number },
 *   topUsers: UserActivity[],
 *   recentFailures: AuditLog[],
 *   timeRange: { from: string, to: string }
 * }
 */
export async function GET(request: NextRequest) {
  return proxyGet(AUDIT_SERVICE_URL, '/audit-logs/summary', request, {
    cacheConfig: CACHE_CONFIG.DYNAMIC,
  });
}
