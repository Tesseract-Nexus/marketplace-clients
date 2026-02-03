/**
 * Audit Logger Utility
 * Automatically creates audit log entries for admin write operations
 * by POSTing directly to the audit-service (fire-and-forget).
 */

import { NextRequest } from 'next/server';
import { logger } from '../logger';
import { getServiceUrl } from '../config/api';

const AUDIT_SERVICE_URL = getServiceUrl('AUDIT');

// Paths that should not generate audit logs
const SKIP_PATHS = ['/audit-logs', '/health', '/ready', '/media/upload'];

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'SETTING_CHANGE' | 'OTHER';
type AuditResource = string;
type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface AuditLogEntry {
  action: AuditAction;
  resource: AuditResource;
  resourceId?: string;
  resourceName?: string;
  status: 'SUCCESS' | 'FAILURE';
  severity: AuditSeverity;
  description: string;
  serviceName: string;
  ipAddress?: string;
  userAgent?: string;
  oldValue?: unknown;
  newValue?: unknown;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

const PATH_TO_RESOURCE: Record<string, AuditResource> = {
  orders: 'ORDER',
  products: 'PRODUCT',
  categories: 'CATEGORY',
  customers: 'CUSTOMER',
  staff: 'STAFF',
  vendors: 'VENDOR',
  settings: 'SETTINGS',
  payments: 'PAYMENT',
  returns: 'RETURN',
  reviews: 'REVIEW',
  coupons: 'COUPON',
  inventory: 'INVENTORY',
  'gift-cards': 'GIFT_CARD',
  tickets: 'TICKET',
  approvals: 'APPROVAL',
  campaigns: 'CAMPAIGN',
  tax: 'CONFIG',
  domains: 'CONFIG',
  storefronts: 'VENDOR',
  segments: 'CUSTOMER',
  ads: 'CONFIG',
  roles: 'ROLE',
  permissions: 'PERMISSION',
  users: 'USER',
  auth: 'AUTH',
  tenants: 'TENANT',
  shipping: 'SHIPMENT',
  refunds: 'REFUND',
  notifications: 'NOTIFICATION',
};

function shouldSkip(path: string): boolean {
  return SKIP_PATHS.some((skip) => path.includes(skip));
}

function deriveResource(path: string): AuditResource {
  // Strip leading slash and split
  const segments = path.replace(/^\//, '').split('/');
  for (const segment of segments) {
    if (PATH_TO_RESOURCE[segment]) {
      return PATH_TO_RESOURCE[segment];
    }
  }
  return 'OTHER';
}

function deriveAction(method: string, path: string): AuditAction {
  const lowerPath = path.toLowerCase();

  // Special path-based actions
  if (lowerPath.includes('/approve')) return 'APPROVE';
  if (lowerPath.includes('/reject')) return 'REJECT';
  if (lowerPath.includes('/login')) return 'LOGIN';

  // Settings changes
  if (lowerPath.includes('/settings') && (method === 'PUT' || method === 'PATCH' || method === 'POST')) {
    return 'SETTING_CHANGE';
  }

  switch (method) {
    case 'POST': return 'CREATE';
    case 'PUT':
    case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    default: return 'OTHER';
  }
}

function deriveSeverity(method: string, resource: AuditResource, action: AuditAction): AuditSeverity {
  // Critical: deleting users/roles/permissions/tenants, or auth operations
  if (method === 'DELETE' && ['USER', 'ROLE', 'PERMISSION', 'TENANT'].includes(resource)) {
    return 'CRITICAL';
  }
  if (resource === 'AUTH') return 'CRITICAL';

  // High: any DELETE, payment/refund changes
  if (method === 'DELETE') return 'HIGH';
  if (['PAYMENT', 'REFUND'].includes(resource) && action === 'UPDATE') return 'HIGH';

  // Medium: updates
  if (method === 'PUT' || method === 'PATCH') return 'MEDIUM';

  // Low: creates
  return 'LOW';
}

function extractResourceId(path: string): string | undefined {
  // Match UUID or ID-like segments after a resource path
  // e.g., /orders/abc-123/status → abc-123
  const segments = path.replace(/^\//, '').split('/');
  for (let i = 0; i < segments.length - 1; i++) {
    if (PATH_TO_RESOURCE[segments[i]] && segments[i + 1]) {
      const candidate = segments[i + 1];
      // Skip sub-resource names
      if (!PATH_TO_RESOURCE[candidate] && candidate !== 'status' && candidate !== 'approve' && candidate !== 'reject') {
        return candidate;
      }
    }
  }
  return undefined;
}

function buildDescription(action: AuditAction, resource: AuditResource, method: string, path: string, success: boolean): string {
  const status = success ? '' : ' (failed)';
  return `${method} ${path} — ${action} ${resource}${status}`;
}

/**
 * Fire-and-forget audit log creation.
 * Never throws, never blocks the response.
 */
export function logAuditEvent(
  request: NextRequest,
  method: string,
  path: string,
  success: boolean,
  requestBody?: unknown,
  responseData?: unknown,
  error?: unknown,
): void {
  if (shouldSkip(path)) return;

  try {
    const resource = deriveResource(path);
    const action = deriveAction(method, path);
    const severity = deriveSeverity(method, resource, action);
    const resourceId = extractResourceId(path);

    const userId = request.headers.get('x-jwt-claim-sub') || '';
    const userEmail = request.headers.get('x-jwt-claim-email') || '';
    const tenantId = request.headers.get('x-jwt-claim-tenant-id') || '';
    const username = request.headers.get('x-jwt-claim-preferred-username') || '';
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const userAgent = request.headers.get('user-agent') || '';

    const entry: AuditLogEntry = {
      action,
      resource,
      resourceId,
      status: success ? 'SUCCESS' : 'FAILURE',
      severity,
      description: buildDescription(action, resource, method, path, success),
      serviceName: 'admin-frontend',
      ipAddress,
      userAgent,
      metadata: {
        method,
        path,
        ...(requestBody && typeof requestBody === 'object' ? { requestBody } : {}),
      },
    };

    if (!success && error) {
      entry.errorMessage = error instanceof Error ? error.message : String(error);
    }

    if (!success && responseData && typeof responseData === 'object') {
      const rd = responseData as Record<string, unknown>;
      if (rd.error) {
        entry.errorMessage = typeof rd.error === 'string' ? rd.error : JSON.stringify(rd.error);
      }
    }

    // Fire-and-forget POST to audit-service
    const body = JSON.stringify({
      ...entry,
      tenantId,
      userId: userId || undefined,
      userEmail: userEmail || undefined,
      username: username || undefined,
    });

    fetch(`${AUDIT_SERVICE_URL}/audit-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(tenantId ? { 'x-jwt-claim-tenant-id': tenantId } : {}),
        ...(userId ? { 'x-jwt-claim-sub': userId } : {}),
      },
      body,
      signal: AbortSignal.timeout(5000),
    }).catch((err) => {
      logger.warn('[Audit] Failed to create audit log:', err?.message || err);
    });
  } catch (err) {
    logger.warn('[Audit] Error preparing audit log:', err);
  }
}
