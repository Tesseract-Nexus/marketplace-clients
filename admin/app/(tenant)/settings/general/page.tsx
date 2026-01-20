'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Save,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  Loader2,
  Plus,
  Store,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Locate,
  Eye,
  EyeOff,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { PhoneInput } from '@/components/ui/phone-input';
import { useDialog } from '@/contexts/DialogContext';
import { settingsService } from '@/lib/services/settingsService';
import { storefrontService } from '@/lib/services/storefrontService';
import { tenantService, type TenantDetails } from '@/lib/services/tenantService';
import type { Storefront } from '@/lib/api/types';
import { AddressAutocomplete, type ParsedAddressData } from '@/components/AddressAutocomplete';
import { locationApi, type LocationData } from '@/lib/api/location';
import { StoreSelector } from '@/components/settings/StoreSelector';
import { LocationConfirmationModal, type DetectedLocationData } from '@/components/settings/LocationConfirmationModal';
import { useTenant } from '@/contexts/TenantContext';
import { useUser } from '@/contexts/UserContext';
import { getStorefrontDomain } from '@/lib/utils/tenant';
import { PermissionGate, Permission } from '@/components/permission-gate';

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

// Required fields for completeness calculation
const REQUIRED_FIELDS = [
  { key: 'store.name', label: 'Store Name' },
  { key: 'store.email', label: 'Email' },
  { key: 'store.phone', label: 'Phone' },
  { key: 'store.country', label: 'Country' },
  { key: 'business.currency', label: 'Currency' },
];

const currencyOptions = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'NZD', label: 'NZD - New Zealand Dollar' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
  { value: 'KRW', label: 'KRW - South Korean Won' },
  { value: 'MXN', label: 'MXN - Mexican Peso' },
  { value: 'BRL', label: 'BRL - Brazilian Real' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'SAR', label: 'SAR - Saudi Riyal' },
  { value: 'SEK', label: 'SEK - Swedish Krona' },
  { value: 'NOK', label: 'NOK - Norwegian Krone' },
  { value: 'DKK', label: 'DKK - Danish Krone' },
  { value: 'PLN', label: 'PLN - Polish Zloty' },
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'THB', label: 'THB - Thai Baht' },
  { value: 'IDR', label: 'IDR - Indonesian Rupiah' },
  { value: 'MYR', label: 'MYR - Malaysian Ringgit' },
  { value: 'PHP', label: 'PHP - Philippine Peso' },
];

const timezoneOptions = [
  // Americas
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'America/Toronto', label: 'Toronto (EST/EDT)' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST/CDT)' },
  { value: 'America/Sao_Paulo', label: 'São Paulo (BRT)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (ART)' },
  // Europe
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)' },
  { value: 'Europe/Moscow', label: 'Moscow (MSK)' },
  // Asia
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Asia/Jakarta', label: 'Jakarta (WIB)' },
  { value: 'Asia/Bangkok', label: 'Bangkok (ICT)' },
  // Oceania
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST)' },
  { value: 'Australia/Perth', label: 'Perth (AWST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)' },
  // Other
  { value: 'UTC', label: 'UTC' },
];

const dateFormatOptions = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD' },
];

