'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useTenant } from './TenantContext';
import { staffRoleService } from '@/lib/api/rbac';
import type { EffectivePermissions, Permission, Role } from '@/lib/api/rbacTypes';

interface PermissionContextType {
  permissions: string[];           // Flat list of permission names (e.g., 'catalog:products:view')
  roles: Role[];                   // User's assigned roles
  effectivePermissions: EffectivePermissions | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canManageStaff: boolean;
  canCreateRoles: boolean;
  maxPriorityLevel: number;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

export function PermissionProvider({ children }: PermissionProviderProps) {
  const { user: authUser, isAuthenticated } = useAuth();
  const { currentTenant } = useTenant();
  const [effectivePermissions, setEffectivePermissions] = useState<EffectivePermissions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract flat list of permission names for easy checking
  const permissions = effectivePermissions?.permissions?.map(p => p.name) || [];
  const roles = effectivePermissions?.roles || [];
  const canManageStaff = effectivePermissions?.canManageStaff || false;
  const canCreateRoles = effectivePermissions?.canCreateRoles || false;
  const maxPriorityLevel = effectivePermissions?.maxPriorityLevel || 0;

  // Fetch permissions when user and tenant are available
  const fetchPermissions = useCallback(async () => {
    if (!isAuthenticated || !currentTenant?.id) {
      setEffectivePermissions(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await staffRoleService.getMyEffectivePermissions();

      if (response.success && response.data) {
        setEffectivePermissions(response.data);
      } else {
        // User might not have a staff record yet (e.g., newly onboarded owner)
        // Set empty permissions but don't show error
        console.warn('Could not fetch permissions:', response.message);
        setEffectivePermissions(null);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      // Don't set error for permission fetch failures - fall back to role-based
      setEffectivePermissions(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentTenant?.id]);

  // Fetch permissions when auth or tenant changes
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Permission check helpers
  const hasPermission = useCallback((permission: string): boolean => {
    // Owner (priority 100) has all permissions
    if (maxPriorityLevel >= 100) return true;
    return permissions.includes(permission);
  }, [permissions, maxPriorityLevel]);

  const hasAnyPermission = useCallback((permissionList: string[]): boolean => {
    if (maxPriorityLevel >= 100) return true;
    return permissionList.some(p => permissions.includes(p));
  }, [permissions, maxPriorityLevel]);

  const hasAllPermissions = useCallback((permissionList: string[]): boolean => {
    if (maxPriorityLevel >= 100) return true;
    return permissionList.every(p => permissions.includes(p));
  }, [permissions, maxPriorityLevel]);

  const refreshPermissions = useCallback(async () => {
    await fetchPermissions();
  }, [fetchPermissions]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    permissions,
    roles,
    effectivePermissions,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageStaff,
    canCreateRoles,
    maxPriorityLevel,
    refreshPermissions,
  }), [
    permissions,
    roles,
    effectivePermissions,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageStaff,
    canCreateRoles,
    maxPriorityLevel,
    refreshPermissions,
  ]);

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}

/**
 * Hook to check a single permission
 * @param permission Permission name (e.g., 'catalog:products:view')
 * @returns boolean indicating if user has the permission
 */
export function useHasPermission(permission: string): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
}

/**
 * Hook to check multiple permissions (any match)
 * @param permissions Array of permission names
 * @returns boolean indicating if user has any of the permissions
 */
export function useHasAnyPermission(permissions: string[]): boolean {
  const { hasAnyPermission } = usePermissions();
  return hasAnyPermission(permissions);
}
