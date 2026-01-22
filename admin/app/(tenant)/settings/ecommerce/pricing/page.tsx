'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Save, Globe, Percent, Loader2 } from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { StoreSelector } from '@/components/settings/StoreSelector';
import { settingsService } from '@/lib/services/settingsService';
import { storefrontService } from '@/lib/services/storefrontService';
import type { Storefront } from '@/lib/api/types';
import type { PricingSettings } from '@/lib/types/settings';
import { useDialog } from '@/contexts/DialogContext';

const defaultPricingData: PricingSettings = {
  display: {
    showPrices: true,
    requireLoginForPrices: false,
    showCompareAtPrices: true,
    showSavingsAmount: true,
    showSavingsPercentage: true,
    priceFormat: '${amount}',
    showPricesWithTax: false,
    showBothPrices: true,
  },
  tax: {
    enabled: true,
    calculation: 'exclusive',
    defaultRate: 8.25,
    compoundTax: false,
    taxShipping: false,
    digitalGoodsTax: true,
    exemptRoles: ['wholesale', 'tax_exempt'],
  },
  rounding: {
    strategy: 'round',
    precision: 2,
    roundToNearest: 0.01,
  },
  discounts: {
    enableCoupons: true,
    enableAutomaticDiscounts: true,
    enableBulkPricing: true,
    enableTieredPricing: true,
    maxDiscountPercent: 50,
    stackableDiscounts: false,
  },
  currencies: {
    primary: 'USD',
    supported: ['USD', 'EUR', 'GBP', 'CAD'],
    autoConversion: true,
    conversionProvider: 'fixer',
    conversionMarkup: 2.5,
  },
};

