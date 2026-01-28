'use client';

import React, { useState, useEffect } from 'react';
import { XCircle, Save, Loader2, Plus, Trash2, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { useDialog } from '@/contexts/DialogContext';
import { StoreSelector } from '@/components/settings/StoreSelector';
import { settingsService } from '@/lib/services/settingsService';
import { approvalService } from '@/lib/services/approvalService';
import { storefrontService } from '@/lib/services/storefrontService';
import type { Storefront } from '@/lib/api/types';
import { useTenant } from '@/contexts/TenantContext';
import type { CancellationSettings, CancellationWindow } from '@/lib/types/cancellation';

// ========================================
// Defaults
// ========================================

const defaultWindow = (): CancellationWindow => ({
  id: crypto.randomUUID(),
  name: '',
  maxHoursAfterOrder: 0,
  feeType: 'percentage',
  feeValue: 0,
  description: '',
});

const defaultSettings: CancellationSettings = {
  enabled: true,
  windows: [
    { id: crypto.randomUUID(), name: 'Free cancellation', maxHoursAfterOrder: 6, feeType: 'percentage', feeValue: 0, description: 'Cancel within 6 hours at no charge.' },
    { id: crypto.randomUUID(), name: 'Low fee', maxHoursAfterOrder: 24, feeType: 'percentage', feeValue: 3, description: 'A small processing fee applies within 24 hours.' },
    { id: crypto.randomUUID(), name: 'Pre-delivery', maxHoursAfterOrder: 72, feeType: 'percentage', feeValue: 10, description: '10% fee for cancellations before delivery.' },
  ],
  defaultFeeType: 'percentage',
  defaultFeeValue: 15,
  nonCancellableStatuses: ['SHIPPED', 'DELIVERED'],
  requireApprovalForPolicyChanges: false,
  requireReason: true,
  allowPartialCancellation: false,
  refundMethod: 'original_payment',
  policyText: '',
  cancellationReasons: [
    'I changed my mind',
    'Found a better price elsewhere',
    'Ordered by mistake',
    'Shipping is taking too long',
    'Payment issue',
    'Other reason',
  ],
};

const ORDER_STATUSES = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'READY_FOR_PICKUP'];

// ========================================
// Page Component
// ========================================

