'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Save, Loader2, Building, MapPin, Key, CheckCircle, XCircle, RefreshCw, Shield } from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { useDialog } from '@/contexts/DialogContext';
import { StoreSelector } from '@/components/settings/StoreSelector';
import { settingsService } from '@/lib/services/settingsService';
import { storefrontService } from '@/lib/services/storefrontService';
import { shippingService } from '@/lib/api/shipping';
import type { Storefront } from '@/lib/api/types';

interface CarrierConfig {
  id?: string;
  carrierType: string;
  displayName: string;
  isEnabled: boolean;
  isTestMode: boolean;
  hasCredentials: boolean;
  logoUrl?: string;
}

interface ShippingSettings {
  preferredCarrierType?: string;
  fallbackCarrierType?: string;
  handlingFeePercent?: number;
  handlingFee?: number;
}

const DEFAULT_SHIPPING_DATA = {
  general: { enabled: true, enableLocalDelivery: true, enableStorePickup: true, enableInternational: true, defaultMethod: 'standard' },
  calculation: { calculationMethod: 'weight_based', includeVirtualItems: false, combineShipping: true, useHighestRate: false },
  freeShipping: { enabled: true, threshold: 75, excludeDiscountedAmount: false, applicableCountries: ['US', 'CA'], requireCouponCode: false },
  tracking: { enabled: true, autoSendTracking: true, trackingUrlTemplate: 'https://track.example.com/{tracking_number}', enableDeliveryConfirmation: true },
  warehouse: {
    name: '',
    company: '',
    phone: '',
    email: '',
    street: '',
    street2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US',
  },
};