// Country options with flags
const countryOptions = [
  // North America
  { value: 'US', label: '🇺🇸 United States', name: 'United States' },
  { value: 'CA', label: '🇨🇦 Canada', name: 'Canada' },
  { value: 'MX', label: '🇲🇽 Mexico', name: 'Mexico' },
  // Europe
  { value: 'GB', label: '🇬🇧 United Kingdom', name: 'United Kingdom' },
  { value: 'DE', label: '🇩🇪 Germany', name: 'Germany' },
  { value: 'FR', label: '🇫🇷 France', name: 'France' },
  { value: 'IT', label: '🇮🇹 Italy', name: 'Italy' },
  { value: 'ES', label: '🇪🇸 Spain', name: 'Spain' },
  { value: 'NL', label: '🇳🇱 Netherlands', name: 'Netherlands' },
  { value: 'CH', label: '🇨🇭 Switzerland', name: 'Switzerland' },
  { value: 'SE', label: '🇸🇪 Sweden', name: 'Sweden' },
  { value: 'NO', label: '🇳🇴 Norway', name: 'Norway' },
  { value: 'DK', label: '🇩🇰 Denmark', name: 'Denmark' },
  { value: 'PL', label: '🇵🇱 Poland', name: 'Poland' },
  // Asia Pacific
  { value: 'IN', label: '🇮🇳 India', name: 'India' },
  { value: 'CN', label: '🇨🇳 China', name: 'China' },
  { value: 'JP', label: '🇯🇵 Japan', name: 'Japan' },
  { value: 'KR', label: '🇰🇷 South Korea', name: 'South Korea' },
  { value: 'AU', label: '🇦🇺 Australia', name: 'Australia' },
  { value: 'NZ', label: '🇳🇿 New Zealand', name: 'New Zealand' },
  { value: 'SG', label: '🇸🇬 Singapore', name: 'Singapore' },
  { value: 'HK', label: '🇭🇰 Hong Kong', name: 'Hong Kong' },
  { value: 'MY', label: '🇲🇾 Malaysia', name: 'Malaysia' },
  { value: 'TH', label: '🇹🇭 Thailand', name: 'Thailand' },
  { value: 'ID', label: '🇮🇩 Indonesia', name: 'Indonesia' },
  { value: 'PH', label: '🇵🇭 Philippines', name: 'Philippines' },
  // Middle East
  { value: 'AE', label: '🇦🇪 UAE', name: 'United Arab Emirates' },
  { value: 'SA', label: '🇸🇦 Saudi Arabia', name: 'Saudi Arabia' },
  // South America
  { value: 'BR', label: '🇧🇷 Brazil', name: 'Brazil' },
  { value: 'AR', label: '🇦🇷 Argentina', name: 'Argentina' },
  // Africa
  { value: 'ZA', label: '🇿🇦 South Africa', name: 'South Africa' },
];

// Country to timezone mapping for auto-detection
const countryTimezoneMap: Record<string, string> = {
  // North America
  US: 'America/New_York',
  CA: 'America/Toronto',
  MX: 'America/Mexico_City',
  // Europe
  GB: 'Europe/London',
  DE: 'Europe/Berlin',
  FR: 'Europe/Paris',
  IT: 'Europe/Paris',
  ES: 'Europe/Paris',
  NL: 'Europe/Amsterdam',
  CH: 'Europe/Paris',
  SE: 'Europe/Stockholm',
  NO: 'Europe/Stockholm',
  DK: 'Europe/Stockholm',
  PL: 'Europe/Paris',
  // Asia Pacific
  IN: 'Asia/Kolkata',
  CN: 'Asia/Shanghai',
  JP: 'Asia/Tokyo',
  KR: 'Asia/Seoul',
  AU: 'Australia/Sydney',
  NZ: 'Pacific/Auckland',
  SG: 'Asia/Singapore',
  HK: 'Asia/Hong_Kong',
  MY: 'Asia/Singapore',
  TH: 'Asia/Bangkok',
  ID: 'Asia/Jakarta',
  PH: 'Asia/Singapore',
  // Middle East
  AE: 'Asia/Dubai',
  SA: 'Asia/Dubai',
  // South America
  BR: 'America/Sao_Paulo',
  AR: 'America/Argentina/Buenos_Aires',
  // Africa
  ZA: 'Europe/Paris', // Close to CET
};

// Country to currency mapping for auto-detection
const countryCurrencyMap: Record<string, string> = {
  // North America
  US: 'USD',
  CA: 'CAD',
  MX: 'MXN',
  // Europe
  GB: 'GBP',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  // Asia Pacific
  IN: 'INR',
  CN: 'CNY',
  JP: 'JPY',
  KR: 'KRW',
  AU: 'AUD',
  NZ: 'NZD',
  SG: 'SGD',
  HK: 'HKD',
  MY: 'MYR',
  TH: 'THB',
  ID: 'IDR',
  PH: 'PHP',
  // Middle East
  AE: 'AED',
  SA: 'SAR',
  // South America
  BR: 'BRL',
  AR: 'USD', // ARS is unstable, USD is commonly used
  // Africa
  ZA: 'ZAR',
};

