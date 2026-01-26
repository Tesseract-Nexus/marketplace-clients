'use client';

/**
 * Permission Hook for RBAC
 *
 * Provides permission checking capabilities for the admin UI.
 * Fetches permissions from staff-service and caches them.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useTenant } from '@/contexts/TenantContext';

// Permission constants - match database (003_seed_permissions.up.sql)
export const Permissions = {
  // Orders - match database (003_seed_permissions.up.sql, orders category)
  ORDERS_READ: 'orders:view',
  ORDERS_VIEW: 'orders:view', // alias
  ORDERS_CREATE: 'orders:create',
  ORDERS_UPDATE: 'orders:edit',
  ORDERS_EDIT: 'orders:edit', // alias
  ORDERS_CANCEL: 'orders:cancel',
  ORDERS_REFUND: 'orders:refund',
  ORDERS_SHIP: 'orders:fulfill', // maps to fulfill
  ORDERS_FULFILL: 'orders:fulfill',
  ORDERS_EXPORT: 'orders:export',
  ORDERS_SHIPPING_MANAGE: 'orders:shipping:manage',
  ORDERS_RETURNS_MANAGE: 'orders:returns:manage',

  // Returns - uses orders permissions in database
  RETURNS_READ: 'orders:returns:manage',
  RETURNS_CREATE: 'orders:returns:manage',
  RETURNS_APPROVE: 'orders:returns:manage',
  RETURNS_REJECT: 'orders:returns:manage',
  RETURNS_REFUND: 'orders:refund',
  RETURNS_INSPECT: 'orders:returns:manage',
  RETURNS_MANAGE: 'orders:returns:manage',

  // Payments - uses settings:payments in database
  PAYMENTS_READ: 'settings:payments:view',
  PAYMENTS_VIEW: 'settings:payments:view', // alias
  PAYMENTS_REFUND: 'orders:refund',
  PAYMENTS_GATEWAY_READ: 'settings:payments:view',
  PAYMENTS_GATEWAY_MANAGE: 'settings:payments:manage',
  PAYMENTS_FEES_MANAGE: 'settings:payments:manage',
  PAYMENTS_MANAGE: 'settings:payments:manage',

  // Payment Methods Configuration - granular permissions
  PAYMENTS_METHODS_VIEW: 'payments:methods:view',
  PAYMENTS_METHODS_ENABLE: 'payments:methods:enable',
  PAYMENTS_METHODS_CONFIG: 'payments:methods:config', // Owner only - sensitive
  PAYMENTS_METHODS_TEST: 'payments:methods:test',

  // Products - match database (003_seed_permissions.up.sql, catalog category)
  PRODUCTS_READ: 'catalog:products:view',
  PRODUCTS_VIEW: 'catalog:products:view', // alias
  PRODUCTS_CREATE: 'catalog:products:create',
  PRODUCTS_UPDATE: 'catalog:products:edit',
  PRODUCTS_EDIT: 'catalog:products:edit', // alias
  PRODUCTS_DELETE: 'catalog:products:delete',
  PRODUCTS_PRICING: 'catalog:pricing:manage',
  PRODUCTS_IMPORT: 'catalog:products:import',
  PRODUCTS_EXPORT: 'catalog:products:export',
  PRODUCTS_PUBLISH: 'catalog:products:publish',
  CATALOG_PRICING_VIEW: 'catalog:pricing:view',
  CATALOG_PRICING_MANAGE: 'catalog:pricing:manage',
  CATALOG_VARIANTS_MANAGE: 'catalog:variants:manage',

  // Categories - match database (003_seed_permissions.up.sql, catalog category)
  CATEGORIES_READ: 'catalog:categories:view',
  CATEGORIES_VIEW: 'catalog:categories:view', // alias
  CATEGORIES_CREATE: 'catalog:categories:manage',
  CATEGORIES_UPDATE: 'catalog:categories:manage',
  CATEGORIES_DELETE: 'catalog:categories:manage',
  CATEGORIES_MANAGE: 'catalog:categories:manage',

  // Inventory
  INVENTORY_READ: 'inventory:stock:view',
  INVENTORY_UPDATE: 'inventory:stock:adjust',
  INVENTORY_ADJUST: 'inventory:stock:adjust',
  INVENTORY_HISTORY_VIEW: 'inventory:history:view',
  INVENTORY_ALERTS_MANAGE: 'inventory:alerts:manage',
  INVENTORY_TRANSFERS_VIEW: 'inventory:transfers:view',
  INVENTORY_TRANSFERS_MANAGE: 'inventory:transfers:manage',
  INVENTORY_WAREHOUSES_VIEW: 'inventory:warehouses:view',
  INVENTORY_WAREHOUSES_MANAGE: 'inventory:warehouses:manage',

  // Staff - match database (003_seed_permissions.up.sql, team category)
  STAFF_READ: 'team:staff:view',
  STAFF_VIEW: 'team:staff:view', // alias
  STAFF_CREATE: 'team:staff:create',
  STAFF_UPDATE: 'team:staff:edit',
  STAFF_EDIT: 'team:staff:edit', // alias
  STAFF_DELETE: 'team:staff:delete',
  STAFF_INVITE: 'team:staff:create', // uses create permission for invites
  STAFF_ROLE_ASSIGN: 'team:roles:assign',

  // Roles - match database (003_seed_permissions.up.sql, team category)
  ROLES_READ: 'team:roles:view',
  ROLES_VIEW: 'team:roles:view', // alias
  ROLES_CREATE: 'team:roles:create',
  ROLES_UPDATE: 'team:roles:edit',
  ROLES_EDIT: 'team:roles:edit', // alias
  ROLES_DELETE: 'team:roles:delete',
  ROLES_ASSIGN: 'team:roles:assign',

  // Departments - match database (003_seed_permissions.up.sql, team category)
  DEPARTMENTS_READ: 'team:departments:view',
  DEPARTMENTS_VIEW: 'team:departments:view', // alias
  DEPARTMENTS_CREATE: 'team:departments:manage',
  DEPARTMENTS_UPDATE: 'team:departments:manage',
  DEPARTMENTS_DELETE: 'team:departments:manage',
  DEPARTMENTS_MANAGE: 'team:departments:manage',

  // Teams - match database (003_seed_permissions.up.sql, team category)
  TEAMS_READ: 'team:teams:view',
  TEAMS_VIEW: 'team:teams:view', // alias
  TEAMS_CREATE: 'team:teams:manage',
  TEAMS_UPDATE: 'team:teams:manage',
  TEAMS_DELETE: 'team:teams:manage',
  TEAMS_MANAGE: 'team:teams:manage',

  // Documents - match database (003_seed_permissions.up.sql, team category)
  DOCUMENTS_READ: 'team:documents:view',
  DOCUMENTS_VIEW: 'team:documents:view', // alias
  DOCUMENTS_VERIFY: 'team:documents:verify',

  // Audit - match database (003_seed_permissions.up.sql, team category)
  AUDIT_READ: 'team:audit:view',
  AUDIT_VIEW: 'team:audit:view', // alias

  // Customers - match database (003_seed_permissions.up.sql)
  CUSTOMERS_READ: 'customers:view',
  CUSTOMERS_VIEW: 'customers:view', // alias
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_UPDATE: 'customers:edit',
  CUSTOMERS_EDIT: 'customers:edit', // alias
  CUSTOMERS_DELETE: 'customers:delete',
  CUSTOMERS_EXPORT: 'customers:export',
  CUSTOMERS_NOTES_MANAGE: 'customers:notes:manage',
  CUSTOMERS_SEGMENTS_MANAGE: 'customers:segments:manage',
  CUSTOMERS_ADDRESSES_VIEW: 'customers:addresses:view',

  // Shipping - match database (003_seed_permissions.up.sql, settings category)
  SHIPPING_READ: 'settings:shipping:view',
  SHIPPING_VIEW: 'settings:shipping:view', // alias
  SHIPPING_CREATE: 'settings:shipping:manage',
  SHIPPING_UPDATE: 'settings:shipping:manage',
  SHIPPING_MANAGE: 'settings:shipping:manage',

  // Vendors - match database migration 019
  VENDORS_READ: 'vendors:read',
  VENDORS_VIEW: 'vendors:read', // alias
  VENDORS_CREATE: 'vendors:create',
  VENDORS_UPDATE: 'vendors:update',
  VENDORS_APPROVE: 'vendors:approve',
  VENDORS_MANAGE: 'vendors:manage',
  VENDORS_PAYOUT: 'vendors:payout',

  // Approvals - match database migration 019
  APPROVALS_READ: 'approvals:read',
  APPROVALS_VIEW: 'approvals:read', // alias
  APPROVALS_CREATE: 'approvals:create',
  APPROVALS_APPROVE: 'approvals:approve',
  APPROVALS_REJECT: 'approvals:reject',
  APPROVALS_MANAGE: 'approvals:manage',

  // Delegations - match database migration 019
  DELEGATIONS_READ: 'delegations:read',
  DELEGATIONS_VIEW: 'delegations:read', // alias
  DELEGATIONS_MANAGE: 'delegations:manage',

  // Analytics - match database (003_seed_permissions.up.sql)
  ANALYTICS_READ: 'analytics:dashboard:view',
  ANALYTICS_DASHBOARD_VIEW: 'analytics:dashboard:view',
  ANALYTICS_REPORTS_VIEW: 'analytics:reports:view',
  ANALYTICS_SALES_VIEW: 'analytics:sales:view',
  ANALYTICS_PRODUCTS_VIEW: 'analytics:products:view',
  ANALYTICS_REALTIME_VIEW: 'analytics:realtime:view',
  ANALYTICS_EXPORT: 'analytics:reports:export',

  // Settings - match database (003_seed_permissions.up.sql)
  SETTINGS_READ: 'settings:store:view',
  SETTINGS_VIEW: 'settings:store:view', // alias
  SETTINGS_UPDATE: 'settings:store:edit',
  SETTINGS_EDIT: 'settings:store:edit', // alias
  SETTINGS_PAYMENTS_VIEW: 'settings:payments:view',
  SETTINGS_PAYMENTS_MANAGE: 'settings:payments:manage',
  SETTINGS_SHIPPING_VIEW: 'settings:shipping:view',
  SETTINGS_SHIPPING_MANAGE: 'settings:shipping:manage',
  SETTINGS_TAXES_VIEW: 'settings:taxes:view',
  SETTINGS_TAXES_MANAGE: 'settings:taxes:manage',
  SETTINGS_NOTIFICATIONS_MANAGE: 'settings:notifications:manage',
  SETTINGS_INTEGRATIONS_MANAGE: 'settings:integrations:manage',

  // Coupons - these map to marketing:coupons:* permissions in database
  COUPONS_READ: 'marketing:coupons:view', // Alias for MARKETING_COUPONS_VIEW
  COUPONS_CREATE: 'marketing:coupons:manage', // Alias for MARKETING_COUPONS_MANAGE
  COUPONS_UPDATE: 'marketing:coupons:manage', // Alias for MARKETING_COUPONS_MANAGE
  COUPONS_DELETE: 'marketing:coupons:manage', // Alias for MARKETING_COUPONS_MANAGE

  // Reviews - match database (marketing:reviews:* permissions)
  REVIEWS_READ: 'marketing:reviews:view',
  REVIEWS_VIEW: 'marketing:reviews:view', // alias
  REVIEWS_MODERATE: 'marketing:reviews:moderate',
  REVIEWS_RESPOND: 'marketing:reviews:moderate',
  REVIEWS_DELETE: 'marketing:reviews:moderate',

  // Tickets - match database migration 019
  TICKETS_READ: 'tickets:read',
  TICKETS_VIEW: 'tickets:read', // alias
  TICKETS_CREATE: 'tickets:create',
  TICKETS_UPDATE: 'tickets:update',
  TICKETS_ASSIGN: 'tickets:assign',
  TICKETS_ESCALATE: 'tickets:escalate',
  TICKETS_RESOLVE: 'tickets:resolve',

  // Marketing - match database migration (003_seed_permissions.up.sql, 008)
  MARKETING_COUPONS_VIEW: 'marketing:coupons:view',
  MARKETING_COUPONS_MANAGE: 'marketing:coupons:manage',
  MARKETING_CAMPAIGNS_VIEW: 'marketing:campaigns:view',
  MARKETING_CAMPAIGNS_MANAGE: 'marketing:campaigns:manage',
  MARKETING_EMAIL_SEND: 'marketing:email:send',
  MARKETING_REVIEWS_VIEW: 'marketing:reviews:view',
  MARKETING_REVIEWS_MODERATE: 'marketing:reviews:moderate',
  MARKETING_BANNERS_MANAGE: 'marketing:banners:manage',
  MARKETING_LOYALTY_VIEW: 'marketing:loyalty:view',
  MARKETING_LOYALTY_MANAGE: 'marketing:loyalty:manage',
  MARKETING_LOYALTY_POINTS_ADJUST: 'marketing:loyalty:points:adjust',
  MARKETING_SEGMENTS_VIEW: 'marketing:segments:view',
  MARKETING_SEGMENTS_MANAGE: 'marketing:segments:manage',
  MARKETING_CARTS_VIEW: 'marketing:carts:view',
  MARKETING_CARTS_RECOVER: 'marketing:carts:recover',
  // Legacy aliases
  MARKETING_READ: 'marketing:coupons:view',
  MARKETING_CREATE: 'marketing:campaigns:manage',
  MARKETING_UPDATE: 'marketing:campaigns:manage',
  MARKETING_MANAGE: 'marketing:campaigns:manage',

  // Ad Manager - Campaign permissions (match database migration 026)
  ADS_CAMPAIGNS_VIEW: 'ads:campaigns:view',
  ADS_CAMPAIGNS_CREATE: 'ads:campaigns:create',
  ADS_CAMPAIGNS_EDIT: 'ads:campaigns:edit',
  ADS_CAMPAIGNS_DELETE: 'ads:campaigns:delete',
  ADS_CAMPAIGNS_APPROVE: 'ads:campaigns:approve',
  ADS_CAMPAIGNS_PAUSE: 'ads:campaigns:pause',
  // Legacy alias for backwards compatibility
  ADS_CAMPAIGNS_MANAGE: 'ads:campaigns:edit',

  // Ad Manager - Creative permissions
  ADS_CREATIVES_VIEW: 'ads:creatives:view',
  ADS_CREATIVES_MANAGE: 'ads:creatives:manage',
  ADS_CREATIVES_APPROVE: 'ads:creatives:approve',

  // Ad Manager - Billing permissions
  ADS_BILLING_VIEW: 'ads:billing:view',
  ADS_BILLING_MANAGE: 'ads:billing:manage',
  ADS_BILLING_REFUND: 'ads:billing:refund',
  ADS_BILLING_TIERS_MANAGE: 'ads:billing:tiers:manage',
  ADS_REVENUE_VIEW: 'ads:revenue:view',

  // Ad Manager - Targeting permissions
  ADS_TARGETING_VIEW: 'ads:targeting:view',
  ADS_TARGETING_MANAGE: 'ads:targeting:manage',

  // Ad Manager - Analytics permissions
  ADS_ANALYTICS_VIEW: 'ads:analytics:view',
  ADS_ANALYTICS_EXPORT: 'ads:analytics:export',

  // Ad Manager - Placement permissions
  ADS_PLACEMENTS_VIEW: 'ads:placements:view',
  ADS_PLACEMENTS_MANAGE: 'ads:placements:manage',

  // Legacy aliases for backwards compatibility
  ADS_APPROVALS_VIEW: 'ads:campaigns:view',
  ADS_APPROVALS_DECIDE: 'ads:campaigns:approve',
  ADS_SETTINGS_VIEW: 'ads:billing:view',
  ADS_SETTINGS_MANAGE: 'ads:billing:manage',

  // Gift Cards - match database migration (008_giftcards_tax_locations_permissions.up.sql)
  GIFT_CARDS_VIEW: 'giftcards:view',
  GIFT_CARDS_READ: 'giftcards:view', // Alias for backwards compatibility
  GIFT_CARDS_CREATE: 'giftcards:create',
  GIFT_CARDS_EDIT: 'giftcards:edit',
  GIFT_CARDS_UPDATE: 'giftcards:edit', // Alias for backwards compatibility
  GIFT_CARDS_DELETE: 'giftcards:delete',
  GIFT_CARDS_REDEEM: 'giftcards:redeem',
  GIFT_CARDS_BALANCE_ADJUST: 'giftcards:balance:adjust',
  GIFT_CARDS_BULK_CREATE: 'giftcards:bulk:create',
  GIFT_CARDS_EXPORT: 'giftcards:export',
  GIFT_CARDS_TRANSACTIONS_VIEW: 'giftcards:transactions:view',
  GIFT_CARDS_MANAGE: 'giftcards:edit', // Alias for backwards compatibility

  // Tax - uses settings:taxes:* permissions in database
  TAX_READ: 'settings:taxes:view',
  TAX_VIEW: 'settings:taxes:view', // alias
  TAX_CREATE: 'settings:taxes:manage',
  TAX_UPDATE: 'settings:taxes:manage',
  TAX_MANAGE: 'settings:taxes:manage',

  // Locations - note: location permissions may be service-specific
  LOCATIONS_READ: 'locations:view',
  LOCATIONS_VIEW: 'locations:view', // alias
  LOCATIONS_CREATE: 'locations:create',
  LOCATIONS_UPDATE: 'locations:update',
  LOCATIONS_DELETE: 'locations:delete',

  // Finance - match database (003_seed_permissions.up.sql, finance category)
  FINANCE_TRANSACTIONS_VIEW: 'finance:transactions:view',
  FINANCE_PAYOUTS_VIEW: 'finance:payouts:view',
  FINANCE_PAYOUTS_MANAGE: 'finance:payouts:manage',
  FINANCE_INVOICES_VIEW: 'finance:invoices:view',
  FINANCE_INVOICES_MANAGE: 'finance:invoices:manage',
  FINANCE_REPORTS_VIEW: 'finance:reports:view',
  FINANCE_RECONCILIATION_MANAGE: 'finance:reconciliation:manage',

  // Enterprise SSO Integration (Owner-only) - uses settings:integrations
  INTEGRATIONS_SSO_VIEW: 'settings:integrations:manage',
  INTEGRATIONS_SSO_MANAGE: 'settings:integrations:manage',
  INTEGRATIONS_SCIM_VIEW: 'settings:integrations:manage',
  INTEGRATIONS_SCIM_MANAGE: 'settings:integrations:manage',

  // Storefronts - map to settings:store and catalog permissions
  STOREFRONTS_VIEW: 'settings:store:view',
  STOREFRONTS_MANAGE: 'settings:store:edit',

  // Dashboard - map to analytics
  DASHBOARD_VIEW: 'analytics:dashboard:view',

  // Additional analytics aliases
  ANALYTICS_VIEW: 'analytics:dashboard:view',

  // Notifications - map to settings
  NOTIFICATIONS_VIEW: 'settings:notifications:manage',

  // Orders management alias
  ORDERS_MANAGE: 'orders:edit',

  // Customers management alias
  CUSTOMERS_MANAGE: 'customers:segments:manage',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

interface PermissionState {
  permissions: string[];
  priority: number;
  canManageStaff: boolean;
  canCreateRoles: boolean;
  canDeleteRoles: boolean;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// In-memory cache for permissions with user context
interface CachedPermissionState extends PermissionState {
  userId: string;
  tenantId: string;
}
let permissionCache: CachedPermissionState | null = null;

interface FetchPermissionsResult {
  permissions: string[];
  priority: number;
  canManageStaff: boolean;
  canCreateRoles: boolean;
  canDeleteRoles: boolean;
}

/**
 * Fetch current user's permissions from staff-service
 * Uses /me/permissions endpoint which doesn't require prior permissions (bootstrap)
 */
