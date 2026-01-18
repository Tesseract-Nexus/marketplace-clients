'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Palette,
  Layout,
  LayoutPanelLeft,
  Menu,
  FootprintsIcon,
  Save,
  Eye,
  RotateCcw,
  Loader2,
  Sparkles,
  ExternalLink,
  Type,
  Code2,
  FileText,
  Plus,
  Edit,
  Globe,
} from 'lucide-react';
import Link from 'next/link';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import { useUser } from '@/contexts/UserContext';

// Import storefront builder components
import {
  ThemeSelector,
  ColorPairPicker,
  SectionEditor,
  NavigationEditor,
  AssetUploader,
  LivePreview,
  FontPicker,
  TypographyPreview,
  StyledSelect,
  SettingToggle,
  ContentPagesEditor,
  SocialLinksManager,
  FooterLinkGroupsManager,
} from '@/components/storefront-builder';

// Import API and types
import { storefrontApi, setCurrentStorefrontId, setCurrentTenantId, setCurrentUserInfo } from '@/lib/api/storefront';
import { storefrontService } from '@/lib/services/storefrontService';
import { settingsService } from '@/lib/services/settingsService';
import { getStorefrontUrl } from '@/lib/utils/tenant';
import {
  StorefrontSettings,
  Storefront,
  ColorMode,
  NavigationStyle,
  THEME_PRESETS,
  TypographyConfig,
  DEFAULT_TYPOGRAPHY_CONFIG,
  DEFAULT_LAYOUT_CONFIG,
  HeadingScale,
  FontWeight,
  LineHeight,
  LetterSpacing,
} from '@/lib/api/types';
import type { ContentPage } from '@/lib/types/settings';

type TabId = 'theme' | 'typography' | 'layout' | 'homepage' | 'header' | 'footer' | 'pages' | 'advanced';

const TABS: { id: TabId; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'theme', label: 'Theme & Colors', icon: Palette, description: 'Colors, logo, and branding' },
  { id: 'typography', label: 'Typography', icon: Type, description: 'Fonts and text styles' },
  { id: 'layout', label: 'Layout', icon: LayoutPanelLeft, description: 'Navigation and structure' },
  { id: 'homepage', label: 'Homepage', icon: Layout, description: 'Hero and sections' },
  { id: 'header', label: 'Header', icon: Menu, description: 'Navigation and announcement' },
  { id: 'footer', label: 'Footer', icon: FootprintsIcon, description: 'Links and contact info' },
  { id: 'pages', label: 'Content Pages', icon: FileText, description: 'Privacy, Terms, FAQ, etc.' },
  { id: 'advanced', label: 'Advanced', icon: Code2, description: 'Custom CSS' },
];

