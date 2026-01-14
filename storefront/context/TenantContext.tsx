'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { StorefrontSettings, TenantInfo, DEFAULT_STOREFRONT_SETTINGS } from '@/types/storefront';
import type { StoreLocalization } from '@/lib/api/storefront';

// ========================================
// Default Localization
// ========================================

const DEFAULT_LOCALIZATION: StoreLocalization = {
  currency: 'USD',
  currencySymbol: '$',
  timezone: 'UTC',
  dateFormat: 'DD/MM/YYYY',
  language: 'en',
  region: '',
  country: '',
  countryCode: '',
};

// ========================================
// Context Types
// ========================================

interface TenantContextValue {
  tenant: TenantInfo | null;
  settings: StorefrontSettings;
  localization: StoreLocalization;
  isLoading: boolean;
  // Helper functions
  getNavPath: (path: string) => string;
  getAssetUrl: (path?: string) => string;
  formatPrice: (amount: number) => string;
}

// ========================================
// Context
// ========================================

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

// ========================================
// Provider Props
// ========================================

interface TenantProviderProps {
  children: React.ReactNode;
  tenant: TenantInfo | null;
  settings: StorefrontSettings;
  localization?: StoreLocalization;
  isLoading?: boolean;
}

// ========================================
// Provider Component
// ========================================

export function TenantProvider({
  children,
  tenant,
  settings,
  localization = DEFAULT_LOCALIZATION,
  isLoading = false,
}: TenantProviderProps) {
  const value = useMemo<TenantContextValue>(() => ({
    tenant,
    settings,
    localization,
    isLoading,
    getNavPath: (path: string) => {
      // With hostname-based routing, paths are root-relative (no slug prefix)
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      return normalizedPath;
    },
    getAssetUrl: (path?: string) => {
      if (!path) return '/placeholder.svg';
      if (path.startsWith('http')) return path;
      return path;
    },
    formatPrice: (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: localization.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    },
  }), [tenant, settings, localization, isLoading]);

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
}

// ========================================
// Hooks
// ========================================

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

export function useStorefrontSettings(): StorefrontSettings {
  const { settings } = useTenant();
  return settings;
}

export function useTenantInfo(): TenantInfo | null {
  const { tenant } = useTenant();
  return tenant;
}

export function useHeaderConfig() {
  const { settings } = useTenant();
  return settings.headerConfig;
}

export function useFooterConfig() {
  const { settings } = useTenant();
  return settings.footerConfig;
}

export function useHomepageConfig() {
  const { settings } = useTenant();
  return settings.homepageConfig;
}

export function useProductConfig() {
  const { settings } = useTenant();
  return settings.productConfig;
}

export function useCheckoutConfig() {
  const { settings } = useTenant();
  return settings.checkoutConfig;
}

export function useTypographyConfig() {
  const { settings } = useTenant();
  return settings.typographyConfig || DEFAULT_STOREFRONT_SETTINGS.typographyConfig!;
}

export function useLayoutConfig() {
  const { settings } = useTenant();
  return settings.layoutConfig || DEFAULT_STOREFRONT_SETTINGS.layoutConfig!;
}

export function useMobileConfig() {
  const { settings } = useTenant();
  return settings.mobileConfig || DEFAULT_STOREFRONT_SETTINGS.mobileConfig!;
}

export function useMarketingConfig() {
  const { settings } = useTenant();
  return settings.marketingConfig || DEFAULT_STOREFRONT_SETTINGS.marketingConfig!;
}

export function useNavPath() {
  const { getNavPath } = useTenant();
  return getNavPath;
}

export function useLocalization(): StoreLocalization {
  const { localization } = useTenant();
  return localization;
}

export function useFormatPrice() {
  const { formatPrice } = useTenant();
  return formatPrice;
}

export function useCurrency() {
  const { localization } = useTenant();
  return {
    code: localization.currency,
    symbol: localization.currencySymbol,
  };
}

// Re-export for convenience
export type { StoreLocalization };