async function fetchPermissions(tenantId: string, staffId: string, userEmail?: string): Promise<FetchPermissionsResult> {
  // BFF handles authentication via HttpOnly session cookies
  // No localStorage tokens needed - credentials: 'include' sends cookies
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-jwt-claim-tenant-id': tenantId,
    'x-jwt-claim-sub': staffId,
  };

  // Include email for multi-tenant staff lookup (staff ID may differ from auth user ID)
  if (userEmail) {
    headers['x-jwt-claim-email'] = userEmail;
  }

  // Use /me/permissions endpoint - doesn't require prior permissions
  const response = await fetch(`/api/staff/me/permissions`, {
    method: 'GET',
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch permissions');
  }

  const data = await response.json();
  // Extract from data wrapper if present (staff-service format)
  const permData = data.data || data;

  // staff-service returns both roles array and flat permissions array
  // Format: { roles: [...], permissions: [{name: "..."}], canManageStaff, canCreateRoles, canDeleteRoles, maxPriorityLevel }
  let allPermissions: string[] = [];
  // API returns maxPriorityLevel (not maxPriority) - Store Owner has priority 100
  let maxPriority = permData.maxPriorityLevel || permData.maxPriority || 0;

  // First try to get permissions from the flat permissions array (always populated by staff-service)
  if (permData.permissions && Array.isArray(permData.permissions)) {
    for (const perm of permData.permissions) {
      const permName = perm.name || perm;
      if (permName && !allPermissions.includes(permName)) {
        allPermissions.push(permName);
      }
    }
  }

  // If no flat permissions, try extracting from roles (fallback for different formats)
  if (allPermissions.length === 0 && permData.roles && Array.isArray(permData.roles)) {
    for (const role of permData.roles) {
      // Get highest priority from all roles
      if (role.priorityLevel && role.priorityLevel > maxPriority) {
        maxPriority = role.priorityLevel;
      }
      // Flatten permissions from all roles
      if (role.permissions && Array.isArray(role.permissions)) {
        for (const perm of role.permissions) {
          const permName = perm.name || perm;
          if (permName && !allPermissions.includes(permName)) {
            allPermissions.push(permName);
          }
        }
      }
    }
  }

  return {
    permissions: allPermissions,
    priority: maxPriority,
    canManageStaff: permData.canManageStaff || false,
    canCreateRoles: permData.canCreateRoles || false,
    canDeleteRoles: permData.canDeleteRoles || false,
  };
}

