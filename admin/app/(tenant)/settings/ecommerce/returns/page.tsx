'use client';

import React, { useState, useEffect } from 'react';
import { RotateCcw, Save, Loader2 } from 'lucide-react';
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
import type { Storefront } from '@/lib/api/types';

interface ReturnsData {
  policy: {
    enabled: boolean;
    period: number;
    extendedPeriodForMembers: number;
    requireOriginalPackaging: boolean;
    requireReceipt: boolean;
    allowPartialReturns: boolean;
    allowExchanges: boolean;
    allowStoreCredit: boolean;
  };
  costs: {
    returnShippingPaidBy: 'customer' | 'merchant' | 'shared';
    restockingFee: number;
    restockingFeePercent: number;
    returnProcessingFee: number;
    freeReturnThreshold: number;
  };
  processing: {
    autoApproval: boolean;
    requireReasonCode: boolean;
    requirePhotos: boolean;
    enableReturnMerchandiseAuth: boolean;
    notifyOnReturn: boolean;
    autoRefundOnReceive: boolean;
  };
  exclusions: {
    finalSaleItems: boolean;
    personalizedItems: boolean;
    perishableItems: boolean;
    digitalItems: boolean;
    giftCards: boolean;
    customItems: boolean;
  };
}

const defaultReturnsData: ReturnsData = {
  policy: { enabled: true, period: 30, extendedPeriodForMembers: 45, requireOriginalPackaging: false, requireReceipt: false, allowPartialReturns: true, allowExchanges: true, allowStoreCredit: true },
  costs: { returnShippingPaidBy: 'customer', restockingFee: 0, restockingFeePercent: 15, returnProcessingFee: 5.99, freeReturnThreshold: 200 },
  processing: { autoApproval: false, requireReasonCode: true, requirePhotos: true, enableReturnMerchandiseAuth: true, notifyOnReturn: true, autoRefundOnReceive: false },
  exclusions: { finalSaleItems: true, personalizedItems: true, perishableItems: true, digitalItems: true, giftCards: true, customItems: true },
};

