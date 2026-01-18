'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { getCurrencyFromCountry } from '@/lib/utils/currency';

interface TenantSettings {
  countryCode?: string;
  currency?: string;
}

/**
 * Hook to get the tenant's currency
 *
 * Determines currency from:
 * 1. Tenant's explicit currency setting (if available)
 * 2. Tenant's country code
 * 3. Default to USD
 */
export function useTenantCurrency(): {
  currency: string;
  isLoading: boolean;
} {
  const { currentTenant } = useTenant();
  const [currency, setCurrency] = useState<string>('USD');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTenantSettings() {
      if (!currentTenant?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Try to fetch tenant settings to get country/currency
        const response = await fetch(`/api/tenants/${currentTenant.id}/details`, {
          credentials: 'include',
          headers: {
            'x-jwt-claim-tenant-id': currentTenant.id,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const tenantData = data.data;

          // Check for explicit currency in store_setup (from onboarding)
          if (tenantData?.store_setup?.currency) {
            setCurrency(tenantData.store_setup.currency);
          } else if (tenantData?.address?.country) {
            // Fall back to country from business address
            setCurrency(getCurrencyFromCountry(tenantData.address.country));
          }
          // If neither is available, keep the default 'USD'
        } else if (response.status === 401) {
          // Auth not ready yet, use default - will retry on next render
          console.debug('Tenant details requires auth, using default currency');
        } else {
          console.warn(`Failed to fetch tenant currency: ${response.status}`);
        }
      } catch (error) {
        console.error('Failed to fetch tenant settings for currency:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTenantSettings();
  }, [currentTenant?.id]);

  return { currency, isLoading };
}

export default useTenantCurrency;