/**
 * Check if a permission matches (including wildcard support and priority-based access)
 * Store Owner (priority 100+) has unrestricted access to all permissions
 */
function matchPermission(userPermissions: string[], requiredPermission: string, userPriority: number = 0): boolean {
  // Store Owner (priority 100+) has unrestricted access to all permissions
  // This matches the backend RBAC middleware behavior (go-shared/rbac/client.go)
  if (userPriority >= Priority.OWNER) {
    return true;
  }

  // Direct match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Wildcard match (e.g., "orders:*" matches "orders:read")
  const [category] = requiredPermission.split(':');
  const wildcardPermission = `${category}:*`;
  if (userPermissions.includes(wildcardPermission)) {
    return true;
  }

  // Super admin check
  if (userPermissions.includes('*:*') || userPermissions.includes('*')) {
    return true;
  }

  return false;
}

/**
 * Hook to manage permission state
 */
export function usePermissions() {
  const { user, isLoading: userLoading } = useUser();
  const { currentTenant, isLoading: tenantLoading } = useTenant();
  const [state, setState] = useState<PermissionState>({
    permissions: [],
    priority: 0,
    canManageStaff: false,
    canCreateRoles: false,
    canDeleteRoles: false,
    isLoading: true,
    error: null,
    lastFetched: null,
  });

  const isAuthenticated = !!user?.id;
  const tenantId = currentTenant?.id;
  const userId = user?.id;
  const userEmail = user?.email;

  const fetchAndCachePermissions = useCallback(async () => {
    if (!userId || !tenantId) {
      setState(prev => ({ ...prev, isLoading: false, permissions: [], priority: 0, canManageStaff: false, canCreateRoles: false, canDeleteRoles: false }));
      return;
    }

    // Check cache - must match current user and tenant
    if (permissionCache && permissionCache.lastFetched &&
        permissionCache.userId === userId &&
        permissionCache.tenantId === tenantId &&
        Date.now() - permissionCache.lastFetched < CACHE_DURATION) {
      setState(permissionCache);
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { permissions, priority, canManageStaff, canCreateRoles, canDeleteRoles } = await fetchPermissions(tenantId, userId, userEmail);
      const newState: CachedPermissionState = {
        permissions,
        priority,
        canManageStaff,
        canCreateRoles,
        canDeleteRoles,
        isLoading: false,
        error: null,
        lastFetched: Date.now(),
        userId,
        tenantId,
      };
      permissionCache = newState;
      setState(newState);
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch permissions',
      }));
    }
  }, [userId, tenantId, userEmail]);

  useEffect(() => {
    // Wait for both user and tenant to load
    if (userLoading || tenantLoading) {
      return;
    }

    if (isAuthenticated && tenantId) {
      fetchAndCachePermissions();
    } else {
      setState({
        permissions: [],
        priority: 0,
        canManageStaff: false,
        canCreateRoles: false,
        canDeleteRoles: false,
        isLoading: false,
        error: null,
        lastFetched: null,
      });
      permissionCache = null;
    }
  }, [isAuthenticated, tenantId, userLoading, tenantLoading, fetchAndCachePermissions]);

  const refreshPermissions = useCallback(() => {
    permissionCache = null;
    return fetchAndCachePermissions();
  }, [fetchAndCachePermissions]);

  return {
    ...state,
    refreshPermissions,
  };
}

