'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Save, RefreshCw, Loader2, AlertCircle, Upload, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/PageHeader';
import { BrandingAssetUploader } from '@/components/settings/BrandingAssetUploader';
import { useTheme } from '@/contexts/ThemeContext';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import { settingsService } from '@/lib/services/settingsService';
import type { AdminBrandingSettings } from '@/lib/types/settings';

// Simplified default branding settings - focus on essentials
const defaultBrandingSettings: AdminBrandingSettings = {
  general: {
    adminTitle: 'Admin Panel',
    adminSubtitle: '',
    logoUrl: '',
    faviconUrl: '',
    loginPageTitle: 'Welcome Back',
    loginPageSubtitle: 'Sign in to your account',
  },
  colors: {
    primaryColor: '#3b82f6',
    secondaryColor: '#8b5cf6',
    accentColor: '#a855f7',
    sidebarBg: '#1e293b',
    sidebarText: '#cbd5e1',
    sidebarActiveText: '#60a5fa',
    headerBg: '#ffffff',
    headerText: '#374151',
  },
  appearance: {
    sidebarStyle: 'dark',
    headerStyle: 'light',
    borderRadius: 'medium',
    fontFamily: 'inter',
    compactMode: false,
    showBreadcrumbs: true,
    showSearch: true,
    animationsEnabled: true,
  },
  advanced: {
    customCss: '',
    customLogo: true,
    showPoweredBy: false,
    enableCustomFonts: false,
    customFontUrl: '',
  },
};