export default function CancellationSettingsPage() {
  const { showSuccess, showError } = useDialog();
  const { currentTenant } = useTenant();
  const [storefronts, setStorefronts] = useState<Storefront[]>([]);
  const [selectedStorefront, setSelectedStorefront] = useState<Storefront | null>(null);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CancellationSettings>(defaultSettings);
  const [savedData, setSavedData] = useState<CancellationSettings>(defaultSettings);
  const [existingEcommerce, setExistingEcommerce] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);

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
    const tenantId = currentTenant?.id;
    if (!tenantId) return;

    try {
      setLoading(true);
      const settings = await settingsService.getSettingsByContext({
        applicationId: 'admin-portal',
        scope: 'application',
        tenantId,
      });

      if (settings?.ecommerce) {
        setExistingEcommerce(settings.ecommerce);
      } else {
        setExistingEcommerce({});
      }

      if (settings?.ecommerce?.cancellation) {
        setData(settings.ecommerce.cancellation);
        setSavedData(settings.ecommerce.cancellation);
        setSettingsId(settings.id);
      } else {
        setData(defaultSettings);
        setSavedData(defaultSettings);
        setSettingsId(settings?.id || null);
      }

      // Check for pending approval
      if (settingsId || settings?.id) {
        try {
          const approvals = await approvalService.getByEntity('settings', settingsId || settings?.id || '');
          const pending = approvals.data?.some(
            (a) => a.approvalType === 'settings_change' && a.status === 'pending' && a.metadata?.settingsSection === 'cancellation'
          );
          setPendingApproval(!!pending);
        } catch {
          // Approvals may not be set up
        }
      }
    } catch (error) {
      console.error('Failed to load cancellation settings:', error);
      setData(defaultSettings);
      setSavedData(defaultSettings);
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

    const tenantId = currentTenant?.id;
    if (!tenantId) {
      showError('Error', 'No tenant available. Please try again.');
      return;
    }

    const isAdminOrOwner = currentTenant?.role === 'admin' || currentTenant?.role === 'owner' || currentTenant?.role === 'platform_admin';

    try {
      setSaving(true);

      // If approval required and user is not admin/owner, submit for approval
      if (data.requireApprovalForPolicyChanges && !isAdminOrOwner) {
        await approvalService.createApproval({
          approvalType: 'settings_change',
          entityType: 'settings',
          entityId: settingsId || 'new',
          entityReference: 'Cancellation Policy Update',
          reason: 'Cancellation policy settings change',
          metadata: {
            settingsSection: 'cancellation',
            pendingSettings: data,
            previousSettings: savedData,
          },
        });
        setPendingApproval(true);
        showSuccess('Submitted', 'Changes submitted for approval.');
        return;
      }

      // Save directly
      const mergedEcommerce = {
        ...existingEcommerce,
        cancellation: data,
      };

      const payload = {
        context: {
          applicationId: 'admin-portal',
          scope: 'application',
          tenantId,
        },
        ecommerce: mergedEcommerce,
      };

      if (settingsId) {
        await settingsService.updateSettings(settingsId, payload as any, tenantId);
      } else {
        const newSettings = await settingsService.createSettings(payload as any, tenantId);
        setSettingsId(newSettings.id);
      }

      setExistingEcommerce(mergedEcommerce);
      setSavedData(data);
      showSuccess('Success', 'Cancellation settings saved successfully!');
    } catch (error) {
      console.error('Failed to save cancellation settings:', error);
      showError('Error', 'Failed to save cancellation settings');
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

  const hasChanges = JSON.stringify(data) !== JSON.stringify(savedData);

  const updateField = <K extends keyof CancellationSettings>(key: K, value: CancellationSettings[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const updateWindow = (id: string, field: keyof CancellationWindow, value: any) => {
    setData((prev) => ({
      ...prev,
      windows: prev.windows.map((w) => (w.id === id ? { ...w, [field]: value } : w)),
    }));
  };

  const addWindow = () => {
    setData((prev) => ({ ...prev, windows: [...prev.windows, defaultWindow()] }));
  };

  const removeWindow = (id: string) => {
    setData((prev) => ({ ...prev, windows: prev.windows.filter((w) => w.id !== id) }));
  };

  const toggleStatus = (status: string) => {
    setData((prev) => {
      const current = prev.nonCancellableStatuses;
      const next = current.includes(status) ? current.filter((s) => s !== status) : [...current, status];
      return { ...prev, nonCancellableStatuses: next };
    });
  };

  const generatePolicyText = () => {
    const lines: string[] = [];
    if (!data.enabled) {
      lines.push('Cancellations are not available at this time.');
    } else {
      lines.push('Our cancellation policy:');
      const sorted = [...data.windows].sort((a, b) => a.maxHoursAfterOrder - b.maxHoursAfterOrder);
      for (const w of sorted) {
        const feeStr = w.feeValue === 0 ? 'free' : w.feeType === 'percentage' ? `${w.feeValue}% fee` : `$${w.feeValue.toFixed(2)} fee`;
        lines.push(`- Within ${w.maxHoursAfterOrder} hours: ${feeStr}`);
      }
      const defaultFeeStr = data.defaultFeeType === 'percentage' ? `${data.defaultFeeValue}%` : `$${data.defaultFeeValue.toFixed(2)}`;
      lines.push(`- After all windows: ${defaultFeeStr} fee`);
      if (data.nonCancellableStatuses.length > 0) {
        lines.push(`Orders that are ${data.nonCancellableStatuses.join(', ').toLowerCase()} cannot be cancelled.`);
      }
      if (data.refundMethod === 'original_payment') {
        lines.push('Refunds are issued to the original payment method.');
      } else if (data.refundMethod === 'store_credit') {
        lines.push('Refunds are issued as store credit.');
      } else {
        lines.push('Refunds can be issued to the original payment method or as store credit.');
      }
    }
    updateField('policyText', lines.join('\n'));
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
          title="Cancellation Settings"
          description="Configure cancellation policies and fees"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings' },
            { label: 'Ecommerce' },
            { label: 'Cancellation' },
          ]}
          actions={
            <Button onClick={handleSave} disabled={!hasChanges || saving || !selectedStorefront} className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
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

        {pendingApproval && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Pending approval</strong> — your changes are awaiting review.
            </p>
          </div>
        )}

        {selectedStorefront ? (
          loading ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* General Settings */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">General Settings</h3>
                    <p className="text-sm text-muted-foreground">Enable and configure cancellation basics</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Checkbox checked={data.enabled} onChange={(e) => updateField('enabled', e.target.checked)} label="Enable Cancellations" description="Allow customers to cancel orders" />
                  {data.enabled && (
                    <div className="ml-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Checkbox checked={data.requireReason} onChange={(e) => updateField('requireReason', e.target.checked)} label="Require Reason" description="Customers must provide a cancellation reason" />
                        <Checkbox checked={data.allowPartialCancellation} onChange={(e) => updateField('allowPartialCancellation', e.target.checked)} label="Allow Partial Cancellation" description="Cancel individual items from an order" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Refund Method</label>
                        <Select
                          value={data.refundMethod}
                          onChange={(value) => updateField('refundMethod', value as CancellationSettings['refundMethod'])}
                          options={[
                            { value: 'original_payment', label: 'Original Payment Method' },
                            { value: 'store_credit', label: 'Store Credit' },
                            { value: 'either', label: 'Customer Choice' },
                          ]}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cancellation Windows */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                      <XCircle className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Cancellation Windows</h3>
                      <p className="text-sm text-muted-foreground">Define tiered cancellation fee windows</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={addWindow}>
                    <Plus className="h-4 w-4 mr-1" /> Add Window
                  </Button>
                </div>
                <div className="space-y-4">
                  {data.windows.map((w, idx) => (
                    <div key={w.id} className="border border-border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">Window {idx + 1}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeWindow(w.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-1">Name</label>
                          <Input value={w.name} onChange={(e) => updateWindow(w.id, 'name', e.target.value)} placeholder="e.g. Free cancellation" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-1">Max Hours After Order</label>
                          <Input type="number" min="0" value={w.maxHoursAfterOrder} onChange={(e) => updateWindow(w.id, 'maxHoursAfterOrder', parseInt(e.target.value) || 0)} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-1">Fee Type</label>
                          <Select
                            value={w.feeType}
                            onChange={(value) => updateWindow(w.id, 'feeType', value)}
                            options={[
                              { value: 'percentage', label: 'Percentage (%)' },
                              { value: 'fixed', label: 'Fixed ($)' },
                            ]}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-1">Fee Value</label>
                          <Input type="number" min="0" step="0.5" value={w.feeValue} onChange={(e) => updateWindow(w.id, 'feeValue', parseFloat(e.target.value) || 0)} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-foreground mb-1">Description</label>
                          <Input value={w.description} onChange={(e) => updateWindow(w.id, 'description', e.target.value)} placeholder="Customer-facing description" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {data.windows.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No windows configured. The default fee will apply to all cancellations.</p>
                  )}
                </div>
              </div>

              {/* Default Fee */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Default Fee</h3>
                    <p className="text-sm text-muted-foreground">Applied when no cancellation window matches</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Fee Type</label>
                    <Select
                      value={data.defaultFeeType}
                      onChange={(value) => updateField('defaultFeeType', value as 'percentage' | 'fixed')}
                      options={[
                        { value: 'percentage', label: 'Percentage (%)' },
                        { value: 'fixed', label: 'Fixed ($)' },
                      ]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Fee Value</label>
                    <Input type="number" min="0" step="0.5" value={data.defaultFeeValue} onChange={(e) => updateField('defaultFeeValue', parseFloat(e.target.value) || 0)} />
                  </div>
                </div>
              </div>

              {/* Order Status Restrictions */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Order Status Restrictions</h3>
                    <p className="text-sm text-muted-foreground">Statuses where cancellation is not allowed</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ORDER_STATUSES.map((status) => (
                    <Checkbox
                      key={status}
                      checked={data.nonCancellableStatuses.includes(status)}
                      onChange={() => toggleStatus(status)}
                      label={status.replace(/_/g, ' ')}
                      description={`Block cancellation for ${status.toLowerCase().replace(/_/g, ' ')} orders`}
                    />
                  ))}
                </div>
              </div>

              {/* Customer Policy Text */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                      <XCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">Customer Policy Text</h3>
                      <p className="text-sm text-muted-foreground">Shown to customers in the cancellation dialog</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={generatePolicyText}>
                    <Sparkles className="h-4 w-4 mr-1" /> Auto-generate
                  </Button>
                </div>
                <textarea
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm min-h-[120px] resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                  value={data.policyText}
                  onChange={(e) => updateField('policyText', e.target.value)}
                  placeholder="Enter your cancellation policy text..."
                />
              </div>

              {/* Approval Requirement */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Approval Requirement</h3>
                    <p className="text-sm text-muted-foreground">Require admin approval for policy changes</p>
                  </div>
                </div>
                <Checkbox
                  checked={data.requireApprovalForPolicyChanges}
                  onChange={(e) => updateField('requireApprovalForPolicyChanges', e.target.checked)}
                  label="Require Approval for Policy Changes"
                  description="Non-admin staff must submit changes for approval before they take effect"
                />
              </div>
            </div>
          )
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <XCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Create Your First Storefront</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Get started by creating a storefront to configure cancellation settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
