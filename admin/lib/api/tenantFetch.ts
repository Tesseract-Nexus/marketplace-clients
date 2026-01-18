/**
 * Tenant-aware fetch utility
 *
 * All API calls should use this utility to ensure the x-jwt-claim-tenant-id header is included.
 * The tenant ID must be provided by the caller (typically from TenantContext).
 */

export interface TenantFetchOptions extends RequestInit {
  tenantId?: string;
  userId?: string;
}

/**
 * Creates a fetch function with tenant headers pre-configured
 */
export function createTenantFetch(defaultTenantId?: string, defaultUserId?: string) {
  return async function tenantFetch(
    url: string,
    options: TenantFetchOptions = {}
  ): Promise<Response> {
    const { tenantId, userId, headers: customHeaders, ...restOptions } = options;

    const effectiveTenantId = tenantId || defaultTenantId;
    const effectiveUserId = userId || defaultUserId;

    if (!effectiveTenantId) {
      console.warn('tenantFetch: No tenant ID provided. API call may fail.');
    }

    const headers = new Headers(customHeaders);

    if (effectiveTenantId) {
      headers.set('x-jwt-claim-tenant-id', effectiveTenantId);
    }

    if (effectiveUserId) {
      headers.set('x-jwt-claim-sub', effectiveUserId);
    }

    // Ensure Content-Type for JSON requests
    if (!headers.has('Content-Type') && restOptions.body && typeof restOptions.body === 'string') {
      try {
        JSON.parse(restOptions.body);
        headers.set('Content-Type', 'application/json');
      } catch {
        // Not JSON, don't set Content-Type
      }
    }

    return fetch(url, {
      ...restOptions,
      headers,
    });
  };
}

/**
 * Default tenant fetch - requires tenantId to be passed with each call
 */
export async function tenantFetch(
  url: string,
  options: TenantFetchOptions = {}
): Promise<Response> {
  const fetchFn = createTenantFetch();
  return fetchFn(url, options);
}

export default tenantFetch;
