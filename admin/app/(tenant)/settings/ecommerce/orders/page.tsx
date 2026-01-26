'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Save, Gift, Edit3, Loader2 } from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PageHeader } from '@/components/PageHeader';
import { StoreSelector } from '@/components/settings/StoreSelector';
import { settingsService } from '@/lib/services/settingsService';
import { storefrontService } from '@/lib/services/storefrontService';
import type { Storefront } from '@/lib/api/types';
import type { OrderSettings } from '@/lib/types/settings';
import { useDialog } from '@/contexts/DialogContext';
import { useTenant } from '@/contexts/TenantContext';

const defaultOrderData: OrderSettings = {
  numbering: {
    format: 'TGP-{YYYY}-{####}',
    prefix: 'TGP',
    startingNumber: 10000,
    resetAnnually: true,
  },
  processing: {
    autoConfirm: true,
    requireManualReview: true,
    manualReviewThreshold: 2500,
    autoCapture: false,
    autoFulfill: false,
    sendConfirmationEmail: true,
  },
  limits: {
    minimumOrderAmount: 25,
    maximumOrderAmount: 25000,
    maxItemsPerOrder: 50,
    maxQuantityPerItem: 10,
    dailyOrderLimit: 5,
  },
  checkout: {
    guestCheckoutEnabled: true,
    requireAccountCreation: false,
    enableExpressCheckout: true,
    enableOneClickCheckout: true,
    collectPhoneNumber: true,
    enableGiftMessages: true,
    enableGiftWrap: true,
    giftWrapFee: 7.99,
  },
  editing: {
    allowEditing: true,
    editTimeLimit: 60,
    allowCancellation: true,
    cancellationTimeLimit: 120,
    allowAddressChange: true,
    allowItemModification: true,
  },
};

