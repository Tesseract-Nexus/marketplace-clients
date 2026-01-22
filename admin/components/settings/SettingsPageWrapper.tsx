'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { Loader2, Plus, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { StoreSelector } from './StoreSelector';
import { storefrontService } from '@/lib/services/storefrontService';
import { settingsService } from '@/lib/services/settingsService';
import type { Storefront } from '@/lib/api/types';
import { useDialog } from '@/contexts/DialogContext';

interface SettingsPageWrapperProps {
  title: string;
  description: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
  children: (props: {
    selectedStorefront: Storefront;
    settings: any;
    settingsId: string | null;
    loading: boolean;
    onSave: (data: any) => Promise<void>;
  }) => ReactNode;
  settingsPath?: string; // e.g., 'ecommerce.pricing' to extract specific settings
  saveIcon?: ReactNode;
  saveButtonText?: string;
}

export function SettingsPageWrapper({
  title,
  description,
  breadcrumbs,
  children,
  settingsPath,
  saveIcon,
  saveButtonText = 'Save Changes',
}: SettingsPageWrapperProps) {
  const { showSuccess, showError } = useDialog();

  // Storefront state
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);

  // Settings state
  const [settings, setSettings] = useState<any>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Ref to track save function from children
  const saveDataRef = React.useRef<any>(null);

  // Load storefronts on mount
  useEffect(() => {
    loadStorefronts();
  }, []);

  // Load settings when storefront changes
  useEffect(() => {
    if (selectedStorefront) {
      loadSettings(selectedStorefront.id);
    }
  }, [selectedStorefront?.id]);

  const loadStorefronts = async () => {
    try {
      setLoadingStorefronts(true);
      const result = await storefrontService.getStorefronts();
      const sfList = result.data || [];
      setStorefronts(sfList);

      if (sfList.length > 0) {
        setSelectedStorefront(sfList[0]);
      }
    } catch (err) {
      console.error('Failed to load storefronts:', err);
    } finally {
      setLoadingStorefronts(false);
    }
  };

  const loadSettings = async (storefrontId: string) => {
    try {
      setLoading(true);
      const data = await settingsService.getSettingsByContext({
        applicationId: 'admin-portal',
        scope: 'application',
        tenantId: storefrontId,
      });

      if (data) {
        setSettingsId(data.id);
        // Extract specific path if provided
        if (settingsPath) {
          const parts = settingsPath.split('.');
          let extracted: any = data;
          for (const part of parts) {
            extracted = extracted?.[part];
          }
          setSettings(extracted || null);
        } else {
          setSettings(data);
        }
      } else {
        setSettingsId(null);
        setSettings(null);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setSettingsId(null);
      setSettings(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    if (!selectedStorefront) {
      showError('Error', 'Please select a storefront first');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        context: {
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: selectedStorefront.id,
        },
        ...data,
      };

      if (settingsId) {
        await settingsService.updateSettings(settingsId, payload, selectedStorefront.id);
      } else {
        const newSettings = await settingsService.createSettings(payload as any, selectedStorefront.id);
        setSettingsId(newSettings.id);
      }

      showSuccess('Success', `${title} saved successfully!`);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      showError('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleStorefrontCreated = (storefront: Storefront) => {
    setStorefronts((prev) => [...prev, storefront]);
    setSelectedStorefront(storefront);
  };

  if (loadingStorefronts && !storefronts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading storefronts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title={title}
          description={description}
          breadcrumbs={breadcrumbs}
          actions={
            <Button
              onClick={() => saveDataRef.current?.()}
              disabled={saving || !selectedStorefront}
              className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                saveIcon
              )}
              {saveButtonText}
            </Button>
          }
        />

        <StoreSelector
          storefronts={storefronts}
          selectedStorefront={selectedStorefront}
          onSelect={setSelectedStorefront}
          onStorefrontCreated={handleStorefrontCreated}
          loading={loadingStorefronts}
        />

        {selectedStorefront ? (
          loading ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          ) : (
            <>
              {children({
                selectedStorefront,
                settings,
                settingsId,
                loading,
                onSave: handleSave,
              })}
            </>
          )
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Create Your First Storefront
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by creating a storefront. Each storefront gets its own subdomain
              and can be customized independently.
            </p>
            <Button className="bg-primary text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Storefront
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Export a simpler hook for custom implementations
export function useSettingsPage() {
  const { showSuccess, showError } = useDialog();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadStorefronts();
  }, []);

  useEffect(() => {
    if (selectedStorefront) {
      loadSettings(selectedStorefront.id);
    }
  }, [selectedStorefront?.id]);

  const loadStorefronts = async () => {
    try {
      setLoadingStorefronts(true);
      const result = await storefrontService.getStorefronts();
      const sfList = result.data || [];
      setStorefronts(sfList);
      if (sfList.length > 0) {
        setSelectedStorefront(sfList[0]);
      }
    } catch (err) {
      console.error('Failed to load storefronts:', err);
    } finally {
      setLoadingStorefronts(false);
    }
  };

  const loadSettings = async (storefrontId: string) => {
    try {
      setLoading(true);
      const data = await settingsService.getSettingsByContext({
        applicationId: 'admin-portal',
        scope: 'application',
        tenantId: storefrontId,
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
      setLoading(false);
    }
  };

  const saveSettings = async (payload: any) => {
    if (!selectedStorefront) {
      showError('Error', 'Please select a storefront first');
      return;
    }

    try {
      setSaving(true);
      const data = {
        context: {
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: selectedStorefront.id,
        },
        ...payload,
      };

      if (settingsId) {
        await settingsService.updateSettings(settingsId, data, selectedStorefront.id);
      } else {
        const newSettings = await settingsService.createSettings(data as any, selectedStorefront.id);
        setSettingsId(newSettings.id);
      }
      showSuccess('Success', 'Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showError('Error', 'Failed to save settings');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleStorefrontCreated = (storefront: Storefront) => {
    setStorefronts((prev) => [...prev, storefront]);
    setSelectedStorefront(storefront);
  };

  return {
    storefronts,
    selectedStorefront,
    setSelectedStorefront,
    loadingStorefronts,
    settings,
    settingsId,
    loading,
    saving,
    saveSettings,
    handleStorefrontCreated,
    refreshSettings: () => selectedStorefront && loadSettings(selectedStorefront.id),
  };
}

export default SettingsPageWrapper;