export default function ReturnsSettingsPage() {
  const { showSuccess, showError } = useDialog();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [returnsData, setReturnsData] = useState<ReturnsData>(defaultReturnsData);
  const [savedData, setSavedData] = useState<ReturnsData>(defaultReturnsData);
  const [existingEcommerce, setExistingEcommerce] = useState<Record<string, any>>({});
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

      if (settings?.ecommerce?.returns) {
        setReturnsData(settings.ecommerce.returns);
        setSavedData(settings.ecommerce.returns);
        setSettingsId(settings.id);
      } else {
        setReturnsData(defaultReturnsData);
        setSavedData(defaultReturnsData);
        setSettingsId(settings?.id || null);
      }
    } catch (error) {
      console.error('Failed to load returns settings:', error);
      setReturnsData(defaultReturnsData);
      setSavedData(defaultReturnsData);
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
        returns: returnsData,
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
      setSavedData(returnsData);
      showSuccess('Success', 'Returns settings saved successfully!');
    } catch (error) {
      console.error('Failed to save returns settings:', error);
      showError('Error', 'Failed to save returns settings');
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

  const hasChanges = JSON.stringify(returnsData) !== JSON.stringify(savedData);
  const updateField = (path: string[], value: any) => {
    setReturnsData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) current = current[path[i]];
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  // Show loading state while loading storefronts
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
          title="Returns Settings"
          description="Configure return policies and processing"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Ecommerce' },
            { label: 'Returns' },
          ]}
          actions={
            <Button onClick={handleSave} disabled={!hasChanges || saving || !selectedStorefront} className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
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
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <RotateCcw className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Return Policy</h3>
                  <p className="text-sm text-muted-foreground">Configure return period and options</p>
                </div>
              </div>
              <div className="space-y-4">
                <Checkbox checked={returnsData.policy.enabled} onChange={(e) => updateField(['policy', 'enabled'], e.target.checked)} label="Enable Returns" description="Allow customers to return products" />
                {returnsData.policy.enabled && (
                  <div className="ml-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Return Period (days)</label>
                        <Input type="number" min="0" max="365" value={returnsData.policy.period} onChange={(e) => updateField(['policy', 'period'], parseInt(e.target.value))} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Extended Period for Members (days)</label>
                        <Input type="number" min="0" max="365" value={returnsData.policy.extendedPeriodForMembers} onChange={(e) => updateField(['policy', 'extendedPeriodForMembers'], parseInt(e.target.value))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Checkbox checked={returnsData.policy.requireOriginalPackaging} onChange={(e) => updateField(['policy', 'requireOriginalPackaging'], e.target.checked)} label="Require Original Packaging" description="Product must be in original box" />
                      <Checkbox checked={returnsData.policy.requireReceipt} onChange={(e) => updateField(['policy', 'requireReceipt'], e.target.checked)} label="Require Receipt" description="Must provide proof of purchase" />
                      <Checkbox checked={returnsData.policy.allowPartialReturns} onChange={(e) => updateField(['policy', 'allowPartialReturns'], e.target.checked)} label="Allow Partial Returns" description="Return some items from order" />
                      <Checkbox checked={returnsData.policy.allowExchanges} onChange={(e) => updateField(['policy', 'allowExchanges'], e.target.checked)} label="Allow Exchanges" description="Exchange for different item" />
                      <Checkbox checked={returnsData.policy.allowStoreCredit} onChange={(e) => updateField(['policy', 'allowStoreCredit'], e.target.checked)} label="Allow Store Credit" description="Refund as store credit" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg flex items-center justify-center">
                  <RotateCcw className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Return Costs</h3>
                  <p className="text-sm text-muted-foreground">Configure fees and cost allocation</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Return Shipping Paid By</label>
                  <Select value={returnsData.costs.returnShippingPaidBy} onChange={(value) => updateField(['costs', 'returnShippingPaidBy'], value)} options={[
                    { value: 'customer', label: 'Customer' },
                    { value: 'merchant', label: 'Merchant' },
                    { value: 'shared', label: 'Shared' },
                  ]} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Restocking Fee (%)</label>
                    <Input type="number" min="0" max="50" value={returnsData.costs.restockingFeePercent} onChange={(e) => updateField(['costs', 'restockingFeePercent'], parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Return Processing Fee ($)</label>
                    <Input type="number" min="0" step="0.50" value={returnsData.costs.returnProcessingFee} onChange={(e) => updateField(['costs', 'returnProcessingFee'], parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Free Return Threshold ($)</label>
                    <Input type="number" min="0" step="10" value={returnsData.costs.freeReturnThreshold} onChange={(e) => updateField(['costs', 'freeReturnThreshold'], parseFloat(e.target.value))} />
                    <p className="text-xs text-muted-foreground mt-1">Orders above this amount get free returns</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <RotateCcw className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Processing Rules</h3>
                  <p className="text-sm text-muted-foreground">Configure return processing workflow</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Checkbox checked={returnsData.processing.autoApproval} onChange={(e) => updateField(['processing', 'autoApproval'], e.target.checked)} label="Auto-Approval" description="Automatically approve returns" />
                <Checkbox checked={returnsData.processing.requireReasonCode} onChange={(e) => updateField(['processing', 'requireReasonCode'], e.target.checked)} label="Require Reason Code" description="Customer must select reason" />
                <Checkbox checked={returnsData.processing.requirePhotos} onChange={(e) => updateField(['processing', 'requirePhotos'], e.target.checked)} label="Require Photos" description="Upload photos of product/damage" />
                <Checkbox checked={returnsData.processing.enableReturnMerchandiseAuth} onChange={(e) => updateField(['processing', 'enableReturnMerchandiseAuth'], e.target.checked)} label="RMA System" description="Generate RMA numbers" />
                <Checkbox checked={returnsData.processing.notifyOnReturn} onChange={(e) => updateField(['processing', 'notifyOnReturn'], e.target.checked)} label="Notify on Return" description="Email when return is initiated" />
                <Checkbox checked={returnsData.processing.autoRefundOnReceive} onChange={(e) => updateField(['processing', 'autoRefundOnReceive'], e.target.checked)} label="Auto-Refund on Receive" description="Refund when item arrives" />
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                  <RotateCcw className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Return Exclusions</h3>
                  <p className="text-sm text-muted-foreground">Items that cannot be returned</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Checkbox checked={returnsData.exclusions.finalSaleItems} onChange={(e) => updateField(['exclusions', 'finalSaleItems'], e.target.checked)} label="Final Sale Items" description="Clearance/final sale products" />
                <Checkbox checked={returnsData.exclusions.personalizedItems} onChange={(e) => updateField(['exclusions', 'personalizedItems'], e.target.checked)} label="Personalized Items" description="Custom engraved/printed" />
                <Checkbox checked={returnsData.exclusions.perishableItems} onChange={(e) => updateField(['exclusions', 'perishableItems'], e.target.checked)} label="Perishable Items" description="Food, flowers, etc." />
                <Checkbox checked={returnsData.exclusions.digitalItems} onChange={(e) => updateField(['exclusions', 'digitalItems'], e.target.checked)} label="Digital Items" description="Downloads, software" />
                <Checkbox checked={returnsData.exclusions.giftCards} onChange={(e) => updateField(['exclusions', 'giftCards'], e.target.checked)} label="Gift Cards" description="Gift cards and vouchers" />
                <Checkbox checked={returnsData.exclusions.customItems} onChange={(e) => updateField(['exclusions', 'customItems'], e.target.checked)} label="Custom Items" description="Made-to-order products" />
              </div>
            </div>
          </div>
          )
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <RotateCcw className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Create Your First Storefront
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by creating a storefront to configure returns settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