export default function OrderSettingsPage() {
  const { showSuccess, showError } = useDialog();
  const { currentTenant } = useTenant();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);
  const [orderData, setOrderData] = useState<OrderSettings>(defaultOrderData);
  const [savedData, setSavedData] = useState<OrderSettings>(defaultOrderData);
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
    if (selectedStorefront && currentTenant?.id) {
      loadSettings();
    }
  }, [selectedStorefront?.id, currentTenant?.id]);

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

  const loadSettings = async () => {
    try {
      setLoading(true);
      const settings = await settingsService.getSettingsByContext({
        applicationId: 'admin-portal',
        scope: 'application',
        tenantId: currentTenant?.id,
      });

      // Store the full ecommerce object to preserve other sections when saving
      if (settings?.ecommerce) {
        setExistingEcommerce(settings.ecommerce);
      } else {
        setExistingEcommerce({});
      }

      if (settings?.ecommerce?.orders) {
        setOrderData(settings.ecommerce.orders);
        setSavedData(settings.ecommerce.orders);
        setSettingsId(settings.id);
      } else {
        setOrderData(defaultOrderData);
        setSavedData(defaultOrderData);
        setSettingsId(settings?.id || null);
      }
    } catch (error) {
      console.error('Failed to load order settings:', error);
      setOrderData(defaultOrderData);
      setSavedData(defaultOrderData);
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
        orders: orderData,
      };

      const payload = {
        context: {
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId: currentTenant?.id,
        },
        ecommerce: mergedEcommerce,
      };

      if (settingsId) {
        await settingsService.updateSettings(settingsId, payload as any, currentTenant?.id);
      } else {
        const newSettings = await settingsService.createSettings(payload as any, currentTenant?.id);
        setSettingsId(newSettings.id);
      }

      // Update existing ecommerce with the merged data
      setExistingEcommerce(mergedEcommerce);
      setSavedData(orderData);
      showSuccess('Success', 'Order settings saved successfully!');
    } catch (error) {
      console.error('Failed to save order settings:', error);
      showError('Error', 'Failed to save order settings');
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

  const hasChanges = JSON.stringify(orderData) !== JSON.stringify(savedData);

  const updateField = (path: string[], value: any) => {
    setOrderData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newData;
    });
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
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Order Management"
          description="Configure order processing, limits, and checkout options"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Ecommerce' },
            { label: 'Orders', href: '/orders' },
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
            {/* Order Numbering */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Order Numbering</h3>
                  <p className="text-sm text-muted-foreground">Configure order number format</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Order Number Format
                  </label>
                  <Input
                    value={orderData.numbering.format}
                    onChange={(e) => updateField(['numbering', 'format'], e.target.value)}
                    placeholder="TGP-{YYYY}-{####}"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {'{YYYY}'} for year, {'{MM}'} for month, {'{####}'} for number
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Order Number Prefix
                  </label>
                  <Input
                    value={orderData.numbering.prefix}
                    onChange={(e) => updateField(['numbering', 'prefix'], e.target.value)}
                    placeholder="TGP"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Starting Number
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={orderData.numbering.startingNumber}
                    onChange={(e) => updateField(['numbering', 'startingNumber'], parseInt(e.target.value))}
                  />
                </div>

                <div className="md:col-span-2">
                  <Checkbox
                    checked={orderData.numbering.resetAnnually}
                    onChange={(e) => updateField(['numbering', 'resetAnnually'], e.target.checked)}
                    label="Reset Numbering Annually"
                    description="Start from beginning each year"
                  />
                </div>
              </div>
            </div>

            {/* Order Processing */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <Edit3 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Order Processing</h3>
                  <p className="text-sm text-muted-foreground">Automated processing rules</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Checkbox
                    checked={orderData.processing.autoConfirm}
                    onChange={(e) => updateField(['processing', 'autoConfirm'], e.target.checked)}
                    label="Auto-Confirm Orders"
                    description="Automatically confirm after payment"
                  />
                  <Checkbox
                    checked={orderData.processing.autoCapture}
                    onChange={(e) => updateField(['processing', 'autoCapture'], e.target.checked)}
                    label="Auto-Capture Payment"
                    description="Capture immediately (vs authorize)"
                  />
                  <Checkbox
                    checked={orderData.processing.autoFulfill}
                    onChange={(e) => updateField(['processing', 'autoFulfill'], e.target.checked)}
                    label="Auto-Fulfill Orders"
                    description="Automatically mark as fulfilled"
                  />
                  <Checkbox
                    checked={orderData.processing.sendConfirmationEmail}
                    onChange={(e) => updateField(['processing', 'sendConfirmationEmail'], e.target.checked)}
                    label="Send Confirmation Email"
                    description="Email customer after order"
                  />
                </div>

                <div>
                  <Checkbox
                    checked={orderData.processing.requireManualReview}
                    onChange={(e) => updateField(['processing', 'requireManualReview'], e.target.checked)}
                    label="Require Manual Review for High-Value Orders"
                    description="Fraud protection for large orders"
                  />
                  {orderData.processing.requireManualReview && (
                    <div className="ml-6 mt-2">
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Manual Review Threshold ($)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        value={orderData.processing.manualReviewThreshold}
                        onChange={(e) => updateField(['processing', 'manualReviewThreshold'], parseFloat(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Limits */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Order Limits</h3>
                  <p className="text-sm text-muted-foreground">Set minimum and maximum order constraints</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Minimum Order Amount ($)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="5"
                    value={orderData.limits.minimumOrderAmount}
                    onChange={(e) => updateField(['limits', 'minimumOrderAmount'], parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Maximum Order Amount ($)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={orderData.limits.maximumOrderAmount}
                    onChange={(e) => updateField(['limits', 'maximumOrderAmount'], parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Max Items Per Order
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={orderData.limits.maxItemsPerOrder}
                    onChange={(e) => updateField(['limits', 'maxItemsPerOrder'], parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Max Quantity Per Item
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={orderData.limits.maxQuantityPerItem}
                    onChange={(e) => updateField(['limits', 'maxQuantityPerItem'], parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Daily Order Limit (Per Customer)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={orderData.limits.dailyOrderLimit}
                    onChange={(e) => updateField(['limits', 'dailyOrderLimit'], parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Checkout Options */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Checkout Options</h3>
                  <p className="text-sm text-muted-foreground">Configure checkout features</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Checkbox
                    checked={orderData.checkout.guestCheckoutEnabled}
                    onChange={(e) => updateField(['checkout', 'guestCheckoutEnabled'], e.target.checked)}
                    label="Guest Checkout"
                    description="Allow checkout without account"
                  />
                  <Checkbox
                    checked={orderData.checkout.requireAccountCreation}
                    onChange={(e) => updateField(['checkout', 'requireAccountCreation'], e.target.checked)}
                    label="Require Account Creation"
                    description="Force account during checkout"
                  />
                  <Checkbox
                    checked={orderData.checkout.enableExpressCheckout}
                    onChange={(e) => updateField(['checkout', 'enableExpressCheckout'], e.target.checked)}
                    label="Express Checkout"
                    description="PayPal, Apple Pay, Google Pay"
                  />
                  <Checkbox
                    checked={orderData.checkout.enableOneClickCheckout}
                    onChange={(e) => updateField(['checkout', 'enableOneClickCheckout'], e.target.checked)}
                    label="One-Click Checkout"
                    description="Saved payment methods"
                  />
                  <Checkbox
                    checked={orderData.checkout.collectPhoneNumber}
                    onChange={(e) => updateField(['checkout', 'collectPhoneNumber'], e.target.checked)}
                    label="Collect Phone Number"
                    description="Require phone during checkout"
                  />
                </div>

                <div>
                  <Checkbox
                    checked={orderData.checkout.enableGiftMessages}
                    onChange={(e) => updateField(['checkout', 'enableGiftMessages'], e.target.checked)}
                    label="Enable Gift Messages"
                    description="Allow customers to add gift messages"
                  />
                </div>

                <div>
                  <Checkbox
                    checked={orderData.checkout.enableGiftWrap}
                    onChange={(e) => updateField(['checkout', 'enableGiftWrap'], e.target.checked)}
                    label="Enable Gift Wrapping"
                    description="Offer gift wrap service"
                  />
                  {orderData.checkout.enableGiftWrap && (
                    <div className="ml-6 mt-2">
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Gift Wrap Fee ($)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.50"
                        value={orderData.checkout.giftWrapFee}
                        onChange={(e) => updateField(['checkout', 'giftWrapFee'], parseFloat(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Post-Order Editing */}
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Edit3 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Post-Order Editing</h3>
                  <p className="text-sm text-muted-foreground">Allow order modifications after placement</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Checkbox
                    checked={orderData.editing.allowEditing}
                    onChange={(e) => updateField(['editing', 'allowEditing'], e.target.checked)}
                    label="Allow Order Editing"
                    description="Let customers edit orders after placement"
                  />
                  {orderData.editing.allowEditing && (
                    <div className="ml-6 mt-2">
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Edit Time Limit (minutes)
                      </label>
                      <Input
                        type="number"
                        min="5"
                        max="1440"
                        value={orderData.editing.editTimeLimit}
                        onChange={(e) => updateField(['editing', 'editTimeLimit'], parseInt(e.target.value))}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Checkbox
                    checked={orderData.editing.allowCancellation}
                    onChange={(e) => updateField(['editing', 'allowCancellation'], e.target.checked)}
                    label="Allow Order Cancellation"
                    description="Let customers cancel orders"
                  />
                  {orderData.editing.allowCancellation && (
                    <div className="ml-6 mt-2">
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Cancellation Time Limit (minutes)
                      </label>
                      <Input
                        type="number"
                        min="5"
                        max="1440"
                        value={orderData.editing.cancellationTimeLimit}
                        onChange={(e) => updateField(['editing', 'cancellationTimeLimit'], parseInt(e.target.value))}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Checkbox
                    checked={orderData.editing.allowAddressChange}
                    onChange={(e) => updateField(['editing', 'allowAddressChange'], e.target.checked)}
                    label="Allow Address Change"
                    description="Update shipping address"
                  />
                  <Checkbox
                    checked={orderData.editing.allowItemModification}
                    onChange={(e) => updateField(['editing', 'allowItemModification'], e.target.checked)}
                    label="Allow Item Modification"
                    description="Add/remove items from order"
                  />
                </div>
              </div>
            </div>
          </div>
          )
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Create Your First Storefront
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by creating a storefront to configure order settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