/**
 * Hook to check if user has a specific permission
 * Store Owner (priority 100+) automatically has all permissions
 */
export function useHasPermission(permission: Permission | string): boolean {
  const { permissions, priority, isLoading } = usePermissions();

  return useMemo(() => {
    if (isLoading) {
      return false;
    }
    // Store Owner (priority 100+) has unrestricted access
    // Allow access even if permissions array is empty for owners
    return matchPermission(permissions, permission, priority);
  }, [permissions, priority, permission, isLoading]);
}

/**
 * Hook to check if user has any of the specified permissions
 * Store Owner (priority 100+) automatically has all permissions
 */
export function useHasAnyPermission(requiredPermissions: (Permission | string)[]): boolean {
  const { permissions, priority, isLoading } = usePermissions();

  return useMemo(() => {
    if (isLoading) {
      return false;
    }
    // Store Owner (priority 100+) has unrestricted access
    return requiredPermissions.some(p => matchPermission(permissions, p, priority));
  }, [permissions, priority, requiredPermissions, isLoading]);
}

/**
 * Hook to check if user has all of the specified permissions
 * Store Owner (priority 100+) automatically has all permissions
 */
export function useHasAllPermissions(requiredPermissions: (Permission | string)[]): boolean {
  const { permissions, priority, isLoading } = usePermissions();

  return useMemo(() => {
    if (isLoading) {
      return false;
    }
    // Store Owner (priority 100+) has unrestricted access
    return requiredPermissions.every(p => matchPermission(permissions, p, priority));
  }, [permissions, priority, requiredPermissions, isLoading]);
}

