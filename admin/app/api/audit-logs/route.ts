import { NextRequest } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyGet, proxyPost, CACHE_CONFIG } from '@/lib/utils/api-route-handler';

const AUDIT_SERVICE_URL = getServiceUrl('AUDIT');

/**
 * GET /api/audit-logs
 * List audit logs with filtering and pagination
 *
 * Query parameters:
 * - action: Filter by action type (CREATE, UPDATE, DELETE, LOGIN, etc.)
 * - resource: Filter by resource type (ORDER, PRODUCT, USER, etc.)
 * - status: Filter by status (SUCCESS, FAILURE, PENDING)
 * - severity: Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
 * - user_id: Filter by user ID
 * - from_date: Start date (RFC3339 format)
 * - to_date: End date (RFC3339 format)
 * - search: Free text search
 * - limit: Number of results (default: 50)
 * - offset: Pagination offset
 * - sort_by: Sort field (default: timestamp)
 * - sort_order: Sort order (ASC or DESC, default: DESC)
 */
export async function GET(request: NextRequest) {
  return proxyGet(AUDIT_SERVICE_URL, '/audit-logs', request, {
    cacheConfig: CACHE_CONFIG.DYNAMIC,
  });
}

/**
 * POST /api/audit-logs
 * Create a new audit log entry
 *
 * Request body:
 * {
 *   action: string,
 *   resource: string,
 *   resourceId?: string,
 *   resourceName?: string,
 *   status: "SUCCESS" | "FAILURE" | "PENDING",
 *   severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
 *   description?: string,
 *   oldValue?: object,
 *   newValue?: object,
 *   changes?: object,
 *   metadata?: object,
 *   tags?: string[]
 * }
 */
export async function POST(request: NextRequest) {
  return proxyPost(AUDIT_SERVICE_URL, '/audit-logs', request);
}
