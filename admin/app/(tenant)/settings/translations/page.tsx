'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Languages,
  Save,
  Loader2,
  Globe,
  BarChart3,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Info,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';
import { storefrontService } from '@/lib/services/storefrontService';
import { StoreSelector } from '@/components/settings/StoreSelector';
import type { Storefront } from '@/lib/api/types';

// Language data with regional groupings
const SUPPORTED_LANGUAGES = {
  indian: [
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', rtl: false },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', rtl: false },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी', rtl: false },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', rtl: false },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', rtl: false },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', rtl: false },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', rtl: false },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', rtl: false },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', rtl: false },
  ],
  global: [
    { code: 'en', name: 'English', nativeName: 'English', rtl: false },
    { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false },
    { code: 'fr', name: 'French', nativeName: 'Français', rtl: false },
    { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', rtl: false },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', rtl: false },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', rtl: false },
  ],
  asian: [
    { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false },
    { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', rtl: false },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', rtl: false },
  ],
  middleEast: [
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true },
    { code: 'fa', name: 'Persian', nativeName: 'فارسی', rtl: true },
    { code: 'he', name: 'Hebrew', nativeName: 'עברית', rtl: true },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', rtl: false },
  ],
};

const ALL_LANGUAGES = [
  ...SUPPORTED_LANGUAGES.global,
  ...SUPPORTED_LANGUAGES.indian,
  ...SUPPORTED_LANGUAGES.asian,
  ...SUPPORTED_LANGUAGES.middleEast,
];

interface TranslationSettings {
  defaultSourceLang: string;
  defaultTargetLang: string;
  enabledLanguages: string[];
  autoDetect: boolean;
  autoTranslateProducts: boolean;
  autoTranslateCategories: boolean;
  autoTranslateContent: boolean;
}

interface TranslationStats {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  totalCharacters: number;
  lastRequestAt: string | null;
}

const defaultSettings: TranslationSettings = {
  defaultSourceLang: 'en',
  defaultTargetLang: 'hi',
  enabledLanguages: ['en', 'hi'],
  autoDetect: true,
  autoTranslateProducts: false,
  autoTranslateCategories: false,
  autoTranslateContent: false,
};

const defaultStats: TranslationStats = {
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  cacheHitRate: 0,
  totalCharacters: 0,
  lastRequestAt: null,
};

