'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Save, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { BrandingAssetUploader } from '@/components/settings/BrandingAssetUploader';
import { useTheme } from '@/contexts/ThemeContext';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import { settingsService } from '@/lib/services/settingsService';
import type { AdminBrandingSettings } from '@/lib/types/settings';

// Default branding settings
const defaultBrandingSettings: AdminBrandingSettings = {
  general: {
    adminTitle: 'Admin Panel',
    adminSubtitle: 'Ecommerce Hub',
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
  const { currentTenant, isLoading: tenantLoading, error: tenantError } = useTenant();

  // Form state
  const [brandingData, setBrandingData] = useState<AdminBrandingSettings>(defaultBrandingSettings);
  const [savedData, setSavedData] = useState<AdminBrandingSettings>(defaultBrandingSettings);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Settings ID for update vs create
  const [settingsId, setSettingsId] = useState<string | null>(null);

  // Helper to merge branding with defaults to ensure all properties exist
  const mergeBrandingWithDefaults = (data: Partial<AdminBrandingSettings> | undefined): AdminBrandingSettings => {
    if (!data) return defaultBrandingSettings;
    return {
      general: { ...defaultBrandingSettings.general, ...data.general },
      colors: { ...defaultBrandingSettings.colors, ...data.colors },
      appearance: { ...defaultBrandingSettings.appearance, ...data.appearance },
      advanced: { ...defaultBrandingSettings.advanced, ...data.advanced },
    };
  };

  // Load settings from backend when tenant is available or when tenant loading completes
  useEffect(() => {
    if (tenantLoading) {
      // Still loading tenant context
      return;
    }

    if (currentTenant?.id) {
      loadSettings();
    } else {
      // No tenant available - use defaults merged with ThemeContext
      const mergedBranding = mergeBrandingWithDefaults(branding);
      setBrandingData(mergedBranding);
      setSavedData(mergedBranding);
      setLoading(false);
      setLoadError(tenantError || 'No tenant available. Settings will be stored locally.');
    }
  }, [currentTenant?.id, tenantLoading, tenantError]);

  const loadSettings = async () => {
    if (!currentTenant?.id) return;

    try {
      setLoading(true);
      setLoadError(null);

      // Fetch global admin branding settings for this tenant
      const data = await settingsService.getSettingsByContext({
        applicationId: 'admin-portal',
        scope: 'global',
        tenantId: currentTenant.id,
      });

      if (data && data.branding) {
        // Settings exist - merge with defaults to ensure all properties exist
        setSettingsId(data.id);
        const loadedBranding = mergeBrandingWithDefaults(data.branding as Partial<AdminBrandingSettings>);
        setBrandingData(loadedBranding);
        setSavedData(loadedBranding);
        // Sync with ThemeContext for live preview
        updateBranding(loadedBranding);
      } else {
        // No settings yet - use defaults merged with ThemeContext (localStorage)
        const mergedBranding = mergeBrandingWithDefaults(branding);
        setBrandingData(mergedBranding);
        setSavedData(mergedBranding);
        setSettingsId(null);
      }
    } catch (error) {
      console.error('Failed to load branding settings:', error);
      // Fall back to ThemeContext (localStorage) merged with defaults
      const mergedBranding = mergeBrandingWithDefaults(branding);
      setBrandingData(mergedBranding);
      setSavedData(mergedBranding);
      setLoadError('Failed to load settings from server. Using local settings.');
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
        // Update existing settings
        await settingsService.updateSettings(settingsId, { branding: brandingData }, currentTenant.id);
      } else {
        // Create new settings
        try {
          const newSettings = await settingsService.createSettings(payload, currentTenant.id);
          setSettingsId(newSettings.id);
        } catch (createError: any) {
          // If settings already exist, try to fetch and update them
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
              throw createError; // Re-throw if we can't find the existing settings
            }
          } else {
            throw createError;
          }
        }
      }

      // Update saved state
      setSavedData(brandingData);

      // Sync with ThemeContext
      updateBranding(brandingData);

      // Exit preview mode if active
      setPreviewing(false);

      showSuccess('Saved Successfully', 'Admin branding settings have been saved and applied!');
    } catch (error) {
      console.error('Failed to save branding settings:', error);
      showErrorDialog('Save Failed', 'Failed to save branding settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (previewing) {
      // Restore saved data
      updateBranding(savedData);
      setPreviewing(false);
    } else {
      // Apply preview
      updateBranding(brandingData);
      setPreviewing(true);
    }
  };

  const handleReset = async () => {
    const confirmed = await showConfirm({
      title: 'Reset to Defaults',
      message: 'Are you sure you want to reset all branding settings to defaults? This action cannot be undone.',
      confirmLabel: 'Reset',
      cancelLabel: 'Cancel',
    });

    if (confirmed) {
      setBrandingData(defaultBrandingSettings);
      resetBranding();
      setPreviewing(false);
    }
  };

  const hasChanges = JSON.stringify(brandingData) !== JSON.stringify(savedData);

  const updateField = (path: string[], value: any) => {
    setBrandingData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) current = current[path[i]];
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  // Determine badge status
  const getBadge = () => {
    if (loading) return { label: 'Loading...', variant: 'default' as const };
    if (previewing) return { label: 'Preview Mode', variant: 'info' as const };
    if (settingsId) return { label: 'Live Data', variant: 'success' as const };
    return { label: 'Not Saved', variant: 'warning' as const };
  };

  if (loading || tenantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            {tenantLoading ? 'Loading tenant information...' : 'Loading branding settings...'}
          </p>
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
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        {loadError && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Warning</p>
              <p className="text-sm text-amber-700">{loadError}</p>
            </div>
          </div>
        )}

        <PageHeader
          title="Admin Branding"
          description="Customize the admin panel appearance and branding"
          breadcrumbs={[
            { label: '🏠 Home', href: '/' },
            { label: '⚙️ Settings', href: '/settings' },
            { label: '🎨 Admin Branding' },
          ]}
          badge={getBadge()}
          actions={
            <div className="flex items-center gap-2">
              <Button onClick={handleReset} variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button onClick={handlePreview} variant="outline" disabled={!hasChanges} className="border-primary/50 text-primary hover:bg-primary/10 disabled:opacity-50">
                {previewing ? 'Cancel Preview' : 'Preview Changes'}
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges || saving} className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          }
        />

        <div className="space-y-6">
          {/* General Branding */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-violet-100 rounded-lg flex items-center justify-center">
                <Palette className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">General Branding</h3>
                <p className="text-sm text-muted-foreground">Admin panel title and logos</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Admin Panel Title</label>
                  <Input value={brandingData.general.adminTitle} onChange={(e) => updateField(['general', 'adminTitle'], e.target.value)} placeholder="Admin Panel" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Subtitle</label>
                  <Input value={brandingData.general.adminSubtitle} onChange={(e) => updateField(['general', 'adminSubtitle'], e.target.value)} placeholder="Ecommerce Hub" />
                </div>
                <div>
                  <BrandingAssetUploader
                    assetType="logo"
                    currentUrl={brandingData.general.logoUrl}
                    onUpload={(url) => updateField(['general', 'logoUrl'], url)}
                    onRemove={() => updateField(['general', 'logoUrl'], '')}
                    label="Admin Logo"
                    description="Recommended: 120x40px, PNG with transparency"
                    aspectRatio="auto"
                    disabled={loading}
                    tenantId={currentTenant?.id}
                  />
                </div>
                <div>
                  <BrandingAssetUploader
                    assetType="favicon"
                    currentUrl={brandingData.general.faviconUrl}
                    onUpload={(url) => updateField(['general', 'faviconUrl'], url)}
                    onRemove={() => updateField(['general', 'faviconUrl'], '')}
                    label="Favicon"
                    description="32x32px or 64x64px .ico/.png"
                    aspectRatio="square"
                    disabled={loading}
                    tenantId={currentTenant?.id}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Login Page Title</label>
                  <Input value={brandingData.general.loginPageTitle} onChange={(e) => updateField(['general', 'loginPageTitle'], e.target.value)} placeholder="Welcome Back" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Login Page Subtitle</label>
                  <Input value={brandingData.general.loginPageSubtitle} onChange={(e) => updateField(['general', 'loginPageSubtitle'], e.target.value)} placeholder="Sign in to your account" />
                </div>
              </div>
            </div>
          </div>

          {/* Color Scheme */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                <Palette className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Color Scheme</h3>
                <p className="text-sm text-muted-foreground">Customize admin panel colors</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Primary Color</label>
                  <div className="flex gap-2">
                    <Input type="color" value={brandingData.colors.primaryColor} onChange={(e) => updateField(['colors', 'primaryColor'], e.target.value)} className="w-20 h-10" />
                    <Input value={brandingData.colors.primaryColor} onChange={(e) => updateField(['colors', 'primaryColor'], e.target.value)} placeholder="#3b82f6" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Secondary Color</label>
                  <div className="flex gap-2">
                    <Input type="color" value={brandingData.colors.secondaryColor} onChange={(e) => updateField(['colors', 'secondaryColor'], e.target.value)} className="w-20 h-10" />
                    <Input value={brandingData.colors.secondaryColor} onChange={(e) => updateField(['colors', 'secondaryColor'], e.target.value)} placeholder="#8b5cf6" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Accent Color</label>
                  <div className="flex gap-2">
                    <Input type="color" value={brandingData.colors.accentColor} onChange={(e) => updateField(['colors', 'accentColor'], e.target.value)} className="w-20 h-10" />
                    <Input value={brandingData.colors.accentColor} onChange={(e) => updateField(['colors', 'accentColor'], e.target.value)} placeholder="#a855f7" />
                  </div>
                </div>
              </div>
              <div className="border-t border-border pt-4 mt-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Sidebar Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Background</label>
                    <div className="flex gap-2">
                      <Input type="color" value={brandingData.colors.sidebarBg} onChange={(e) => updateField(['colors', 'sidebarBg'], e.target.value)} className="w-20 h-10" />
                      <Input value={brandingData.colors.sidebarBg} onChange={(e) => updateField(['colors', 'sidebarBg'], e.target.value)} placeholder="#1e293b" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Text</label>
                    <div className="flex gap-2">
                      <Input type="color" value={brandingData.colors.sidebarText} onChange={(e) => updateField(['colors', 'sidebarText'], e.target.value)} className="w-20 h-10" />
                      <Input value={brandingData.colors.sidebarText} onChange={(e) => updateField(['colors', 'sidebarText'], e.target.value)} placeholder="#cbd5e1" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Active Text</label>
                    <div className="flex gap-2">
                      <Input type="color" value={brandingData.colors.sidebarActiveText} onChange={(e) => updateField(['colors', 'sidebarActiveText'], e.target.value)} className="w-20 h-10" />
                      <Input value={brandingData.colors.sidebarActiveText} onChange={(e) => updateField(['colors', 'sidebarActiveText'], e.target.value)} placeholder="#60a5fa" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-border pt-4 mt-4">
                <h4 className="text-sm font-semibold text-foreground mb-3">Header Colors</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Background</label>
                    <div className="flex gap-2">
                      <Input type="color" value={brandingData.colors.headerBg} onChange={(e) => updateField(['colors', 'headerBg'], e.target.value)} className="w-20 h-10" />
                      <Input value={brandingData.colors.headerBg} onChange={(e) => updateField(['colors', 'headerBg'], e.target.value)} placeholder="#ffffff" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Text</label>
                    <div className="flex gap-2">
                      <Input type="color" value={brandingData.colors.headerText} onChange={(e) => updateField(['colors', 'headerText'], e.target.value)} className="w-20 h-10" />
                      <Input value={brandingData.colors.headerText} onChange={(e) => updateField(['colors', 'headerText'], e.target.value)} placeholder="#374151" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                <Palette className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Appearance Settings</h3>
                <p className="text-sm text-muted-foreground">Layout and visual preferences</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Sidebar Style</label>
                  <Select value={brandingData.appearance.sidebarStyle} onChange={(value) => updateField(['appearance', 'sidebarStyle'], value)} options={[
                    { value: 'dark', label: 'Dark (Default)' },
                    { value: 'light', label: 'Light' },
                    { value: 'gradient', label: 'Gradient' },
                  ]} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Header Style</label>
                  <Select value={brandingData.appearance.headerStyle} onChange={(value) => updateField(['appearance', 'headerStyle'], value)} options={[
                    { value: 'light', label: 'Light (Default)' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'transparent', label: 'Transparent' },
                  ]} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Border Radius</label>
                  <Select value={brandingData.appearance.borderRadius} onChange={(value) => updateField(['appearance', 'borderRadius'], value)} options={[
                    { value: 'none', label: 'Sharp (0px)' },
                    { value: 'small', label: 'Small (4px)' },
                    { value: 'medium', label: 'Medium (8px)' },
                    { value: 'large', label: 'Large (12px)' },
                    { value: 'xl', label: 'Extra Large (16px)' },
                  ]} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Font Family</label>
                  <Select value={brandingData.appearance.fontFamily} onChange={(value) => updateField(['appearance', 'fontFamily'], value)} options={[
                    { value: 'inter', label: 'Inter (Default)' },
                    { value: 'roboto', label: 'Roboto' },
                    { value: 'poppins', label: 'Poppins' },
                    { value: 'montserrat', label: 'Montserrat' },
                    { value: 'system', label: 'System Font' },
                  ]} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-border">
                <Checkbox checked={brandingData.appearance.compactMode} onChange={(e) => updateField(['appearance', 'compactMode'], e.target.checked)} label="Compact Mode" description="Reduce spacing and padding" />
                <Checkbox checked={brandingData.appearance.showBreadcrumbs} onChange={(e) => updateField(['appearance', 'showBreadcrumbs'], e.target.checked)} label="Show Breadcrumbs" description="Display navigation breadcrumbs" />
                <Checkbox checked={brandingData.appearance.showSearch} onChange={(e) => updateField(['appearance', 'showSearch'], e.target.checked)} label="Show Search" description="Display search in header" />
                <Checkbox checked={brandingData.appearance.animationsEnabled} onChange={(e) => updateField(['appearance', 'animationsEnabled'], e.target.checked)} label="Animations" description="Enable UI animations" />
              </div>
            </div>
          </div>

          {/* Advanced */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                <Palette className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Advanced Options</h3>
                <p className="text-sm text-muted-foreground">Custom CSS and advanced features</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Checkbox checked={brandingData.advanced.customLogo} onChange={(e) => updateField(['advanced', 'customLogo'], e.target.checked)} label="Use Custom Logo" description="Replace default icon" />
                <Checkbox checked={brandingData.advanced.showPoweredBy} onChange={(e) => updateField(['advanced', 'showPoweredBy'], e.target.checked)} label="Show 'Powered By'" description="Display attribution footer" />
                <Checkbox checked={brandingData.advanced.enableCustomFonts} onChange={(e) => updateField(['advanced', 'enableCustomFonts'], e.target.checked)} label="Custom Fonts" description="Load custom web fonts" />
              </div>
              {brandingData.advanced.enableCustomFonts && (
                <div className="ml-6">
                  <label className="block text-sm font-semibold text-foreground mb-2">Custom Font URL</label>
                  <Input value={brandingData.advanced.customFontUrl} onChange={(e) => updateField(['advanced', 'customFontUrl'], e.target.value)} placeholder="https://fonts.googleapis.com/css2?family=..." />
                  <p className="text-xs text-muted-foreground mt-1">Google Fonts or custom CSS URL</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Custom CSS</label>
                <textarea
                  value={brandingData.advanced.customCss}
                  onChange={(e) => updateField(['advanced', 'customCss'], e.target.value)}
                  className="w-full min-h-[120px] px-3 py-2 text-sm font-mono bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder=".custom-class { color: #333; }"
                />
                <p className="text-xs text-muted-foreground mt-1">Advanced: Add custom CSS to override styles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PermissionGate>
  );
}
