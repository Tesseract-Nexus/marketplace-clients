'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useTenant } from './TenantContext';
import { storefrontService } from '@/lib/services/storefrontService';
import { apiClient } from '@/lib/api/client';

export interface Storefront {
  id: string;
  vendorId: string;
  slug: string;
  name: string;
  description?: string;
  customDomain?: string;
  isActive: boolean;
  logoUrl?: string;
  faviconUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface StorefrontContextType {
  currentStorefront: Storefront | null;
  storefronts: Storefront[];
  isLoading: boolean;
  error: string | null;
  switchStorefront: (storefrontId: string) => void;
  refreshStorefronts: () => Promise<void>;
  hasMultipleStorefronts: boolean;
}

const StorefrontContext = createContext<StorefrontContextType | undefined>(undefined);

interface StorefrontProviderProps {
  children: ReactNode;
}

export function StorefrontProvider({ children }: StorefrontProviderProps) {
  const { currentTenant } = useTenant();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [currentStorefront, setCurrentStorefront] = useState<Storefront | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch storefronts for current tenant
  const fetchStorefronts = useCallback(async () => {
    if (!currentTenant?.id) {
      setStorefronts([]);
      setCurrentStorefront(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Ensure tenant ID is set on apiClient before fetching
      // This handles the race condition where TenantApiProvider's useEffect
      // hasn't run yet (child effects run before parent effects)
      apiClient.setTenantId(currentTenant.id);

      // Don't filter by vendorId - the backend filters by tenant via x-jwt-claim-tenant-id header
      const response = await storefrontService.getStorefronts();

      const storefrontList = response.data || [];
      setStorefronts(storefrontList);

      // Try to restore previously selected storefront from localStorage
      const savedStorefrontId = localStorage.getItem(`storefront_${currentTenant.id}`);

      if (savedStorefrontId) {
        const savedStorefront = storefrontList.find((s: Storefront) => s.id === savedStorefrontId);
        if (savedStorefront) {
          setCurrentStorefront(savedStorefront);
        } else if (storefrontList.length > 0) {
          // Saved storefront not found, use first one
          setCurrentStorefront(storefrontList[0]);
        }
      } else if (storefrontList.length > 0) {
        // No saved preference, use first storefront
        setCurrentStorefront(storefrontList[0]);
      } else {
        setCurrentStorefront(null);
      }
    } catch (err) {
      console.error('Error fetching storefronts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch storefronts');
      setStorefronts([]);
      setCurrentStorefront(null);
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant?.id]);

  // Fetch storefronts when tenant changes
  useEffect(() => {
    fetchStorefronts();
  }, [fetchStorefronts]);

  // Switch to a different storefront
  const switchStorefront = useCallback((storefrontId: string) => {
    const storefront = storefronts.find((s) => s.id === storefrontId);
    if (!storefront) {
      console.error('Storefront not found:', storefrontId);
      return;
    }

    setCurrentStorefront(storefront);

    // Persist selection to localStorage
    if (currentTenant?.id) {
      localStorage.setItem(`storefront_${currentTenant.id}`, storefrontId);
    }
  }, [storefronts, currentTenant?.id]);

  const refreshStorefronts = useCallback(async () => {
    await fetchStorefronts();
  }, [fetchStorefronts]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    currentStorefront,
    storefronts,
    isLoading,
    error,
    switchStorefront,
    refreshStorefronts,
    hasMultipleStorefronts: storefronts.length > 1,
  }), [
    currentStorefront,
    storefronts,
    isLoading,
    error,
    switchStorefront,
    refreshStorefronts,
  ]);

  return (
    <StorefrontContext.Provider value={contextValue}>
      {children}
    </StorefrontContext.Provider>
  );
}

export function useStorefront() {
  const context = useContext(StorefrontContext);
  if (context === undefined) {
    throw new Error('useStorefront must be used within a StorefrontProvider');
  }
  return context;
}