// Helper to get nested value from object
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

// Completeness Indicator Component
function CompletenessIndicator({
  settings,
  onFieldClick,
}: {
  settings: GeneralSettings;
  onFieldClick: (field: string) => void;
}) {
  const { completedFields, missingFields, percentage } = useMemo(() => {
    const completed: string[] = [];
    const missing: { key: string; label: string }[] = [];

    REQUIRED_FIELDS.forEach((field) => {
      const value = getNestedValue(settings, field.key);
      if (value && value.trim && value.trim() !== '') {
        completed.push(field.key);
      } else if (value) {
        completed.push(field.key);
      } else {
        missing.push(field);
      }
    });

    return {
      completedFields: completed,
      missingFields: missing,
      percentage: Math.round((completed.length / REQUIRED_FIELDS.length) * 100),
    };
  }, [settings]);

  const isComplete = percentage === 100;

  return (
    <div
      className={`rounded-xl border p-4 ${
        isComplete
          ? 'bg-green-50 border-green-200'
          : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-600" />
          )}
          <span
            className={`font-semibold ${
              isComplete ? 'text-green-800' : 'text-amber-800'
            }`}
          >
            {isComplete ? 'Setup Complete' : 'Setup Progress'}
          </span>
        </div>
        <span
          className={`text-sm font-bold ${
            isComplete ? 'text-green-700' : 'text-amber-700'
          }`}
        >
          {percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-500 ${
            isComplete ? 'bg-green-500' : 'bg-amber-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Missing fields */}
      {missingFields.length > 0 && (
        <div className="text-sm text-amber-700">
          <span className="font-medium">Missing: </span>
          {missingFields.map((field, idx) => (
            <button
              key={field.key}
              onClick={() => onFieldClick(field.key)}
              className="hover:underline text-amber-800"
            >
              {field.label}
              {idx < missingFields.length - 1 ? ', ' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Create Storefront Modal Component
function CreateStorefrontModal({
  isOpen,
  onClose,
  onCreated,
  vendorId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (storefront: Storefront) => void;
  vendorId: string;
}) {
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const { showSuccess, showError, showConfirm } = useDialog();

  // Generate slug from name
  const slug = useMemo(() => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }, [name]);

  // Use dynamic domain detection for preview URL
  const storefrontDomain = getStorefrontDomain();
  const storefrontProtocol = storefrontDomain.includes('localhost') ? 'http' : 'https';
  const storefrontUrl = slug ? `${storefrontProtocol}://${slug}.${storefrontDomain}` : '';

  const handleCreate = async () => {
    if (!vendorId) {
      setError('Unable to create storefront: Tenant information not loaded. Please refresh the page.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter a store name');
      return;
    }

    if (slug.length < 3) {
      setError('Store name must be at least 3 characters');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Check slug availability
      const isAvailable = await storefrontService.checkSlugAvailability(slug);
      if (!isAvailable) {
        setError('This store URL is already taken. Try a different name.');
        setIsCreating(false);
        return;
      }

      // Create storefront with minimal data
      const result = await storefrontService.createStorefront({
        vendorId,
        name: name.trim(),
        slug,
        description: undefined,
        customDomain: undefined,
        logoUrl: undefined,
        faviconUrl: undefined,
        metaTitle: undefined,
        metaDescription: undefined,
      });

      showSuccess('Storefront Created', `${name} is now live at ${storefrontUrl}`);
      onCreated(result.data);
      setName('');
      onClose();
    } catch (err: any) {
      console.error('Failed to create storefront:', err);
      setError(err.message || 'Failed to create storefront');
      showError('Error', err.message || 'Failed to create storefront');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-primary px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Store className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Create New Storefront</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-muted-foreground mb-4">
            Create a new storefront with just a name. You can fill in other details later.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Store Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="e.g., My Awesome Store"
                className="w-full"
                autoFocus
              />
            </div>

            {/* URL Preview */}
            {slug && (
              <div className="bg-muted rounded-lg p-3 border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Your storefront URL will be:
                </p>
                <p className="text-sm font-mono text-purple-600 break-all">
                  {storefrontUrl}
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            className="bg-primary text-white"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Storefront
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function GeneralSettingsPage() {
  const { showSuccess, showError, showConfirm } = useDialog();
  const { currentTenant } = useTenant();
  const { user } = useUser();
  const [settings, setSettings] = useState<GeneralSettings>(defaultSettings);
  const [savedSettings, setSavedSettings] = useState<GeneralSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

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

  // Tenant onboarding data (for auto-populating empty settings)
  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null);

  // Publish/unpublish state
  const [isPublishing, setIsPublishing] = useState(false);

  // Get vendor ID from tenant context
  const vendorId = currentTenant?.id || '';

  useEffect(() => {
    loadStorefronts();
  }, []);

  useEffect(() => {
    // Wait for selectedStorefront, user, AND vendorId (tenant context) to be available
    // This ensures the fallback to tenant onboarding data works correctly
    if (selectedStorefront && user?.id && vendorId) {
      loadSettings(selectedStorefront.id);
    }
  }, [selectedStorefront, user?.id, vendorId]);

  // Auto-detect location on page load - shows confirmation modal
  useEffect(() => {
    if (selectedStorefront && !loading && !hasAutoDetected) {
      // Check if key location fields are empty OR if this is a fresh setup (no settingsId)
      // This ensures auto-detection for new storefronts
      const needsLocationDetection =
        !settingsId || !settings.store.city || !settings.store.country;

      if (needsLocationDetection) {
        setHasAutoDetected(true);
        // Small delay to let the page render first
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

      // Auto-select first storefront if available
      if (sfList.length > 0) {
        setSelectedStorefront(sfList[0]);
      }
    } catch (err) {
      console.error('Failed to load storefronts:', err);
    } finally {
      setLoadingStorefronts(false);
    }
  };

  /**
   * Build initial settings from tenant onboarding data
   * This is used when settings don't exist yet to auto-populate the form
   */
  const buildSettingsFromTenantData = (tenant: TenantDetails, storefrontName: string): GeneralSettings => {
    const rawCountry = tenant.address?.country || '';

    // Handle both country code (e.g., "IN") and country name (e.g., "India")
    // Check if it's a 2-letter country code first
    let countryCode = '';
    let countryName = '';

    const matchByCode = countryOptions.find(c => c.value === rawCountry.toUpperCase());
    if (matchByCode) {
      // rawCountry is a country code like "IN"
      countryCode = matchByCode.value;
      countryName = matchByCode.name;
    } else {
      // rawCountry might be a country name like "India"
      const matchByName = countryOptions.find(c => c.name === rawCountry);
      if (matchByName) {
        countryCode = matchByName.value;
        countryName = matchByName.name;
      } else {
        // Fallback: try to find by partial match or use as-is
        countryName = rawCountry;
        countryCode = Object.keys(countryCurrencyMap).find(
          code => countryOptions.find(c => c.value === code)?.name === rawCountry
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
        currency: tenant.store_setup?.currency || countryCurrencyMap[countryCode] || 'USD',
        timezone: tenant.store_setup?.timezone || countryTimezoneMap[countryCode] || 'UTC',
        dateFormat: countryCode === 'US' ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
      },
    };
  };

  /**
   * Fetch tenant details for auto-populating empty settings
   */
  const loadTenantDetails = async (): Promise<TenantDetails | null> => {
    if (!vendorId) return null;

    try {
      // Pass user ID to help with auth when BFF cookies don't propagate correctly
      const details = await tenantService.getTenantDetails(vendorId, user?.id);
      setTenantDetails(details);
      return details;
    } catch (err) {
      console.error('Failed to load tenant details:', err);
      return null;
    }
  };

  const loadSettings = async (storefrontId: string) => {
    // Declare tenant at function scope so it's accessible in catch block
    let tenant: TenantDetails | null = tenantDetails;

    try {
      setLoading(true);
      console.log('[Settings] Loading settings for storefront:', storefrontId, 'vendorId:', vendorId, 'userId:', user?.id);

      // ALWAYS load tenant details first as the primary data source
      // This ensures onboarding data (address, phone, currency, timezone) is available
      if (!tenant && vendorId) {
        console.log('[Settings] Loading tenant details for vendor:', vendorId);
        tenant = await loadTenantDetails();
        console.log('[Settings] Tenant details loaded:', tenant ? 'success' : 'failed');
      }

      // Try to fetch saved settings for this storefront
      let data = null;
      try {
        data = await settingsService.getSettingsByContext({
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: storefrontId,
        });
        console.log('[Settings] Settings service returned:', data ? 'data' : 'null');
      } catch (settingsErr) {
        console.log('[Settings] Settings service error (will use tenant data):', settingsErr);
      }

      if (data) {
        setSettingsId(data.id);

        // Get country name and find matching country code
        const countryName = data.ecommerce?.store?.address?.country || '';
        const countryCode = countryOptions.find(c => c.name === countryName)?.value || '';

        // Build tenant defaults from onboarding data (if available)
        const tenantDefaults = tenant ? buildSettingsFromTenantData(tenant, selectedStorefront?.name || '') : null;

        // Merge: prefer saved settings, fallback to tenant onboarding data, then defaults
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
            currency: data.ecommerce?.pricing?.currencies?.primary || tenantDefaults?.business.currency || countryCurrencyMap[countryCode] || 'USD',
            timezone: data.localization?.timezone || tenantDefaults?.business.timezone || countryTimezoneMap[countryCode] || 'UTC',
            dateFormat: data.localization?.dateFormat || tenantDefaults?.business.dateFormat || 'DD/MM/YYYY',
          },
        };
        console.log('[Settings] Final mapped settings:', mappedSettings);
        setSettings(mappedSettings);
        setSavedSettings(mappedSettings);

        // Set detected country code for phone input
        const finalCountryCode = countryCode || tenantDefaults?.store.countryCode;
        if (finalCountryCode) {
          setDetectedCountryCode(finalCountryCode);
        }
      } else {
        // No settings exist - use tenant onboarding data (already loaded above)
        console.log('[Settings] No saved settings, using tenant data');
        if (tenant) {
          // Auto-populate from tenant onboarding data
          const newSettings = buildSettingsFromTenantData(tenant, selectedStorefront?.name || '');
          console.log('[Settings] Using tenant onboarding data:', newSettings);
          setSettings(newSettings);
          setSavedSettings(newSettings);
          setSettingsId(null);
        } else {
          // Fallback to defaults with storefront name - will auto-detect location
          console.log('[Settings] No tenant data, using defaults');
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
        }
      }
    } catch (err) {
      console.error('[Settings] Failed to load settings:', err);

      // Try to use tenant data as fallback (may already be loaded)
      if (tenant) {
        console.log('[Settings] Using cached tenant data after error');
        const newSettings = buildSettingsFromTenantData(tenant, selectedStorefront?.name || '');
        setSettings(newSettings);
        setSavedSettings(newSettings);
      } else {
        // Use defaults with storefront name
        console.log('[Settings] No tenant data available, using defaults');
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
      showError('Error', 'Please select a storefront first');
      return;
    }

    try {
      setIsSaving(true);

      const payload: any = {
        context: {
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: selectedStorefront.id,
        },
        ecommerce: {
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
        },
        localization: {
          timezone: settings.business.timezone,
          dateFormat: settings.business.dateFormat,
          language: 'en',
          region: settings.store.country || '',
          currency: { code: settings.business.currency },
          timeFormat: '12h',
          numberFormat: {},
          rtl: false,
        },
      };

      if (settingsId) {
        await settingsService.updateSettings(settingsId, payload, selectedStorefront.id);
      } else {
        const newSettings = await settingsService.createSettings(payload, selectedStorefront.id);
        setSettingsId(newSettings.id);
      }

      setSavedSettings(settings);
      showSuccess('Success', 'Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      showError('Error', 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStorefrontCreated = (newStorefront: Storefront) => {
    setStorefronts((prev) => [...prev, newStorefront]);
    setSelectedStorefront(newStorefront);
  };

  // Handle publish/unpublish toggle
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

      // Update local state
      setSelectedStorefront({
        ...selectedStorefront,
        isActive: shouldPublish,
      });
      setStorefronts((prev) =>
        prev.map((sf) =>
          sf.id === selectedStorefront.id ? { ...sf, isActive: shouldPublish } : sf
        )
      );

      showSuccess(
        shouldPublish ? 'Store Published!' : 'Store Unpublished',
        shouldPublish
          ? 'Your storefront is now live and visible to customers.'
          : 'Your storefront is now showing a "Coming Soon" page to visitors.'
      );
    } catch (err) {
      console.error(`Failed to ${action} storefront:`, err);
      showError('Error', `Failed to ${action} storefront. Please try again.`);
    } finally {
      setIsPublishing(false);
    }
  };

  // Handle preview button click
  const handlePreviewStore = () => {
    if (!selectedStorefront?.storefrontUrl) return;
    // Add preview=true parameter to bypass Coming Soon page
    const previewUrl = selectedStorefront.storefrontUrl + '?preview=true';
    window.open(previewUrl, '_blank');
  };

  // Handle address selection from autocomplete
  const handleAddressSelect = (address: ParsedAddressData) => {
    const countryCode = address.countryCode?.toUpperCase() || '';
    setDetectedCountryCode(countryCode);

    // Find the matching country option
    const countryOption = countryOptions.find(c => c.value === countryCode);

    // Update address fields and sync currency/timezone
    setSettings((prev) => ({
      ...prev,
      store: {
        ...prev.store,
        address: address.streetAddress,
        city: address.city,
        state: address.stateCode || address.state,
        zipCode: address.postalCode,
        country: countryOption?.name || address.country,
        countryCode: countryCode,
      },
      business: {
        ...prev.business,
        timezone: countryTimezoneMap[countryCode] || prev.business.timezone,
        currency: countryCurrencyMap[countryCode] || prev.business.currency,
        dateFormat: countryCode === 'US' ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
      },
    }));
  };

  // Handle country change - auto-sync currency and timezone
  const handleCountryChange = (countryCode: string) => {
    const countryOption = countryOptions.find(c => c.value === countryCode);
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
        timezone: countryTimezoneMap[countryCode] || prev.business.timezone,
        currency: countryCurrencyMap[countryCode] || prev.business.currency,
        dateFormat: countryCode === 'US' ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
      },
    }));
  };

  // Helper function to retry API calls
  const retryWithBackoff = async <T,>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> => {
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

  // Detect location with confirmation modal
  const handleAutoDetectWithModal = async () => {
    setShowLocationModal(true);
    setIsDetectingLocation(true);
    setLocationDetectionError(undefined);
    setDetectedLocationData(null);

    try {
      // First try IP-based detection as it's more reliable and doesn't need permission
      try {
        const locationData = await retryWithBackoff(() => locationApi.detectLocation(), 3, 1000);
        const countryCode = locationData.country?.toUpperCase() || '';

        const detected: DetectedLocationData = {
          city: locationData.city || '',
          state: locationData.state?.replace(`${locationData.country}-`, '') || '',
          country: locationData.country_name || '',
          countryCode: countryCode,
          zipCode: locationData.postal_code || '',
          timezone: locationData.timezone || countryTimezoneMap[countryCode] || '',
          currency: countryCurrencyMap[countryCode] || 'USD',
        };

        setDetectedLocationData(detected);
        setDetectedCountryCode(countryCode);
        setIsDetectingLocation(false);
        return;
      } catch {
        // IP detection failed, trying browser geolocation
      }

      // Fall back to browser geolocation (will trigger permission prompt)
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
          const result = await retryWithBackoff(
            () => locationApi.reverseGeocode(latitude, longitude),
            2,
            1500
          );

          if (result) {
            const components = result.components || [];
            const getComponent = (type: string, useShort = false) => {
              const comp = components.find((c) => c.type === type);
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
              timezone: countryTimezoneMap[countryCode] || '',
              currency: countryCurrencyMap[countryCode] || 'USD',
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

      // If we get here, both methods failed
      throw new Error('Could not detect your location automatically');
    } catch (error) {
      console.error('Location detection failed:', error);
      setLocationDetectionError('Could not detect your location. Please enter details manually.');
      setIsDetectingLocation(false);
    }
  };

  // Handle location confirmation from modal
  const handleLocationConfirm = (data: DetectedLocationData) => {
    const countryCode = data.countryCode?.toUpperCase() || detectedCountryCode || '';

    // Find the matching country name from our options
    const countryOption = countryOptions.find(c => c.value === countryCode);

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
        timezone: data.timezone || countryTimezoneMap[countryCode] || prev.business.timezone,
        currency: data.currency || countryCurrencyMap[countryCode] || prev.business.currency,
        dateFormat: countryCode === 'US' ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
      },
    }));

    setShowLocationModal(false);
    showSuccess('Location Applied', 'Your location and business settings have been updated');
  };

  // Handle skip from modal
  const handleLocationSkip = () => {
    setShowLocationModal(false);
  };

  const scrollToField = (fieldKey: string) => {
    // Simple scroll - in production you might want to focus the input
    const element = document.querySelector(`[data-field="${fieldKey}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(savedSettings);

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
      fallbackTitle="General Settings"
      fallbackDescription="You don't have permission to view general settings."
    >
    <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="General Settings"
          description="Configure your store's basic information and preferences"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'General' },
          ]}
          actions={
            selectedStorefront ? (
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
            ) : null
          }
        />

        {/* Store Details Selector */}
        <StoreSelector
          storefronts={storefronts}
          selectedStorefront={selectedStorefront}
          onSelect={setSelectedStorefront}
          onCreateNew={() => setShowCreateModal(true)}
          onStorefrontCreated={handleStorefrontCreated}
          loading={loadingStorefronts}
          vendorId={vendorId}
          className="mb-6"
        />

        {/* Completeness Indicator */}
        {selectedStorefront && (
          <CompletenessIndicator settings={settings} onFieldClick={scrollToField} />
        )}

        {/* Settings Forms */}
        {selectedStorefront ? (
          <div className="space-y-6">
            {/* Store Information */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-violet-100 rounded-lg flex items-center justify-center">
                    <Globe className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Store Information</h3>
                    <p className="text-sm text-muted-foreground">Basic details about your store</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoDetectWithModal}
                  disabled={isDetectingLocation || showLocationModal}
                  className="flex items-center gap-2"
                >
                  {isDetectingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Locate className="h-4 w-4" />
                  )}
                  {isDetectingLocation ? 'Detecting...' : 'Detect Location'}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div data-field="store.name" className="md:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    <Store className="h-4 w-4 inline mr-1" />
                    Store Name <span className="text-red-500">*</span>
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
                  />
                </div>

                <div data-field="store.email">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email <span className="text-red-500">*</span>
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
                  />
                </div>

                <div data-field="store.phone">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone <span className="text-red-500">*</span>
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
                    countryCode={detectedCountryCode || undefined}
                  />
                </div>

                {/* Address Autocomplete */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Search Address
                  </label>
                  <AddressAutocomplete
                    onAddressSelect={handleAddressSelect}
                    placeholder="Start typing to search for an address..."
                    defaultValue={settings.store.address ? `${settings.store.address}, ${settings.store.city}` : ''}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Search for an address or click &quot;Detect Location&quot; to auto-fill
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Street Address
                  </label>
                  <Input
                    value={settings.store.address}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        store: { ...settings.store, address: e.target.value },
                      })
                    }
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    City
                  </label>
                  <Input
                    value={settings.store.city}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        store: { ...settings.store, city: e.target.value },
                      })
                    }
                    placeholder="Melbourne"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    State/Province
                  </label>
                  <Input
                    value={settings.store.state}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        store: { ...settings.store, state: e.target.value },
                      })
                    }
                    placeholder="VIC"
                  />
                </div>

                <div data-field="store.country">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    <Globe className="h-4 w-4 inline mr-1" />
                    Country <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={settings.store.countryCode}
                    onChange={handleCountryChange}
                    options={countryOptions}
                    placeholder="Select a country"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Currency and timezone will sync automatically
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    ZIP/Postal Code
                  </label>
                  <Input
                    value={settings.store.zipCode}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        store: { ...settings.store, zipCode: e.target.value },
                      })
                    }
                    placeholder="3000"
                  />
                </div>
              </div>
            </div>

            {/* Storefront Visibility Section */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <Rocket className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Storefront Visibility</h3>
                  <p className="text-sm text-muted-foreground">Control whether your store is visible to customers</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Status Indicator */}
                <div className={`p-4 rounded-lg border ${
                  selectedStorefront?.isActive
                    ? 'bg-green-50 border-green-200'
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedStorefront?.isActive ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      ) : (
                        <AlertCircle className="h-6 w-6 text-amber-600" />
                      )}
                      <div>
                        <p className={`font-semibold ${
                          selectedStorefront?.isActive ? 'text-green-800' : 'text-amber-800'
                        }`}>
                          {selectedStorefront?.isActive ? 'Published' : 'Unpublished'}
                        </p>
                        <p className={`text-sm ${
                          selectedStorefront?.isActive ? 'text-green-700' : 'text-amber-700'
                        }`}>
                          {selectedStorefront?.isActive
                            ? 'Your store is live and visible to customers'
                            : 'Customers see a "Coming Soon" page'}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {selectedStorefront?.isActive ? 'Live' : 'Hidden'}
                      </span>
                      <Switch
                        checked={selectedStorefront?.isActive || false}
                        onCheckedChange={(checked) => handlePublishToggle(checked)}
                        disabled={isPublishing}
                      />
                    </div>
                  </div>
                </div>

                {/* Preview Button (shown when unpublished) */}
                {!selectedStorefront?.isActive && (
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Eye className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Preview Your Store</p>
                        <p className="text-sm text-muted-foreground">
                          See how your store looks before publishing
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handlePreviewStore}
                      disabled={!selectedStorefront?.storefrontUrl}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                )}

                {/* Store URL */}
                {selectedStorefront?.storefrontUrl && (
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-foreground">Store URL</p>
                        <p className="text-sm text-purple-600 truncate">
                          {selectedStorefront.storefrontUrl}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(selectedStorefront.storefrontUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Publishing Info */}
                <p className="text-xs text-muted-foreground">
                  {selectedStorefront?.isActive
                    ? 'Your store is live. Toggle off to show a "Coming Soon" page while you make changes.'
                    : 'Your store is hidden. Finish setting up your store, then toggle on to make it visible to customers.'}
                </p>
              </div>
            </div>

            {/* Business Settings */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Regional Settings</h3>
                  <p className="text-sm text-muted-foreground">Currency, timezone, and date format</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div data-field="business.currency">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={settings.business.currency}
                    onChange={(value) =>
                      setSettings({
                        ...settings,
                        business: { ...settings.business, currency: value },
                      })
                    }
                    options={currencyOptions}
                  />
                </div>

                <div data-field="business.timezone">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Timezone
                  </label>
                  <Select
                    value={settings.business.timezone}
                    onChange={(value) =>
                      setSettings({
                        ...settings,
                        business: { ...settings.business, timezone: value },
                      })
                    }
                    options={timezoneOptions}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Date Format
                  </label>
                  <Select
                    value={settings.business.dateFormat}
                    onChange={(value) =>
                      setSettings({
                        ...settings,
                        business: { ...settings.business, dateFormat: value },
                      })
                    }
                    options={dateFormatOptions}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                These settings are automatically synced when you change your country. You can override them here if needed.
              </p>
            </div>

          </div>
        ) : (
          /* No Storefront Selected State */
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Create Your First Storefront
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by creating a storefront. Each storefront gets its own subdomain
              and can be customized independently.
            </p>
            {!vendorId && (
              <p className="text-amber-600 text-sm mb-4">
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
        )}
      </div>

      {/* Create Storefront Modal */}
      <CreateStorefrontModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleStorefrontCreated}
        vendorId={vendorId}
      />

      {/* Location Confirmation Modal - Auto-appears when address fields are empty */}
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