export default function ShippingSettingsPage() {
  const { showSuccess, showError } = useDialog();

  // Storefront state
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);

  // Settings state
  const [shippingData, setShippingData] = useState(DEFAULT_SHIPPING_DATA);
  const [savedData, setSavedData] = useState(DEFAULT_SHIPPING_DATA);
  const [existingEcommerce, setExistingEcommerce] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  // Carrier configuration state
  const [carrierConfigs, setCarrierConfigs] = useState<CarrierConfig[]>([]);
  const [carrierSettings, setCarrierSettings] = useState<ShippingSettings>({});
  const [loadingCarriers, setLoadingCarriers] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [savingCarrier, setSavingCarrier] = useState<string | null>(null);

  // Carrier credentials input state
  const [delhiveryToken, setDelhiveryToken] = useState('');
  const [delhiveryPickupLocation, setDelhiveryPickupLocation] = useState('');
  const [shiprocketEmail, setShiprocketEmail] = useState('');
  const [shiprocketPassword, setShiprocketPassword] = useState('');

  // Load storefronts on mount
  useEffect(() => {
    loadStorefronts();
  }, []);

  // Load settings when storefront changes
  useEffect(() => {
    if (selectedStorefront) {
      loadSettings(selectedStorefront.id);
      loadCarrierConfigs();
    }
  }, [selectedStorefront?.id]);

  const loadCarrierConfigs = async () => {
    try {
      setLoadingCarriers(true);
      // Fetch carrier configs from shipping service
      const response = await fetch('/api/shipping/carrier-configs', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCarrierConfigs(data.data || data || []);
      }

      // Also fetch shipping settings for preferred/fallback
      const settingsResponse = await fetch('/api/shipping/shipping-settings', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setCarrierSettings(settingsData.data || settingsData || {});
      }
    } catch (error) {
      console.error('Failed to load carrier configs:', error);
    } finally {
      setLoadingCarriers(false);
    }
  };

  const saveCarrierCredentials = async (carrierType: string) => {
    try {
      setSavingCarrier(carrierType);

      let credentials: Record<string, string> = {};
      if (carrierType === 'DELHIVERY') {
        credentials = {
          api_token: delhiveryToken,
          pickup_location: delhiveryPickupLocation || 'Primary',
        };
      } else if (carrierType === 'SHIPROCKET') {
        credentials = {
          email: shiprocketEmail,
          password: shiprocketPassword,
        };
      }

      // Check if carrier already exists
      const existingCarrier = carrierConfigs.find(c => c.carrierType === carrierType);

      if (existingCarrier?.id) {
        // Update existing carrier
        await fetch(`/api/shipping/carrier-configs/${existingCarrier.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credentials, isEnabled: true }),
        });
      } else {
        // Create new carrier from template
        await fetch(`/api/shipping/carrier-configs/from-template/${carrierType}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...credentials, isTestMode: false }),
        });
      }

      showSuccess('Success', `${carrierType} credentials saved successfully!`);
      await loadCarrierConfigs();

      // Clear input fields
      if (carrierType === 'DELHIVERY') {
        setDelhiveryToken('');
        setDelhiveryPickupLocation('');
      } else {
        setShiprocketEmail('');
        setShiprocketPassword('');
      }
    } catch (error) {
      console.error('Failed to save carrier credentials:', error);
      showError('Error', `Failed to save ${carrierType} credentials`);
    } finally {
      setSavingCarrier(null);
    }
  };

  const testCarrierConnection = async (carrierId: string, carrierType: string) => {
    try {
      setTestingConnection(carrierType);
      const response = await fetch(`/api/shipping/carrier-configs/${carrierId}/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.valid || data.success) {
        showSuccess('Connection Successful', `${carrierType} API connection is working!`);
      } else {
        showError('Connection Failed', data.message || `Failed to connect to ${carrierType}`);
      }
    } catch (error) {
      showError('Connection Failed', `Failed to test ${carrierType} connection`);
    } finally {
      setTestingConnection(null);
    }
  };

  const saveCarrierPriority = async () => {
    try {
      setSaving(true);
      await fetch('/api/shipping/shipping-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredCarrierType: carrierSettings.preferredCarrierType,
          fallbackCarrierType: carrierSettings.fallbackCarrierType,
          handlingFeePercent: carrierSettings.handlingFeePercent,
        }),
      });
      showSuccess('Success', 'Carrier priority settings saved!');
    } catch (error) {
      showError('Error', 'Failed to save carrier priority settings');
    } finally {
      setSaving(false);
    }
  };

  const getCarrierStatus = (carrierType: string) => {
    const config = carrierConfigs.find(c => c.carrierType === carrierType);
    if (!config) return { configured: false, enabled: false };
    return { configured: config.hasCredentials, enabled: config.isEnabled, id: config.id };
  };

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

      if (settings?.ecommerce?.shipping) {
        // Merge with defaults to handle missing fields (like warehouse if it wasn't set before)
        const loadedShipping = settings.ecommerce.shipping as Record<string, any>;
        const mergedData = {
          ...DEFAULT_SHIPPING_DATA,
          general: { ...DEFAULT_SHIPPING_DATA.general, ...loadedShipping.general },
          calculation: { ...DEFAULT_SHIPPING_DATA.calculation, ...loadedShipping.calculation },
          freeShipping: { ...DEFAULT_SHIPPING_DATA.freeShipping, ...loadedShipping.freeShipping },
          tracking: { ...DEFAULT_SHIPPING_DATA.tracking, ...loadedShipping.tracking },
          warehouse: { ...DEFAULT_SHIPPING_DATA.warehouse, ...(loadedShipping.warehouse || {}) },
        };
        setShippingData(mergedData);
        setSavedData(mergedData);
        setSettingsId(settings.id);
      } else {
        setShippingData(DEFAULT_SHIPPING_DATA);
        setSavedData(DEFAULT_SHIPPING_DATA);
        setSettingsId(settings?.id || null);
      }
    } catch (error) {
      console.error('Failed to load shipping settings:', error);
      setShippingData(DEFAULT_SHIPPING_DATA);
      setSavedData(DEFAULT_SHIPPING_DATA);
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
        shipping: shippingData,
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
      setSavedData(shippingData);
      showSuccess('Success', 'Shipping settings saved successfully!');
    } catch (error) {
      console.error('Failed to save shipping settings:', error);
      showError('Error', 'Failed to save shipping settings');
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

  const hasChanges = JSON.stringify(shippingData) !== JSON.stringify(savedData);

  const updateField = (path: string[], value: any) => {
    setShippingData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) current = current[path[i]];
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
          title="Shipping Settings"
          description="Configure shipping methods, zones, and tracking"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Ecommerce' },
            { label: 'Shipping' },
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
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-violet-100 rounded-lg flex items-center justify-center">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">General Settings</h3>
                  <p className="text-sm text-muted-foreground">Enable shipping options</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Checkbox checked={shippingData.general.enabled} onChange={(e) => updateField(['general', 'enabled'], e.target.checked)} label="Enable Shipping" description="Offer shipping to customers" />
                <Checkbox checked={shippingData.general.enableLocalDelivery} onChange={(e) => updateField(['general', 'enableLocalDelivery'], e.target.checked)} label="Local Delivery" description="Same-day local delivery" />
                <Checkbox checked={shippingData.general.enableStorePickup} onChange={(e) => updateField(['general', 'enableStorePickup'], e.target.checked)} label="Store Pickup" description="In-store pickup option" />
                <Checkbox checked={shippingData.general.enableInternational} onChange={(e) => updateField(['general', 'enableInternational'], e.target.checked)} label="International Shipping" description="Ship outside your country" />
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                  <Truck className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Calculation Method</h3>
                  <p className="text-sm text-muted-foreground">How to calculate shipping costs</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Calculation Method</label>
                  <Select value={shippingData.calculation.calculationMethod} onChange={(value) => updateField(['calculation', 'calculationMethod'], value)} options={[
                    { value: 'flat_rate', label: 'Flat Rate' },
                    { value: 'weight_based', label: 'Weight Based' },
                    { value: 'price_based', label: 'Price Based' },
                    { value: 'dimensional', label: 'Dimensional Weight' },
                  ]} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Checkbox checked={shippingData.calculation.combineShipping} onChange={(e) => updateField(['calculation', 'combineShipping'], e.target.checked)} label="Combine Shipping" description="Single rate for multiple items" />
                  <Checkbox checked={shippingData.calculation.useHighestRate} onChange={(e) => updateField(['calculation', 'useHighestRate'], e.target.checked)} label="Use Highest Rate" description="When combining shipping" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Free Shipping</h3>
                  <p className="text-sm text-muted-foreground">Configure free shipping thresholds</p>
                </div>
              </div>
              <div className="space-y-4">
                <Checkbox checked={shippingData.freeShipping.enabled} onChange={(e) => updateField(['freeShipping', 'enabled'], e.target.checked)} label="Enable Free Shipping" description="Offer free shipping on qualifying orders" />
                {shippingData.freeShipping.enabled && (
                  <div className="ml-6 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Free Shipping Threshold ($)</label>
                      <Input type="number" min="0" step="5" value={shippingData.freeShipping.threshold} onChange={(e) => updateField(['freeShipping', 'threshold'], parseFloat(e.target.value))} />
                    </div>
                    <Checkbox checked={shippingData.freeShipping.excludeDiscountedAmount} onChange={(e) => updateField(['freeShipping', 'excludeDiscountedAmount'], e.target.checked)} label="Exclude Discounted Amount" description="Calculate before discounts applied" />
                    <Checkbox checked={shippingData.freeShipping.requireCouponCode} onChange={(e) => updateField(['freeShipping', 'requireCouponCode'], e.target.checked)} label="Require Coupon Code" description="Must use free shipping coupon" />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                  <Truck className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Tracking</h3>
                  <p className="text-sm text-muted-foreground">Shipment tracking configuration</p>
                </div>
              </div>
              <div className="space-y-4">
                <Checkbox checked={shippingData.tracking.enabled} onChange={(e) => updateField(['tracking', 'enabled'], e.target.checked)} label="Enable Tracking" description="Provide tracking numbers to customers" />
                {shippingData.tracking.enabled && (
                  <div className="ml-6 space-y-4">
                    <Checkbox checked={shippingData.tracking.autoSendTracking} onChange={(e) => updateField(['tracking', 'autoSendTracking'], e.target.checked)} label="Auto-Send Tracking" description="Email tracking info automatically" />
                    <Checkbox checked={shippingData.tracking.enableDeliveryConfirmation} onChange={(e) => updateField(['tracking', 'enableDeliveryConfirmation'], e.target.checked)} label="Delivery Confirmation" description="Require signature on delivery" />
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Tracking URL Template</label>
                      <Input value={shippingData.tracking.trackingUrlTemplate} onChange={(e) => updateField(['tracking', 'trackingUrlTemplate'], e.target.value)} placeholder="https://track.example.com/{tracking_number}" />
                      <p className="text-xs text-muted-foreground mt-1">Use {'{tracking_number}'} as placeholder</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Warehouse / Ship From Address</h3>
                  <p className="text-sm text-muted-foreground">Default origin address for shipments</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Contact Name *</label>
                    <Input
                      value={shippingData.warehouse?.name || ''}
                      onChange={(e) => updateField(['warehouse', 'name'], e.target.value)}
                      placeholder="Warehouse Manager"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Company Name</label>
                    <Input
                      value={shippingData.warehouse?.company || ''}
                      onChange={(e) => updateField(['warehouse', 'company'], e.target.value)}
                      placeholder="Your Company"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Street Address *</label>
                  <Input
                    value={shippingData.warehouse?.street || ''}
                    onChange={(e) => updateField(['warehouse', 'street'], e.target.value)}
                    placeholder="123 Warehouse Street"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Street Address 2</label>
                  <Input
                    value={shippingData.warehouse?.street2 || ''}
                    onChange={(e) => updateField(['warehouse', 'street2'], e.target.value)}
                    placeholder="Suite, Unit, Building (optional)"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">City *</label>
                    <Input
                      value={shippingData.warehouse?.city || ''}
                      onChange={(e) => updateField(['warehouse', 'city'], e.target.value)}
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">State *</label>
                    <Input
                      value={shippingData.warehouse?.state || ''}
                      onChange={(e) => updateField(['warehouse', 'state'], e.target.value)}
                      placeholder="NY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Postal Code *</label>
                    <Input
                      value={shippingData.warehouse?.postalCode || ''}
                      onChange={(e) => updateField(['warehouse', 'postalCode'], e.target.value)}
                      placeholder="10001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Country *</label>
                    <Input
                      value={shippingData.warehouse?.country || ''}
                      onChange={(e) => updateField(['warehouse', 'country'], e.target.value)}
                      placeholder="US"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Phone *</label>
                    <Input
                      value={shippingData.warehouse?.phone || ''}
                      onChange={(e) => updateField(['warehouse', 'phone'], e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Email *</label>
                    <Input
                      type="email"
                      value={shippingData.warehouse?.email || ''}
                      onChange={(e) => updateField(['warehouse', 'email'], e.target.value)}
                      placeholder="warehouse@yourstore.com"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg text-sm text-primary">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>This address will be used as the default &quot;Ship From&quot; address when creating shipments for orders.</span>
                </div>
              </div>
            </div>

            {/* Shipping Carriers Configuration */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                  <Key className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Shipping Carriers</h3>
                  <p className="text-sm text-muted-foreground">Configure carrier API credentials and priority</p>
                </div>
              </div>

              {loadingCarriers ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 text-emerald-500 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading carrier configurations...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Delhivery Configuration */}
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
                          <Truck className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Delhivery</h4>
                          <p className="text-sm text-muted-foreground">Primary carrier for India</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCarrierStatus('DELHIVERY').configured ? (
                          <span className="flex items-center gap-1 text-sm text-success bg-success-muted px-2 py-1 rounded-full">
                            <CheckCircle className="h-4 w-4" />
                            Configured
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            <XCircle className="h-4 w-4" />
                            Not configured
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">API Token *</label>
                        <Input
                          type="password"
                          value={delhiveryToken}
                          onChange={(e) => setDelhiveryToken(e.target.value)}
                          placeholder="Enter Delhivery API token"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Pickup Location Code</label>
                        <Input
                          value={delhiveryPickupLocation}
                          onChange={(e) => setDelhiveryPickupLocation(e.target.value)}
                          placeholder="Primary (default)"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveCarrierCredentials('DELHIVERY')}
                          disabled={!delhiveryToken || savingCarrier === 'DELHIVERY'}
                          className="bg-destructive hover:bg-destructive text-white"
                        >
                          {savingCarrier === 'DELHIVERY' ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save Credentials
                        </Button>
                        {getCarrierStatus('DELHIVERY').id && (
                          <Button
                            variant="outline"
                            onClick={() => testCarrierConnection(getCarrierStatus('DELHIVERY').id!, 'DELHIVERY')}
                            disabled={testingConnection === 'DELHIVERY'}
                          >
                            {testingConnection === 'DELHIVERY' ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Test Connection
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shiprocket Configuration */}
                  <div className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Truck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">Shiprocket</h4>
                          <p className="text-sm text-muted-foreground">Fallback carrier with 17+ courier partners</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCarrierStatus('SHIPROCKET').configured ? (
                          <span className="flex items-center gap-1 text-sm text-success bg-success-muted px-2 py-1 rounded-full">
                            <CheckCircle className="h-4 w-4" />
                            Configured
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            <XCircle className="h-4 w-4" />
                            Not configured
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
                        <Input
                          type="email"
                          value={shiprocketEmail}
                          onChange={(e) => setShiprocketEmail(e.target.value)}
                          placeholder="Enter Shiprocket email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Password *</label>
                        <Input
                          type="password"
                          value={shiprocketPassword}
                          onChange={(e) => setShiprocketPassword(e.target.value)}
                          placeholder="Enter Shiprocket password"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveCarrierCredentials('SHIPROCKET')}
                          disabled={!shiprocketEmail || !shiprocketPassword || savingCarrier === 'SHIPROCKET'}
                          className="bg-primary hover:bg-primary text-white"
                        >
                          {savingCarrier === 'SHIPROCKET' ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save Credentials
                        </Button>
                        {getCarrierStatus('SHIPROCKET').id && (
                          <Button
                            variant="outline"
                            onClick={() => testCarrierConnection(getCarrierStatus('SHIPROCKET').id!, 'SHIPROCKET')}
                            disabled={testingConnection === 'SHIPROCKET'}
                          >
                            {testingConnection === 'SHIPROCKET' ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Test Connection
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Carrier Priority Settings */}
                  <div className="border-t border-border pt-6 mt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-foreground">Carrier Priority</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Primary Carrier</label>
                        <Select
                          value={carrierSettings.preferredCarrierType || 'DELHIVERY'}
                          onChange={(value) => setCarrierSettings({ ...carrierSettings, preferredCarrierType: value })}
                          options={[
                            { value: 'DELHIVERY', label: 'Delhivery (Recommended)' },
                            { value: 'SHIPROCKET', label: 'Shiprocket' },
                          ]}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Used first for all shipments</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Fallback Carrier</label>
                        <Select
                          value={carrierSettings.fallbackCarrierType || 'SHIPROCKET'}
                          onChange={(value) => setCarrierSettings({ ...carrierSettings, fallbackCarrierType: value })}
                          options={[
                            { value: 'SHIPROCKET', label: 'Shiprocket (Recommended)' },
                            { value: 'DELHIVERY', label: 'Delhivery' },
                          ]}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Used if primary carrier fails</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-foreground mb-2">Shipping Markup (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="500"
                        step="10"
                        value={(carrierSettings.handlingFeePercent || 1.5) * 100}
                        onChange={(e) => setCarrierSettings({ ...carrierSettings, handlingFeePercent: parseFloat(e.target.value) / 100 })}
                        className="w-32"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Markup added to carrier rates (150% recommended to cover GST & handling)</p>
                    </div>
                    <Button
                      onClick={saveCarrierPriority}
                      disabled={saving}
                      className="mt-4 bg-primary hover:bg-primary text-white"
                    >
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Priority Settings
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          )
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Create Your First Storefront
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by creating a storefront to configure shipping settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
