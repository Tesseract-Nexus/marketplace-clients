'use client';

import { useState, useEffect, useCallback } from 'react';
import { storefrontService } from '@/lib/services/storefrontService';
import { settingsService } from '@/lib/services/settingsService';
import { useTenant } from '@/contexts/TenantContext';
import type { Storefront } from '@/lib/api/types';
import type { Settings } from '@/lib/types/settings';
import { buildStorefrontUrl } from '@/lib/utils/tenant';

interface UseStorefrontSettingsOptions {
  applicationId?: string;
  scope?: string;
  autoSelectFirst?: boolean;
}

interface UseStorefrontSettingsReturn {
  // Storefront state
  storefronts: Storefront[];
  selectedStorefront: Storefront | null;
  loadingStorefronts: boolean;
  selectStorefront: (storefront: Storefront) => void;

  // Settings state
  settings: Settings | null;
  settingsId: string | null;
  loadingSettings: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  saveSettings: (data: Partial<Settings>) => Promise<Settings | null>;
  refreshStorefronts: () => Promise<void>;

  // Helpers
  getStorefrontUrl: (slug: string) => string;
  hasStorefronts: boolean;
}

export function useStorefrontSettings(
  options: UseStorefrontSettingsOptions = {}
): UseStorefrontSettingsReturn {
  const {
    applicationId = 'admin-portal',
    scope = 'application',
    autoSelectFirst = true,
  } = options;

  const { currentTenant } = useTenant();

  // Storefront state
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);

  // Settings state
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Load storefronts on mount
  useEffect(() => {
    loadStorefronts();
  }, []);

  // Load settings when storefront changes and tenant is available
  useEffect(() => {
    if (selectedStorefront && currentTenant?.id) {
      loadSettingsForTenant();
    } else {
      setSettings(null);
      setSettingsId(null);
    }
  }, [selectedStorefront?.id, currentTenant?.id]);

  const loadStorefronts = async () => {
    try {
      setLoadingStorefronts(true);
      const result = await storefrontService.getStorefronts();
      const sfList = result.data || [];
      setStorefronts(sfList);

      // Auto-select first storefront if available and enabled
      if (autoSelectFirst && sfList.length > 0 && !selectedStorefront) {
        setSelectedStorefront(sfList[0]);
      }
    } catch (err) {
      console.error('Failed to load storefronts:', err);
    } finally {
      setLoadingStorefronts(false);
    }
  };

  const loadSettingsForTenant = async () => {
    // IMPORTANT: Use tenant ID (not storefront ID) for tenant-scoped settings
    const tenantId = currentTenant?.id;
    if (!tenantId) {
      console.warn('[useStorefrontSettings] No tenant ID available');
      return;
    }

    try {
      setLoadingSettings(true);
      const data = await settingsService.getSettingsByContext({
        applicationId,
        scope,
        tenantId: tenantId,
      });

      if (data) {
        setSettingsId(data.id);
        setSettings(data);
      } else {
        setSettingsId(null);
        setSettings(null);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setSettingsId(null);
      setSettings(null);
    } finally {
      setLoadingSettings(false);
    }
  };

  const loadSettings = useCallback(async () => {
    if (selectedStorefront && currentTenant?.id) {
      await loadSettingsForTenant();
    }
  }, [selectedStorefront?.id, currentTenant?.id]);

  const saveSettings = useCallback(async (data: Partial<Settings>): Promise<Settings | null> => {
    // IMPORTANT: Use tenant ID (not storefront ID) for tenant-scoped settings
    const tenantId = currentTenant?.id;
    if (!tenantId) {
      throw new Error('No tenant available');
    }

    if (!selectedStorefront) {
      throw new Error('No storefront selected');
    }

    const payload = {
      ...data,
      context: {
        applicationId,
        scope,
        tenantId: tenantId,
      },
    };

    try {
      let result: Settings;
      if (settingsId) {
        result = await settingsService.updateSettings(settingsId, payload, tenantId);
      } else {
        result = await settingsService.createSettings(payload as any, tenantId);
        setSettingsId(result.id);
      }
      setSettings(result);
      return result;
    } catch (err) {
      console.error('Failed to save settings:', err);
      throw err;
    }
  }, [selectedStorefront?.id, settingsId, applicationId, scope, currentTenant?.id]);

  const selectStorefront = useCallback((storefront: Storefront) => {
    setSelectedStorefront(storefront);
  }, []);

  const refreshStorefronts = useCallback(async () => {
    await loadStorefronts();
  }, []);

  const getStorefrontUrl = useCallback((slug: string) => {
    return buildStorefrontUrl(slug);
  }, []);

  return {
    // Storefront state
    storefronts,
    selectedStorefront,
    loadingStorefronts,
    selectStorefront,

    // Settings state
    settings,
    settingsId,
    loadingSettings,

    // Actions
    loadSettings,
    saveSettings,
    refreshStorefronts,

    // Helpers
    getStorefrontUrl,
    hasStorefronts: storefronts.length > 0,
  };
}

export default useStorefrontSettings;
