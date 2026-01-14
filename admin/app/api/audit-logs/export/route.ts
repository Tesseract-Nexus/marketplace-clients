import { NextRequest, NextResponse } from 'next/server';
import { getServiceUrl } from '@/lib/config/api';
import { proxyToBackend, handleApiError, CACHE_CONFIG } from '@/lib/utils/api-route-handler';

const AUDIT_SERVICE_URL = getServiceUrl('AUDIT');

/**
 * GET /api/audit-logs/export
 * Export audit logs to JSON or CSV format
 *
 * Query parameters:
 * - format: "json" or "csv" (default: json)
 * - action: Filter by action type
 * - resource: Filter by resource type
 * - status: Filter by status
 * - severity: Filter by severity
 * - from_date: Start date (RFC3339 format)
 * - to_date: End date (RFC3339 format)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const response = await proxyToBackend(AUDIT_SERVICE_URL, '/audit-logs/export', {
      method: 'GET',
      params: searchParams,
      incomingRequest: request,
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    // Get the blob data
    const data = await response.blob();

    // Set appropriate content type and filename
    const contentType = format === 'csv' ? 'text/csv' : 'application/json';
    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;

    const nextResponse = new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': CACHE_CONFIG.NO_CACHE.cacheControl,
      },
    });

    return nextResponse;
  } catch (error) {
    return handleApiError(error, 'GET audit-logs/export');
  }
}