/**
 * Hook to get user's priority level
 */
export function useUserPriority(): number {
  const { priority } = usePermissions();
  return priority;
}

/**
 * Hook to check if user has minimum priority level
 */
export function useHasMinPriority(minPriority: number): boolean {
  const priority = useUserPriority();
  return priority >= minPriority;
}

// Priority constants - must match backend (staff-service migrations)
export const Priority = {
  VIEWER: 10,            // Read-only access
  CUSTOMER_SUPPORT: 50,  // Order/customer support
  SPECIALIST: 60,        // Inventory/Order/Marketing Manager
  MANAGER: 70,           // Store operations manager
  ADMIN: 90,             // Full admin access (except finance)
  OWNER: 100,            // Full unrestricted access
} as const;

/**
 * Hook for permission-based conditional rendering
 * Store Owner (priority 100+) automatically has all permissions
 */
export function usePermissionGuard(
  permission: Permission | string | (Permission | string)[],
  options?: { requireAll?: boolean }
) {
  const { permissions, priority, isLoading, error } = usePermissions();

  const hasPermission = useMemo(() => {
    if (isLoading) {
      return false;
    }

    const requiredPermissions = Array.isArray(permission) ? permission : [permission];

    // Store Owner (priority 100+) has unrestricted access
    if (options?.requireAll) {
      return requiredPermissions.every(p => matchPermission(permissions, p, priority));
    }
    return requiredPermissions.some(p => matchPermission(permissions, p, priority));
  }, [permissions, priority, permission, options?.requireAll, isLoading]);

  return {
    hasPermission,
    isLoading,
    error,
  };
}

/**
 * Hook to check if user can manage staff
 */
export function useCanManageStaff(): boolean {
  const { canManageStaff, isLoading } = usePermissions();
  return !isLoading && canManageStaff;
}

/**
 * Hook to check if user can create/edit roles
 */
export function useCanCreateRoles(): boolean {
  const { canCreateRoles, isLoading } = usePermissions();
  return !isLoading && canCreateRoles;
}

/**
 * Hook to check if user can delete roles
 */
export function useCanDeleteRoles(): boolean {
  const { canDeleteRoles, isLoading } = usePermissions();
  return !isLoading && canDeleteRoles;
}

/**
 * Hook to get all role management capabilities
 */
export function useRoleCapabilities() {
  const { canManageStaff, canCreateRoles, canDeleteRoles, isLoading } = usePermissions();
  return {
    canManageStaff: !isLoading && canManageStaff,
    canCreateRoles: !isLoading && canCreateRoles,
    canDeleteRoles: !isLoading && canDeleteRoles,
    isLoading,
  };
}

export default useHasPermission;
