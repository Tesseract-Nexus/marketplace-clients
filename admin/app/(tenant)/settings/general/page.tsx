'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Save,
  Mail,
  Phone,
  Store,
  Loader2,
  Plus,
  Palette,
  Globe,
  XCircle,
  Gift,
  X,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { PhoneInput } from '@/components/ui/phone-input';
import { useDialog } from '@/contexts/DialogContext';
import { useToast } from '@/contexts/ToastContext';
import { settingsService } from '@/lib/services/settingsService';
import { storefrontService } from '@/lib/services/storefrontService';
import { tenantService, type TenantDetails } from '@/lib/services/tenantService';
import type { Storefront } from '@/lib/api/types';
import type { GiftCardTemplateSettings } from '@/lib/types/settings';
import { locationApi } from '@/lib/api/location';
import { LocationConfirmationModal, type DetectedLocationData } from '@/components/settings/LocationConfirmationModal';
import { CreateStorefrontModal } from '@/components/settings/CreateStorefrontModal';
import { useTenant } from '@/contexts/TenantContext';
import { useUser } from '@/contexts/UserContext';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { StorefrontThemeContent } from '@/components/settings/StorefrontThemeContent';
import { DomainsTabContent } from '@/components/settings/domains';
import { CancellationTabContent } from '@/components/settings/CancellationTabContent';

// New modular components
import {
  SettingsSidebar,
  CollapsibleAddressSection,
  SmartRegionalSettings,
  OnboardingBanner,
  SetupCompleteBanner,
} from '@/components/settings/store';

// Shared constants
import {
  COUNTRY_OPTIONS,
  COUNTRY_TIMEZONE_MAP,
  COUNTRY_CURRENCY_MAP,
  REQUIRED_STORE_FIELDS,
  getCountryByCode,
  getAutoSyncedSettings,
} from '@/lib/constants/settings';

// Types
interface GeneralSettings {
  store: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    countryCode: string;
    zipCode: string;
  };
  business: {
    currency: string;
    timezone: string;
    dateFormat: string;
  };
}

const defaultSettings: GeneralSettings = {
  store: {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    countryCode: '',
    zipCode: '',
  },
  business: {
    currency: 'USD',
    timezone: 'UTC',
    dateFormat: 'DD/MM/YYYY',
  },
};

