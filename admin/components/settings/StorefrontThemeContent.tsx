'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Palette,
  Layout,
  Settings2,
  Image as ImageIcon,
  Save,
  Eye,
  RotateCcw,
  Loader2,
  ShoppingBag,
  CreditCard,
  Menu,
  FootprintsIcon,
  Sparkles,
  Store,
  AlertCircle,
  Globe,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { cn } from '@/lib/utils';
import { useDialog } from '@/contexts/DialogContext';
import { StoreSelector } from '@/components/settings/StoreSelector';

// Import our new storefront builder components
import {
  ThemeSelector,
  ColorPairPicker,
  SectionEditor,
  NavigationEditor,
  AssetUploader,
  LivePreview,
  NavigationBuilder,
  FooterBuilder,
} from '@/components/storefront-builder';

// Import API and types
import { storefrontApi, setCurrentStorefrontId, setCurrentTenantId, setCurrentUserInfo } from '@/lib/api/storefront';
import { useTenant } from '@/contexts/TenantContext';
import { useUser } from '@/contexts/UserContext';
import { storefrontService } from '@/lib/services/storefrontService';
import { getStorefrontDomain, buildStorefrontUrl } from '@/lib/utils/tenant';
import {
  StorefrontSettings,
  ThemeTemplate,
  StorefrontSection,
  StorefrontNavLink,
  DEFAULT_STOREFRONT_SETTINGS,
  THEME_PRESETS,
  Storefront,
  ColorMode,
} from '@/lib/api/types';

type TabId = 'theme' | 'homepage' | 'header' | 'footer' | 'products' | 'checkout';

const TABS: { id: TabId; label: string; icon: React.ElementType; description: string }[] = [
  {
    id: 'theme',
    label: 'Theme & Colors',
    icon: Palette,
    description: 'Choose template and customize colors',
  },
  {
    id: 'homepage',
    label: 'Homepage',
    icon: Layout,
    description: 'Configure homepage sections',
  },
  {
    id: 'header',
    label: 'Header',
    icon: Menu,
    description: 'Logo, navigation, and announcement',
  },
  {
    id: 'footer',
    label: 'Footer',
    icon: FootprintsIcon,
    description: 'Footer links and contact info',
  },
  {
    id: 'products',
    label: 'Products',
    icon: ShoppingBag,
    description: 'Product display settings',
  },
  {
    id: 'checkout',
    label: 'Checkout',
    icon: CreditCard,
    description: 'Checkout flow options',
  },
];

interface StorefrontThemeContentProps {
  embedded?: boolean; // When embedded in Store Settings, hide PageHeader and StoreSelector
  selectedStorefrontId?: string; // When embedded, use parent's selected storefront
}

