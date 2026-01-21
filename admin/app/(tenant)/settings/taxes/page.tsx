'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Globe,
  Percent,
  FileCheck,
  Calculator,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MapPin,
  Building2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  Info,
  Settings,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { taxService, TaxJurisdiction } from '@/lib/services/taxService';
import { settingsService } from '@/lib/services/settingsService';
import { storefrontService } from '@/lib/services/storefrontService';
import { useTenant } from '@/contexts/TenantContext';
import type { Storefront } from '@/lib/api/types';
import {
  TAX_CONFIGURATIONS,
  INDIA_STATES,
  getCountryConfig,
  getCountryCode,
  validateGSTIN,
  getStateFromGSTIN,
  calculateSetupCompletion,
  COUNTRY_NAME_TO_CODE,
} from '@/lib/data/taxConfigurations';
import { PermissionGate, Permission } from '@/components/permission-gate';

// Types
interface TaxStatus {
  loading: boolean;
  jurisdictionsCount: number;
  ratesCount: number;
  exemptionsCount: number;
  hasCountryJurisdiction: boolean;
  countryCode: string | null;
  completionPercentage: number;
}

interface StoreSettings {
  country: string;
  countryCode: string | null;
  state: string;
  loading: boolean;
}

export default function TaxSettingsPage() {
  const { currentTenant } = useTenant();

  // State
  const [taxStatus, setTaxStatus] = useState<TaxStatus>({
    loading: true,
    jurisdictionsCount: 0,
    ratesCount: 0,
    exemptionsCount: 0,
    hasCountryJurisdiction: false,
    countryCode: null,
    completionPercentage: 0,
  });

  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    country: '',
    countryCode: null,
    state: '',
    loading: true,
  });

  const [showGlobalCoverage, setShowGlobalCoverage] = useState(false);

  // Quick Setup State - Common
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupProgress, setSetupProgress] = useState(0);
  const [setupStep, setSetupStep] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState<{ jurisdictions: number; rates: number } | null>(null);

  // India GST Setup State
  const [gstin, setGstin] = useState('');
  const [gstinError, setGstinError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState('MH');
  const [selectedGstSlabs, setSelectedGstSlabs] = useState<number[]>([5, 12, 18, 28]);

  // US Sales Tax Setup State
  const [usBusinessState, setUsBusinessState] = useState('CA');
  const [usNexusStates, setUsNexusStates] = useState<string[]>(['CA']);

  // Canada Tax Setup State
  const [caBusinessProvince, setCaBusinessProvince] = useState('ON');

  // UK/Australia - minimal config needed

  // Country selection state (for when no country is configured)
  const [selectedCountry, setSelectedCountry] = useState('');
  const [isSavingCountry, setIsSavingCountry] = useState(false);

  // Storefront state - needed to sync with General Settings
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [existingSettingsId, setExistingSettingsId] = useState<string | null>(null);

  // Load storefronts (same as General Settings page)
  const loadStorefronts = useCallback(async () => {
    try {
      const result = await storefrontService.getStorefronts();
      const sfList = result.data || [];
      setStorefronts(sfList);
      if (sfList.length > 0) {
        setSelectedStorefront(sfList[0]);
      }
    } catch (err) {
      console.error('Failed to load storefronts:', err);
    }
  }, []);

  // Load store settings from General Settings (using storefront ID like General Settings page)
  const loadStoreSettings = useCallback(async () => {
    if (!selectedStorefront?.id) return;

    try {
      const settings = await settingsService.getSettingsByContext({
        applicationId: 'admin-portal',
        scope: 'application',
        tenantId: selectedStorefront.id,
      });

      if (settings) {
        setExistingSettingsId(settings.id);

        // Extract country from settings
        const ecommerce = settings.ecommerce as any;
        const localization = settings.localization as any;

        const country = ecommerce?.store?.address?.country ||
                       localization?.region ||
                       '';

        const countryCode = COUNTRY_NAME_TO_CODE[country] || getCountryCode(country) || null;

        const state = ecommerce?.store?.address?.state || '';

        setStoreSettings({
          country,
          countryCode,
          state,
          loading: false,
        });

        // Auto-select state if available
        if (countryCode === 'IN' && state) {
          const stateConfig = INDIA_STATES.find(s =>
            s.name.toLowerCase() === state.toLowerCase() ||
            s.code.toLowerCase() === state.toLowerCase()
          );
          if (stateConfig) {
            setSelectedState(stateConfig.code);
          }
        }
      } else {
        setExistingSettingsId(null);
        setStoreSettings(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Failed to load store settings:', error);
      setStoreSettings(prev => ({ ...prev, loading: false }));
    }
  }, [selectedStorefront?.id]);

  // Load tax status
  const loadTaxStatus = useCallback(async () => {
    try {
      const status = await taxService.setup.getStatus();
      const completion = calculateSetupCompletion(
        status.jurisdictionsCount,
        status.ratesCount,
        status.hasCountryJurisdiction
      );

      setTaxStatus({
        loading: false,
        jurisdictionsCount: status.jurisdictionsCount,
        ratesCount: status.ratesCount,
        exemptionsCount: status.exemptionsCount,
        hasCountryJurisdiction: status.hasCountryJurisdiction,
        countryCode: status.countryCode,
        completionPercentage: completion,
      });
    } catch (error) {
      console.error('Failed to load tax status:', error);
      setTaxStatus(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Load storefronts on mount
  useEffect(() => {
    loadStorefronts();
  }, [loadStorefronts]);

  // Load store settings when storefront is selected
  useEffect(() => {
    if (selectedStorefront) {
      loadStoreSettings();
    }
  }, [selectedStorefront, loadStoreSettings]);

  // Load tax status on mount
  useEffect(() => {
    loadTaxStatus();
  }, [loadTaxStatus]);

  // Country to currency mapping
  const countryCurrencyMap: Record<string, string> = {
    IN: 'INR',
    US: 'USD',
    GB: 'GBP',
    AU: 'AUD',
    CA: 'CAD',
    NZ: 'NZD',
    SG: 'SGD',
    DE: 'EUR',
    FR: 'EUR',
  };

  // Country to timezone mapping
  const countryTimezoneMap: Record<string, string> = {
    IN: 'Asia/Kolkata',
    US: 'America/Los_Angeles',
    GB: 'Europe/London',
    AU: 'Australia/Sydney',
    CA: 'America/Toronto',
    NZ: 'Pacific/Auckland',
    SG: 'Asia/Singapore',
  };

  // Available countries for selection
  const availableCountries = [
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  ];

  // Save country selection to settings (using storefront ID to sync with General Settings)
  const handleSaveCountry = async () => {
    if (!selectedStorefront?.id || !selectedCountry) return;

    setIsSavingCountry(true);
    try {
      const countryData = availableCountries.find(c => c.code === selectedCountry);
      const countryName = countryData?.name || selectedCountry;
      const currency = countryCurrencyMap[selectedCountry] || 'USD';
      const timezone = countryTimezoneMap[selectedCountry] || 'UTC';

      const payload = {
        context: {
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: selectedStorefront.id,
        },
        ecommerce: {
          store: {
            address: {
              country: countryName,
            },
          },
          pricing: {
            currencies: {
              primary: currency,
              supported: [currency],
              autoConversion: true,
            },
          },
        },
        localization: {
          language: 'en',
          region: countryName,
          timezone: timezone,
          currency: { code: currency },
          dateFormat: selectedCountry === 'US' ? 'MM/DD/YYYY' : 'DD/MM/YYYY',
          timeFormat: '12h' as const,
          numberFormat: {},
          rtl: false,
        },
      };

      if (existingSettingsId) {
        // Update existing settings
        await settingsService.updateSettings(existingSettingsId, payload as any, selectedStorefront.id);
      } else {
        // Create new settings
        const newSettings = await settingsService.createSettings(payload as any, selectedStorefront.id);
        setExistingSettingsId(newSettings.id);
      }

      // Update local state
      setStoreSettings({
        country: countryName,
        countryCode: selectedCountry,
        state: '',
        loading: false,
      });

      setSelectedCountry('');
    } catch (error) {
      console.error('Failed to save country:', error);
    } finally {
      setIsSavingCountry(false);
    }
  };

  // Handle GSTIN validation
  const handleGstinChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setGstin(upperValue);
    setGstinError(null);

    if (upperValue.length > 0) {
      const validation = validateGSTIN(upperValue);
      if (!validation.valid) {
        setGstinError(validation.error || 'Invalid GSTIN');
      } else if (validation.stateCode) {
        // Auto-select state from GSTIN
        const state = getStateFromGSTIN(upperValue);
        if (state) {
          setSelectedState(state.code);
        }
      }
    }
  };

  // Handle GST slab toggle
  const toggleGstSlab = (slab: number) => {
    setSelectedGstSlabs(prev =>
      prev.includes(slab) ? prev.filter(s => s !== slab) : [...prev, slab].sort((a, b) => a - b)
    );
  };

  // Handle India GST Setup
  const handleIndiaGSTSetup = async () => {
    if (selectedGstSlabs.length === 0) {
      setSetupError('Please select at least one GST slab');
      return;
    }

    setIsSettingUp(true);
    setSetupError(null);
    setSetupSuccess(null);
    setSetupProgress(0);

    try {
      const result = await taxService.setup.setupIndiaGST({
        gstin: gstin || undefined,
        businessState: selectedState,
        gstSlabs: selectedGstSlabs,
        onProgress: (step, progress) => {
          setSetupStep(step);
          setSetupProgress(progress);
        },
      });

      if (result.success) {
        setSetupSuccess(result.created);
        await loadTaxStatus(); // Refresh status
      } else {
        setSetupError(result.error || 'Setup failed');
      }
    } catch (error: any) {
      setSetupError(error.message || 'Setup failed');
    } finally {
      setIsSettingUp(false);
    }
  };

  // Handle US Sales Tax Setup
  const handleUSSalesTaxSetup = async () => {
    if (usNexusStates.length === 0) {
      setSetupError('Please select at least one nexus state');
      return;
    }

    setIsSettingUp(true);
    setSetupError(null);
    setSetupSuccess(null);
    setSetupProgress(0);

    try {
      const result = await taxService.setup.setupUSSalesTax({
        businessState: usBusinessState,
        nexusStates: usNexusStates,
        onProgress: (step, progress) => {
          setSetupStep(step);
          setSetupProgress(progress);
        },
      });

      if (result.success) {
        setSetupSuccess(result.created);
        await loadTaxStatus();
      } else {
        setSetupError(result.error || 'Setup failed');
      }
    } catch (error: any) {
      setSetupError(error.message || 'Setup failed');
    } finally {
      setIsSettingUp(false);
    }
  };

  // Handle UK VAT Setup
  const handleUKVATSetup = async () => {
    setIsSettingUp(true);
    setSetupError(null);
    setSetupSuccess(null);
    setSetupProgress(0);

    try {
      const result = await taxService.setup.setupUKVAT({
        onProgress: (step, progress) => {
          setSetupStep(step);
          setSetupProgress(progress);
        },
      });

      if (result.success) {
        setSetupSuccess(result.created);
        await loadTaxStatus();
      } else {
        setSetupError(result.error || 'Setup failed');
      }
    } catch (error: any) {
      setSetupError(error.message || 'Setup failed');
    } finally {
      setIsSettingUp(false);
    }
  };

  // Handle Australia GST Setup
  const handleAustraliaGSTSetup = async () => {
    setIsSettingUp(true);
    setSetupError(null);
    setSetupSuccess(null);
    setSetupProgress(0);

    try {
      const result = await taxService.setup.setupAustraliaGST({
        onProgress: (step, progress) => {
          setSetupStep(step);
          setSetupProgress(progress);
        },
      });

      if (result.success) {
        setSetupSuccess(result.created);
        await loadTaxStatus();
      } else {
        setSetupError(result.error || 'Setup failed');
      }
    } catch (error: any) {
      setSetupError(error.message || 'Setup failed');
    } finally {
      setIsSettingUp(false);
    }
  };

  // Handle Canada Tax Setup
  const handleCanadaTaxSetup = async () => {
    setIsSettingUp(true);
    setSetupError(null);
    setSetupSuccess(null);
    setSetupProgress(0);

    try {
      const result = await taxService.setup.setupCanadaTax({
        businessProvince: caBusinessProvince,
        onProgress: (step, progress) => {
          setSetupStep(step);
          setSetupProgress(progress);
        },
      });

      if (result.success) {
        setSetupSuccess(result.created);
        await loadTaxStatus();
      } else {
        setSetupError(result.error || 'Setup failed');
      }
    } catch (error: any) {
      setSetupError(error.message || 'Setup failed');
    } finally {
      setIsSettingUp(false);
    }
  };

  // Get country config
  const countryConfig = getCountryConfig(storeSettings.country);
  const isIndiaStore = storeSettings.countryCode === 'IN';
  const isUSStore = storeSettings.countryCode === 'US';
  const isUKStore = storeSettings.countryCode === 'GB';
  const isAustraliaStore = storeSettings.countryCode === 'AU';
  const isCanadaStore = storeSettings.countryCode === 'CA';
  const needsSetup = !taxStatus.hasCountryJurisdiction;

  // Tax features data
  const taxFeatures = [
    {
      region: 'India GST',
      details: 'CGST, SGST, IGST with state codes. All 28 states and 8 UTs supported with proper GST state codes.',
      slabs: '0%, 5%, 12%, 18%, 28%',
    },
    {
      region: 'EU VAT',
      details: '17 EU countries with 2024 VAT rates. Supports intra-community supplies and reverse charge.',
      slabs: '16% - 27%',
    },
    {
      region: 'Canada',
      details: 'Federal GST 5%, Provincial HST 13-15%, PST, and Quebec QST (compound tax on GST).',
      slabs: 'GST + Provincial',
    },
    {
      region: 'UK VAT',
      details: 'Post-Brexit UK VAT with England, Scotland, Wales, and Northern Ireland support.',
      slabs: '20%',
    },
    {
      region: 'Australia/NZ',
      details: 'Australia GST 10% with all states. New Zealand GST 15%.',
      slabs: '10% / 15%',
    },
    {
      region: 'USA',
      details: 'State and local sales taxes. Supports nexus tracking and economic nexus thresholds.',
      slabs: 'State varies',
    },
  ];

  return (
    <PermissionGate
      permission={Permission.SETTINGS_TAXES_VIEW}
      fallback="styled"
      fallbackTitle="Tax Settings"
      fallbackDescription="You don't have permission to view tax settings."
    >
      <div className="min-h-screen bg-background p-8">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Tax Settings"
          description="Configure tax jurisdictions, rates, and exemptions for global tax compliance"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Taxes' },
          ]}
        />

        {/* Status Banner */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Store Location */}
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Store Location</p>
                    <Link
                      href="/settings/general"
                      className="text-xs text-primary hover:text-primary flex items-center gap-1"
                    >
                      <Settings className="h-3 w-3" />
                      Change
                    </Link>
                  </div>
                  {storeSettings.loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  ) : storeSettings.country ? (
                    <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                      {countryConfig?.flag} {storeSettings.country}
                    </p>
                  ) : (
                    <p className="text-sm text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      No country configured
                    </p>
                  )}
                </div>
              </div>

              {/* Setup Status */}
              <div className="flex-1 max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Tax Setup Progress</span>
                  <span className="text-sm font-semibold text-foreground">
                    {taxStatus.loading ? '...' : `${taxStatus.completionPercentage}%`}
                  </span>
                </div>
                <Progress value={taxStatus.completionPercentage} className="h-2" />
              </div>

              {/* Status Badge */}
              <div>
                {taxStatus.loading ? (
                  <Badge variant="secondary" className="gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading...
                  </Badge>
                ) : taxStatus.hasCountryJurisdiction ? (
                  <Badge className="gap-1 bg-success-muted text-success-muted-foreground hover:bg-success-muted">
                    <CheckCircle2 className="h-3 w-3" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Setup Required
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* No Country Configured Banner */}
        {!storeSettings.loading && !storeSettings.country && (
          <div className="bg-amber-50 rounded-xl border-2 border-amber-200 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">Select Your Store Location</h3>
                <p className="text-muted-foreground mt-1">
                  Choose your store's country to get the appropriate tax configuration recommendations.
                  Currency and timezone will be automatically set based on your selection.
                </p>

                <div className="mt-4 flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[200px] max-w-[300px]">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Store Country
                    </label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your country" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCountries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            <span className="flex items-center gap-2">
                              <span>{country.flag}</span>
                              <span>{country.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleSaveCountry}
                    disabled={!selectedCountry || isSavingCountry}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    {isSavingCountry ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Set Location
                      </>
                    )}
                  </Button>
                </div>

                {selectedCountry && (
                  <div className="mt-3 text-sm text-amber-700">
                    <Info className="h-4 w-4 inline mr-1" />
                    Currency will be set to <strong>{countryCurrencyMap[selectedCountry] || 'USD'}</strong> and
                    timezone to <strong>{countryTimezoneMap[selectedCountry] || 'UTC'}</strong>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-amber-200">
                  <p className="text-xs text-muted-foreground">
                    Or configure full address in{' '}
                    <Link href="/settings/general" className="text-amber-600 hover:text-amber-700 underline">
                      General Settings
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Setup Card - Show for India */}
        {isIndiaStore && needsSetup && !setupSuccess && !storeSettings.loading && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    {countryConfig?.flag} Set Up India GST
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Your store is located in India. Set up GST to enable automatic tax calculation
                    for CGST, SGST (intrastate), and IGST (interstate) transactions.
                  </p>
                </div>
              </div>

              {/* Setup Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GSTIN Input */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    GSTIN (Optional)
                  </label>
                  <Input
                    value={gstin}
                    onChange={(e) => handleGstinChange(e.target.value)}
                    placeholder="27AABCU9603R1ZM"
                    maxLength={15}
                    className={`uppercase tracking-wider ${gstinError ? 'border-red-500' : ''}`}
                  />
                  {gstinError ? (
                    <p className="text-sm text-error mt-1">{gstinError}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      15-character GST ID. State will be auto-detected.
                    </p>
                  )}
                </div>

                {/* State Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Business State/UT
                  </label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIA_STATES.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name} ({state.stateCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    CGST+SGST rates will be created for this state.
                  </p>
                </div>
              </div>

              {/* GST Slabs */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  GST Slabs to Configure
                </label>
                <div className="flex flex-wrap gap-3">
                  {[5, 12, 18, 28].map((slab) => (
                    <label
                      key={slab}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedGstSlabs.includes(slab)
                          ? 'bg-orange-100 border-orange-500 text-orange-700'
                          : 'bg-card border-border text-muted-foreground hover:border-border'
                      }`}
                    >
                      <Checkbox
                        checked={selectedGstSlabs.includes(slab)}
                        onCheckedChange={() => toggleGstSlab(slab)}
                      />
                      <span className="font-medium">{slab}% GST</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Setup Progress */}
              {isSettingUp && (
                <div className="mt-6 p-4 bg-card rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                    <span className="text-sm font-medium text-foreground">{setupStep}</span>
                  </div>
                  <Progress value={setupProgress} className="h-2" />
                </div>
              )}

              {/* Error Message */}
              {setupError && (
                <div className="mt-4 p-4 bg-error-muted rounded-lg border border-error/30">
                  <p className="text-sm text-error">{setupError}</p>
                </div>
              )}

              {/* Setup Button */}
              <div className="mt-6 flex items-center gap-4">
                <Button
                  onClick={handleIndiaGSTSetup}
                  disabled={isSettingUp || selectedGstSlabs.length === 0}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                >
                  {isSettingUp ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Set Up India GST
                    </>
                  )}
                </Button>

                <div className="text-sm text-muted-foreground">
                  Creates: 1 country + 36 states + {selectedGstSlabs.length * 3} IGST rates + {selectedGstSlabs.length * 2} CGST/SGST rates
                </div>
              </div>

              {/* Help Links */}
              <div className="mt-6 pt-6 border-t border-orange-200">
                <p className="text-sm font-medium text-foreground mb-2">Useful Resources</p>
                <div className="flex flex-wrap gap-3">
                  {countryConfig?.helpLinks.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Setup Card - US Sales Tax */}
        {isUSStore && needsSetup && !setupSuccess && !storeSettings.loading && (
          <div className="bg-muted rounded-xl border-2 border-primary/30 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    🇺🇸 Set Up US Sales Tax
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Configure state-level sales tax with nexus tracking. Tax rates vary by state.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Business State
                  </label>
                  <Select value={usBusinessState} onValueChange={setUsBusinessState}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_CONFIGURATIONS.US?.states.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isSettingUp && (
                <div className="mt-6 p-4 bg-card rounded-lg border border-primary/30">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm font-medium text-foreground">{setupStep}</span>
                  </div>
                  <Progress value={setupProgress} className="h-2" />
                </div>
              )}

              {setupError && (
                <div className="mt-4 p-4 bg-error-muted rounded-lg border border-error/30">
                  <p className="text-sm text-error">{setupError}</p>
                </div>
              )}

              <div className="mt-6">
                <Button
                  onClick={handleUSSalesTaxSetup}
                  disabled={isSettingUp}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                >
                  {isSettingUp ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Set Up US Sales Tax
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Setup Card - UK VAT */}
        {isUKStore && needsSetup && !setupSuccess && !storeSettings.loading && (
          <div className="bg-gradient-to-r from-red-50 to-blue-50 rounded-xl border-2 border-red-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-blue-500 text-white">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    🇬🇧 Set Up UK VAT
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Configure UK Value Added Tax with standard (20%) and reduced (5%) rates for all regions.
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-4 mb-6">
                <h3 className="text-sm font-medium text-foreground mb-2">What will be created:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• UK country jurisdiction with England, Scotland, Wales, Northern Ireland</li>
                  <li>• Standard VAT rate: 20%</li>
                  <li>• Reduced VAT rate: 5%</li>
                </ul>
              </div>

              {isSettingUp && (
                <div className="mt-6 p-4 bg-card rounded-lg border border-red-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="h-5 w-5 animate-spin text-error" />
                    <span className="text-sm font-medium text-foreground">{setupStep}</span>
                  </div>
                  <Progress value={setupProgress} className="h-2" />
                </div>
              )}

              {setupError && (
                <div className="mt-4 p-4 bg-error-muted rounded-lg border border-error/30">
                  <p className="text-sm text-error">{setupError}</p>
                </div>
              )}

              <div className="mt-6">
                <Button
                  onClick={handleUKVATSetup}
                  disabled={isSettingUp}
                  className="bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600"
                >
                  {isSettingUp ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Set Up UK VAT
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Setup Card - Australia GST */}
        {isAustraliaStore && needsSetup && !setupSuccess && !storeSettings.loading && (
          <div className="bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl border-2 border-green-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-yellow-500 text-white">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    🇦🇺 Set Up Australia GST
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Configure Australian Goods and Services Tax at 10% for all states and territories.
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-4 mb-6">
                <h3 className="text-sm font-medium text-foreground mb-2">What will be created:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Australia country jurisdiction with all 8 states/territories</li>
                  <li>• GST rate: 10%</li>
                  <li>• Applied to products and shipping</li>
                </ul>
              </div>

              {isSettingUp && (
                <div className="mt-6 p-4 bg-card rounded-lg border border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="h-5 w-5 animate-spin text-success" />
                    <span className="text-sm font-medium text-foreground">{setupStep}</span>
                  </div>
                  <Progress value={setupProgress} className="h-2" />
                </div>
              )}

              {setupError && (
                <div className="mt-4 p-4 bg-error-muted rounded-lg border border-error/30">
                  <p className="text-sm text-error">{setupError}</p>
                </div>
              )}

              <div className="mt-6">
                <Button
                  onClick={handleAustraliaGSTSetup}
                  disabled={isSettingUp}
                  className="bg-gradient-to-r from-green-500 to-yellow-500 hover:from-green-600 hover:to-yellow-600"
                >
                  {isSettingUp ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Set Up Australia GST
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Setup Card - Canada Tax */}
        {isCanadaStore && needsSetup && !setupSuccess && !storeSettings.loading && (
          <div className="bg-gradient-to-r from-red-50 to-white rounded-xl border-2 border-red-200 shadow-sm overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    🇨🇦 Set Up Canada Taxes
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Configure Canadian taxes including Federal GST (5%) and Provincial HST/PST rates.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Business Province
                  </label>
                  <Select value={caBusinessProvince} onValueChange={setCaBusinessProvince}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_CONFIGURATIONS.CA?.states.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-4 mt-4">
                <h3 className="text-sm font-medium text-foreground mb-2">What will be created:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Canada country jurisdiction with all provinces/territories</li>
                  <li>• Federal GST: 5%</li>
                  <li>• Provincial HST/PST rates based on province</li>
                </ul>
              </div>

              {isSettingUp && (
                <div className="mt-6 p-4 bg-card rounded-lg border border-red-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="h-5 w-5 animate-spin text-error" />
                    <span className="text-sm font-medium text-foreground">{setupStep}</span>
                  </div>
                  <Progress value={setupProgress} className="h-2" />
                </div>
              )}

              {setupError && (
                <div className="mt-4 p-4 bg-error-muted rounded-lg border border-error/30">
                  <p className="text-sm text-error">{setupError}</p>
                </div>
              )}

              <div className="mt-6">
                <Button
                  onClick={handleCanadaTaxSetup}
                  disabled={isSettingUp}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  {isSettingUp ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Set Up Canada Taxes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {setupSuccess && (
          <div className="bg-success-muted rounded-xl border-2 border-success/30 p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-full bg-success-muted">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-success">
                  {countryConfig?.flag} {countryConfig?.taxTypeLabel || 'Tax'} Setup Complete!
                </h3>
                <p className="text-success mt-1">
                  Created {setupSuccess.jurisdictions} jurisdictions and {setupSuccess.rates} tax rates.
                </p>
                <div className="mt-4 flex gap-3">
                  <Link href="/settings/taxes/jurisdictions">
                    <Button variant="outline" size="sm">
                      View Jurisdictions
                    </Button>
                  </Link>
                  <Link href="/settings/taxes/rates">
                    <Button variant="outline" size="sm">
                      View Tax Rates
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Jurisdictions Card */}
          <Link
            href="/settings/taxes/jurisdictions"
            className="group bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <Globe className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-muted-foreground group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Tax Jurisdictions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage tax regions including countries, states, counties, and cities.
              </p>
              <div className="flex items-center justify-between">
                <Badge
                  variant={taxStatus.jurisdictionsCount > 0 ? 'default' : 'secondary'}
                  className={taxStatus.jurisdictionsCount > 0 ? 'bg-primary/20 text-primary hover:bg-primary/20' : ''}
                >
                  {taxStatus.loading ? '...' : `${taxStatus.jurisdictionsCount} active`}
                </Badge>
                {taxStatus.hasCountryJurisdiction && (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                )}
              </div>
            </div>
          </Link>

          {/* Tax Rates Card */}
          <Link
            href="/settings/taxes/rates"
            className="group bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            <div className="h-2 bg-gradient-to-r from-green-500 to-green-600" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <Percent className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-muted-foreground group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Tax Rates</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure tax rates for each jurisdiction with effective dates.
              </p>
              <div className="flex items-center justify-between">
                <Badge
                  variant={taxStatus.ratesCount > 0 ? 'default' : 'secondary'}
                  className={taxStatus.ratesCount > 0 ? 'bg-success-muted text-success-muted-foreground hover:bg-success-muted' : ''}
                >
                  {taxStatus.loading ? '...' : `${taxStatus.ratesCount} rates`}
                </Badge>
                {taxStatus.ratesCount > 0 && (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                )}
              </div>
            </div>
          </Link>

          {/* Exemptions Card */}
          <Link
            href="/settings/taxes/exemptions"
            className="group bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <FileCheck className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-muted-foreground group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Tax Exemptions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage customer tax exemption certificates for B2B.
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {taxStatus.loading ? '...' : `${taxStatus.exemptionsCount} certificates`}
                </Badge>
              </div>
            </div>
          </Link>
        </div>

        {/* Global Tax Coverage - Collapsible */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <button
            onClick={() => setShowGlobalCoverage(!showGlobalCoverage)}
            className="w-full px-6 py-4 border-b border-border bg-gradient-to-r from-gray-50 to-white flex items-center justify-between hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-primary" />
              <div className="text-left">
                <h2 className="text-lg font-semibold text-foreground">Global Tax Coverage</h2>
                <p className="text-sm text-muted-foreground">
                  Pre-configured tax rates for major regions
                </p>
              </div>
            </div>
            {showGlobalCoverage ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {showGlobalCoverage && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">
                      Tax Slabs
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {taxFeatures.map((feature, index) => (
                    <tr key={index} className="hover:bg-muted transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-foreground">{feature.region}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {feature.details}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                          {feature.slabs}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="bg-muted rounded-xl border border-primary/30 p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/20">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">How Tax Calculation Works</h3>
              <p className="text-sm text-foreground">
                Tax is automatically calculated based on customer's shipping address and your tax configuration.
                For India: Intrastate sales apply CGST + SGST, while interstate sales apply IGST.
                The system supports compound taxes (Quebec QST), effective date ranges, and category-specific overrides.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PermissionGate>
  );
}