export default function TranslationSettingsPage() {
  const { showSuccess, showError, showConfirm } = useDialog();
  const { currentTenant } = useTenant();
  const [settings, setSettings] = useState<TranslationSettings>(defaultSettings);
  const [savedSettings, setSavedSettings] = useState<TranslationSettings>(defaultSettings);
  const [stats, setStats] = useState<TranslationStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  // Storefront state
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);

  const vendorId = currentTenant?.id || '';

  // Language options for dropdowns
  const languageOptions = useMemo(() => {
    return ALL_LANGUAGES.map((lang) => ({
      value: lang.code,
      label: `${lang.name} (${lang.nativeName})`,
    }));
  }, []);

  useEffect(() => {
    loadStorefronts();
  }, []);

  useEffect(() => {
    if (selectedStorefront) {
      loadSettings();
      loadStats();
    }
  }, [selectedStorefront]);

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

  const loadSettings = async () => {
    if (!selectedStorefront) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/translations?endpoint=preferences`,
        {
          headers: {
            'x-jwt-claim-tenant-id': selectedStorefront.id,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const loadedSettings: TranslationSettings = {
          defaultSourceLang: data.default_source_lang || 'en',
          defaultTargetLang: data.default_target_lang || 'hi',
          enabledLanguages: data.enabled_languages || ['en', 'hi'],
          autoDetect: data.auto_detect !== false,
          autoTranslateProducts: data.auto_translate_products || false,
          autoTranslateCategories: data.auto_translate_categories || false,
          autoTranslateContent: data.auto_translate_content || false,
        };
        setSettings(loadedSettings);
        setSavedSettings(loadedSettings);
      } else {
        // Use defaults for new setup
        setSettings(defaultSettings);
        setSavedSettings(defaultSettings);
      }
    } catch (err) {
      console.error('Failed to load translation settings:', err);
      setSettings(defaultSettings);
      setSavedSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!selectedStorefront) return;

    try {
      const response = await fetch(
        `/api/translations?endpoint=stats`,
        {
          headers: {
            'x-jwt-claim-tenant-id': selectedStorefront.id,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalRequests: data.total_requests || 0,
          cacheHits: data.cache_hits || 0,
          cacheMisses: data.cache_misses || 0,
          cacheHitRate: data.cache_hit_rate || 0,
          totalCharacters: data.total_characters || 0,
          lastRequestAt: data.last_request_at || null,
        });
      }
    } catch (err) {
      console.error('Failed to load translation stats:', err);
    }
  };

  const handleSave = async () => {
    if (!selectedStorefront) return;

    try {
      setSaving(true);

      const response = await fetch(
        `/api/translations?endpoint=preferences`,
        {
          method: 'PUT',
          headers: {
            'x-jwt-claim-tenant-id': selectedStorefront.id,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            default_source_lang: settings.defaultSourceLang,
            default_target_lang: settings.defaultTargetLang,
            enabled_languages: settings.enabledLanguages,
            auto_detect: settings.autoDetect,
          }),
        }
      );

      if (response.ok) {
        setSavedSettings(settings);
        showSuccess('Success', 'Translation settings saved successfully!');
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      showError('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    if (!selectedStorefront) return;

    const confirmed = await showConfirm({
      title: 'Clear Translation Cache',
      message: 'This will remove all cached translations for this storefront. New translations will be fetched from the translation service. Continue?',
    });

    if (!confirmed) return;

    try {
      setClearingCache(true);

      const response = await fetch(
        `/api/translations?endpoint=cache`,
        {
          method: 'DELETE',
          headers: {
            'x-jwt-claim-tenant-id': selectedStorefront.id,
          },
        }
      );

      if (response.ok) {
        showSuccess('Cache Cleared', 'Translation cache has been cleared successfully.');
        loadStats(); // Refresh stats
      } else {
        const error = await response.json();
        showError('Error', error.error || 'Failed to clear cache');
      }
    } catch (err) {
      console.error('Error clearing cache:', err);
      showError('Error', 'Failed to clear cache');
    } finally {
      setClearingCache(false);
    }
  };

  const toggleLanguage = (langCode: string) => {
    setSettings((prev) => {
      const enabled = prev.enabledLanguages.includes(langCode);
      let newEnabled: string[];

      if (enabled) {
        // Don't allow removing the last language or the default languages
        if (
          prev.enabledLanguages.length <= 1 ||
          langCode === prev.defaultSourceLang ||
          langCode === prev.defaultTargetLang
        ) {
          return prev;
        }
        newEnabled = prev.enabledLanguages.filter((l) => l !== langCode);
      } else {
        newEnabled = [...prev.enabledLanguages, langCode];
      }

      return { ...prev, enabledLanguages: newEnabled };
    });
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
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
    <PermissionGate
      permission={Permission.SETTINGS_VIEW}
      fallback="styled"
      fallbackTitle="Translations"
      fallbackDescription="You don't have permission to view translation settings."
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Translation Settings"
          description="Configure languages and translation preferences for your storefront"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Translations' },
          ]}
          actions={
            selectedStorefront ? (
              <Button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            ) : null
          }
        />

        {/* Store Selector */}
        <StoreSelector
          storefronts={storefronts}
          selectedStorefront={selectedStorefront}
          onSelect={setSelectedStorefront}
          loading={loadingStorefronts}
          vendorId={vendorId}
          className="mb-6"
        />

        {selectedStorefront && (
          <div className="space-y-6">
            {/* Translation Stats */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Translation Statistics</h3>
                    <p className="text-sm text-muted-foreground">Usage and performance metrics</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadStats}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-primary">
                    {formatNumber(stats.totalRequests)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Requests</div>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-success">
                    {stats.cacheHitRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Cache Hit Rate</div>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(stats.totalCharacters)}
                  </div>
                  <div className="text-sm text-muted-foreground">Characters Translated</div>
                </div>
                <div className="bg-muted rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-warning">
                    {settings.enabledLanguages.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Languages Enabled</div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearCache}
                  disabled={clearingCache}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                >
                  {clearingCache ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Clear Translation Cache
                </Button>
              </div>
            </div>

            {/* Default Language Settings */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                  <Globe className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Default Languages</h3>
                  <p className="text-sm text-muted-foreground">Set the primary source and target languages</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Default Source Language
                  </label>
                  <Select
                    value={settings.defaultSourceLang}
                    onChange={(value) =>
                      setSettings({
                        ...settings,
                        defaultSourceLang: value,
                        enabledLanguages: settings.enabledLanguages.includes(value)
                          ? settings.enabledLanguages
                          : [...settings.enabledLanguages, value],
                      })
                    }
                    options={languageOptions}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The language your content is originally written in
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Default Target Language
                  </label>
                  <Select
                    value={settings.defaultTargetLang}
                    onChange={(value) =>
                      setSettings({
                        ...settings,
                        defaultTargetLang: value,
                        enabledLanguages: settings.enabledLanguages.includes(value)
                          ? settings.enabledLanguages
                          : [...settings.enabledLanguages, value],
                      })
                    }
                    options={languageOptions}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    The primary language for translations
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 border border-border rounded-lg hover:bg-muted">
                <Checkbox
                  checked={settings.autoDetect}
                  onChange={(e) =>
                    setSettings({ ...settings, autoDetect: e.target.checked })
                  }
                  label="Auto-detect source language"
                  description="Automatically detect the source language when translating"
                />
              </div>
            </div>

            {/* Enabled Languages */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <Languages className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Enabled Languages</h3>
                  <p className="text-sm text-muted-foreground">
                    Select which languages customers can choose from on your storefront
                  </p>
                </div>
              </div>

              {/* Indian Regional Languages */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Indian Regional Languages
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {SUPPORTED_LANGUAGES.indian.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => toggleLanguage(lang.code)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        settings.enabledLanguages.includes(lang.code)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-border hover:border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="font-medium text-foreground">{lang.name}</div>
                          <div className="text-xs text-muted-foreground">{lang.nativeName}</div>
                        </div>
                        {settings.enabledLanguages.includes(lang.code) && (
                          <CheckCircle2 className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Global Languages */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Global Languages
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SUPPORTED_LANGUAGES.global.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => toggleLanguage(lang.code)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        settings.enabledLanguages.includes(lang.code)
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="font-medium text-foreground">{lang.name}</div>
                          <div className="text-xs text-muted-foreground">{lang.nativeName}</div>
                        </div>
                        {settings.enabledLanguages.includes(lang.code) && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Asian Languages */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  Asian Languages
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SUPPORTED_LANGUAGES.asian.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => toggleLanguage(lang.code)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        settings.enabledLanguages.includes(lang.code)
                          ? 'border-green-500 bg-success-muted'
                          : 'border-border hover:border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="font-medium text-foreground">{lang.name}</div>
                          <div className="text-xs text-muted-foreground">{lang.nativeName}</div>
                        </div>
                        {settings.enabledLanguages.includes(lang.code) && (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Middle East Languages */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-warning rounded-full"></span>
                  Middle East Languages
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {SUPPORTED_LANGUAGES.middleEast.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => toggleLanguage(lang.code)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        settings.enabledLanguages.includes(lang.code)
                          ? 'border-amber-500 bg-warning-muted'
                          : 'border-border hover:border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="font-medium text-foreground">{lang.name}</div>
                          <div className="text-xs text-muted-foreground">{lang.nativeName}</div>
                        </div>
                        {settings.enabledLanguages.includes(lang.code) && (
                          <CheckCircle2 className="h-5 w-5 text-warning" />
                        )}
                        {lang.rtl && (
                          <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded ml-1">
                            RTL
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Auto-Translation Settings */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Auto-Translation</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically translate content when customers select a different language
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 border border-border rounded-lg hover:bg-muted">
                  <Checkbox
                    checked={settings.autoTranslateProducts}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        autoTranslateProducts: e.target.checked,
                      })
                    }
                    label="Auto-translate product names and descriptions"
                    description="Product content will be translated on-the-fly when viewed in a different language"
                  />
                </div>

                <div className="p-4 border border-border rounded-lg hover:bg-muted">
                  <Checkbox
                    checked={settings.autoTranslateCategories}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        autoTranslateCategories: e.target.checked,
                      })
                    }
                    label="Auto-translate category names"
                    description="Category names will be translated when viewing in a different language"
                  />
                </div>

                <div className="p-4 border border-border rounded-lg hover:bg-muted">
                  <Checkbox
                    checked={settings.autoTranslateContent}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        autoTranslateContent: e.target.checked,
                      })
                    }
                    label="Auto-translate static content pages"
                    description="Blog posts, FAQs, and other content pages will be translated automatically"
                  />
                </div>
              </div>

              <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">
                      How auto-translation works
                    </p>
                    <p className="text-sm text-primary mt-1">
                      When enabled, content is translated in real-time using AI. Translations are
                      cached for performance. You can always manually override translations in
                      the product or content editors.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </PermissionGate>
  );
}