export function StorefrontThemeContent({ embedded = false, selectedStorefrontId }: StorefrontThemeContentProps) {
  const searchParams = useSearchParams();
  const { showSuccess, showError, showConfirm } = useDialog();
  const { currentTenant } = useTenant();
  const { user } = useUser();
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);
  const [savedSettings, setSavedSettings] = useState<StorefrontSettings | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('theme');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Storefront selection state
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);

  // Get vendor ID from tenant context
  const vendorId = currentTenant?.id || '';

  // Set tenant ID for API calls when tenant context changes
  useEffect(() => {
    if (currentTenant?.id) {
      setCurrentTenantId(currentTenant.id);
    }
  }, [currentTenant?.id]);

  // Set user info for API calls (required for backend IstioAuth middleware)
  useEffect(() => {
    if (user?.id) {
      setCurrentUserInfo(user.id, user.email || null);
    }
  }, [user?.id, user?.email]);

  // Load storefronts on mount
  useEffect(() => {
    loadStorefronts();
  }, []);

  // Handle storefront ID from URL params or embedded prop
  useEffect(() => {
    const storefrontIdToUse = embedded ? selectedStorefrontId : searchParams.get('storefrontId');
    if (storefrontIdToUse && storefronts.length > 0) {
      const storefront = storefronts.find(sf => sf.id === storefrontIdToUse);
      if (storefront && storefront.id !== selectedStorefront?.id) {
        handleStorefrontSelect(storefront);
      }
    }
  }, [searchParams, storefronts, selectedStorefrontId, embedded]);

  // Auto-select first storefront when embedded and parent hasn't selected one
  useEffect(() => {
    if (embedded && !selectedStorefrontId && storefronts.length > 0 && !selectedStorefront) {
      handleStorefrontSelect(storefronts[0]);
    }
  }, [embedded, selectedStorefrontId, storefronts, selectedStorefront]);

  const loadStorefronts = async () => {
    setLoadingStorefronts(true);
    try {
      const response = await storefrontService.getStorefronts();
      setStorefronts(response.data);
      // Auto-select first storefront if none selected
      if (response.data.length > 0 && !selectedStorefront) {
        handleStorefrontSelect(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading storefronts:', error);
    } finally {
      setLoadingStorefronts(false);
    }
  };

  const handleStorefrontSelect = (storefront: Storefront) => {
    setSelectedStorefront(storefront);
    setCurrentStorefrontId(storefront.id);
  };

  const handleStorefrontCreated = (storefront: Storefront) => {
    setStorefronts(prev => [...prev, storefront]);
    handleStorefrontSelect(storefront);
  };

  // Load settings when storefront changes
  useEffect(() => {
    if (selectedStorefront?.id) {
      loadSettings();
    }
  }, [selectedStorefront?.id]);

  const loadSettings = async () => {
    if (!selectedStorefront?.id) {
      setSettings(null);
      setSavedSettings(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await storefrontApi.settings.getSettings();
      if (response.success && response.data) {
        setSettings(response.data);
        setSavedSettings(response.data);
      }
    } catch (error) {
      showError('Error', 'Failed to load storefront settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    // Verify we have required context set
    if (!selectedStorefront?.id) {
      showError('Error', 'No storefront selected. Please select a storefront first.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await storefrontApi.settings.saveSettings(settings);
      if (response.success && response.data) {
        setSavedSettings(response.data);
        setSettings(response.data);
        showSuccess('Success', 'Storefront settings saved successfully!');
      } else {
        const errorMessage = response.message || 'Failed to save settings';
        showError('Error', errorMessage);
        console.error('Save settings failed:', response);
      }
    } catch (error) {
      console.error('Save settings error:', error);
      showError('Error', 'An error occurred while saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = await showConfirm({
      title: 'Reset Settings',
      message: 'Are you sure you want to reset all storefront settings to defaults? This cannot be undone.',
    });

    if (confirmed) {
      try {
        const response = await storefrontApi.settings.resetSettings();
        if (response.success && response.data) {
          setSettings(response.data);
          setSavedSettings(response.data);
          showSuccess('Success', 'Settings reset to defaults');
        }
      } catch (error) {
        showError('Error', 'Failed to reset settings');
      }
    }
  };

  const handleDiscard = () => {
    if (savedSettings) {
      setSettings(savedSettings);
    }
  };

  const hasChanges = settings && savedSettings
    ? JSON.stringify(settings) !== JSON.stringify(savedSettings)
    : false;

  // Update helper functions
  const updateSettings = (updates: Partial<StorefrontSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
  };

  const updateHeaderConfig = (updates: Partial<StorefrontSettings['headerConfig']>) => {
    if (settings) {
      setSettings({
        ...settings,
        headerConfig: { ...settings.headerConfig, ...updates },
      });
    }
  };

  const updateHomepageConfig = (updates: Partial<StorefrontSettings['homepageConfig']>) => {
    if (settings) {
      setSettings({
        ...settings,
        homepageConfig: { ...settings.homepageConfig, ...updates },
      });
    }
  };

  const updateFooterConfig = (updates: Partial<StorefrontSettings['footerConfig']>) => {
    if (settings) {
      setSettings({
        ...settings,
        footerConfig: { ...settings.footerConfig, ...updates },
      });
    }
  };

  const updateProductConfig = (updates: Partial<StorefrontSettings['productConfig']>) => {
    if (settings) {
      setSettings({
        ...settings,
        productConfig: { ...settings.productConfig, ...updates },
      });
    }
  };

  const updateCheckoutConfig = (updates: Partial<StorefrontSettings['checkoutConfig']>) => {
    if (settings) {
      setSettings({
        ...settings,
        checkoutConfig: { ...settings.checkoutConfig, ...updates },
      });
    }
  };

  // Show storefront selector first, then loading/content (only when not embedded)
  if (!selectedStorefront) {
    // When embedded, show minimal loading state since parent controls store selection
    if (embedded) {
      if (loadingStorefronts) {
        return (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        );
      }
      return (
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Select a store from the sidebar to customize its theme.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Store Selector */}
        <StoreSelector
          storefronts={storefronts}
          selectedStorefront={selectedStorefront}
          onSelect={handleStorefrontSelect}
          onStorefrontCreated={handleStorefrontCreated}
          loading={loadingStorefronts}
          vendorId={vendorId}
          showQuickActions={false}
          showUrlInfo={false}
          className="mb-6"
        />

        {/* Info Card */}
        <div className="bg-muted rounded-xl border border-primary/30 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-2">How Storefronts Work</h4>
              <ul className="text-sm text-primary space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Each storefront gets its own <strong>unique subdomain</strong> (e.g., <code className="bg-primary/20 px-1.5 py-0.5 rounded text-xs">your-store.{getStorefrontDomain()}</code>)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Storefronts are <strong>automatically live</strong> once created - no manual setup needed</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Customize theme, colors, and branding for each storefront independently</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {storefronts.length === 0 && !loadingStorefronts && (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No Storefronts Found
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create a storefront in the General tab first to customize its appearance.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {!embedded && (
          <StoreSelector
            storefronts={storefronts}
            selectedStorefront={selectedStorefront}
            onSelect={handleStorefrontSelect}
            onStorefrontCreated={handleStorefrontCreated}
            loading={loadingStorefronts}
            vendorId={vendorId}
            showQuickActions={false}
            showUrlInfo={false}
            className="mb-6"
          />
        )}
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading storefront settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        {!embedded && (
          <StoreSelector
            storefronts={storefronts}
            selectedStorefront={selectedStorefront}
            onSelect={handleStorefrontSelect}
            onStorefrontCreated={handleStorefrontCreated}
            loading={loadingStorefronts}
            vendorId={vendorId}
            showQuickActions={false}
            showUrlInfo={false}
            className="mb-6"
          />
        )}
        <div className="bg-card rounded-lg border border-destructive/30 p-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Failed to load settings for this storefront</p>
          <Button onClick={loadSettings} size="sm" className="bg-primary hover:bg-primary/90 text-white">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.STOREFRONTS_MANAGE}
      fallback="styled"
      fallbackTitle="Storefront Settings"
      fallbackDescription="You don't have permission to manage storefront themes."
    >
      <div className={cn('space-y-4', embedded && 'p-6')}>
        {/* Action Bar - Compact when embedded */}
        <div className={cn('flex items-center justify-between', embedded ? 'mb-4' : 'mb-6')}>
          {!embedded ? (
            <StoreSelector
              storefronts={storefronts}
              selectedStorefront={selectedStorefront}
              onSelect={handleStorefrontSelect}
              onStorefrontCreated={handleStorefrontCreated}
              loading={loadingStorefronts}
              vendorId={vendorId}
              showQuickActions={false}
              showUrlInfo={false}
            />
          ) : (
            <div className="text-sm text-muted-foreground">
              Customizing: <span className="font-medium text-foreground">{selectedStorefront?.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-xs"
            >
              <Eye className="h-3.5 w-3.5" />
              {showPreview ? 'Hide' : 'Preview'}
            </Button>
            {hasChanges && (
              <Button onClick={handleDiscard} variant="outline" size="sm" className="h-8 text-xs">
                Discard
              </Button>
            )}
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs"
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              Save
            </Button>
          </div>
        </div>

        {/* Mobile: Dropdown navigation */}
        <div className="md:hidden mb-4">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as TabId)}
            className="w-full px-3 py-2 border border-border rounded-lg bg-card text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop: Horizontal tabs */}
        <div className="hidden md:block border-b border-border mb-6">
          <nav className="-mb-px flex space-x-6 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className={cn('grid gap-4', showPreview ? 'grid-cols-1 lg:grid-cols-12' : '')}>
          {/* Main Content */}
          <div className={cn(showPreview ? 'lg:col-span-8' : '')}>
            <div className={cn('bg-card rounded-xl border border-border shadow-sm', embedded ? 'p-4' : 'p-6')}>
              {/* Theme & Colors Tab */}
              {activeTab === 'theme' && (
                <div className="space-y-6">
                  {/* Theme Templates */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-foreground">Theme Template</h3>
                      <span className="text-xs text-muted-foreground">Hover for details</span>
                    </div>
                    <ThemeSelector
                      selectedTheme={settings.themeTemplate}
                      onThemeSelect={(theme) => {
                        const preset = THEME_PRESETS.find((p) => p.id === theme);
                        updateSettings({
                          themeTemplate: theme,
                          primaryColor: preset?.primaryColor || settings.primaryColor,
                          secondaryColor: preset?.secondaryColor || settings.secondaryColor,
                        });
                      }}
                    />
                  </div>

                  {/* Color Mode Setting */}
                  <div className="border-t border-border pt-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Color Mode</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { id: 'light' as ColorMode, label: 'Light', icon: Sun },
                        { id: 'dark' as ColorMode, label: 'Dark', icon: Moon },
                        { id: 'both' as ColorMode, label: 'Toggle', icon: Monitor },
                        { id: 'system' as ColorMode, label: 'System', icon: Monitor },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => updateSettings({ colorMode: mode.id })}
                          className={cn(
                            'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all',
                            settings.colorMode === mode.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border hover:border-primary/50 text-muted-foreground'
                          )}
                        >
                          <mode.icon className="h-4 w-4" />
                          <span className="font-medium text-sm">{mode.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-6">
                    <ColorPairPicker
                      primaryColor={settings.primaryColor}
                      secondaryColor={settings.secondaryColor}
                      onPrimaryChange={(color) => updateSettings({ primaryColor: color })}
                      onSecondaryChange={(color) => updateSettings({ secondaryColor: color })}
                      defaultPrimary={
                        THEME_PRESETS.find((p) => p.id === settings.themeTemplate)?.primaryColor
                      }
                      defaultSecondary={
                        THEME_PRESETS.find((p) => p.id === settings.themeTemplate)?.secondaryColor
                      }
                    />
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Logo & Branding</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <AssetUploader
                        type="logo"
                        label="Store Logo"
                        description="200x60px, PNG or SVG"
                        currentUrl={settings.logoUrl}
                        onUpload={(url) => updateSettings({ logoUrl: url })}
                        onRemove={() => updateSettings({ logoUrl: undefined })}
                        aspectRatio="banner"
                      />
                      <AssetUploader
                        type="favicon"
                        label="Favicon"
                        description="32x32px, ICO or PNG"
                        currentUrl={settings.faviconUrl}
                        onUpload={(url) => updateSettings({ faviconUrl: url })}
                        onRemove={() => updateSettings({ faviconUrl: undefined })}
                        aspectRatio="square"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Homepage Tab */}
              {activeTab === 'homepage' && (
                <div className="space-y-8">
                  {/* Hero Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Hero Section</h3>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.homepageConfig.heroEnabled}
                          onChange={(e) =>
                            updateHomepageConfig({ heroEnabled: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium">Enable hero section</span>
                      </label>

                      {settings.homepageConfig.heroEnabled && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Hero Title
                            </label>
                            <input
                              type="text"
                              value={settings.homepageConfig.heroTitle || ''}
                              onChange={(e) =>
                                updateHomepageConfig({ heroTitle: e.target.value })
                              }
                              placeholder="Welcome to Our Store"
                              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Hero Subtitle
                            </label>
                            <input
                              type="text"
                              value={settings.homepageConfig.heroSubtitle || ''}
                              onChange={(e) =>
                                updateHomepageConfig({ heroSubtitle: e.target.value })
                              }
                              placeholder="Discover amazing products"
                              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              CTA Button Text
                            </label>
                            <input
                              type="text"
                              value={settings.homepageConfig.heroCtaText || ''}
                              onChange={(e) =>
                                updateHomepageConfig({ heroCtaText: e.target.value })
                              }
                              placeholder="Shop Now"
                              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              CTA Button Link
                            </label>
                            <input
                              type="text"
                              value={settings.homepageConfig.heroCtaLink || ''}
                              onChange={(e) =>
                                updateHomepageConfig({ heroCtaLink: e.target.value })
                              }
                              placeholder="/products"
                              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <AssetUploader
                              type="hero"
                              label="Hero Background Image"
                              description="Recommended: 1920x800px"
                              currentUrl={settings.homepageConfig.heroImage}
                              onUpload={(url) => updateHomepageConfig({ heroImage: url })}
                              onRemove={() => updateHomepageConfig({ heroImage: undefined })}
                              aspectRatio="banner"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Homepage Sections */}
                  <div className="border-t border-border pt-8">
                    <SectionEditor
                      sections={settings.homepageConfig.sections}
                      onChange={(sections) => updateHomepageConfig({ sections })}
                    />
                  </div>

                  {/* Newsletter */}
                  <div className="border-t border-border pt-8">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={settings.homepageConfig.showNewsletter}
                        onChange={(e) =>
                          updateHomepageConfig({ showNewsletter: e.target.checked })
                        }
                        className="rounded border-border text-primary focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium">Show newsletter signup</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Header Tab */}
              {activeTab === 'header' && (
                <div className="space-y-8">
                  {/* Announcement Bar */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Announcement Bar</h3>
                    <div className="space-y-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.headerConfig.showAnnouncement}
                          onChange={(e) =>
                            updateHeaderConfig({ showAnnouncement: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium">Show announcement bar</span>
                      </label>

                      {settings.headerConfig.showAnnouncement && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Announcement Text
                            </label>
                            <input
                              type="text"
                              value={settings.headerConfig.announcementText || ''}
                              onChange={(e) =>
                                updateHeaderConfig({ announcementText: e.target.value })
                              }
                              placeholder="Free shipping on orders over $50!"
                              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Link (optional)
                            </label>
                            <input
                              type="text"
                              value={settings.headerConfig.announcementLink || ''}
                              onChange={(e) =>
                                updateHeaderConfig({ announcementLink: e.target.value })
                              }
                              placeholder="/shipping"
                              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="border-t border-border pt-8">
                    <NavigationBuilder
                      links={settings.headerConfig.navLinks}
                      onChange={(navLinks) => updateHeaderConfig({ navLinks })}
                      maxLinks={10}
                      maxDepth={2}
                    />
                  </div>

                  {/* Header Options */}
                  <div className="border-t border-border pt-8">
                    <h4 className="font-medium text-foreground mb-4">Header Options</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.headerConfig.stickyHeader}
                          onChange={(e) =>
                            updateHeaderConfig({ stickyHeader: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Sticky header (stays visible on scroll)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.headerConfig.showSearch}
                          onChange={(e) =>
                            updateHeaderConfig({ showSearch: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show search bar</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.headerConfig.showCart}
                          onChange={(e) => updateHeaderConfig({ showCart: e.target.checked })}
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show cart icon</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.headerConfig.showAccount}
                          onChange={(e) =>
                            updateHeaderConfig({ showAccount: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show account icon</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Tab */}
              {activeTab === 'footer' && (
                <div className="space-y-6">
                  <FooterBuilder
                    config={settings.footerConfig}
                    onChange={updateFooterConfig}
                  />

                  {/* Content Pages Hint */}
                  <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                    <h4 className="font-medium text-primary mb-2">Content Pages</h4>
                    <p className="text-sm text-primary mb-3">
                      Create pages like Privacy Policy, Terms of Service, About Us, etc. in{' '}
                      <Link href="/settings/content-pages" className="underline font-medium">
                        Content Pages
                      </Link>{' '}
                      and enable &quot;Show in Footer&quot; to automatically add them to your footer.
                    </p>
                    <Button variant="outline" size="sm" asChild className="bg-white">
                      <Link href="/settings/content-pages">
                        Manage Content Pages
                      </Link>
                    </Button>
                  </div>
                </div>
              )}

              {/* Products Tab */}
              {activeTab === 'products' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Product Display Settings</h3>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Grid Columns (Desktop)
                        </label>
                        <select
                          value={settings.productConfig.gridColumns}
                          onChange={(e) =>
                            updateProductConfig({
                              gridColumns: parseInt(e.target.value) as 2 | 3 | 4,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                        >
                          <option value={2}>2 Columns</option>
                          <option value={3}>3 Columns</option>
                          <option value={4}>4 Columns</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Card Style
                        </label>
                        <select
                          value={settings.productConfig.cardStyle}
                          onChange={(e) =>
                            updateProductConfig({ cardStyle: e.target.value as any })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                        >
                          <option value="default">Default</option>
                          <option value="minimal">Minimal</option>
                          <option value="bordered">Bordered</option>
                          <option value="elevated">Elevated (Shadow)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Image Aspect Ratio
                        </label>
                        <select
                          value={settings.productConfig.imageAspectRatio}
                          onChange={(e) =>
                            updateProductConfig({ imageAspectRatio: e.target.value as any })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                        >
                          <option value="square">Square (1:1)</option>
                          <option value="portrait">Portrait (3:4)</option>
                          <option value="landscape">Landscape (4:3)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Hover Effect
                        </label>
                        <select
                          value={settings.productConfig.hoverEffect}
                          onChange={(e) =>
                            updateProductConfig({ hoverEffect: e.target.value as any })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                        >
                          <option value="none">None</option>
                          <option value="zoom">Zoom</option>
                          <option value="fade">Fade</option>
                          <option value="slide">Slide</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <h4 className="font-medium text-foreground mb-4">Display Options</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.productConfig.showQuickView}
                          onChange={(e) =>
                            updateProductConfig({ showQuickView: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Enable quick view</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.productConfig.showWishlist}
                          onChange={(e) =>
                            updateProductConfig({ showWishlist: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show wishlist button</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.productConfig.showRatings}
                          onChange={(e) =>
                            updateProductConfig({ showRatings: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show ratings</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.productConfig.showSaleBadge}
                          onChange={(e) =>
                            updateProductConfig({ showSaleBadge: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show sale badges</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.productConfig.showStockStatus}
                          onChange={(e) =>
                            updateProductConfig({ showStockStatus: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show stock status</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Checkout Tab */}
              {activeTab === 'checkout' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Checkout Settings</h3>

                    <div className="space-y-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.checkoutConfig.guestCheckoutEnabled}
                          onChange={(e) =>
                            updateCheckoutConfig({ guestCheckoutEnabled: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm font-medium">Allow guest checkout</span>
                        <span className="text-xs text-muted-foreground">
                          (Customers can checkout without creating an account)
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <h4 className="font-medium text-foreground mb-4">Required Fields</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.checkoutConfig.requirePhone}
                          onChange={(e) =>
                            updateCheckoutConfig({ requirePhone: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Require phone number</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.checkoutConfig.requireCompany}
                          onChange={(e) =>
                            updateCheckoutConfig({ requireCompany: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Require company name</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <h4 className="font-medium text-foreground mb-4">Additional Options</h4>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.checkoutConfig.showOrderNotes}
                          onChange={(e) =>
                            updateCheckoutConfig({ showOrderNotes: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Allow order notes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.checkoutConfig.showGiftOptions}
                          onChange={(e) =>
                            updateCheckoutConfig({ showGiftOptions: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show gift options</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.checkoutConfig.showTrustBadges}
                          onChange={(e) =>
                            updateCheckoutConfig({ showTrustBadges: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show trust badges</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.checkoutConfig.showPaymentIcons}
                          onChange={(e) =>
                            updateCheckoutConfig({ showPaymentIcons: e.target.checked })
                          }
                          className="rounded border-border text-primary focus:ring-purple-500"
                        />
                        <span className="text-sm">Show payment method icons</span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <h4 className="font-medium text-foreground mb-4">Terms & Conditions</h4>
                    <label className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        checked={settings.checkoutConfig.showTermsCheckbox}
                        onChange={(e) =>
                          updateCheckoutConfig({ showTermsCheckbox: e.target.checked })
                        }
                        className="rounded border-border text-primary focus:ring-purple-500"
                      />
                      <span className="text-sm">Require terms acceptance</span>
                    </label>

                    {settings.checkoutConfig.showTermsCheckbox && (
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Terms Text
                          </label>
                          <input
                            type="text"
                            value={settings.checkoutConfig.termsText || ''}
                            onChange={(e) =>
                              updateCheckoutConfig({ termsText: e.target.value })
                            }
                            placeholder="I agree to the terms and conditions"
                            className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Terms Page Link
                          </label>
                          <input
                            type="text"
                            value={settings.checkoutConfig.termsLink || ''}
                            onChange={(e) =>
                              updateCheckoutConfig({ termsLink: e.target.value })
                            }
                            placeholder="/terms"
                            className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-primary"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview Panel */}
          {showPreview && (
            <div className="lg:col-span-4">
              <LivePreview
                settings={settings}
                tenantSlug={selectedStorefront?.slug}
                className="sticky top-4 h-[calc(100vh-12rem)]"
              />
            </div>
          )}
        </div>
      </div>
    </PermissionGate>
  );
}
