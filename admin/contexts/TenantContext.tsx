'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  getCurrentTenantSlug,
  navigateToTenantWithUrl,
  isRootDomain,
  buildAdminUrl,
} from '@/lib/utils/tenant';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: 'owner' | 'admin' | 'manager' | 'staff' | 'member' | 'viewer' | 'platform_admin';
  isDefault: boolean;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  displayName?: string;
  businessModel?: 'ONLINE_STORE' | 'MARKETPLACE';
  createdAt?: string;
  // Custom domain support
  adminUrl?: string; // Full admin URL (e.g., https://admin.yahvismartfarm.com)
  customDomain?: string; // Custom domain if configured
  useCustomDomain?: boolean; // Whether custom domain is active
  memberCount?: number; // Optional team member count from backend
}

interface TenantContextType {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  isLoading: boolean;
  error: string | null;
  isRootDomain: boolean;
  isPlatformAdmin: boolean;
  switchTenant: (slug: string) => void;
  refreshTenants: () => Promise<void>;
  setDefaultTenant: (tenantId: string) => Promise<boolean>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onRootDomain, setOnRootDomain] = useState(true);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  // Get tenant slug from subdomain
  const getSlugFromSubdomain = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return getCurrentTenantSlug();
  }, []);

  // Fetch user's tenants
  const fetchTenants = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch tenants using BFF session (cookie-based auth)
      // The BFF will proxy this request with the access token
      const response = await fetch('/api/tenants/user-tenants', {
        credentials: 'include', // Include session cookie
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Handle 401 Unauthorized - user needs to log in
        if (response.status === 401) {
          setTenants([]);
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to fetch tenants');
      }

      const data = await response.json();
      const fetchedTenants = data.tenants || [];
      setTenants(fetchedTenants);

      // Check if user is a platform admin
      if (data.is_platform_admin) {
        setIsPlatformAdmin(true);
      }

      // Get tenant slug from subdomain
      const slug = getSlugFromSubdomain();
      setOnRootDomain(!slug);

      if (slug && fetchedTenants.length > 0) {
        // Find tenant matching the subdomain
        const matched = fetchedTenants.find((t: Tenant) => t.slug === slug);
        if (matched) {
          setCurrentTenant(matched);
        } else {
          // Subdomain doesn't match any tenant user has access to
          // Could redirect to default or show error
          console.warn(`Tenant "${slug}" not found in user's tenants`);
          setError(`You don't have access to "${slug}"`);
        }
      } else if (!slug && fetchedTenants.length > 0) {
        // On root domain - set default tenant but don't navigate
        const defaultTenant = fetchedTenants.find((t: Tenant) => t.isDefault) || fetchedTenants[0];
        setCurrentTenant(defaultTenant);
      }
    } catch (err) {
      console.error('Error fetching tenants:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tenants');
    } finally {
      setIsLoading(false);
    }
  }, [getSlugFromSubdomain]);

  // Initial fetch
  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // NOTE: Tenant ID is set on API client by TenantApiProvider (synchronously during render)
  // This ensures tenant ID is set BEFORE children render and make API requests

  // Switch to a different tenant (navigates to new subdomain or custom domain)
  const switchTenant = useCallback((newSlug: string) => {
    const tenant = tenants.find((t) => t.slug === newSlug);
    if (!tenant) {
      console.error('Tenant not found:', newSlug);
      return;
    }

    // Get the current path to preserve navigation context
    const currentPath = window.location.pathname;

    // Determine the target URL:
    // 1. If tenant has a custom adminUrl, use it
    // 2. Otherwise, build standard admin URL
    let targetUrl: string;
    if (tenant.adminUrl) {
      // Use the custom admin URL (e.g., https://admin.yahvismartfarm.com)
      targetUrl = tenant.adminUrl + currentPath;
      console.log('[Tenant] Switching to custom domain:', targetUrl);
    } else {
      // Use standard pattern (e.g., https://{slug}-admin.tesserix.app)
      targetUrl = buildAdminUrl(tenant.slug, currentPath);
      console.log('[Tenant] Switching to standard domain:', targetUrl);
    }

    // Navigate to the new tenant (full page reload)
    navigateToTenantWithUrl(targetUrl);
  }, [tenants]);

  const refreshTenants = useCallback(async () => {
    await fetchTenants();
  }, [fetchTenants]);

  // Set a tenant as the user's default
  const setDefaultTenant = useCallback(async (tenantId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/tenants/set-default', {
        method: 'PUT',
        credentials: 'include', // Use BFF session cookie
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });

      if (response.ok) {
        // Update local state to reflect the change
        setTenants(prev => prev.map(t => ({
          ...t,
          isDefault: t.id === tenantId,
        })));
        return true;
      }

      console.error('Failed to set default tenant');
      return false;
    } catch (err) {
      console.error('Error setting default tenant:', err);
      return false;
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    currentTenant,
    tenants,
    isLoading,
    error,
    isRootDomain: onRootDomain,
    isPlatformAdmin,
    switchTenant,
    refreshTenants,
    setDefaultTenant,
  }), [
    currentTenant,
    tenants,
    isLoading,
    error,
    onRootDomain,
    isPlatformAdmin,
    switchTenant,
    refreshTenants,
    setDefaultTenant,
  ]);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

// Hook to build links (now just returns path since tenant is in subdomain)
export function useTenantLink() {
  const link = useCallback((path: string) => {
    // With subdomain routing, paths are relative - no tenant prefix needed
    return path.startsWith('/') ? path : '/' + path;
  }, []);

  return link;
}
