'use client';

import React, { useState, useEffect } from 'react';
import { Package, Save, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
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
import type { InventorySettings } from '@/lib/types/settings';
import { useDialog } from '@/contexts/DialogContext';

const defaultInventorySettings: InventorySettings = {
  tracking: {
    enabled: true,
    trackByVariant: true,
    trackByLocation: true,
    enableSerialNumbers: false,
    enableBatchTracking: true,
    enableExpirationDates: false,
  },
  stockLevels: {
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    overStockThreshold: 1000,
    autoReorderEnabled: true,
    autoReorderQuantity: 100,
    autoReorderThreshold: 20,
  },
  availability: {
    allowBackorders: false,
    backorderLimit: 50,
    outOfStockBehavior: 'show_notify',
    preorderEnabled: true,
    showStockQuantity: false,
    stockDisplayThreshold: 10,
  },
  reservations: {
    cartReservationTimeout: 15,
    checkoutReservationTimeout: 10,
    enableStockReservations: true,
  },
};

export default function InventorySettingsPage() {
  const { showSuccess, showError } = useDialog();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);
  const [inventoryData, setInventoryData] = useState<InventorySettings>(defaultInventorySettings);
  const [savedData, setSavedData] = useState<InventorySettings>(defaultInventorySettings);
  const [existingEcommerce, setExistingEcommerce] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

      if (settings?.ecommerce?.inventory) {
        setInventoryData(settings.ecommerce.inventory);
        setSavedData(settings.ecommerce.inventory);
        setSettingsId(settings.id);
      } else {
        setInventoryData(defaultInventorySettings);
        setSavedData(defaultInventorySettings);
        setSettingsId(settings?.id || null);
      }
    } catch (error) {
      console.error('Failed to load inventory settings:', error);
      setInventoryData(defaultInventorySettings);
      setSavedData(defaultInventorySettings);
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
        inventory: inventoryData,
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
      setSavedData(inventoryData);
      showSuccess('Success', 'Inventory settings saved successfully!');
    } catch (error) {
      console.error('Failed to save inventory settings:', error);
      showError('Error', 'Failed to save inventory settings');
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

  const hasChanges = JSON.stringify(inventoryData) !== JSON.stringify(savedData);

  const updateField = (path: string[], value: any) => {
    setInventoryData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  // Show loading state while storefronts are loading
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
          title="Inventory Management"
          description="Configure stock tracking, reservations, and availability"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Ecommerce' },
            { label: 'Inventory' },
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
              <Loader2 className="h-8 w-8 text-purple-500 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          ) : (
          <div className="space-y-6">
            {/* Tracking Settings */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-violet-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Inventory Tracking</h3>
                  <p className="text-sm text-muted-foreground">Configure how inventory is tracked</p>
                </div>
              </div>

              <div className="space-y-4">
                <Checkbox
                  checked={inventoryData.tracking.enabled}
                  onChange={(e) => updateField(['tracking', 'enabled'], e.target.checked)}
                  label="Enable Inventory Tracking"
                  description="Track stock levels for products"
                />

                {inventoryData.tracking.enabled && (
                  <div className="border border-border rounded-lg p-4 ml-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Checkbox
                        checked={inventoryData.tracking.trackByVariant}
                        onChange={(e) => updateField(['tracking', 'trackByVariant'], e.target.checked)}
                        label="Track by Variant"
                        description="Track each variant separately"
                      />
                      <Checkbox
                        checked={inventoryData.tracking.trackByLocation}
                        onChange={(e) => updateField(['tracking', 'trackByLocation'], e.target.checked)}
                        label="Track by Location"
                        description="Multi-warehouse inventory"
                      />
                      <Checkbox
                        checked={inventoryData.tracking.enableSerialNumbers}
                        onChange={(e) => updateField(['tracking', 'enableSerialNumbers'], e.target.checked)}
                        label="Serial Numbers"
                        description="Track individual items"
                      />
                      <Checkbox
                        checked={inventoryData.tracking.enableBatchTracking}
                        onChange={(e) => updateField(['tracking', 'enableBatchTracking'], e.target.checked)}
                        label="Batch Tracking"
                        description="Track production batches"
                      />
                      <Checkbox
                        checked={inventoryData.tracking.enableExpirationDates}
                        onChange={(e) => updateField(['tracking', 'enableExpirationDates'], e.target.checked)}
                        label="Expiration Dates"
                        description="Track perishable items"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stock Levels */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Stock Level Thresholds</h3>
                  <p className="text-sm text-muted-foreground">Configure alert levels and auto-reorder</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Low Stock Threshold
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={inventoryData.stockLevels.lowStockThreshold}
                    onChange={(e) => updateField(['stockLevels', 'lowStockThreshold'], parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Show low stock warning</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Critical Stock Threshold
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={inventoryData.stockLevels.criticalStockThreshold}
                    onChange={(e) => updateField(['stockLevels', 'criticalStockThreshold'], parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Urgent restock needed</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Over Stock Threshold
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={inventoryData.stockLevels.overStockThreshold}
                    onChange={(e) => updateField(['stockLevels', 'overStockThreshold'], parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Too much inventory</p>
                </div>
              </div>

              <div className="mt-6 border border-border rounded-lg p-4">
                <Checkbox
                  checked={inventoryData.stockLevels.autoReorderEnabled}
                  onChange={(e) => updateField(['stockLevels', 'autoReorderEnabled'], e.target.checked)}
                  label="Enable Auto-Reorder"
                  description="Automatically create purchase orders when stock is low"
                />

                {inventoryData.stockLevels.autoReorderEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 ml-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Auto-Reorder Threshold
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={inventoryData.stockLevels.autoReorderThreshold}
                        onChange={(e) => updateField(['stockLevels', 'autoReorderThreshold'], parseInt(e.target.value))}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Auto-Reorder Quantity
                      </label>
                      <Input
                        type="number"
                        min="1"
                        value={inventoryData.stockLevels.autoReorderQuantity}
                        onChange={(e) => updateField(['stockLevels', 'autoReorderQuantity'], parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Availability Settings */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Availability Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure out-of-stock behavior</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Out of Stock Behavior
                  </label>
                  <Select
                    value={inventoryData.availability.outOfStockBehavior}
                    onChange={(value) => updateField(['availability', 'outOfStockBehavior'], value)}
                    options={[
                      { value: 'hide', label: 'Hide Product' },
                      { value: 'show_notify', label: 'Show with "Notify Me" Option' },
                      { value: 'show_disabled', label: 'Show but Disable Purchase' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Checkbox
                    checked={inventoryData.availability.allowBackorders}
                    onChange={(e) => updateField(['availability', 'allowBackorders'], e.target.checked)}
                    label="Allow Backorders"
                    description="Accept orders when out of stock"
                  />
                  <Checkbox
                    checked={inventoryData.availability.preorderEnabled}
                    onChange={(e) => updateField(['availability', 'preorderEnabled'], e.target.checked)}
                    label="Enable Pre-orders"
                    description="Sell before product is in stock"
                  />
                  <Checkbox
                    checked={inventoryData.availability.showStockQuantity}
                    onChange={(e) => updateField(['availability', 'showStockQuantity'], e.target.checked)}
                    label="Show Stock Quantity"
                    description="Display available quantity to customers"
                  />
                </div>

                {inventoryData.availability.allowBackorders && (
                  <div className="ml-6">
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Backorder Limit
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={inventoryData.availability.backorderLimit}
                      onChange={(e) => updateField(['availability', 'backorderLimit'], parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Maximum backorders allowed per product</p>
                  </div>
                )}

                {inventoryData.availability.showStockQuantity && (
                  <div className="ml-6">
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Stock Display Threshold
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={inventoryData.availability.stockDisplayThreshold}
                      onChange={(e) => updateField(['availability', 'stockDisplayThreshold'], parseInt(e.target.value))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Only show exact quantity below this threshold</p>
                  </div>
                )}
              </div>
            </div>

            {/* Stock Reservations */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Stock Reservations</h3>
                  <p className="text-sm text-muted-foreground">Configure cart and checkout reservations</p>
                </div>
              </div>

              <div className="space-y-4">
                <Checkbox
                  checked={inventoryData.reservations.enableStockReservations}
                  onChange={(e) => updateField(['reservations', 'enableStockReservations'], e.target.checked)}
                  label="Enable Stock Reservations"
                  description="Reserve inventory when items are in cart or checkout"
                />

                {inventoryData.reservations.enableStockReservations && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Cart Reservation Timeout (minutes)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={inventoryData.reservations.cartReservationTimeout}
                        onChange={(e) => updateField(['reservations', 'cartReservationTimeout'], parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">How long items stay reserved in cart</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Checkout Reservation Timeout (minutes)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={inventoryData.reservations.checkoutReservationTimeout}
                        onChange={(e) => updateField(['reservations', 'checkoutReservationTimeout'], parseInt(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">How long items stay reserved during checkout</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          )
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Create Your First Storefront
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by creating a storefront to configure inventory settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
