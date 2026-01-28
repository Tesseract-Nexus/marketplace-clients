'use client';

import React, { useState, useEffect } from 'react';
import {
  Save,
  Loader2,
  Package,
  Truck,
  DollarSign,
  Building,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/Select';
import { useToast } from '@/contexts/ToastContext';
import { AddressAutocomplete, ParsedAddressData } from '@/components/AddressAutocomplete';
import {
  shippingCarriersService,
  ShippingSettings,
  ShippingCarrierConfig,
  getCarrierDisplayName,
} from '@/lib/api/shippingCarriers';

const selectionStrategyOptions = [
  { value: 'priority', label: 'Priority (use configured priority order)' },
  { value: 'cheapest', label: 'Cheapest (select lowest rate)' },
  { value: 'fastest', label: 'Fastest (select quickest delivery)' },
];

const weightUnitOptions = [
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'oz', label: 'Ounces (oz)' },
];

const dimensionUnitOptions = [
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'in', label: 'Inches (in)' },
  { value: 'm', label: 'Meters (m)' },
];

const returnLabelModeOptions = [
  { value: 'on_request', label: 'On Request (generate when customer requests)' },
  { value: 'with_shipment', label: 'With Shipment (include return label with every order)' },
];

export function ShippingSettingsTab() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [carriers, setCarriers] = useState<ShippingCarrierConfig[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    warehouse: true,
    pricing: false,
    advanced: false,
  });
  const [settings, setSettings] = useState<Partial<ShippingSettings>>({
    autoSelectCarrier: true,
    selectionStrategy: 'priority',
    enableLocalDelivery: true,
    enableStorePickup: true,
    enableInternational: true,
    freeShippingEnabled: false,
    handlingFee: 0,
    handlingFeePercent: 0,
    defaultWeightUnit: 'kg',
    defaultDimensionUnit: 'cm',
    defaultPackageWeight: 0.5,
    insuranceEnabled: false,
    insurancePercentage: 0,
    sendShipmentNotifications: true,
    sendDeliveryNotifications: true,
    sendTrackingUpdates: true,
    returnsEnabled: true,
    returnWindowDays: 30,
    freeReturnsEnabled: false,
    returnLabelMode: 'on_request',
    cacheRates: true,
    rateCacheDuration: 300,
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
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, carriersData] = await Promise.all([
        shippingCarriersService.getShippingSettings(),
        shippingCarriersService.getCarrierConfigs(),
      ]);
      if (settingsData) {
        setSettings(settingsData);
      }
      setCarriers(carriersData);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await shippingCarriersService.updateShippingSettings(settings);
      toast.success('Success', 'Shipping settings updated successfully');
    } catch (error: any) {
      toast.error('Error', error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const enabledCarriers = carriers.filter((c) => c.isEnabled);
  const carrierOptions = enabledCarriers.map((c) => ({
    value: c.carrierType,
    label: c.displayName || getCarrierDisplayName(c.carrierType),
  }));

  const updateWarehouse = (field: string, value: string) => {
    setSettings({
      ...settings,
      warehouse: {
        ...settings.warehouse,
        [field]: value,
      } as any,
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAddressSelect = (address: ParsedAddressData) => {
    setSettings({
      ...settings,
      warehouse: {
        ...settings.warehouse,
        street: address.streetAddress,
        city: address.city,
        state: address.stateCode || address.state,
        postalCode: address.postalCode,
        country: address.countryCode || address.country,
      } as any,
    });
  };

  return (
    <div className="space-y-6">
      {/* Warehouse / Ship From Address */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('warehouse')}
          className="w-full flex items-center justify-between p-6 hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Building className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-foreground">Ship From Address</h3>
              <p className="text-sm text-muted-foreground">
                {settings.warehouse?.street
                  ? `${settings.warehouse.city}, ${settings.warehouse.state} ${settings.warehouse.postalCode}`
                  : 'Configure your warehouse address'}
              </p>
            </div>
          </div>
          {expandedSections.warehouse ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {expandedSections.warehouse && (
          <div className="px-6 pb-6 space-y-4 border-t border-border pt-4">
            {/* Address Autocomplete */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Search Address
              </label>
              <AddressAutocomplete
                onAddressSelect={handleAddressSelect}
                placeholder="Start typing to search address..."
                defaultValue={settings.warehouse?.street || ''}
              />
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Contact Name *</label>
                <Input
                  value={settings.warehouse?.name || ''}
                  onChange={(e) => updateWarehouse('name', e.target.value)}
                  placeholder="Warehouse Manager"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Company</label>
                <Input
                  value={settings.warehouse?.company || ''}
                  onChange={(e) => updateWarehouse('company', e.target.value)}
                  placeholder="Your Company"
                />
              </div>
            </div>

            {/* Address Fields (auto-filled from autocomplete) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">Street *</label>
                <Input
                  value={settings.warehouse?.street || ''}
                  onChange={(e) => updateWarehouse('street', e.target.value)}
                  placeholder="123 Warehouse Street"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">City *</label>
                <Input
                  value={settings.warehouse?.city || ''}
                  onChange={(e) => updateWarehouse('city', e.target.value)}
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">State *</label>
                <Input
                  value={settings.warehouse?.state || ''}
                  onChange={(e) => updateWarehouse('state', e.target.value)}
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Postal Code *</label>
                <Input
                  value={settings.warehouse?.postalCode || ''}
                  onChange={(e) => updateWarehouse('postalCode', e.target.value)}
                  placeholder="Postal"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Country *</label>
                <Input
                  value={settings.warehouse?.country || ''}
                  onChange={(e) => updateWarehouse('country', e.target.value)}
                  placeholder="US"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Phone *</label>
                <Input
                  value={settings.warehouse?.phone || ''}
                  onChange={(e) => updateWarehouse('phone', e.target.value)}
                  placeholder="+1 555-123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Email *</label>
                <Input
                  type="email"
                  value={settings.warehouse?.email || ''}
                  onChange={(e) => updateWarehouse('email', e.target.value)}
                  placeholder="warehouse@store.com"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Carrier Selection & Options */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Shipping Options</h3>
            <p className="text-sm text-muted-foreground">Configure carrier selection and shipping methods</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Quick Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-border">
            <Checkbox
              checked={settings.enableLocalDelivery || false}
              onChange={(e) => setSettings({ ...settings, enableLocalDelivery: e.target.checked })}
              label="Local Delivery"
            />
            <Checkbox
              checked={settings.enableStorePickup || false}
              onChange={(e) => setSettings({ ...settings, enableStorePickup: e.target.checked })}
              label="Store Pickup"
            />
            <Checkbox
              checked={settings.enableInternational || false}
              onChange={(e) => setSettings({ ...settings, enableInternational: e.target.checked })}
              label="International"
            />
          </div>

          {/* Carrier Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Selection Strategy</label>
              <Select
                value={settings.selectionStrategy || 'priority'}
                onChange={(value) => setSettings({ ...settings, selectionStrategy: value as any })}
                options={selectionStrategyOptions}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Preferred Carrier</label>
              <Select
                value={settings.preferredCarrierType || ''}
                onChange={(value) => setSettings({ ...settings, preferredCarrierType: value || undefined })}
                options={[{ value: '', label: 'Auto' }, ...carrierOptions]}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Fallback Carrier</label>
              <Select
                value={settings.fallbackCarrierType || ''}
                onChange={(value) => setSettings({ ...settings, fallbackCarrierType: value || undefined })}
                options={[{ value: '', label: 'None' }, ...carrierOptions]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing & Fees - Collapsible */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('pricing')}
          className="w-full flex items-center justify-between p-6 hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-foreground">Pricing & Fees</h3>
              <p className="text-sm text-muted-foreground">
                {settings.freeShippingEnabled
                  ? `Free shipping over $${settings.freeShippingMinimum || 0}`
                  : 'Configure free shipping and handling fees'}
              </p>
            </div>
          </div>
          {expandedSections.pricing ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {expandedSections.pricing && (
          <div className="px-6 pb-6 space-y-4 border-t border-border pt-4">
            {/* Shipping Markup Section */}
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
              <p className="text-sm text-primary">
                <strong>Shipping Markup:</strong> Add a percentage and/or fixed amount to carrier rates.
                This helps absorb rate fluctuations and creates a shipping margin.
                Customers see the final rate (carrier + markup) as a single shipping cost.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Markup Percentage (%)</label>
                <Input
                  type="number"
                  value={settings.handlingFeePercent ? (settings.handlingFeePercent * 100).toFixed(0) : 0}
                  onChange={(e) => setSettings({ ...settings, handlingFeePercent: parseFloat(e.target.value) / 100 })}
                  min={0}
                  max={50}
                  step={1}
                  placeholder="e.g., 10 for 10%"
                />
                <p className="text-xs text-muted-foreground mt-1">Applied as percentage of carrier rate</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Fixed Markup Amount</label>
                <Input
                  type="number"
                  value={settings.handlingFee || 0}
                  onChange={(e) => setSettings({ ...settings, handlingFee: parseFloat(e.target.value) })}
                  min={0}
                  step={1}
                  placeholder="e.g., 5"
                />
                <p className="text-xs text-muted-foreground mt-1">Fixed amount added to every shipment</p>
              </div>
            </div>

            {/* Free Shipping Section */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-4 mb-4">
                <Checkbox
                  checked={settings.freeShippingEnabled || false}
                  onChange={(e) => setSettings({ ...settings, freeShippingEnabled: e.target.checked })}
                  label="Enable free shipping above minimum order value"
                />
              </div>

              {settings.freeShippingEnabled && (
                <div className="w-1/3">
                  <label className="block text-sm font-semibold text-foreground mb-2">Minimum Order Value</label>
                  <Input
                    type="number"
                    value={settings.freeShippingMinimum || ''}
                    onChange={(e) => setSettings({ ...settings, freeShippingMinimum: e.target.value ? parseFloat(e.target.value) : undefined })}
                    min={0}
                    placeholder="e.g., 999"
                  />
                </div>
              )}
            </div>

            {/* Package Defaults */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-semibold text-foreground mb-3">Package Defaults</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Weight Unit</label>
                  <Select
                    value={settings.defaultWeightUnit || 'kg'}
                    onChange={(value) => setSettings({ ...settings, defaultWeightUnit: value })}
                    options={weightUnitOptions}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Dimension Unit</label>
                  <Select
                    value={settings.defaultDimensionUnit || 'cm'}
                    onChange={(value) => setSettings({ ...settings, defaultDimensionUnit: value })}
                    options={dimensionUnitOptions}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Default Weight</label>
                  <Input
                    type="number"
                    value={settings.defaultPackageWeight || 0.5}
                    onChange={(e) => setSettings({ ...settings, defaultPackageWeight: parseFloat(e.target.value) })}
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Settings - Collapsible */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('advanced')}
          className="w-full flex items-center justify-between p-6 hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted-foreground rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-foreground">Advanced Settings</h3>
              <p className="text-sm text-muted-foreground">Insurance, notifications, returns</p>
            </div>
          </div>
          {expandedSections.advanced ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>

        {expandedSections.advanced && (
          <div className="px-6 pb-6 space-y-6 border-t border-border pt-4">
            {/* Insurance */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  checked={settings.insuranceEnabled || false}
                  onChange={(e) => setSettings({ ...settings, insuranceEnabled: e.target.checked })}
                  label="Enable shipping insurance"
                />
              </div>
              {settings.insuranceEnabled && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Insurance Rate (%)</label>
                    <Input
                      type="number"
                      value={settings.insurancePercentage || 0}
                      onChange={(e) => setSettings({ ...settings, insurancePercentage: parseFloat(e.target.value) })}
                      min={0}
                      max={100}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Auto-Insure Above ($)</label>
                    <Input
                      type="number"
                      value={settings.autoInsureAboveValue || ''}
                      onChange={(e) => setSettings({ ...settings, autoInsureAboveValue: e.target.value ? parseFloat(e.target.value) : undefined })}
                      placeholder="Disabled"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-semibold text-foreground mb-3">Notifications</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Checkbox
                  checked={settings.sendShipmentNotifications || false}
                  onChange={(e) => setSettings({ ...settings, sendShipmentNotifications: e.target.checked })}
                  label="Shipment created"
                />
                <Checkbox
                  checked={settings.sendTrackingUpdates || false}
                  onChange={(e) => setSettings({ ...settings, sendTrackingUpdates: e.target.checked })}
                  label="Tracking updates"
                />
                <Checkbox
                  checked={settings.sendDeliveryNotifications || false}
                  onChange={(e) => setSettings({ ...settings, sendDeliveryNotifications: e.target.checked })}
                  label="Delivery confirmation"
                />
              </div>
            </div>

            {/* Returns */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  checked={settings.returnsEnabled || false}
                  onChange={(e) => setSettings({ ...settings, returnsEnabled: e.target.checked })}
                  label="Enable returns"
                />
              </div>
              {settings.returnsEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Return Window (days)</label>
                    <Input
                      type="number"
                      value={settings.returnWindowDays || 30}
                      onChange={(e) => setSettings({ ...settings, returnWindowDays: parseInt(e.target.value) })}
                      min={1}
                      max={365}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Label Mode</label>
                    <Select
                      value={settings.returnLabelMode || 'on_request'}
                      onChange={(value) => setSettings({ ...settings, returnLabelMode: value as any })}
                      options={returnLabelModeOptions}
                    />
                  </div>
                  <div className="flex items-end">
                    <Checkbox
                      checked={settings.freeReturnsEnabled || false}
                      onChange={(e) => setSettings({ ...settings, freeReturnsEnabled: e.target.checked })}
                      label="Free returns"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Rate Caching */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <Checkbox
                  checked={settings.cacheRates || false}
                  onChange={(e) => setSettings({ ...settings, cacheRates: e.target.checked })}
                  label="Cache shipping rates for faster checkout"
                />
                {settings.cacheRates && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Duration:</label>
                    <Input
                      type="number"
                      value={settings.rateCacheDuration || 300}
                      onChange={(e) => setSettings({ ...settings, rateCacheDuration: parseInt(e.target.value) })}
                      min={60}
                      max={3600}
                      className="w-24"
                    />
                    <span className="text-xs text-muted-foreground">sec</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:opacity-90"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
