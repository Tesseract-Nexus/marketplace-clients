'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';
import { useTenant } from './TenantContext';
import { useUser } from './UserContext';
import { apiClient } from '@/lib/api/client';
import { enhancedApiClient } from '@/lib/api/enhanced-client';
import { Loader2, AlertCircle } from 'lucide-react';

// DEV AUTH BYPASS - Skip tenant checks when enabled
const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

// Mock tenant for dev mode
const DEV_MOCK_TENANT = {
  id: 'dev-tenant-001',
  slug: 'dev-tenant',
  name: 'Dev Tenant',
  businessModel: 'ONLINE_STORE' as const,
  status: 'active' as const,
  role: 'owner',
};

/**
 * Store Not Found page component
 * Extracted to handle client-side window access properly and avoid hydration errors
 */
function StoreNotFoundPage() {
  const [requestedSlug, setRequestedSlug] = useState<string | null>(null);

  useEffect(() => {
    // Only access window on client side
    const hostname = window.location.hostname;
    const slugMatch = hostname.match(/^(.+)-admin\.tesserix\.app$/);
    setRequestedSlug(slugMatch ? slugMatch[1] : null);
  }, []);

  const handleLogout = () => {
    // Redirect to BFF logout endpoint which handles session cleanup
    window.location.href = '/auth/logout?returnTo=/login';
  };

  const handleCreateStore = () => {
    // Redirect to onboarding
    window.location.href = 'https://dev-onboarding.tesserix.app';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md p-8 bg-card rounded-2xl shadow-xl">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">Store Not Found</h2>
        {requestedSlug && (
          <p className="text-muted-foreground mb-2">
            The store <span className="font-semibold text-foreground">&quot;{requestedSlug}&quot;</span> doesn&apos;t exist or has been deleted.
          </p>
        )}
        <p className="text-muted-foreground text-sm mb-6">
          This URL is not associated with any active store.
        </p>
        <div className="space-y-3">
          <button
            onClick={handleCreateStore}
            className="w-full px-4 py-3 bg-primary text-white rounded-md hover:bg-primary transition-colors font-medium"
          >
            Create a New Store
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 bg-muted text-foreground rounded-md hover:bg-muted transition-colors font-medium"
          >
            Sign Out & Login Again
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-6">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}

interface TenantApiProviderProps {
  children: ReactNode;
  /** If true, blocks rendering until tenant is loaded */
  requireTenant?: boolean;
}

/**
 * Provider component that synchronizes the current tenant context
 * with ALL API clients for automatic tenant header injection.
 *
 * SECURITY: This ensures all API requests include the tenant ID header
 * for proper multi-tenant data isolation.
 *
 * Production-grade features:
 * - Syncs tenant with both legacy and enhanced API clients
 * - Sets tenant ID SYNCHRONOUSLY before children render (not in useEffect)
 * - Shows loading/error states for better UX
 */
export function TenantApiProvider({ children, requireTenant = true }: TenantApiProviderProps) {
  const { currentTenant: realTenant, isLoading: realLoading, error: realError } = useTenant();
  const { user: realUser, isLoading: realUserLoading } = useUser();

  // DEV MODE: Use mock tenant and user, skip loading states
  const currentTenant = DEV_AUTH_BYPASS ? DEV_MOCK_TENANT : realTenant;
  const isLoading = DEV_AUTH_BYPASS ? false : realLoading;
  const error = DEV_AUTH_BYPASS ? null : realError;
  const user = DEV_AUTH_BYPASS ? { id: 'dev-user-001', email: 'dev@tesserix.local', displayName: 'Dev User' } : realUser;
  const userLoading = DEV_AUTH_BYPASS ? false : realUserLoading;

  // Log dev bypass status
  useEffect(() => {
    if (DEV_AUTH_BYPASS) {
      console.log('[TenantApiProvider] 🔓 DEV AUTH BYPASS - using mock tenant:', DEV_MOCK_TENANT.slug);
    }
  }, []);

  // Track the last tenant ID, vendor ID, and user info we set on the API client
  const lastSetTenantId = useRef<string | null>(null);
  const lastSetVendorId = useRef<string | null>(null);
  const lastSetUserId = useRef<string | null>(null);

  // NOTE: Auth tokens are no longer stored in localStorage
  // All API requests go through the BFF which handles authentication via secure HttpOnly cookies
  // The API client uses credentials: 'include' to send cookies with requests

  // CRITICAL: Set tenant ID SYNCHRONOUSLY during render (not in useEffect)
  // This ensures the tenant ID is set BEFORE children render and fetch data
  // This is safe because setTenantId just updates a variable, no side effects
  if (currentTenant?.id && currentTenant.id !== lastSetTenantId.current) {
    apiClient.setTenantId(currentTenant.id);
    enhancedApiClient.setTenantId(currentTenant.id);
    lastSetTenantId.current = currentTenant.id;
  } else if (!currentTenant?.id && lastSetTenantId.current) {
    apiClient.setTenantId(null);
    enhancedApiClient.setTenantId(null);
    lastSetTenantId.current = null;
  }

  // Set vendor ID for marketplace isolation (Tenant -> Vendor -> Staff hierarchy)
  // Vendors/Staff only see their own data (products, orders, etc.)
  // IMPORTANT: In this system, the tenant ID IS the vendor ID for storefronts
  // Use user.vendorId if available (for staff users), otherwise fallback to tenant ID
  const effectiveVendorId = user?.vendorId || currentTenant?.id || null;
  if (effectiveVendorId && effectiveVendorId !== lastSetVendorId.current) {
    apiClient.setVendorId(effectiveVendorId);
    enhancedApiClient.setVendorId(effectiveVendorId);
    lastSetVendorId.current = effectiveVendorId;
  } else if (!effectiveVendorId && lastSetVendorId.current) {
    apiClient.setVendorId(null);
    enhancedApiClient.setVendorId(null);
    lastSetVendorId.current = null;
  }

  // Set user info for proper attribution on API requests
  if (user?.id && user.id !== lastSetUserId.current) {
    const userName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    const userRole = currentTenant?.role || user.role || 'admin';
    const userEmail = user.email || null;
    apiClient.setUserInfo(user.id, userName, userRole, userEmail);
    enhancedApiClient.setUserInfo(user.id, userName, userRole, userEmail);
    lastSetUserId.current = user.id;
  } else if (!user?.id && lastSetUserId.current) {
    apiClient.setUserInfo(null, null, null, null);
    enhancedApiClient.setUserInfo(null, null, null, null);
    lastSetUserId.current = null;
  }

  // Block rendering until tenant AND user are loaded
  // This prevents race conditions where API calls are made before user info is set on the client
  if (requireTenant && (isLoading || userLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{isLoading ? 'Loading tenant context...' : 'Loading user context...'}</p>
        </div>
      </div>
    );
  }

  // Show error state if tenant loading failed
  // IMPORTANT: Only show tenant error if user IS authenticated
  // If user is not authenticated, let the layout redirect to login first
  if (requireTenant && error) {
    // Check if user is authenticated - if not, redirect to login instead of showing error
    if (!user && !userLoading) {
      // Not authenticated - return null and let TenantLayoutInner handle redirect to login
      return null;
    }

    // User IS authenticated but doesn't have access to this tenant - show error
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-card rounded-xl shadow-lg">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Tenant Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => window.location.href = '/auth/logout?returnTo=/login'}
              className="w-full px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted transition-colors"
            >
              Sign Out & Login with Different Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no tenant is selected but it's required
  // First check if user is authenticated - if not, let the layout redirect to login
  if (requireTenant && !isLoading && !currentTenant) {
    // Check if user is authenticated via user context (session is managed by BFF)
    if (!user) {
      // Not authenticated - return null and let TenantLayoutInner handle redirect
      return null;
    }
    // Authenticated but no tenant access - show Store Not Found
    return <StoreNotFoundPage />;
  }

  return <>{children}</>;
}

/**
 * Hook to get the current tenant ID for API calls
 * Use this when you need to manually pass tenant ID
 */
export function useCurrentTenantId(): string | null {
  const { currentTenant } = useTenant();
  return currentTenant?.id ?? null;
}