// Helper to get nested value from object
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export default function GeneralSettingsPage() {
  const { showConfirm } = useDialog();
  const toast = useToast();
  const { currentTenant } = useTenant();
  const { user } = useUser();
  const searchParams = useSearchParams();

  // Settings state
  const [settings, setSettings] = useState<GeneralSettings>(defaultSettings);
  const [savedSettings, setSavedSettings] = useState<GeneralSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  // Store existing ecommerce data to preserve cancellation settings when saving
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [existingEcommerce, setExistingEcommerce] = useState<Record<string, any>>({});

  // Tab state - check URL parameter for initial tab
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'domains' ? 'domains' : tabParam === 'theme' ? 'theme' : tabParam === 'cancellation' ? 'cancellation' : tabParam === 'giftcards' ? 'giftcards' : 'general';
  const [activeTab, setActiveTab] = useState<'general' | 'theme' | 'domains' | 'cancellation' | 'giftcards'>(initialTab);

  // Storefront state
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Location detection state
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedCountryCode, setDetectedCountryCode] = useState<string | null>(null);
  const [hasAutoDetected, setHasAutoDetected] = useState(false);

  // Location confirmation modal state
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [detectedLocationData, setDetectedLocationData] = useState<DetectedLocationData | null>(null);
  const [locationDetectionError, setLocationDetectionError] = useState<string | undefined>();

  // Tenant onboarding data
  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null);

  // Publish state
  const [isPublishing, setIsPublishing] = useState(false);

  // Onboarding dismissed state
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  // Get vendor ID from tenant context
  const vendorId = currentTenant?.id || '';

  // Gift Card Templates state
  // Default amounts: [500, 1000, 2000, 5000, 10000] - must match storefront defaults
  const defaultGiftCardSettings: GiftCardTemplateSettings = {
    enabled: true,
    presetAmounts: [500, 1000, 2000, 5000, 10000],
    allowCustomAmount: false,
    minAmount: 100,
    maxAmount: 50000,
  };
  const [giftCardSettings, setGiftCardSettings] = useState<GiftCardTemplateSettings>(defaultGiftCardSettings);
  const [savedGiftCardSettings, setSavedGiftCardSettings] = useState<GiftCardTemplateSettings>(defaultGiftCardSettings);

  // Update active tab when URL parameter changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'domains') {
      setActiveTab('domains');
    } else if (tab === 'theme') {
      setActiveTab('theme');
    } else if (tab === 'cancellation') {
      setActiveTab('cancellation');
    } else if (tab === 'giftcards') {
      setActiveTab('giftcards');
    }
  }, [searchParams]);

  // Load storefronts on mount
  useEffect(() => {
    loadStorefronts();
  }, []);

  // Load settings when storefront changes
  useEffect(() => {
    if (selectedStorefront && user?.id && vendorId) {
      loadSettings(selectedStorefront.id);
    }
  }, [selectedStorefront, user?.id, vendorId]);

  // Auto-detect location on page load
  useEffect(() => {
    if (selectedStorefront && !loading && !hasAutoDetected) {
      const needsLocationDetection =
        !settingsId || !settings.store.city || !settings.store.country;

      if (needsLocationDetection) {
        setHasAutoDetected(true);
        const timer = setTimeout(() => {
          handleAutoDetectWithModal();
        }, 500);
        return () => clearTimeout(timer);
      } else {
        setHasAutoDetected(true);
      }
    }
  }, [selectedStorefront, loading, hasAutoDetected, settingsId, settings.store.city, settings.store.country]);

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

  const buildSettingsFromTenantData = (tenant: TenantDetails, storefrontName: string): GeneralSettings => {
    const rawCountry = tenant.address?.country || '';
    let countryCode = '';
    let countryName = '';

    const matchByCode = COUNTRY_OPTIONS.find((c) => c.value === rawCountry.toUpperCase());
    if (matchByCode) {
      countryCode = matchByCode.value;
      countryName = matchByCode.name;
    } else {
      const matchByName = COUNTRY_OPTIONS.find((c) => c.name === rawCountry);
      if (matchByName) {
        countryCode = matchByName.value;
        countryName = matchByName.name;
      } else {
        countryName = rawCountry;
        countryCode =
          Object.keys(COUNTRY_CURRENCY_MAP).find(
            (code) => COUNTRY_OPTIONS.find((c) => c.value === code)?.name === rawCountry
          ) || '';
      }
    }

    return {
      store: {
        name: tenant.business_info?.business_name || storefrontName || '',
        email: tenant.contact_info?.email || '',
        phone: tenant.contact_info?.phone || '',
        address: tenant.address?.street_address || '',
        city: tenant.address?.city || '',
        state: tenant.address?.state_province || '',
        country: countryName,
        countryCode: countryCode,
        zipCode: tenant.address?.postal_code || '',
      },
      business: {
        currency: tenant.store_setup?.currency || COUNTRY_CURRENCY_MAP[countryCode] || 'USD',
        timezone: tenant.store_setup?.timezone || COUNTRY_TIMEZONE_MAP[countryCode] || 'UTC',
        dateFormat: countryCode === 'US' ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
      },
    };
  };

  const loadTenantDetails = async (): Promise<TenantDetails | null> => {
    if (!vendorId) return null;

    try {
      const details = await tenantService.getTenantDetails(vendorId, user?.id);
      setTenantDetails(details);
      return details;
    } catch (err) {
      console.error('Failed to load tenant details:', err);
      return null;
    }
  };

  const loadSettings = async (storefrontId: string) => {
    let tenant: TenantDetails | null = tenantDetails;

    try {
      setLoading(true);

      if (!tenant && vendorId) {
        tenant = await loadTenantDetails();
      }

      let data = null;
      try {
        // IMPORTANT: Use tenant ID (not storefront ID) for tenant-scoped settings
        // The settings service uses tenant_id for RBAC and data isolation
        const tenantId = currentTenant?.id || '';
        if (!tenantId) {
          console.warn('[Settings] No tenant ID available');
        }
        data = await settingsService.getSettingsByContext({
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: tenantId,
        });
      } catch (settingsErr) {
        console.log('[Settings] Settings service error (will use tenant data):', settingsErr);
      }

      if (data) {
        setSettingsId(data.id);
        // Store existing ecommerce data to preserve cancellation settings when saving
        setExistingEcommerce(data.ecommerce || {});

        const countryName = data.ecommerce?.store?.address?.country || '';
        const countryCode = COUNTRY_OPTIONS.find((c) => c.name === countryName)?.value || '';
        const tenantDefaults = tenant
          ? buildSettingsFromTenantData(tenant, selectedStorefront?.name || '')
          : null;

        const settingsCurrency = data.ecommerce?.pricing?.currencies?.primary;
        const settingsTimezone = data.localization?.timezone;
        const tenantCurrency = tenantDefaults?.business.currency;
        const tenantTimezone = tenantDefaults?.business.timezone;

        const resolvedCurrency =
          settingsCurrency &&
          !(settingsCurrency === 'USD' && tenantCurrency && tenantCurrency !== 'USD')
            ? settingsCurrency
            : (tenantCurrency || COUNTRY_CURRENCY_MAP[countryCode] || 'USD');

        const resolvedTimezone =
          settingsTimezone &&
          !(settingsTimezone === 'UTC' && tenantTimezone && tenantTimezone !== 'UTC')
            ? settingsTimezone
            : (tenantTimezone || COUNTRY_TIMEZONE_MAP[countryCode] || 'UTC');

        const mappedSettings: GeneralSettings = {
          store: {
            name: data.ecommerce?.store?.name || tenantDefaults?.store.name || selectedStorefront?.name || '',
            email: data.ecommerce?.store?.contactEmail || tenantDefaults?.store.email || '',
            phone: data.ecommerce?.store?.supportPhone || tenantDefaults?.store.phone || '',
            address: data.ecommerce?.store?.address?.street1 || tenantDefaults?.store.address || '',
            city: data.ecommerce?.store?.address?.city || tenantDefaults?.store.city || '',
            state: data.ecommerce?.store?.address?.state || tenantDefaults?.store.state || '',
            country: countryName || tenantDefaults?.store.country || '',
            countryCode: countryCode || tenantDefaults?.store.countryCode || '',
            zipCode: data.ecommerce?.store?.address?.zipCode || tenantDefaults?.store.zipCode || '',
          },
          business: {
            currency: resolvedCurrency,
            timezone: resolvedTimezone,
            dateFormat: data.localization?.dateFormat || tenantDefaults?.business.dateFormat || 'DD/MM/YYYY',
          },
        };

        setSettings(mappedSettings);
        setSavedSettings(mappedSettings);

        // Load gift card settings from marketing data
        if (data.marketing?.giftCardTemplates) {
          const gcSettings: GiftCardTemplateSettings = {
            enabled: data.marketing.giftCardTemplates.enabled ?? true,
            presetAmounts: data.marketing.giftCardTemplates.presetAmounts || [500, 1000, 2000, 5000, 10000],
            allowCustomAmount: data.marketing.giftCardTemplates.allowCustomAmount ?? false,
            minAmount: data.marketing.giftCardTemplates.minAmount ?? 100,
            maxAmount: data.marketing.giftCardTemplates.maxAmount ?? 50000,
          };
          setGiftCardSettings(gcSettings);
          setSavedGiftCardSettings(gcSettings);
        }

        const finalCountryCode = countryCode || tenantDefaults?.store.countryCode;
        if (finalCountryCode) {
          setDetectedCountryCode(finalCountryCode);
        }
      } else {
        if (tenant) {
          const newSettings = buildSettingsFromTenantData(tenant, selectedStorefront?.name || '');
          setSettings(newSettings);
          setSavedSettings(newSettings);
          setSettingsId(null);
          setExistingEcommerce({});
        } else {
          const newSettings = {
            ...defaultSettings,
            store: {
              ...defaultSettings.store,
              name: selectedStorefront?.name || '',
            },
          };
          setSettings(newSettings);
          setSavedSettings(newSettings);
          setSettingsId(null);
          setExistingEcommerce({});
        }
      }
    } catch (err) {
      console.error('[Settings] Failed to load settings:', err);
      setExistingEcommerce({});

      if (tenant) {
        const newSettings = buildSettingsFromTenantData(tenant, selectedStorefront?.name || '');
        setSettings(newSettings);
        setSavedSettings(newSettings);
      } else {
        const newSettings = {
          ...defaultSettings,
          store: {
            ...defaultSettings.store,
            name: selectedStorefront?.name || '',
          },
        };
        setSettings(newSettings);
        setSavedSettings(newSettings);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedStorefront) {
      toast.error('Error', 'Please select a storefront first');
      return;
    }

    try {
      setIsSaving(true);

      // IMPORTANT: Use tenant ID (not storefront ID) for tenant-scoped settings
      const tenantId = currentTenant?.id || '';
      if (!tenantId) {
        toast.error('Error', 'Unable to save: No tenant context available');
        return;
      }

      // Build settings payload - using Partial types since we're only updating specific fields
      // IMPORTANT: Merge with existing ecommerce data to preserve cancellation settings
      const mergedEcommerce = {
        ...existingEcommerce,
        store: {
          name: settings.store.name,
          contactEmail: settings.store.email,
          supportPhone: settings.store.phone,
          address: {
            businessName: settings.store.name,
            street1: settings.store.address,
            city: settings.store.city,
            state: settings.store.state,
            zipCode: settings.store.zipCode,
            country: settings.store.country,
          },
        },
        pricing: {
          currencies: {
            primary: settings.business.currency,
            supported: [settings.business.currency],
            autoConversion: true,
          },
        },
      };

      const payload = {
        context: {
          applicationId: 'admin-portal',
          scope: 'application' as const,
          tenantId: tenantId,
        },
        ecommerce: mergedEcommerce,
        localization: {
          timezone: settings.business.timezone,
          dateFormat: settings.business.dateFormat,
          language: 'en',
          region: settings.store.country || '',
          currency: { code: settings.business.currency },
          timeFormat: '12h' as const,
          numberFormat: {},
          rtl: false,
        },
      };

      if (settingsId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await settingsService.updateSettings(settingsId, payload as any, tenantId);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newSettings = await settingsService.createSettings(payload as any, tenantId);
        setSettingsId(newSettings.id);
      }

      // Update local state to track the merged ecommerce data
      setExistingEcommerce(mergedEcommerce);
      setSavedSettings(settings);
      toast.success('Success', 'Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveGiftCards = async () => {
    if (!selectedStorefront) {
      toast.error('Error', 'Please select a storefront first');
      return;
    }

    try {
      setIsSaving(true);

      const tenantId = currentTenant?.id || '';
      if (!tenantId) {
        toast.error('Error', 'Unable to save: No tenant context available');
        return;
      }

      // Build settings payload with gift card settings in marketing
      const payload = {
        context: {
          applicationId: 'admin-portal',
          scope: 'application' as const,
          tenantId: tenantId,
        },
        marketing: {
          giftCardTemplates: giftCardSettings,
        },
      };

      if (settingsId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await settingsService.updateSettings(settingsId, payload as any, tenantId);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newSettings = await settingsService.createSettings(payload as any, tenantId);
        setSettingsId(newSettings.id);
      }

      setSavedGiftCardSettings(giftCardSettings);
      toast.success('Success', 'Gift card settings saved successfully!');
    } catch (err) {
      console.error('Error saving gift card settings:', err);
      toast.error('Error', 'Failed to save gift card settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStorefrontCreated = (newStorefront: Storefront) => {
    setStorefronts((prev) => [...prev, newStorefront]);
    setSelectedStorefront(newStorefront);
  };

  const handlePublishToggle = async (shouldPublish: boolean) => {
    if (!selectedStorefront) return;

    const confirmed = await showConfirm({
      title: shouldPublish ? 'Publish Storefront' : 'Unpublish Storefront',
      message: shouldPublish
        ? 'Are you sure you want to publish this storefront? It will become visible to customers.'
        : 'Are you sure you want to unpublish this storefront? Customers will see a "Coming Soon" page.',
      confirmLabel: shouldPublish ? 'Publish' : 'Unpublish',
      cancelLabel: 'Cancel',
    });

    if (!confirmed) return;

    setIsPublishing(true);

    try {
      await storefrontService.updateStorefront(selectedStorefront.id, {
        isActive: shouldPublish,
      });

      setSelectedStorefront({
        ...selectedStorefront,
        isActive: shouldPublish,
      });
      setStorefronts((prev) =>
        prev.map((sf) => (sf.id === selectedStorefront.id ? { ...sf, isActive: shouldPublish } : sf))
      );

      toast.success(
        shouldPublish ? 'Store Published!' : 'Store Unpublished',
        shouldPublish
          ? 'Your storefront is now live and visible to customers.'
          : 'Your storefront is now showing a "Coming Soon" page to visitors.'
      );
    } catch (err) {
      const action = shouldPublish ? 'publish' : 'unpublish';
      console.error(`Failed to ${action} storefront:`, err);
      toast.error('Error', `Failed to ${action} storefront. Please try again.`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePreviewStore = () => {
    if (!selectedStorefront?.storefrontUrl) return;
    const previewUrl = selectedStorefront.storefrontUrl + '?preview=true';
    window.open(previewUrl, '_blank');
  };

  const handleCountryChange = (countryCode: string) => {
    const countryOption = COUNTRY_OPTIONS.find((c) => c.value === countryCode);
    const autoSynced = getAutoSyncedSettings(countryCode);
    setDetectedCountryCode(countryCode);

    setSettings((prev) => ({
      ...prev,
      store: {
        ...prev.store,
        country: countryOption?.name || '',
        countryCode: countryCode,
      },
      business: {
        ...prev.business,
        timezone: autoSynced.timezone,
        currency: autoSynced.currency,
        dateFormat: autoSynced.dateFormat,
      },
    }));
  };

  // Helper function to retry API calls
  const retryWithBackoff = async <T,>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
    throw new Error('All retries failed');
  };

  const handleAutoDetectWithModal = async () => {
    setShowLocationModal(true);
    setIsDetectingLocation(true);
    setLocationDetectionError(undefined);
    setDetectedLocationData(null);

    try {
      try {
        const locationData = await retryWithBackoff(() => locationApi.detectLocation(), 3, 1000);
        const countryCode = locationData.country?.toUpperCase() || '';

        const detected: DetectedLocationData = {
          city: locationData.city || '',
          state: locationData.state?.replace(`${locationData.country}-`, '') || '',
          country: locationData.country_name || '',
          countryCode: countryCode,
          zipCode: locationData.postal_code || '',
          timezone: locationData.timezone || COUNTRY_TIMEZONE_MAP[countryCode] || '',
          currency: COUNTRY_CURRENCY_MAP[countryCode] || 'USD',
        };

        setDetectedLocationData(detected);
        setDetectedCountryCode(countryCode);
        setIsDetectingLocation(false);
        return;
      } catch {
        // IP detection failed, trying browser geolocation
      }

      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 300000,
            });
          });

          const { latitude, longitude } = position.coords;
          const result = await retryWithBackoff(() => locationApi.reverseGeocode(latitude, longitude), 2, 1500);

          if (result) {
            const components = result.components || [];
            const getComponent = (type: string, useShort = false) => {
              const comp = components.find((c: { type: string; short_name?: string; long_name?: string }) => c.type === type);
              return comp ? (useShort ? comp.short_name : comp.long_name) : '';
            };

            const streetNumber = getComponent('street_number');
            const route = getComponent('route');
            const countryCode = getComponent('country', true).toUpperCase();

            const detected: DetectedLocationData = {
              address: [streetNumber, route].filter(Boolean).join(' '),
              city: getComponent('locality') || getComponent('administrative_area_level_2'),
              state: getComponent('administrative_area_level_1', true),
              country: getComponent('country'),
              countryCode: countryCode,
              zipCode: getComponent('postal_code'),
              timezone: COUNTRY_TIMEZONE_MAP[countryCode] || '',
              currency: COUNTRY_CURRENCY_MAP[countryCode] || 'USD',
            };

            setDetectedLocationData(detected);
            setDetectedCountryCode(countryCode);
            setIsDetectingLocation(false);
            return;
          }
        } catch {
          // Browser geolocation failed
        }
      }

      throw new Error('Could not detect your location automatically');
    } catch (error) {
      console.error('Location detection failed:', error);
      setLocationDetectionError('Could not detect your location. Please enter details manually.');
      setIsDetectingLocation(false);
    }
  };

  const handleLocationConfirm = (data: DetectedLocationData) => {
    const countryCode = data.countryCode?.toUpperCase() || detectedCountryCode || '';
    const countryOption = COUNTRY_OPTIONS.find((c) => c.value === countryCode);

    setSettings((prev) => ({
      ...prev,
      store: {
        ...prev.store,
        address: data.address || prev.store.address,
        city: data.city || prev.store.city,
        state: data.state || prev.store.state,
        country: countryOption?.name || data.country || prev.store.country,
        countryCode: countryCode || prev.store.countryCode,
        zipCode: data.zipCode || prev.store.zipCode,
      },
      business: {
        ...prev.business,
        timezone: data.timezone || COUNTRY_TIMEZONE_MAP[countryCode] || prev.business.timezone,
        currency: data.currency || COUNTRY_CURRENCY_MAP[countryCode] || prev.business.currency,
        dateFormat: countryCode === 'US' ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
      },
    }));

    setShowLocationModal(false);
    toast.success('Location Applied', 'Your location and business settings have been updated');
  };

  const handleLocationSkip = () => {
    setShowLocationModal(false);
  };

  const scrollToField = useCallback((fieldKey: string) => {
    const element = document.querySelector(`[data-field="${fieldKey}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add highlight effect
      element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
      setTimeout(() => {
        element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
      }, 2000);
    }
  }, []);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);
  const hasGiftCardChanges = JSON.stringify(giftCardSettings) !== JSON.stringify(savedGiftCardSettings);

  // Calculate setup progress
  const setupProgress = React.useMemo(() => {
    let completed = 0;
    REQUIRED_STORE_FIELDS.forEach((field) => {
      const value = getNestedValue(settings as unknown as Record<string, unknown>, field.key);
      if (value && typeof value === 'string' && value.trim() !== '') {
        completed++;
      } else if (value) {
        completed++;
      }
    });
    return Math.round((completed / REQUIRED_STORE_FIELDS.length) * 100);
  }, [settings]);

  // Loading state
  if (loadingStorefronts && !storefronts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
      fallbackTitle="Store Settings"
      fallbackDescription="You don't have permission to view store settings."
    >
      <div className="flex h-[calc(100vh-64px)] bg-background">
        {/* Sidebar */}
        <SettingsSidebar
          storefronts={storefronts}
          selectedStorefront={selectedStorefront}
          settings={settings}
          onSelectStorefront={setSelectedStorefront}
          onCreateStorefront={() => setShowCreateModal(true)}
          onPublishToggle={handlePublishToggle}
          onPreview={handlePreviewStore}
          onFieldClick={scrollToField}
          loading={loadingStorefronts}
          isPublishing={isPublishing}
          vendorId={vendorId}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {/* Sticky Header */}
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h1 className="text-xl font-bold text-foreground">Store Settings</h1>
                <p className="text-sm text-muted-foreground">
                  Configure your store information and preferences
                </p>
              </div>
              {activeTab === 'general' && selectedStorefront && (
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              )}
              {activeTab === 'giftcards' && selectedStorefront && (
                <Button
                  onClick={handleSaveGiftCards}
                  disabled={!hasGiftCardChanges || isSaving}
                  className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              )}
            </div>

            {/* Tabs */}
            <div className="px-6 pb-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'general' | 'theme' | 'domains' | 'cancellation' | 'giftcards')}>
                <TabsList className="inline-flex h-auto items-center justify-start rounded-xl bg-card border border-border p-1 shadow-sm">
                  <TabsTrigger
                    value="general"
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Store className="h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger
                    value="theme"
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Palette className="h-4 w-4" />
                    Theme & Design
                  </TabsTrigger>
                  <TabsTrigger
                    value="domains"
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Globe className="h-4 w-4" />
                    Domains
                  </TabsTrigger>
                  <TabsTrigger
                    value="cancellation"
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancellation
                  </TabsTrigger>
                  <TabsTrigger
                    value="giftcards"
                    className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Gift className="h-4 w-4" />
                    Gift Cards
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} className="h-full">
              {/* General Tab Content */}
              <TabsContent value="general" className="h-full m-0 p-0">
                {selectedStorefront ? (
                  loading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                  ) : (
                    <div className="max-w-2xl mx-auto p-6 space-y-6">
                      {/* Onboarding Banner */}
                      {setupProgress < 100 && !onboardingDismissed && (
                        <OnboardingBanner
                          settings={settings}
                          onFieldClick={scrollToField}
                          onDismiss={() => setOnboardingDismissed(true)}
                        />
                      )}

                      {/* Setup Complete Banner */}
                      {setupProgress === 100 && !onboardingDismissed && (
                        <SetupCompleteBanner onDismiss={() => setOnboardingDismissed(true)} />
                      )}

                      {/* Store Information Card */}
                      <div className="bg-card rounded-lg border border-border p-5 shadow-sm">
                        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                          <Store className="h-4 w-4 text-primary" />
                          Store Information
                        </h2>

                        <div className="space-y-4">
                          {/* Store Name */}
                          <div data-field="store.name">
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                              Store Name <span className="text-destructive">*</span>
                            </label>
                            <Input
                              value={settings.store.name}
                              onChange={(e) =>
                                setSettings({
                                  ...settings,
                                  store: { ...settings.store, name: e.target.value },
                                })
                              }
                              placeholder="My Store"
                              className="h-10"
                            />
                          </div>

                          {/* Email & Phone */}
                          <div className="grid grid-cols-2 gap-4">
                            <div data-field="store.email">
                              <label className="block text-sm font-medium text-foreground mb-1.5">
                                <Mail className="h-3.5 w-3.5 inline mr-1 opacity-70" />
                                Email <span className="text-destructive">*</span>
                              </label>
                              <Input
                                type="email"
                                value={settings.store.email}
                                onChange={(e) =>
                                  setSettings({
                                    ...settings,
                                    store: { ...settings.store, email: e.target.value },
                                  })
                                }
                                placeholder="store@example.com"
                                className="h-10"
                              />
                            </div>

                            <div data-field="store.phone">
                              <label className="block text-sm font-medium text-foreground mb-1.5">
                                <Phone className="h-3.5 w-3.5 inline mr-1 opacity-70" />
                                Phone <span className="text-destructive">*</span>
                              </label>
                              <PhoneInput
                                value={settings.store.phone}
                                onChange={(value) =>
                                  setSettings({
                                    ...settings,
                                    store: { ...settings.store, phone: value },
                                  })
                                }
                                autoDetectCountry
                                countryCode={settings.store.countryCode || detectedCountryCode || undefined}
                              />
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="border-t border-border pt-4">
                            {/* Collapsible Address Section */}
                            <CollapsibleAddressSection
                              data={{
                                address: settings.store.address,
                                city: settings.store.city,
                                state: settings.store.state,
                                country: settings.store.country,
                                countryCode: settings.store.countryCode,
                                zipCode: settings.store.zipCode,
                              }}
                              onChange={(updates) =>
                                setSettings({
                                  ...settings,
                                  store: { ...settings.store, ...updates },
                                })
                              }
                              onCountryChange={handleCountryChange}
                              onAutoDetect={handleAutoDetectWithModal}
                              isDetecting={isDetectingLocation}
                              detectedCountryCode={detectedCountryCode}
                            />
                          </div>

                          {/* Divider */}
                          <div className="border-t border-border pt-4">
                            {/* Smart Regional Settings */}
                            <SmartRegionalSettings
                              data={{
                                currency: settings.business.currency,
                                timezone: settings.business.timezone,
                                dateFormat: settings.business.dateFormat,
                              }}
                              countryCode={settings.store.countryCode}
                              onChange={(updates) =>
                                setSettings({
                                  ...settings,
                                  business: { ...settings.business, ...updates },
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  /* No Storefront Selected State */
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center max-w-md">
                      <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Create Your First Storefront
                      </h3>
                      <p className="text-muted-foreground mb-6 text-sm">
                        Get started by creating a storefront. Each storefront gets its own subdomain and
                        can be customized independently.
                      </p>
                      {!vendorId && (
                        <p className="text-warning text-sm mb-4">
                          Please wait while we load your tenant information...
                        </p>
                      )}
                      <Button
                        onClick={() => setShowCreateModal(true)}
                        disabled={!vendorId}
                        className="bg-primary text-white disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Storefront
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Theme Tab Content */}
              <TabsContent value="theme" className="h-full m-0 p-0">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                  }
                >
                  <StorefrontThemeContent embedded />
                </Suspense>
              </TabsContent>

              {/* Domains Tab Content */}
              <TabsContent value="domains" className="h-full m-0 p-0">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                  }
                >
                  <DomainsTabContent />
                </Suspense>
              </TabsContent>

              {/* Cancellation Tab Content */}
              <TabsContent value="cancellation" className="h-full m-0 p-0">
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                  }
                >
                  <CancellationTabContent />
                </Suspense>
              </TabsContent>

              {/* Gift Cards Tab Content */}
              <TabsContent value="giftcards" className="h-full m-0 p-0">
                {selectedStorefront ? (
                  loading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                  ) : (
                    <div className="max-w-2xl mx-auto p-6 space-y-6">
                      {/* Gift Card Templates */}
                      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                            <CreditCard className="h-6 w-6 text-purple-500" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-foreground">Gift Card Templates</h3>
                            <p className="text-sm text-muted-foreground">Configure gift card preset amounts for your storefront</p>
                          </div>
                          <Checkbox
                            checked={giftCardSettings.enabled ?? true}
                            onChange={(e) => setGiftCardSettings({ ...giftCardSettings, enabled: e.target.checked })}
                            label="Enable"
                          />
                        </div>

                        {giftCardSettings.enabled !== false && (
                          <div className="space-y-6">
                            {/* Preset Amounts */}
                            <div>
                              <label className="block text-sm font-semibold text-foreground mb-2">
                                Preset Amounts
                              </label>
                              <p className="text-xs text-muted-foreground mb-3">
                                These amounts will be shown as quick-select buttons on the storefront gift card page
                              </p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {(giftCardSettings.presetAmounts || []).map((amount, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                                  >
                                    <span>{amount.toLocaleString()}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newAmounts = [...(giftCardSettings.presetAmounts || [])];
                                        newAmounts.splice(index, 1);
                                        setGiftCardSettings({ ...giftCardSettings, presetAmounts: newAmounts });
                                      }}
                                      className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Enter amount"
                                  className="w-40"
                                  id="gift-card-amount-input"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const input = e.target as HTMLInputElement;
                                      const value = parseInt(input.value);
                                      if (value > 0) {
                                        const currentAmounts = giftCardSettings.presetAmounts || [];
                                        if (!currentAmounts.includes(value)) {
                                          const newAmounts = [...currentAmounts, value].sort((a, b) => a - b);
                                          setGiftCardSettings({ ...giftCardSettings, presetAmounts: newAmounts });
                                        }
                                        input.value = '';
                                      }
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const input = document.getElementById('gift-card-amount-input') as HTMLInputElement;
                                    const value = parseInt(input?.value || '0');
                                    if (value > 0) {
                                      const currentAmounts = giftCardSettings.presetAmounts || [];
                                      if (!currentAmounts.includes(value)) {
                                        const newAmounts = [...currentAmounts, value].sort((a, b) => a - b);
                                        setGiftCardSettings({ ...giftCardSettings, presetAmounts: newAmounts });
                                      }
                                      if (input) input.value = '';
                                    }
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              </div>
                            </div>

                            {/* Custom Amount Settings */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-1">
                                <Checkbox
                                  checked={giftCardSettings.allowCustomAmount ?? true}
                                  onChange={(e) => setGiftCardSettings({ ...giftCardSettings, allowCustomAmount: e.target.checked })}
                                  label="Allow Custom Amount"
                                  description="Let customers enter their own amount"
                                />
                              </div>

                              {giftCardSettings.allowCustomAmount !== false && (
                                <>
                                  <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                      Minimum Amount
                                    </label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={giftCardSettings.minAmount ?? 100}
                                      onChange={(e) => setGiftCardSettings({ ...giftCardSettings, minAmount: parseInt(e.target.value) || 1 })}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Minimum custom amount allowed</p>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                      Maximum Amount
                                    </label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={giftCardSettings.maxAmount ?? 50000}
                                      onChange={(e) => setGiftCardSettings({ ...giftCardSettings, maxAmount: parseInt(e.target.value) || 1 })}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Maximum custom amount allowed</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center max-w-md">
                      <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Select a Storefront
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Please select a storefront from the sidebar to configure gift card settings.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>

        {/* Create Storefront Modal */}
        <CreateStorefrontModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleStorefrontCreated}
          vendorId={vendorId}
        />

        {/* Location Confirmation Modal */}
        <LocationConfirmationModal
          isOpen={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onConfirm={handleLocationConfirm}
          onSkip={handleLocationSkip}
          detectedLocation={detectedLocationData}
          isDetecting={isDetectingLocation}
          error={locationDetectionError}
        />
      </div>
    </PermissionGate>
  );
}
