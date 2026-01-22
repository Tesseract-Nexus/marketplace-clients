'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Save, RefreshCw, Loader2, AlertCircle, Upload, Image, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { PageHeader } from '@/components/PageHeader';
import { BrandingAssetUploader } from '@/components/settings/BrandingAssetUploader';
import { useTheme } from '@/contexts/ThemeContext';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import { settingsService } from '@/lib/services/settingsService';
import type { AdminBrandingSettings } from '@/lib/types/settings';

// Predefined professional theme presets
const themePresets = [
  {
    id: 'classic-slate',
    name: 'Classic Slate',
    description: 'Professional & timeless',
    colors: {
      primaryColor: '#0f172a',
      secondaryColor: '#334155',
      accentColor: '#2563eb',
      sidebarBg: '#f8fafc',
      sidebarText: '#475569',
      sidebarActiveText: '#2563eb',
      headerBg: '#ffffff',
      headerText: '#0f172a',
    },
    preview: {
      bg: '#f8fafc',
      primary: '#0f172a',
      accent: '#2563eb',
    },
  },
  {
    id: 'ocean-teal',
    name: 'Ocean Teal',
    description: 'Fresh & unique',
    colors: {
      primaryColor: '#0d9488',
      secondaryColor: '#115e59',
      accentColor: '#14b8a6',
      sidebarBg: '#f0fdfa',
      sidebarText: '#134e4a',
      sidebarActiveText: '#0d9488',
      headerBg: '#ffffff',
      headerText: '#134e4a',
    },
    preview: {
      bg: '#f0fdfa',
      primary: '#0d9488',
      accent: '#14b8a6',
    },
  },
  {
    id: 'warm-ember',
    name: 'Warm Ember',
    description: 'Approachable & warm',
    colors: {
      primaryColor: '#1c1917',
      secondaryColor: '#44403c',
      accentColor: '#ea580c',
      sidebarBg: '#fafaf9',
      sidebarText: '#57534e',
      sidebarActiveText: '#ea580c',
      headerBg: '#ffffff',
      headerText: '#1c1917',
    },
    preview: {
      bg: '#fafaf9',
      primary: '#1c1917',
      accent: '#ea580c',
    },
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    description: 'Bold & modern',
    colors: {
      primaryColor: '#1e3a8a',
      secondaryColor: '#1e40af',
      accentColor: '#3b82f6',
      sidebarBg: '#0f172a',
      sidebarText: '#94a3b8',
      sidebarActiveText: '#60a5fa',
      headerBg: '#ffffff',
      headerText: '#1e3a8a',
    },
    preview: {
      bg: '#0f172a',
      primary: '#1e3a8a',
      accent: '#3b82f6',
    },
  },
  {
    id: 'royal-indigo',
    name: 'Royal Indigo',
    description: 'Sophisticated & premium',
    colors: {
      primaryColor: '#4f46e5',
      secondaryColor: '#6366f1',
      accentColor: '#818cf8',
      sidebarBg: '#fafafa',
      sidebarText: '#4b5563',
      sidebarActiveText: '#4f46e5',
      headerBg: '#ffffff',
      headerText: '#1f2937',
    },
    preview: {
      bg: '#fafafa',
      primary: '#4f46e5',
      accent: '#818cf8',
    },
  },
  {
    id: 'forest-green',
    name: 'Forest Green',
    description: 'Natural & trustworthy',
    colors: {
      primaryColor: '#166534',
      secondaryColor: '#15803d',
      accentColor: '#22c55e',
      sidebarBg: '#f0fdf4',
      sidebarText: '#14532d',
      sidebarActiveText: '#16a34a',
      headerBg: '#ffffff',
      headerText: '#14532d',
    },
    preview: {
      bg: '#f0fdf4',
      primary: '#166534',
      accent: '#22c55e',
    },
  },
];

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
    primaryColor: '#0f172a',
    secondaryColor: '#334155',
    accentColor: '#2563eb',
    sidebarBg: '#f8fafc',
    sidebarText: '#475569',
    sidebarActiveText: '#2563eb',
    headerBg: '#ffffff',
    headerText: '#0f172a',
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
        <div className="animate-in fade-in duration-500">
          {loadError && (
            <div className="bg-warning-muted border border-warning/30 rounded-lg p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-sm text-warning-foreground">{loadError}</p>
            </div>
          )}

          <PageHeader
            title="Admin Branding"
            description="Customize your admin panel appearance"
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Settings', href: '/settings' },
              { label: 'Admin Branding' },
            ]}
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

          {/* Two Column Layout */}
          <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1fr,320px] gap-6">
            {/* Left Column - Settings */}
            <div className="space-y-6">
              {/* Theme Presets */}
              <div className="bg-card rounded-lg border border-border p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Theme Presets</h3>
                    <p className="text-xs text-muted-foreground">Quick start with professional color schemes</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {themePresets.map((preset) => {
                    const isSelected =
                      brandingData.colors.primaryColor === preset.colors.primaryColor &&
                      brandingData.colors.accentColor === preset.colors.accentColor;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => setBrandingData(prev => ({
                          ...prev,
                          colors: { ...prev.colors, ...preset.colors },
                        }))}
                        className={`relative group p-2 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                          isSelected
                            ? 'border-accent bg-accent/5 shadow-sm'
                            : 'border-border hover:border-accent/50'
                        }`}
                        title={preset.description}
                      >
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        <div className="flex gap-0.5 mb-1.5 justify-center">
                          <div
                            className="w-4 h-4 rounded shadow-sm"
                            style={{ backgroundColor: preset.preview.primary }}
                          />
                          <div
                            className="w-4 h-4 rounded shadow-sm"
                            style={{ backgroundColor: preset.preview.accent }}
                          />
                          <div
                            className="w-4 h-4 rounded shadow-sm border border-border/50"
                            style={{ backgroundColor: preset.preview.bg }}
                          />
                        </div>
                        <p className="text-[10px] font-medium text-foreground truncate text-center">{preset.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Brand Colors */}
              <div className="bg-card rounded-lg border border-border p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Palette className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Brand Colors</h3>
                    <p className="text-xs text-muted-foreground">Customize your color scheme</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
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
                    label="Sidebar BG"
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

              {/* Logo & Favicon */}
              <div className="bg-card rounded-lg border border-border p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Image className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Logo & Favicon</h3>
                    <p className="text-xs text-muted-foreground">Upload your brand assets</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>

            {/* Right Column - Live Preview (Sticky) */}
            <div className="xl:sticky xl:top-24 xl:self-start">
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/50">
                  <h3 className="text-sm font-semibold text-foreground">Live Preview</h3>
                </div>

                {/* Mini Admin Layout Preview */}
                <div className="p-4">
                  <div className="rounded-lg border border-border overflow-hidden shadow-sm">
                    {/* Mini Header */}
                    <div
                      className="h-8 flex items-center px-3 border-b"
                      style={{ backgroundColor: brandingData.colors.headerBg || '#ffffff' }}
                    >
                      <div
                        className="w-16 h-3 rounded"
                        style={{ backgroundColor: brandingData.colors.headerText || brandingData.colors.primaryColor }}
                      />
                      <div className="ml-auto flex gap-1.5">
                        <div className="w-4 h-4 rounded bg-muted" />
                        <div className="w-4 h-4 rounded bg-muted" />
                      </div>
                    </div>

                    <div className="flex h-40">
                      {/* Mini Sidebar */}
                      <div
                        className="w-14 flex flex-col items-center py-3 gap-2 border-r"
                        style={{ backgroundColor: brandingData.colors.sidebarBg }}
                      >
                        {brandingData.general.logoUrl ? (
                          <img
                            src={brandingData.general.logoUrl}
                            alt="Logo"
                            className="w-7 h-7 rounded object-cover"
                          />
                        ) : (
                          <div
                            className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: brandingData.colors.primaryColor }}
                          >
                            A
                          </div>
                        )}
                        <div className="w-8 h-1.5 rounded" style={{ backgroundColor: brandingData.colors.sidebarText, opacity: 0.4 }} />
                        <div
                          className="w-8 h-1.5 rounded"
                          style={{ backgroundColor: brandingData.colors.sidebarActiveText }}
                        />
                        <div className="w-8 h-1.5 rounded" style={{ backgroundColor: brandingData.colors.sidebarText, opacity: 0.4 }} />
                        <div className="w-8 h-1.5 rounded" style={{ backgroundColor: brandingData.colors.sidebarText, opacity: 0.4 }} />
                      </div>

                      {/* Mini Content Area */}
                      <div className="flex-1 p-3 bg-background">
                        <div className="space-y-2">
                          <div
                            className="h-3 w-24 rounded"
                            style={{ backgroundColor: brandingData.colors.primaryColor }}
                          />
                          <div className="h-2 w-full rounded bg-muted" />
                          <div className="h-2 w-3/4 rounded bg-muted" />
                          <div className="mt-3 flex gap-2">
                            <div
                              className="h-5 w-14 rounded text-[8px] text-white flex items-center justify-center"
                              style={{ backgroundColor: brandingData.colors.accentColor }}
                            >
                              Button
                            </div>
                            <div className="h-5 w-14 rounded border border-border bg-background" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color Swatches */}
                <div className="px-4 pb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Color Palette</p>
                  <div className="flex gap-2">
                    <div className="flex-1 text-center">
                      <div
                        className="h-8 rounded-lg shadow-sm mb-1"
                        style={{ backgroundColor: brandingData.colors.primaryColor }}
                      />
                      <span className="text-[10px] text-muted-foreground">Primary</span>
                    </div>
                    <div className="flex-1 text-center">
                      <div
                        className="h-8 rounded-lg shadow-sm mb-1"
                        style={{ backgroundColor: brandingData.colors.secondaryColor }}
                      />
                      <span className="text-[10px] text-muted-foreground">Secondary</span>
                    </div>
                    <div className="flex-1 text-center">
                      <div
                        className="h-8 rounded-lg shadow-sm mb-1"
                        style={{ backgroundColor: brandingData.colors.accentColor }}
                      />
                      <span className="text-[10px] text-muted-foreground">Accent</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}

// Compact color picker component
function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer border border-border flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <label className="block text-xs font-medium text-foreground">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="w-full text-xs text-muted-foreground bg-transparent border-none p-0 focus:outline-none focus:text-foreground"
        />
      </div>
    </div>
  );
}