export default function PricingSettingsPage() {
  const { showSuccess, showError } = useDialog();

  // Storefront state
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);

  // Settings state
  const [pricingData, setPricingData] = useState<PricingSettings>(defaultPricingData);
  const [savedData, setSavedData] = useState<PricingSettings>(defaultPricingData);
  const [existingEcommerce, setExistingEcommerce] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

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
    } catch (error) {
      console.error('Failed to load storefronts:', error);
    } finally {
      setLoadingStorefronts(false);
    }
  };

  // Deep merge function to ensure all nested properties exist
  const deepMerge = (defaults: any, override: any): any => {
    if (!override) return defaults;
    const result = { ...defaults };
    for (const key of Object.keys(defaults)) {
      if (override[key] !== undefined) {
        if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key])) {
          result[key] = deepMerge(defaults[key], override[key]);
        } else {
          result[key] = override[key];
        }
      }
    }
    return result;
  };

  const loadSettings = async (storefrontId: string) => {
    try {
      setLoading(true);
      const settings = await settingsService.getSettingsByContext({
        applicationId: 'admin-portal',
        scope: 'application',
        tenantId: storefrontId,
      });

      // Store the full ecommerce object to preserve other sections when saving
      if (settings?.ecommerce) {
        setExistingEcommerce(settings.ecommerce);
      } else {
        setExistingEcommerce({});
      }

      if (settings?.ecommerce?.pricing) {
        // Deep merge with defaults to ensure all nested properties exist
        const mergedData = deepMerge(defaultPricingData, settings.ecommerce.pricing);
        setPricingData(mergedData);
        setSavedData(mergedData);
        setSettingsId(settings.id);
      } else {
        setPricingData(defaultPricingData);
        setSavedData(defaultPricingData);
        setSettingsId(settings?.id || null);
      }
    } catch (error) {
      console.error('Failed to load pricing settings:', error);
      setPricingData(defaultPricingData);
      setSavedData(defaultPricingData);
      setExistingEcommerce({});
      setSettingsId(null);
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
      setSaving(true);
      // Merge current section with existing ecommerce data to preserve other sections
      const mergedEcommerce = {
        ...existingEcommerce,
        pricing: pricingData,
      };

      const payload = {
        context: {
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: selectedStorefront.id,
        },
        ecommerce: mergedEcommerce,
      };

      if (settingsId) {
        await settingsService.updateSettings(settingsId, payload as any, selectedStorefront.id);
      } else {
        const newSettings = await settingsService.createSettings(payload as any, selectedStorefront.id);
        setSettingsId(newSettings.id);
      }

      // Update existing ecommerce with the merged data
      setExistingEcommerce(mergedEcommerce);
      setSavedData(pricingData);
      showSuccess('Success', 'Pricing settings saved successfully!');
    } catch (error) {
      console.error('Failed to save pricing settings:', error);
      showError('Error', 'Failed to save pricing settings');
    } finally {
      setSaving(false);
    }
  };

  const handleStorefrontSelect = (storefront: Storefront) => {
    setSelectedStorefront(storefront);
  };

  const handleStorefrontCreated = (storefront: Storefront) => {
    setStorefronts((prev) => [...prev, storefront]);
    setSelectedStorefront(storefront);
  };

  const hasChanges = JSON.stringify(pricingData) !== JSON.stringify(savedData);

  const updateField = (path: string[], value: any) => {
    setPricingData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  // Show loading state
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
          title="Pricing Settings"
          description="Configure pricing display, tax, discounts, and currencies"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Ecommerce' },
            { label: 'Pricing' },
          ]}
          actions={
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving || !selectedStorefront}
              className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          }
        />

        <StoreSelector
          storefronts={storefronts}
          selectedStorefront={selectedStorefront}
          onSelect={handleStorefrontSelect}
          onStorefrontCreated={handleStorefrontCreated}
          loading={loadingStorefronts}
          showQuickActions={false}
          showUrlInfo={false}
        />

        {selectedStorefront ? (
          loading ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          ) : (
          <div className="space-y-6">
            {/* Price Display */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Price Display</h3>
                  <p className="text-sm text-muted-foreground">Configure how prices are shown to customers</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Price Format
                  </label>
                  <Input
                    value={pricingData.display.priceFormat}
                    onChange={(e) => updateField(['display', 'priceFormat'], e.target.value)}
                    placeholder="${amount}"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Use {'{amount}'} for price value</p>
                </div>

                <div className="border border-border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Checkbox
                      checked={pricingData.display.showPrices}
                      onChange={(e) => updateField(['display', 'showPrices'], e.target.checked)}
                      label="Show Prices"
                      description="Display prices on product pages"
                    />
                    <Checkbox
                      checked={pricingData.display.requireLoginForPrices}
                      onChange={(e) => updateField(['display', 'requireLoginForPrices'], e.target.checked)}
                      label="Require Login for Prices"
                      description="B2B mode - hide prices from guests"
                    />
                    <Checkbox
                      checked={pricingData.display.showCompareAtPrices}
                      onChange={(e) => updateField(['display', 'showCompareAtPrices'], e.target.checked)}
                      label="Show Compare At Prices"
                      description="Display original price for discounts"
                    />
                    <Checkbox
                      checked={pricingData.display.showSavingsAmount}
                      onChange={(e) => updateField(['display', 'showSavingsAmount'], e.target.checked)}
                      label="Show Savings Amount"
                      description="Display dollar amount saved"
                    />
                    <Checkbox
                      checked={pricingData.display.showSavingsPercentage}
                      onChange={(e) => updateField(['display', 'showSavingsPercentage'], e.target.checked)}
                      label="Show Savings Percentage"
                      description="Display percentage saved"
                    />
                    <Checkbox
                      checked={pricingData.display.showPricesWithTax}
                      onChange={(e) => updateField(['display', 'showPricesWithTax'], e.target.checked)}
                      label="Show Prices With Tax"
                      description="Include tax in displayed price"
                    />
                    <Checkbox
                      checked={pricingData.display.showBothPrices}
                      onChange={(e) => updateField(['display', 'showBothPrices'], e.target.checked)}
                      label="Show Both Prices"
                      description="Show with and without tax"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tax Settings */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Percent className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Tax Configuration</h3>
                  <p className="text-sm text-muted-foreground">Configure tax calculation and rates</p>
                </div>
              </div>

              <div className="space-y-4">
                <Checkbox
                  checked={pricingData.tax.enabled}
                  onChange={(e) => updateField(['tax', 'enabled'], e.target.checked)}
                  label="Enable Tax Calculation"
                  description="Calculate and apply taxes to orders"
                />

                {pricingData.tax.enabled && (
                  <div className="ml-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Tax Calculation Method
                        </label>
                        <Select
                          value={pricingData.tax.calculation}
                          onChange={(value) => updateField(['tax', 'calculation'], value)}
                          options={[
                            { value: 'inclusive', label: 'Tax Inclusive' },
                            { value: 'exclusive', label: 'Tax Exclusive' },
                          ]}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Default Tax Rate (%)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={pricingData.tax.defaultRate}
                          onChange={(e) => updateField(['tax', 'defaultRate'], parseFloat(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Checkbox
                        checked={pricingData.tax.compoundTax}
                        onChange={(e) => updateField(['tax', 'compoundTax'], e.target.checked)}
                        label="Compound Tax"
                        description="Tax on top of tax (e.g., VAT + GST)"
                      />
                      <Checkbox
                        checked={pricingData.tax.taxShipping}
                        onChange={(e) => updateField(['tax', 'taxShipping'], e.target.checked)}
                        label="Tax Shipping"
                        description="Apply tax to shipping costs"
                      />
                      <Checkbox
                        checked={pricingData.tax.digitalGoodsTax}
                        onChange={(e) => updateField(['tax', 'digitalGoodsTax'], e.target.checked)}
                        label="Digital Goods Tax"
                        description="Apply tax to digital products"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Discounts */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <Percent className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Discount Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure discount and coupon options</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Checkbox
                    checked={pricingData.discounts.enableCoupons}
                    onChange={(e) => updateField(['discounts', 'enableCoupons'], e.target.checked)}
                    label="Enable Coupons"
                    description="Allow coupon code discounts"
                  />
                  <Checkbox
                    checked={pricingData.discounts.enableAutomaticDiscounts}
                    onChange={(e) => updateField(['discounts', 'enableAutomaticDiscounts'], e.target.checked)}
                    label="Automatic Discounts"
                    description="Apply discounts without codes"
                  />
                  <Checkbox
                    checked={pricingData.discounts.enableBulkPricing}
                    onChange={(e) => updateField(['discounts', 'enableBulkPricing'], e.target.checked)}
                    label="Bulk Pricing"
                    description="Volume-based discounts"
                  />
                  <Checkbox
                    checked={pricingData.discounts.enableTieredPricing}
                    onChange={(e) => updateField(['discounts', 'enableTieredPricing'], e.target.checked)}
                    label="Tiered Pricing"
                    description="Customer tier-based pricing"
                  />
                  <Checkbox
                    checked={pricingData.discounts.stackableDiscounts}
                    onChange={(e) => updateField(['discounts', 'stackableDiscounts'], e.target.checked)}
                    label="Stackable Discounts"
                    description="Allow multiple discounts together"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Maximum Discount Percentage
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={pricingData.discounts.maxDiscountPercent}
                    onChange={(e) => updateField(['discounts', 'maxDiscountPercent'], parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Maximum discount allowed per order</p>
                </div>
              </div>
            </div>

            {/* Currency */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Currency Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure multi-currency support</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Primary Currency
                  </label>
                  <Select
                    value={pricingData.currencies.primary}
                    onChange={(value) => updateField(['currencies', 'primary'], value)}
                    options={[
                      { value: 'USD', label: 'USD - US Dollar' },
                      { value: 'EUR', label: 'EUR - Euro' },
                      { value: 'GBP', label: 'GBP - British Pound' },
                      { value: 'CAD', label: 'CAD - Canadian Dollar' },
                      { value: 'AUD', label: 'AUD - Australian Dollar' },
                      { value: 'INR', label: 'INR - Indian Rupee' },
                    ]}
                  />
                </div>

                <Checkbox
                  checked={pricingData.currencies.autoConversion}
                  onChange={(e) => updateField(['currencies', 'autoConversion'], e.target.checked)}
                  label="Enable Auto-Conversion"
                  description="Automatically convert prices to customer's currency"
                />

                {pricingData.currencies.autoConversion && (
                  <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Conversion Provider
                      </label>
                      <Select
                        value={pricingData.currencies.conversionProvider || 'fixer'}
                        onChange={(value) => updateField(['currencies', 'conversionProvider'], value)}
                        options={[
                          { value: 'fixer', label: 'Fixer.io' },
                          { value: 'openexchange', label: 'Open Exchange Rates' },
                          { value: 'currencyapi', label: 'Currency API' },
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Conversion Markup (%)
                      </label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={pricingData.currencies.conversionMarkup || 0}
                        onChange={(e) => updateField(['currencies', 'conversionMarkup'], parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rounding */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-slate-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Price Rounding</h3>
                  <p className="text-sm text-muted-foreground">Configure price rounding strategy</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Rounding Strategy
                  </label>
                  <Select
                    value={pricingData.rounding.strategy}
                    onChange={(value) => updateField(['rounding', 'strategy'], value)}
                    options={[
                      { value: 'round', label: 'Round (Normal)' },
                      { value: 'ceil', label: 'Round Up (Ceiling)' },
                      { value: 'floor', label: 'Round Down (Floor)' },
                      { value: 'nickel', label: 'Nickel Rounding' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Decimal Precision
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="4"
                    value={pricingData.rounding.precision}
                    onChange={(e) => updateField(['rounding', 'precision'], parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Round To Nearest
                  </label>
                  <Select
                    value={pricingData.rounding.roundToNearest.toString()}
                    onChange={(value) => updateField(['rounding', 'roundToNearest'], parseFloat(value))}
                    options={[
                      { value: '0.01', label: '$0.01 (Penny)' },
                      { value: '0.05', label: '$0.05 (Nickel)' },
                      { value: '0.10', label: '$0.10 (Dime)' },
                      { value: '0.25', label: '$0.25 (Quarter)' },
                      { value: '1.00', label: '$1.00 (Dollar)' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
          )
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Create Your First Storefront
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by creating a storefront to configure pricing settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
