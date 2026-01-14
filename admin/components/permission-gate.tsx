'use client';

/**
 * Permission Gate Component
 *
 * Conditionally renders content based on user permissions.
 * Supports single permission, any permission, or all permissions.
 */

import React from 'react';
import { usePermissionGuard, Permissions, Priority, useHasMinPriority } from '@/hooks/usePermission';
import type { Permission } from '@/hooks/usePermission';
import { ErrorState } from '@/components/ui/error-state';

/**
 * Default styled fallback for permission denied states
 * Use this in custom fallback props for consistent styling
 */
export function PermissionDeniedFallback({
  title = 'Access Denied',
  description = 'You don\'t have permission to access this resource. Please contact your administrator if you need access.',
  compact = false,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <ErrorState
      type="permission_denied"
      title={title}
      description={description}
      compact={compact}
      showHomeButton={!compact}
    />
  );
}

interface PermissionGateProps {
  /**
   * Required permission(s). Can be a single permission or an array.
   */
  permission: Permission | string | (Permission | string)[];
  /**
   * If true, all permissions are required. Otherwise, any permission is sufficient.
   */
  requireAll?: boolean;
  /**
   * Minimum priority level required (optional)
   */
  minPriority?: number;
  /**
   * Content to render when permission is granted
   */
  children: React.ReactNode;
  /**
   * Content to render when permission is denied (optional).
   * Set to "styled" to use the default styled PermissionDeniedFallback.
   */
  fallback?: React.ReactNode | 'styled';
  /**
   * Custom title for the styled fallback (only used when fallback="styled")
   */
  fallbackTitle?: string;
  /**
   * Custom description for the styled fallback (only used when fallback="styled")
   */
  fallbackDescription?: string;
  /**
   * Content to render while loading permissions
   */
  loading?: React.ReactNode;
}

/**
 * Permission Gate Component
 *
 * Example usage:
 * ```tsx
 * <PermissionGate permission="orders:refund">
 *   <RefundButton />
 * </PermissionGate>
 *
 * <PermissionGate permission={["orders:read", "orders:update"]} requireAll>
 *   <OrderEditForm />
 * </PermissionGate>
 *
 * <PermissionGate permission="staff:delete" minPriority={Priority.ADMIN}>
 *   <DeleteStaffButton />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  requireAll = false,
  minPriority,
  children,
  fallback = null,
  fallbackTitle,
  fallbackDescription,
  loading = null,
}: PermissionGateProps) {
  const { hasPermission, isLoading, error } = usePermissionGuard(permission, { requireAll });
  const hasPriority = useHasMinPriority(minPriority ?? 0);

  // Resolve the fallback content
  const resolveFallback = () => {
    if (fallback === 'styled') {
      return (
        <PermissionDeniedFallback
          title={fallbackTitle}
          description={fallbackDescription}
        />
      );
    }
    return fallback;
  };

  // Show loading state
  if (isLoading) {
    return <>{loading}</>;
  }

  // Check priority if specified
  if (minPriority !== undefined && !hasPriority) {
    return <>{resolveFallback()}</>;
  }

  // Check permission
  if (!hasPermission) {
    return <>{resolveFallback()}</>;
  }

  // Show error state (optional - could also just show fallback)
  if (error) {
    console.error('Permission check error:', error);
    return <>{resolveFallback()}</>;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for permission-based access control
 *
 * Example usage:
 * ```tsx
 * const ProtectedPage = withPermission(
 *   MyPage,
 *   'analytics:read',
 *   { fallback: <NoAccessPage /> }
 * );
 * ```
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission | string | (Permission | string)[],
  options?: {
    requireAll?: boolean;
    minPriority?: number;
    fallback?: React.ComponentType;
  }
) {
  return function PermissionProtectedComponent(props: P) {
    const FallbackComponent = options?.fallback;

    return (
      <PermissionGate
        permission={permission}
        requireAll={options?.requireAll}
        minPriority={options?.minPriority}
        fallback={FallbackComponent ? <FallbackComponent /> : null}
      >
        <Component {...props} />
      </PermissionGate>
    );
  };
}

/**
 * Hook for imperative permission checks (e.g., in event handlers)
 *
 * Example usage:
 * ```tsx
 * const { canPerform } = useCanPerform();
 *
 * const handleRefund = () => {
 *   if (!canPerform('orders:refund')) {
 *     toast.error('You do not have permission to issue refunds');
 *     return;
 *   }
 *   // proceed with refund
 * };
 * ```
 */
export function useCanPerform() {
  const { hasPermission: _unused, ...permState } = usePermissionGuard([]);

  const canPerform = React.useCallback(
    (permission: Permission | string) => {
      const { hasPermission } = usePermissionGuard(permission);
      return hasPermission;
    },
    []
  );

  return {
    canPerform,
    isLoading: permState.isLoading,
  };
}

// Export Permissions object as "Permission" for use as Permission.ORDERS_READ etc.
export { Permissions as Permission, Priority };
export type { Permission as PermissionType };
export default PermissionGate;
