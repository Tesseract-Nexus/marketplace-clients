'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Save,
  Loader2,
  Building,
  MapPin,
  Key,
  CheckCircle,
  Settings2,
  Shield,
  Globe,
  Store,
  Package,
} from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/Select';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDialog } from '@/contexts/DialogContext';
import { StoreSelector } from '@/components/settings/StoreSelector';
import {
  ShippingStatusWidget,
  MethodCard,
  CarrierCard,
  CarrierConfigModal,
  CARRIERS,
} from '@/components/settings/shipping';
import { settingsService } from '@/lib/services/settingsService';
import { storefrontService } from '@/lib/services/storefrontService';
import type { Storefront } from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface CarrierConfig {
  id?: string;
  carrierType: string;
  displayName: string;
  isEnabled: boolean;
  isTestMode: boolean;
  hasCredentials: boolean;
}

interface ShippingSettings {
  preferredCarrierType?: string;
  fallbackCarrierType?: string;
  handlingFeePercent?: number;
}

const DEFAULT_SHIPPING_DATA = {
  general: {
    enabled: true,
    enableLocalDelivery: true,
    enableStorePickup: true,
    enableInternational: true,
    defaultMethod: 'standard',
  },
  calculation: {
    calculationMethod: 'weight_based',
    includeVirtualItems: false,
    combineShipping: true,
    useHighestRate: false,
  },
  freeShipping: {
    enabled: true,
    threshold: 75,
    excludeDiscountedAmount: false,
    applicableCountries: ['US', 'CA'],
    requireCouponCode: false,
  },
  tracking: {
    enabled: true,
    autoSendTracking: true,
    trackingUrlTemplate: 'https://track.example.com/{tracking_number}',
    enableDeliveryConfirmation: true,
  },
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

type TabId = 'general' | 'methods' | 'carriers' | 'warehouse' | 'tracking';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'methods', label: 'Methods', icon: Package },
  { id: 'carriers', label: 'Carriers', icon: Key },
  { id: 'warehouse', label: 'Warehouse', icon: Building },
  { id: 'tracking', label: 'Tracking', icon: MapPin },
];