export default function AdminBrandingPage() {
  const { branding, updateBranding, resetBranding } = useTheme();
  const { showSuccess, showError: showErrorDialog, showConfirm } = useDialog();
  const { currentTenant, isLoading: tenantLoading } = useTenant();

  // Form state
  const [brandingData, setBrandingData] = useState<AdminBrandingSettings>(defaultBrandingSettings);
  const [savedData, setSavedData] = useState<AdminBrandingSettings>(defaultBrandingSettings);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  // Merge branding with defaults
  const mergeBrandingWithDefaults = (data: Partial<AdminBrandingSettings> | undefined): AdminBrandingSettings => {
    if (!data) return defaultBrandingSettings;
    return {
      general: { ...defaultBrandingSettings.general, ...data.general },
      colors: { ...defaultBrandingSettings.colors, ...data.colors },
      appearance: { ...defaultBrandingSettings.appearance, ...data.appearance },
      advanced: { ...defaultBrandingSettings.advanced, ...data.advanced },
    };
  };

  // Load settings
  useEffect(() => {
    if (tenantLoading) return;

    if (currentTenant?.id) {
      loadSettings();
    } else {
      const mergedBranding = mergeBrandingWithDefaults(branding);
      setBrandingData(mergedBranding);
      setSavedData(mergedBranding);
      setLoading(false);
    }
  }, [currentTenant?.id, tenantLoading]);

  const loadSettings = async () => {
    if (!currentTenant?.id) return;

    try {
      setLoading(true);
      setLoadError(null);

      const data = await settingsService.getSettingsByContext({
        applicationId: 'admin-portal',
        scope: 'global',
        tenantId: currentTenant.id,
      });

      if (data && data.branding) {
        setSettingsId(data.id);
        const loadedBranding = mergeBrandingWithDefaults(data.branding as Partial<AdminBrandingSettings>);
        setBrandingData(loadedBranding);
        setSavedData(loadedBranding);
        updateBranding(loadedBranding);
      } else {
        const mergedBranding = mergeBrandingWithDefaults(branding);
        setBrandingData(mergedBranding);
        setSavedData(mergedBranding);
        setSettingsId(null);
      }
    } catch (error) {
      console.error('Failed to load branding settings:', error);
      const mergedBranding = mergeBrandingWithDefaults(branding);
      setBrandingData(mergedBranding);
      setSavedData(mergedBranding);
      setLoadError('Failed to load settings. Using defaults.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentTenant?.id) {
      showErrorDialog('Error', 'No tenant selected');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        context: {
          applicationId: 'admin-portal',
          scope: 'global' as const,
          tenantId: currentTenant.id,
        },
        branding: brandingData,
      };

      if (settingsId) {
        await settingsService.updateSettings(settingsId, { branding: brandingData }, currentTenant.id);
      } else {
        try {
          const newSettings = await settingsService.createSettings(payload, currentTenant.id);
          setSettingsId(newSettings.id);
        } catch (createError: any) {
          if (createError.message?.includes('already exist')) {
            const existing = await settingsService.getSettingsByContext({
              applicationId: 'admin-portal',
              scope: 'global',
              tenantId: currentTenant.id,
            });
            if (existing?.id) {
              await settingsService.updateSettings(existing.id, { branding: brandingData }, currentTenant.id);
              setSettingsId(existing.id);
            } else {
              throw createError;
            }
          } else {
            throw createError;
          }
        }
      }

      setSavedData(brandingData);
      updateBranding(brandingData);
      showSuccess('Saved', 'Branding settings saved successfully!');
    } catch (error) {
      console.error('Failed to save branding settings:', error);
      showErrorDialog('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = await showConfirm({
      title: 'Reset to Defaults',
      message: 'Reset all branding settings to defaults?',
      confirmLabel: 'Reset',
      cancelLabel: 'Cancel',
    });

    if (confirmed) {
      setBrandingData(defaultBrandingSettings);
      resetBranding();
    }
  };

  const hasChanges = JSON.stringify(brandingData) !== JSON.stringify(savedData);

  const updateField = (section: keyof AdminBrandingSettings, field: string, value: any) => {
    setBrandingData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading branding settings...</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.SETTINGS_VIEW}
      fallback="styled"
      fallbackTitle="Admin Branding"
      fallbackDescription="You don't have permission to view admin branding settings."
    >
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {loadError && (
            <div className="bg-warning-muted border border-warning/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm text-warning-foreground">{loadError}</p>
            </div>
          )}

          <PageHeader
            title="Admin Branding"
            description="Customize your admin panel appearance"
            badge={settingsId ? { label: 'Saved', variant: 'success' } : { label: 'Not Saved', variant: 'warning' }}
            actions={
              <div className="flex items-center gap-2">
                <Button onClick={handleReset} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={handleSave} disabled={!hasChanges || saving} size="sm">
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            }
          />

          {/* Logo & Favicon */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Image className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Logo & Favicon</h3>
                <p className="text-sm text-muted-foreground">Upload your brand assets</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BrandingAssetUploader
                assetType="logo"
                currentUrl={brandingData.general.logoUrl}
                onUpload={(url) => updateField('general', 'logoUrl', url)}
                onRemove={() => updateField('general', 'logoUrl', '')}
                label="Logo"
                description="PNG or SVG, max 2MB"
                aspectRatio="auto"
                disabled={loading}
                tenantId={currentTenant?.id}
              />
              <BrandingAssetUploader
                assetType="favicon"
                currentUrl={brandingData.general.faviconUrl}
                onUpload={(url) => updateField('general', 'faviconUrl', url)}
                onRemove={() => updateField('general', 'faviconUrl', '')}
                label="Favicon"
                description="32x32px ICO or PNG"
                aspectRatio="square"
                disabled={loading}
                tenantId={currentTenant?.id}
              />
            </div>
          </div>

          {/* Brand Colors */}
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Brand Colors</h3>
                <p className="text-sm text-muted-foreground">Customize your color scheme</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorPicker
                label="Primary"
                value={brandingData.colors.primaryColor}
                onChange={(v) => updateField('colors', 'primaryColor', v)}
              />
              <ColorPicker
                label="Secondary"
                value={brandingData.colors.secondaryColor}
                onChange={(v) => updateField('colors', 'secondaryColor', v)}
              />
              <ColorPicker
                label="Accent"
                value={brandingData.colors.accentColor}
                onChange={(v) => updateField('colors', 'accentColor', v)}
              />
              <ColorPicker
                label="Sidebar Background"
                value={brandingData.colors.sidebarBg}
                onChange={(v) => updateField('colors', 'sidebarBg', v)}
              />
              <ColorPicker
                label="Sidebar Text"
                value={brandingData.colors.sidebarText}
                onChange={(v) => updateField('colors', 'sidebarText', v)}
              />
              <ColorPicker
                label="Sidebar Active"
                value={brandingData.colors.sidebarActiveText}
                onChange={(v) => updateField('colors', 'sidebarActiveText', v)}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Preview</h3>
            <div className="flex gap-4 items-start">
              {/* Mini Sidebar Preview */}
              <div
                className="w-16 h-32 rounded-lg flex flex-col items-center py-3 gap-2"
                style={{ backgroundColor: brandingData.colors.sidebarBg }}
              >
                <div className="w-8 h-8 rounded" style={{ backgroundColor: brandingData.colors.primaryColor }} />
                <div className="w-10 h-2 rounded" style={{ backgroundColor: brandingData.colors.sidebarText, opacity: 0.5 }} />
                <div className="w-10 h-2 rounded" style={{ backgroundColor: brandingData.colors.sidebarActiveText }} />
                <div className="w-10 h-2 rounded" style={{ backgroundColor: brandingData.colors.sidebarText, opacity: 0.5 }} />
              </div>
              {/* Color Swatches */}
              <div className="flex gap-2 flex-wrap">
                <div
                  className="w-12 h-12 rounded-lg shadow-sm"
                  style={{ backgroundColor: brandingData.colors.primaryColor }}
                  title="Primary"
                />
                <div
                  className="w-12 h-12 rounded-lg shadow-sm"
                  style={{ backgroundColor: brandingData.colors.secondaryColor }}
                  title="Secondary"
                />
                <div
                  className="w-12 h-12 rounded-lg shadow-sm"
                  style={{ backgroundColor: brandingData.colors.accentColor }}
                  title="Accent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}

// Simple color picker component
function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded cursor-pointer border border-border"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1"
        />
      </div>
    </div>
  );
}