export default function StorefrontThemePage() {
  const params = useParams();
  const router = useRouter();
  const storefrontId = params?.id as string;
  const { showSuccess, showError, showConfirm } = useDialog();
  const { currentTenant } = useTenant();
  const { user } = useUser();

  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [settings, setSettings] = useState<StorefrontSettings | null>(null);
  const [savedSettings, setSavedSettings] = useState<StorefrontSettings | null>(null);
  const [contentPages, setContentPages] = useState<ContentPage[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('theme');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Set tenant ID for API calls
  useEffect(() => {
    if (currentTenant?.id) {
      setCurrentTenantId(currentTenant.id);
    }
  }, [currentTenant?.id]);

  // Set user info for API calls (required for Istio auth headers)
  useEffect(() => {
    if (user?.id) {
      setCurrentUserInfo(user.id, user.email || null);
    }
  }, [user?.id, user?.email]);

  // Load storefront and settings
  useEffect(() => {
    if (storefrontId) {
      loadStorefrontAndSettings();
    }
  }, [storefrontId]);

  const loadStorefrontAndSettings = async () => {
    setIsLoading(true);
    try {
      const sfResponse = await storefrontService.getStorefront(storefrontId);
      if (sfResponse.data) {
        setStorefront(sfResponse.data);
        setCurrentStorefrontId(storefrontId);
      }

      const [settingsResponse, generalSettings] = await Promise.all([
        storefrontApi.settings.getSettings(),
        settingsService.getSettingsByContext({
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: storefrontId,
        })
      ]);

      if (settingsResponse.success && settingsResponse.data) {
        setSettings(settingsResponse.data);
        setSavedSettings(settingsResponse.data);
      }

      if (generalSettings?.ecommerce?.contentPages) {
        setContentPages(generalSettings.ecommerce.contentPages);
      }
    } catch (error) {
      console.error('Error loading storefront:', error);
      showError('Error', 'Failed to load storefront settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setIsSaving(true);
    try {
      const response = await storefrontApi.settings.saveSettings(settings);
      if (response.success && response.data) {
        setSavedSettings(response.data);
        setSettings(response.data);
        showSuccess('Success', 'Theme settings saved! Changes will reflect on your storefront shortly.');
      } else {
        showError('Error', 'Failed to save settings');
      }
    } catch (error) {
      showError('Error', 'An error occurred while saving');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const confirmed = await showConfirm({
      title: 'Reset Theme Settings',
      message: 'Are you sure you want to reset all theme settings to defaults? This cannot be undone.',
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

  // Update helpers
  const updateSettings = (updates: Partial<StorefrontSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
  };

  const updateHeaderConfig = (updates: Partial<StorefrontSettings['headerConfig']>) => {
    if (settings) {
      setSettings({ ...settings, headerConfig: { ...settings.headerConfig, ...updates } });
    }
  };

  const updateHomepageConfig = (updates: Partial<StorefrontSettings['homepageConfig']>) => {
    if (settings) {
      setSettings({ ...settings, homepageConfig: { ...settings.homepageConfig, ...updates } });
    }
  };

  const updateFooterConfig = (updates: Partial<StorefrontSettings['footerConfig']>) => {
    if (settings) {
      setSettings({ ...settings, footerConfig: { ...settings.footerConfig, ...updates } });
    }
  };

  const updateTypographyConfig = (updates: Partial<TypographyConfig>) => {
    if (settings) {
      const currentConfig = settings.typographyConfig || DEFAULT_TYPOGRAPHY_CONFIG;
      setSettings({ ...settings, typographyConfig: { ...currentConfig, ...updates } });
    }
  };

  const updateLayoutConfig = (updates: Partial<StorefrontSettings['layoutConfig']>) => {
    if (settings) {
      const currentConfig = settings.layoutConfig || DEFAULT_LAYOUT_CONFIG;
      setSettings({ ...settings, layoutConfig: { ...currentConfig, ...updates } });
    }
  };

  const getTypographyConfig = (): TypographyConfig => {
    return settings?.typographyConfig || DEFAULT_TYPOGRAPHY_CONFIG;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-pink-50/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading theme settings...</p>
        </div>
      </div>
    );
  }

  if (!storefront || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-pink-50/20 p-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Failed to load storefront</p>
          <Button onClick={() => router.push('/storefronts')}>Back to Storefronts</Button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.STOREFRONTS_MANAGE}
      fallback="styled"
      fallbackTitle="Storefront Theme Access Required"
      fallbackDescription="You don't have the required permissions to view storefront theme. Please contact your administrator to request access."
    >
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/20 to-pink-50/20">
      <div className="p-8 space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title={`Theme: ${storefront.name}`}
          description="Customize your storefront's appearance"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Storefronts', href: '/storefronts' },
            { label: storefront.name, href: `/storefronts/${storefrontId}/edit` },
            { label: 'Theme' },
          ]}
          badge={{
            label: hasChanges ? 'Unsaved Changes' : 'Saved',
            variant: hasChanges ? 'warning' : 'success',
          }}
          actions={
            <div className="flex gap-2">
              <Link href="/settings/content-pages">
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Manage Content
                </Button>
              </Link>
              <a
                href={getStorefrontUrl(storefront)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted"
              >
                <ExternalLink className="h-4 w-4" />
                View Live
              </a>
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
              {hasChanges && (
                <Button onClick={handleDiscard} variant="outline">
                  Discard
                </Button>
              )}
              <Button
                onClick={handleReset}
                variant="outline"
                className="text-red-600 hover:bg-red-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          }
        />

        <div className={cn('grid gap-6', showPreview ? 'grid-cols-12' : 'grid-cols-12')}>
          {/* Sidebar Tabs */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-card rounded-xl border border-border p-2 sticky top-8">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left mb-1',
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                  <div>
                    <span className="font-semibold block">{tab.label}</span>
                    <span className={cn('text-xs', activeTab === tab.id ? 'text-white/80' : 'text-muted-foreground')}>
                      {tab.description}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className={cn('col-span-12', showPreview ? 'lg:col-span-5' : 'lg:col-span-9')}>
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              {/* Theme & Colors Tab */}
              {activeTab === 'theme' && (
                <div className="space-y-8">
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

                  <div className="border-t border-border pt-8">
                    <ColorPairPicker
                      primaryColor={settings.primaryColor}
                      secondaryColor={settings.secondaryColor}
                      onPrimaryChange={(color) => updateSettings({ primaryColor: color })}
                      onSecondaryChange={(color) => updateSettings({ secondaryColor: color })}
                      defaultPrimary={THEME_PRESETS.find((p) => p.id === settings.themeTemplate)?.primaryColor}
                      defaultSecondary={THEME_PRESETS.find((p) => p.id === settings.themeTemplate)?.secondaryColor}
                    />
                  </div>

                  <div className="border-t border-border pt-8">
                    <h3 className="text-lg font-semibold mb-4">Logo & Branding</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      <AssetUploader
                        type="logo"
                        label="Store Logo"
                        description="Recommended: 200x60px, PNG or SVG"
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
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <h3 className="text-lg font-semibold mb-2">Color Mode</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Control whether visitors can switch between light and dark mode on your storefront.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        { value: 'light', label: 'Light Only', description: 'Always use light theme' },
                        { value: 'dark', label: 'Dark Only', description: 'Always use dark theme' },
                        { value: 'both', label: 'Light + Dark', description: 'Users can toggle between modes' },
                        { value: 'system', label: 'System Default', description: 'Follow user system preference' },
                      ].map((mode) => (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => updateSettings({ colorMode: mode.value as ColorMode })}
                          className={cn(
                            'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center',
                            settings.colorMode === mode.value
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-border hover:border-border bg-white'
                          )}
                        >
                          <div className={cn(
                            'w-12 h-8 rounded-lg flex items-center justify-center',
                            mode.value === 'light' && 'bg-card border border-border',
                            mode.value === 'dark' && 'bg-gray-900',
                            mode.value === 'both' && 'bg-gradient-to-r from-white to-gray-900 border border-border',
                            mode.value === 'system' && 'bg-gradient-to-br from-blue-100 to-purple-100 border border-border'
                          )}>
                            {mode.value === 'both' && (
                              <div className="w-px h-full bg-gray-300" />
                            )}
                          </div>
                          <span className="font-medium text-sm">{mode.label}</span>
                          <span className="text-xs text-muted-foreground">{mode.description}</span>
                          {settings.colorMode === mode.value && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Typography Tab */}
              {activeTab === 'typography' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Font Families</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose fonts for headings and body text. Fonts are loaded from Google Fonts.
                    </p>
                    <div className="grid gap-6 md:grid-cols-2">
                      <FontPicker
                        label="Heading Font"
                        description="Used for titles and headings"
                        value={getTypographyConfig().headingFont}
                        onChange={(font) => updateTypographyConfig({ headingFont: font })}
                      />
                      <FontPicker
                        label="Body Font"
                        description="Used for paragraphs and general text"
                        value={getTypographyConfig().bodyFont}
                        onChange={(font) => updateTypographyConfig({ bodyFont: font })}
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <h3 className="text-lg font-semibold mb-4">Font Sizes</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Base Font Size: {getTypographyConfig().baseFontSize}px
                        </label>
                        <input
                          type="range"
                          min="14"
                          max="20"
                          value={getTypographyConfig().baseFontSize}
                          onChange={(e) => updateTypographyConfig({ baseFontSize: parseInt(e.target.value) })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>14px</span>
                          <span>20px</span>
                        </div>
                      </div>
                      <StyledSelect
                        label="Heading Scale"
                        value={getTypographyConfig().headingScale}
                        onChange={(value) => updateTypographyConfig({ headingScale: value as HeadingScale })}
                        options={[
                          { value: 'compact', label: 'Compact', description: 'Smaller headings' },
                          { value: 'default', label: 'Default', description: 'Standard size' },
                          { value: 'large', label: 'Large', description: 'Bigger headings' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <h3 className="text-lg font-semibold mb-4">Font Weights</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      <StyledSelect
                        label="Heading Weight"
                        value={getTypographyConfig().headingWeight}
                        onChange={(value) => updateTypographyConfig({ headingWeight: Number(value) as FontWeight })}
                        options={[
                          { value: 400, label: 'Regular', description: '400' },
                          { value: 500, label: 'Medium', description: '500' },
                          { value: 600, label: 'Semi-Bold', description: '600' },
                          { value: 700, label: 'Bold', description: '700' },
                          { value: 800, label: 'Extra Bold', description: '800' },
                        ]}
                      />
                      <StyledSelect
                        label="Body Weight"
                        value={getTypographyConfig().bodyWeight}
                        onChange={(value) => updateTypographyConfig({ bodyWeight: Number(value) as FontWeight })}
                        options={[
                          { value: 300, label: 'Light', description: '300' },
                          { value: 400, label: 'Regular', description: '400' },
                          { value: 500, label: 'Medium', description: '500' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <TypographyPreview
                      headingFont={getTypographyConfig().headingFont}
                      bodyFont={getTypographyConfig().bodyFont}
                      baseFontSize={getTypographyConfig().baseFontSize}
                      headingWeight={getTypographyConfig().headingWeight}
                      bodyWeight={getTypographyConfig().bodyWeight}
                      headingLineHeight={getTypographyConfig().headingLineHeight}
                      bodyLineHeight={getTypographyConfig().bodyLineHeight}
                      headingLetterSpacing={getTypographyConfig().headingLetterSpacing}
                      headingScale={getTypographyConfig().headingScale}
                    />
                  </div>
                </div>
              )}

              {/* Layout Tab */}
              {activeTab === 'layout' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Navigation Style</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose how navigation appears on your storefront. This affects the overall structure of your store.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        {
                          value: 'header',
                          label: 'Top Header',
                          description: 'Traditional horizontal navigation at the top',
                          preview: (
                            <div className="w-full h-24 bg-muted rounded-lg overflow-hidden border border-border">
                              <div className="h-6 bg-gray-300 w-full" />
                              <div className="p-2 h-full bg-white" />
                            </div>
                          ),
                        },
                        {
                          value: 'sidebar-left',
                          label: 'Left Sidebar',
                          description: 'Vertical navigation on the left side',
                          preview: (
                            <div className="w-full h-24 bg-muted rounded-lg overflow-hidden border border-border flex">
                              <div className="w-1/4 h-full bg-gray-300" />
                              <div className="flex-1 h-full bg-white" />
                            </div>
                          ),
                        },
                        {
                          value: 'sidebar-right',
                          label: 'Right Sidebar',
                          description: 'Vertical navigation on the right side',
                          preview: (
                            <div className="w-full h-24 bg-muted rounded-lg overflow-hidden border border-border flex">
                              <div className="flex-1 h-full bg-white" />
                              <div className="w-1/4 h-full bg-gray-300" />
                            </div>
                          ),
                        },
                        {
                          value: 'minimal',
                          label: 'Minimal (Headerless)',
                          description: 'No persistent navigation, clean look',
                          preview: (
                            <div className="w-full h-24 bg-muted rounded-lg overflow-hidden border border-border">
                              <div className="h-full bg-white flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-gray-300 mx-0.5" />
                                <div className="w-2 h-2 rounded-full bg-gray-300 mx-0.5" />
                                <div className="w-2 h-2 rounded-full bg-gray-300 mx-0.5" />
                              </div>
                            </div>
                          ),
                        },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateLayoutConfig({ navigationStyle: option.value as NavigationStyle })}
                          className={cn(
                            'relative flex flex-col gap-3 p-4 rounded-xl border-2 transition-all text-left',
                            settings.layoutConfig?.navigationStyle === option.value
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-border hover:border-border bg-white'
                          )}
                        >
                          {option.preview}
                          <div>
                            <span className="font-medium text-sm block">{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                          {settings.layoutConfig?.navigationStyle === option.value && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <h4 className="font-medium text-foreground mb-4">Layout Options</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Additional layout customization options coming soon: container width, spacing, and more.
                    </p>
                  </div>
                </div>
              )}

              {/* Homepage Tab */}
              {activeTab === 'homepage' && (
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      <h3 className="text-lg font-semibold">Hero Section</h3>
                    </div>

                    <div className="space-y-4">
                      <SettingToggle
                        label="Enable hero section"
                        description="Display a hero banner at the top of the homepage"
                        checked={settings.homepageConfig.heroEnabled}
                        onChange={(checked) => updateHomepageConfig({ heroEnabled: checked })}
                        variant="card"
                      />

                      {settings.homepageConfig.heroEnabled && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Hero Title</label>
                            <input
                              type="text"
                              value={settings.homepageConfig.heroTitle || ''}
                              onChange={(e) => updateHomepageConfig({ heroTitle: e.target.value })}
                              placeholder="Welcome to Our Store"
                              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Hero Subtitle</label>
                            <input
                              type="text"
                              value={settings.homepageConfig.heroSubtitle || ''}
                              onChange={(e) => updateHomepageConfig({ heroSubtitle: e.target.value })}
                              placeholder="Discover amazing products"
                              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">CTA Button Text</label>
                            <input
                              type="text"
                              value={settings.homepageConfig.heroCtaText || ''}
                              onChange={(e) => updateHomepageConfig({ heroCtaText: e.target.value })}
                              placeholder="Shop Now"
                              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">CTA Button Link</label>
                            <input
                              type="text"
                              value={settings.homepageConfig.heroCtaLink || ''}
                              onChange={(e) => updateHomepageConfig({ heroCtaLink: e.target.value })}
                              placeholder="/products"
                              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
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

                  <div className="border-t border-border pt-8">
                    <SectionEditor
                      sections={settings.homepageConfig.sections}
                      onChange={(sections) => updateHomepageConfig({ sections })}
                    />
                  </div>

                  <div className="border-t border-border pt-8">
                    <SettingToggle
                      label="Show newsletter signup"
                      description="Add a newsletter subscription section to the homepage"
                      checked={settings.homepageConfig.showNewsletter}
                      onChange={(checked) => updateHomepageConfig({ showNewsletter: checked })}
                      variant="card"
                    />
                  </div>
                </div>
              )}

              {/* Header Tab */}
              {activeTab === 'header' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Announcement Bar</h3>
                    <div className="space-y-4">
                      <SettingToggle
                        label="Show announcement bar"
                        description="Display a promotional banner at the top of the page"
                        checked={settings.headerConfig.showAnnouncement}
                        onChange={(checked) => updateHeaderConfig({ showAnnouncement: checked })}
                        variant="card"
                      />

                      {settings.headerConfig.showAnnouncement && (
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-foreground mb-1">Announcement Text</label>
                            <input
                              type="text"
                              value={settings.headerConfig.announcementText || ''}
                              onChange={(e) => updateHeaderConfig({ announcementText: e.target.value })}
                              placeholder="Free shipping on orders over $50!"
                              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Link (optional)</label>
                            <input
                              type="text"
                              value={settings.headerConfig.announcementLink || ''}
                              onChange={(e) => updateHeaderConfig({ announcementLink: e.target.value })}
                              placeholder="/shipping"
                              className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-border pt-8">
                    <NavigationEditor
                      links={settings.headerConfig.navLinks}
                      onChange={(navLinks) => updateHeaderConfig({ navLinks })}
                    />
                  </div>

                  <div className="border-t border-border pt-8">
                    <h4 className="font-medium text-foreground mb-4">Header Options</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <SettingToggle
                        label="Sticky header"
                        description="Stays visible on scroll"
                        checked={settings.headerConfig.stickyHeader}
                        onChange={(checked) => updateHeaderConfig({ stickyHeader: checked })}
                        variant="card"
                      />
                      <SettingToggle
                        label="Show search bar"
                        description="Display search in header"
                        checked={settings.headerConfig.showSearch}
                        onChange={(checked) => updateHeaderConfig({ showSearch: checked })}
                        variant="card"
                      />
                      <SettingToggle
                        label="Show cart icon"
                        description="Shopping cart indicator"
                        checked={settings.headerConfig.showCart}
                        onChange={(checked) => updateHeaderConfig({ showCart: checked })}
                        variant="card"
                      />
                      <SettingToggle
                        label="Show account icon"
                        description="User account access"
                        checked={settings.headerConfig.showAccount}
                        onChange={(checked) => updateHeaderConfig({ showAccount: checked })}
                        variant="card"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Tab */}
              {activeTab === 'footer' && (
                <div className="space-y-8">
                  <SettingToggle
                    label="Show footer"
                    description="Display the footer section on all pages"
                    checked={settings.footerConfig.showFooter}
                    onChange={(checked) => updateFooterConfig({ showFooter: checked })}
                    variant="card"
                  />

                  {settings.footerConfig.showFooter && (
                    <>
                      <div className="border-t border-border pt-8">
                        <h4 className="font-medium text-foreground mb-4">Contact Information</h4>
                        <SettingToggle
                          label="Show contact information"
                          description="Display email and phone in footer"
                          checked={settings.footerConfig.showContactInfo}
                          onChange={(checked) => updateFooterConfig({ showContactInfo: checked })}
                          variant="card"
                          className="mb-4"
                        />

                        {settings.footerConfig.showContactInfo && (
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                              <input
                                type="email"
                                value={settings.footerConfig.contactEmail || ''}
                                onChange={(e) => updateFooterConfig({ contactEmail: e.target.value })}
                                placeholder="support@example.com"
                                className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                              <input
                                type="tel"
                                value={settings.footerConfig.contactPhone || ''}
                                onChange={(e) => updateFooterConfig({ contactPhone: e.target.value })}
                                placeholder="+1 (555) 123-4567"
                                className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Social Media Links */}
                      <div className="border-t border-border pt-8">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-medium text-foreground">Social Media Links</h4>
                            <p className="text-sm text-muted-foreground">Add links to your social media profiles</p>
                          </div>
                          <SettingToggle
                            label="Show icons"
                            checked={settings.footerConfig.showSocialIcons}
                            onChange={(checked) => updateFooterConfig({ showSocialIcons: checked })}
                          />
                        </div>
                        {settings.footerConfig.showSocialIcons && (
                          <SocialLinksManager
                            socialLinks={settings.footerConfig.socialLinks || []}
                            onChange={(links) => updateFooterConfig({ socialLinks: links })}
                          />
                        )}
                      </div>

                      {/* Footer Link Columns */}
                      <div className="border-t border-border pt-8">
                        <div className="mb-4">
                          <h4 className="font-medium text-foreground">Footer Link Columns</h4>
                          <p className="text-sm text-muted-foreground">Organize your footer links into columns</p>
                        </div>
                        <FooterLinkGroupsManager
                          linkGroups={settings.footerConfig.linkGroups || []}
                          onChange={(groups) => updateFooterConfig({ linkGroups: groups })}
                        />
                      </div>

                      {/* Newsletter & Other Options */}
                      <div className="border-t border-border pt-8">
                        <h4 className="font-medium text-foreground mb-4">Additional Options</h4>
                        <SettingToggle
                          label="Show newsletter signup"
                          description="Display newsletter subscription form in footer"
                          checked={settings.footerConfig.showNewsletter}
                          onChange={(checked) => updateFooterConfig({ showNewsletter: checked })}
                          variant="card"
                        />
                      </div>

                      <div className="border-t border-border pt-8">
                        <label className="block text-sm font-medium text-foreground mb-1">Copyright Text</label>
                        <input
                          type="text"
                          value={settings.footerConfig.copyrightText || ''}
                          onChange={(e) => updateFooterConfig({ copyrightText: e.target.value })}
                          placeholder="© 2024 Your Store. All rights reserved."
                          className="w-full px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Content Pages Tab */}
              {activeTab === 'pages' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Content Pages</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Create and manage informational pages like About Us, Privacy Policy, Terms of Service, and FAQ.
                      Pages marked as "Published" with "Show in Footer" enabled will automatically appear in your storefront footer.
                    </p>
                  </div>

                  <ContentPagesEditor
                    storefrontId={storefrontId}
                    storefrontSlug={storefront?.slug}
                    tenantId={currentTenant?.id}
                  />
                </div>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Custom CSS</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Add custom CSS to further customize your storefront. Use with caution.
                    </p>
                    <div className="rounded-lg border border-border overflow-hidden">
                      <div className="bg-muted px-4 py-2 border-b border-border flex items-center gap-2">
                        <Code2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">CSS Editor</span>
                      </div>
                      <textarea
                        value={settings.customCss || ''}
                        onChange={(e) => updateSettings({ customCss: e.target.value })}
                        placeholder={`/* Add your custom CSS here */
.my-custom-class {
  color: red;
}`}
                        className="w-full h-64 p-4 font-mono text-sm bg-gray-900 text-gray-100 focus:outline-none resize-none"
                        spellCheck={false}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Tip: Use CSS variables like var(--tenant-primary) to match your theme colors.
                    </p>
                  </div>

                  <div className="border-t border-border pt-8">
                    <h3 className="text-lg font-semibold mb-4">Available CSS Variables</h3>
                    <div className="bg-muted rounded-lg p-4">
                      <pre className="text-sm text-foreground overflow-x-auto">
{`--tenant-primary        /* Primary color */
--tenant-primary-light  /* Lighter primary */
--tenant-primary-dark   /* Darker primary */
--tenant-secondary      /* Secondary color */
--tenant-accent         /* Accent color */
--tenant-gradient       /* Primary to secondary gradient */
--font-heading          /* Heading font family */
--font-body             /* Body font family */
--container-width       /* Container max width */
--border-radius         /* Default border radius */
--button-radius         /* Button border radius */`}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview Panel */}
          {showPreview && (
            <div className="col-span-12 lg:col-span-4">
              <LivePreview
                settings={settings}
                tenantSlug={storefront?.slug}
                className="sticky top-8 h-[calc(100vh-8rem)]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
    </PermissionGate>
  );
}