export default function ShippingSettingsPage() {
  const { showSuccess, showError } = useDialog();
  const [activeTab, setActiveTab] = useState<TabId>('general');

  // Storefront state
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);

  // Settings state
  const [shippingData, setShippingData] = useState(DEFAULT_SHIPPING_DATA);
  const [savedData, setSavedData] = useState(DEFAULT_SHIPPING_DATA);
  const [existingEcommerce, setExistingEcommerce] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  // Carrier state
  const [carrierConfigs, setCarrierConfigs] = useState<CarrierConfig[]>([]);
  const [carrierSettings, setCarrierSettings] = useState<ShippingSettings>({});
  const [loadingCarriers, setLoadingCarriers] = useState(false);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [savingCarrier, setSavingCarrier] = useState(false);

  // Modal state
  const [carrierModalOpen, setCarrierModalOpen] = useState(false);
  const [selectedCarrierType, setSelectedCarrierType] = useState<string | null>(null);

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

  const loadCarrierConfigs = async () => {
    try {
      setLoadingCarriers(true);
      const response = await fetch('/api/shipping/carrier-configs');
      if (response.ok) {
        const data = await response.json();
        setCarrierConfigs(data.data || data || []);
      }

      const settingsResponse = await fetch('/api/shipping/shipping-settings');
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

  const loadSettings = async (storefrontId: string) => {
    try {
      setLoading(true);
      const settings = await settingsService.getSettingsByContext({
        applicationId: 'admin-portal',
        scope: 'application',
        tenantId: storefrontId,
      });

      if (settings?.ecommerce) {
        setExistingEcommerce(settings.ecommerce as Record<string, unknown>);
      } else {
        setExistingEcommerce({});
      }

      if (settings?.ecommerce?.shipping) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loadedShipping = settings.ecommerce.shipping as any;
        const mergedData = {
          ...DEFAULT_SHIPPING_DATA,
          general: { ...DEFAULT_SHIPPING_DATA.general, ...(loadedShipping.general || {}) },
          calculation: { ...DEFAULT_SHIPPING_DATA.calculation, ...(loadedShipping.calculation || {}) },
          freeShipping: { ...DEFAULT_SHIPPING_DATA.freeShipping, ...(loadedShipping.freeShipping || {}) },
          tracking: { ...DEFAULT_SHIPPING_DATA.tracking, ...(loadedShipping.tracking || {}) },
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
      const mergedEcommerce = { ...existingEcommerce, shipping: shippingData };
      const payload = {
        context: {
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: selectedStorefront.id,
        },
        ecommerce: mergedEcommerce,
      };

      if (settingsId) {
        await settingsService.updateSettings(settingsId, payload as never, selectedStorefront.id);
      } else {
        const newSettings = await settingsService.createSettings(payload as never, selectedStorefront.id);
        setSettingsId(newSettings.id);
      }

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

  const handleSaveCarrierCredentials = async (
    carrierType: string,
    credentials: Record<string, string>,
    isTestMode: boolean
  ) => {
    try {
      setSavingCarrier(true);
      const existingCarrier = carrierConfigs.find((c) => c.carrierType === carrierType);

      if (existingCarrier?.id) {
        await fetch(`/api/shipping/carrier-configs/${existingCarrier.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credentials, isEnabled: true, isTestMode }),
        });
      } else {
        await fetch(`/api/shipping/carrier-configs/from-template/${carrierType}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...credentials, isTestMode }),
        });
      }

      showSuccess('Success', `${carrierType} credentials saved successfully!`);
      await loadCarrierConfigs();
      setCarrierModalOpen(false);
    } catch (error) {
      console.error('Failed to save carrier credentials:', error);
      showError('Error', `Failed to save ${carrierType} credentials`);
    } finally {
      setSavingCarrier(false);
    }
  };

  const handleTestConnection = async (carrierId: string, carrierType: string) => {
    try {
      setTestingConnection(carrierType);
      const response = await fetch(`/api/shipping/carrier-configs/${carrierId}/test-connection`, {
        method: 'POST',
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
    const config = carrierConfigs.find((c) => c.carrierType === carrierType);
    if (!config) return { configured: false, enabled: false };
    return { configured: config.hasCredentials, enabled: config.isEnabled, id: config.id };
  };

  const updateField = (path: string[], value: unknown) => {
    setShippingData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current = newData;
      for (let i = 0; i < path.length - 1; i++) current = current[path[i]];
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  const hasChanges = JSON.stringify(shippingData) !== JSON.stringify(savedData);

  // Status calculations
  const warehouseConfigured = Boolean(shippingData.warehouse?.street && shippingData.warehouse?.city);
  const carrierConfigured = carrierConfigs.some((c) => c.hasCredentials);

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
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Shipping Settings"
          description="Configure shipping methods, carriers, and tracking"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Ecommerce' },
            { label: 'Shipping' },
          ]}
        />

        <StoreSelector
          storefronts={storefronts}
          selectedStorefront={selectedStorefront}
          onSelect={setSelectedStorefront}
          onStorefrontCreated={(sf) => {
            setStorefronts((prev) => [...prev, sf]);
            setSelectedStorefront(sf);
          }}
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
            <div className="flex gap-6">
              {/* Sidebar */}
              <div className="w-56 flex-shrink-0 hidden lg:block">
                <div className="sticky top-6 space-y-3">
                  <ShippingStatusWidget
                    shippingEnabled={shippingData.general.enabled}
                    warehouseConfigured={warehouseConfigured}
                    carrierConfigured={carrierConfigured}
                    trackingEnabled={shippingData.tracking.enabled}
                  />

                  {/* Quick Links */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => setActiveTab('carriers')}
                    >
                      <Key className="h-3 w-3 mr-1" />
                      Carriers
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => setActiveTab('warehouse')}
                    >
                      <Building className="h-3 w-3 mr-1" />
                      Warehouse
                    </Button>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 min-w-0">
                {/* Mobile Status */}
                <div className="lg:hidden mb-4 bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        carrierConfigured && warehouseConfigured ? 'bg-success/10' : 'bg-warning/10'
                      )}
                    >
                      <Truck
                        className={cn(
                          'h-5 w-5',
                          carrierConfigured && warehouseConfigured ? 'text-success' : 'text-warning'
                        )}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {carrierConfigured && warehouseConfigured ? 'Ready' : 'Setup needed'}
                      </p>
                      <p className="text-xs text-muted-foreground">Shipping status</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Tab Selector */}
                <div className="md:hidden mb-4">
                  <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value as TabId)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-sm font-medium"
                  >
                    {TABS.map((tab) => (
                      <option key={tab.id} value={tab.id}>
                        {tab.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Desktop Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
                  <TabsList className="hidden md:inline-flex h-auto items-center justify-start rounded-xl bg-card border border-border p-1 shadow-sm mb-6">
                    {TABS.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <tab.icon className="h-4 w-4 mr-2" />
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* General Tab */}
                  <TabsContent value="general" className="mt-0">
                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-6">
                      <div>
                        <h2 className="text-lg font-bold text-foreground mb-1">General Settings</h2>
                        <p className="text-sm text-muted-foreground">
                          Enable shipping options for your store
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MethodCard
                          icon={Truck}
                          title="Standard Shipping"
                          description="Ship products to customer addresses"
                          enabled={shippingData.general.enabled}
                          onToggle={(checked) => updateField(['general', 'enabled'], checked)}
                        />
                        <MethodCard
                          icon={MapPin}
                          title="Local Delivery"
                          description="Same-day delivery for local customers"
                          enabled={shippingData.general.enableLocalDelivery}
                          onToggle={(checked) => updateField(['general', 'enableLocalDelivery'], checked)}
                        />
                        <MethodCard
                          icon={Store}
                          title="Store Pickup"
                          description="Customers pick up orders in-store"
                          enabled={shippingData.general.enableStorePickup}
                          onToggle={(checked) => updateField(['general', 'enableStorePickup'], checked)}
                        />
                        <MethodCard
                          icon={Globe}
                          title="International Shipping"
                          description="Ship to customers worldwide"
                          enabled={shippingData.general.enableInternational}
                          onToggle={(checked) => updateField(['general', 'enableInternational'], checked)}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Methods Tab */}
                  <TabsContent value="methods" className="mt-0">
                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-6">
                      <div>
                        <h2 className="text-lg font-bold text-foreground mb-1">Calculation & Free Shipping</h2>
                        <p className="text-sm text-muted-foreground">
                          Configure how shipping costs are calculated
                        </p>
                      </div>

                      {/* Calculation Method */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Calculation Method
                          </label>
                          <Select
                            value={shippingData.calculation.calculationMethod}
                            onChange={(value) => updateField(['calculation', 'calculationMethod'], value)}
                            options={[
                              { value: 'flat_rate', label: 'Flat Rate' },
                              { value: 'weight_based', label: 'Weight Based' },
                              { value: 'price_based', label: 'Price Based' },
                              { value: 'dimensional', label: 'Dimensional Weight' },
                            ]}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">Combine Shipping</p>
                            <p className="text-xs text-muted-foreground">Single rate for multiple items</p>
                          </div>
                          <Switch
                            checked={shippingData.calculation.combineShipping}
                            onCheckedChange={(checked) => updateField(['calculation', 'combineShipping'], checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">Use Highest Rate</p>
                            <p className="text-xs text-muted-foreground">When combining shipping</p>
                          </div>
                          <Switch
                            checked={shippingData.calculation.useHighestRate}
                            onCheckedChange={(checked) => updateField(['calculation', 'useHighestRate'], checked)}
                          />
                        </div>
                      </div>

                      {/* Free Shipping */}
                      <div className="border-t border-border pt-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">Free Shipping</h3>
                            <p className="text-sm text-muted-foreground">Offer free shipping on qualifying orders</p>
                          </div>
                          <Switch
                            checked={shippingData.freeShipping.enabled}
                            onCheckedChange={(checked) => updateField(['freeShipping', 'enabled'], checked)}
                          />
                        </div>

                        {shippingData.freeShipping.enabled && (
                          <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1.5">
                                Free Shipping Threshold ($)
                              </label>
                              <Input
                                type="number"
                                min="0"
                                step="5"
                                value={shippingData.freeShipping.threshold}
                                onChange={(e) =>
                                  updateField(['freeShipping', 'threshold'], parseFloat(e.target.value))
                                }
                                className="w-40"
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <p className="font-medium text-sm">Exclude Discounted Amount</p>
                                <p className="text-xs text-muted-foreground">Calculate before discounts applied</p>
                              </div>
                              <Switch
                                checked={shippingData.freeShipping.excludeDiscountedAmount}
                                onCheckedChange={(checked) =>
                                  updateField(['freeShipping', 'excludeDiscountedAmount'], checked)
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <p className="font-medium text-sm">Require Coupon Code</p>
                                <p className="text-xs text-muted-foreground">Must use free shipping coupon</p>
                              </div>
                              <Switch
                                checked={shippingData.freeShipping.requireCouponCode}
                                onCheckedChange={(checked) =>
                                  updateField(['freeShipping', 'requireCouponCode'], checked)
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* Carriers Tab */}
                  <TabsContent value="carriers" className="mt-0">
                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-6">
                      <div>
                        <h2 className="text-lg font-bold text-foreground mb-1">Shipping Carriers</h2>
                        <p className="text-sm text-muted-foreground">
                          Connect carrier accounts to calculate real-time rates
                        </p>
                      </div>

                      {loadingCarriers ? (
                        <div className="text-center py-8">
                          <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-2" />
                          <p className="text-muted-foreground">Loading carriers...</p>
                        </div>
                      ) : (
                        <>
                          {/* Carrier Priority Overview */}
                          {carrierConfigs.some((c) => c.hasCredentials) && (
                            <div className="bg-gradient-to-br from-primary/5 to-background rounded-xl border border-border p-5">
                              <div className="flex items-center gap-2 mb-4">
                                <Shield className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">Carrier Priority</h3>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-4 bg-card rounded-lg border border-border">
                                  <p className="text-xs text-muted-foreground mb-1">Primary Carrier</p>
                                  <p className="font-semibold text-foreground flex items-center gap-2">
                                    {carrierSettings.preferredCarrierType || 'Not set'}
                                    {carrierSettings.preferredCarrierType && (
                                      <CheckCircle className="h-4 w-4 text-success" />
                                    )}
                                  </p>
                                </div>
                                <div className="p-4 bg-card rounded-lg border border-border">
                                  <p className="text-xs text-muted-foreground mb-1">Fallback Carrier</p>
                                  <p className="font-semibold text-foreground">
                                    {carrierSettings.fallbackCarrierType || 'Not set'}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Primary
                                  </label>
                                  <Select
                                    value={carrierSettings.preferredCarrierType || 'DELHIVERY'}
                                    onChange={(value) =>
                                      setCarrierSettings({ ...carrierSettings, preferredCarrierType: value })
                                    }
                                    options={[
                                      { value: 'DELHIVERY', label: 'Delhivery' },
                                      { value: 'SHIPROCKET', label: 'Shiprocket' },
                                    ]}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Fallback
                                  </label>
                                  <Select
                                    value={carrierSettings.fallbackCarrierType || 'SHIPROCKET'}
                                    onChange={(value) =>
                                      setCarrierSettings({ ...carrierSettings, fallbackCarrierType: value })
                                    }
                                    options={[
                                      { value: 'SHIPROCKET', label: 'Shiprocket' },
                                      { value: 'DELHIVERY', label: 'Delhivery' },
                                    ]}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Markup (%)
                                  </label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="500"
                                    step="10"
                                    value={(carrierSettings.handlingFeePercent || 1.5) * 100}
                                    onChange={(e) =>
                                      setCarrierSettings({
                                        ...carrierSettings,
                                        handlingFeePercent: parseFloat(e.target.value) / 100,
                                      })
                                    }
                                  />
                                </div>
                              </div>

                              <Button
                                onClick={saveCarrierPriority}
                                disabled={saving}
                                className="mt-4 bg-primary"
                                size="sm"
                              >
                                {saving ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Save className="h-4 w-4 mr-2" />
                                )}
                                Save Priority
                              </Button>
                            </div>
                          )}

                          {/* Available Carriers */}
                          <div>
                            <h3 className="text-sm font-semibold text-foreground mb-3">Available Carriers</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {CARRIERS.map((carrier) => {
                                const status = getCarrierStatus(carrier.type);
                                return (
                                  <CarrierCard
                                    key={carrier.type}
                                    carrier={carrier}
                                    configured={status.configured}
                                    carrierId={status.id}
                                    onConfigure={() => {
                                      setSelectedCarrierType(carrier.type);
                                      setCarrierModalOpen(true);
                                    }}
                                    onTestConnection={
                                      status.id
                                        ? () => handleTestConnection(status.id!, carrier.type)
                                        : undefined
                                    }
                                    testingConnection={testingConnection === carrier.type}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </TabsContent>

                  {/* Warehouse Tab */}
                  <TabsContent value="warehouse" className="mt-0">
                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-6">
                      <div>
                        <h2 className="text-lg font-bold text-foreground mb-1">Warehouse Address</h2>
                        <p className="text-sm text-muted-foreground">
                          Default origin address for shipments
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                              Contact Name *
                            </label>
                            <Input
                              value={shippingData.warehouse?.name || ''}
                              onChange={(e) => updateField(['warehouse', 'name'], e.target.value)}
                              placeholder="Warehouse Manager"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                              Company Name
                            </label>
                            <Input
                              value={shippingData.warehouse?.company || ''}
                              onChange={(e) => updateField(['warehouse', 'company'], e.target.value)}
                              placeholder="Your Company"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">
                            Street Address *
                          </label>
                          <Input
                            value={shippingData.warehouse?.street || ''}
                            onChange={(e) => updateField(['warehouse', 'street'], e.target.value)}
                            placeholder="123 Warehouse Street"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1.5">
                            Street Address 2
                          </label>
                          <Input
                            value={shippingData.warehouse?.street2 || ''}
                            onChange={(e) => updateField(['warehouse', 'street2'], e.target.value)}
                            placeholder="Suite, Unit, Building (optional)"
                          />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">City *</label>
                            <Input
                              value={shippingData.warehouse?.city || ''}
                              onChange={(e) => updateField(['warehouse', 'city'], e.target.value)}
                              placeholder="New York"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">State *</label>
                            <Input
                              value={shippingData.warehouse?.state || ''}
                              onChange={(e) => updateField(['warehouse', 'state'], e.target.value)}
                              placeholder="NY"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                              Postal Code *
                            </label>
                            <Input
                              value={shippingData.warehouse?.postalCode || ''}
                              onChange={(e) => updateField(['warehouse', 'postalCode'], e.target.value)}
                              placeholder="10001"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Country *</label>
                            <Input
                              value={shippingData.warehouse?.country || ''}
                              onChange={(e) => updateField(['warehouse', 'country'], e.target.value)}
                              placeholder="US"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Phone *</label>
                            <Input
                              value={shippingData.warehouse?.phone || ''}
                              onChange={(e) => updateField(['warehouse', 'phone'], e.target.value)}
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Email *</label>
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
                          <span>
                            This address will be used as the default &quot;Ship From&quot; address when creating
                            shipments.
                          </span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tracking Tab */}
                  <TabsContent value="tracking" className="mt-0">
                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-6">
                      <div>
                        <h2 className="text-lg font-bold text-foreground mb-1">Tracking Settings</h2>
                        <p className="text-sm text-muted-foreground">
                          Configure shipment tracking for customers
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                          <div>
                            <h3 className="font-semibold text-foreground">Enable Tracking</h3>
                            <p className="text-sm text-muted-foreground">
                              Provide tracking numbers to customers
                            </p>
                          </div>
                          <Switch
                            checked={shippingData.tracking.enabled}
                            onCheckedChange={(checked) => updateField(['tracking', 'enabled'], checked)}
                          />
                        </div>

                        {shippingData.tracking.enabled && (
                          <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <p className="font-medium text-sm">Auto-Send Tracking</p>
                                <p className="text-xs text-muted-foreground">Email tracking info automatically</p>
                              </div>
                              <Switch
                                checked={shippingData.tracking.autoSendTracking}
                                onCheckedChange={(checked) =>
                                  updateField(['tracking', 'autoSendTracking'], checked)
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <p className="font-medium text-sm">Delivery Confirmation</p>
                                <p className="text-xs text-muted-foreground">Require signature on delivery</p>
                              </div>
                              <Switch
                                checked={shippingData.tracking.enableDeliveryConfirmation}
                                onCheckedChange={(checked) =>
                                  updateField(['tracking', 'enableDeliveryConfirmation'], checked)
                                }
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1.5">
                                Tracking URL Template
                              </label>
                              <Input
                                value={shippingData.tracking.trackingUrlTemplate}
                                onChange={(e) => updateField(['tracking', 'trackingUrlTemplate'], e.target.value)}
                                placeholder="https://track.example.com/{tracking_number}"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Use {'{tracking_number}'} as placeholder
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Sticky Save Bar */}
                {hasChanges && (
                  <div className="sticky bottom-4 mt-6">
                    <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">You have unsaved changes</p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShippingData(savedData)}>
                          Discard
                        </Button>
                        <Button onClick={handleSave} disabled={saving} size="sm" className="bg-primary">
                          {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Truck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Create Your First Storefront</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by creating a storefront to configure shipping settings.
            </p>
          </div>
        )}
      </div>

      {/* Carrier Config Modal */}
      <CarrierConfigModal
        open={carrierModalOpen}
        onOpenChange={setCarrierModalOpen}
        carrierType={selectedCarrierType}
        onSave={handleSaveCarrierCredentials}
        saving={savingCarrier}
      />
    </div>
  );
}
