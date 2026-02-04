'use client';

import React, { useState } from 'react';
import { Store, Save, Settings, ShoppingCart } from 'lucide-react';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/Select';
import { PageHeader } from '@/components/PageHeader';
import { useDialog } from '@/contexts/DialogContext';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';

const mockMarketplaceData = {
  enabled: true,
  vendors: { enableVendorRegistration: true, requireVendorApproval: true, enableVendorProfiles: true, enableVendorRatings: true, maxProductsPerVendor: 1000, enableVendorChat: true },
  commissions: { defaultCommissionPercent: 15, enableTieredCommissions: true, commissionCalculation: 'net_sale', minimumPayout: 100, payoutSchedule: 'weekly' },
  fees: { listingFee: 0.50, subscriptionFee: 29.99, transactionFee: 2.9, enableSetupFee: true, setupFee: 99.00 },
};

export default function MarketplaceSettingsPage() {
  const { showAlert } = useDialog();
  const [marketplaceData, setMarketplaceData] = useState(mockMarketplaceData);
  const [savedData, setSavedData] = useState(mockMarketplaceData);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSavedData(marketplaceData);
    setSaving(false);
    await showAlert({ title: 'Success', message: 'Marketplace settings saved successfully!' });
  };

  const hasChanges = JSON.stringify(marketplaceData) !== JSON.stringify(savedData);
  const updateField = (path: string[], value: any) => {
    setMarketplaceData((prev) => {
      const newData = JSON.parse(JSON.stringify(prev));
      let current: any = newData;
      for (let i = 0; i < path.length - 1; i++) current = current[path[i]];
      current[path[path.length - 1]] = value;
      return newData;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Marketplace Settings"
          description="Configure multi-vendor marketplace features"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Settings', href: '/settings', icon: Settings },
            { label: 'Ecommerce', icon: ShoppingCart },
            { label: 'Marketplace', icon: Store },
          ]}
          actions={
            <Button onClick={handleSave} disabled={!hasChanges || saving} className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          }
        />

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Marketplace Mode</h3>
                <p className="text-sm text-muted-foreground">Enable multi-vendor functionality</p>
              </div>
            </div>
            <Checkbox checked={marketplaceData.enabled} onChange={(e) => updateField(['enabled'], e.target.checked)} label="Enable Marketplace Mode" description="Allow multiple vendors to sell on your platform" />
          </div>

          {marketplaceData.enabled && (
            <>
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <Store className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Vendor Management</h3>
                    <p className="text-sm text-muted-foreground">Vendor registration and capabilities</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Max Products Per Vendor</label>
                    <Input type="number" min="1" max="100000" value={marketplaceData.vendors.maxProductsPerVendor} onChange={(e) => updateField(['vendors', 'maxProductsPerVendor'], parseInt(e.target.value))} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Checkbox checked={marketplaceData.vendors.enableVendorRegistration} onChange={(e) => updateField(['vendors', 'enableVendorRegistration'], e.target.checked)} label="Vendor Registration" description="Allow public vendor signup" />
                    <Checkbox checked={marketplaceData.vendors.requireVendorApproval} onChange={(e) => updateField(['vendors', 'requireVendorApproval'], e.target.checked)} label="Require Approval" description="Manually approve new vendors" />
                    <Checkbox checked={marketplaceData.vendors.enableVendorProfiles} onChange={(e) => updateField(['vendors', 'enableVendorProfiles'], e.target.checked)} label="Vendor Profiles" description="Public vendor profile pages" />
                    <Checkbox checked={marketplaceData.vendors.enableVendorRatings} onChange={(e) => updateField(['vendors', 'enableVendorRatings'], e.target.checked)} label="Vendor Ratings" description="Customer ratings for vendors" />
                    <Checkbox checked={marketplaceData.vendors.enableVendorChat} onChange={(e) => updateField(['vendors', 'enableVendorChat'], e.target.checked)} label="Vendor Chat" description="Direct messaging with vendors" />
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Commission Structure</h3>
                    <p className="text-sm text-muted-foreground">Revenue sharing configuration</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Default Commission (%)</label>
                      <Input type="number" min="0" max="100" step="0.1" value={marketplaceData.commissions.defaultCommissionPercent} onChange={(e) => updateField(['commissions', 'defaultCommissionPercent'], parseFloat(e.target.value))} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Commission Calculation</label>
                      <Select value={marketplaceData.commissions.commissionCalculation} onChange={(value) => updateField(['commissions', 'commissionCalculation'], value)} options={[
                        { value: 'gross_sale', label: 'Gross Sale (before fees)' },
                        { value: 'net_sale', label: 'Net Sale (after fees)' },
                      ]} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Minimum Payout ($)</label>
                      <Input type="number" min="0" step="10" value={marketplaceData.commissions.minimumPayout} onChange={(e) => updateField(['commissions', 'minimumPayout'], parseFloat(e.target.value))} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Payout Schedule</label>
                      <Select value={marketplaceData.commissions.payoutSchedule} onChange={(value) => updateField(['commissions', 'payoutSchedule'], value)} options={[
                        { value: 'daily', label: 'Daily' },
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'biweekly', label: 'Bi-Weekly' },
                        { value: 'monthly', label: 'Monthly' },
                      ]} />
                    </div>
                  </div>
                  <Checkbox checked={marketplaceData.commissions.enableTieredCommissions} onChange={(e) => updateField(['commissions', 'enableTieredCommissions'], e.target.checked)} label="Tiered Commissions" description="Lower rates for high-volume vendors" />
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                    <Store className="h-6 w-6 text-warning" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Vendor Fees</h3>
                    <p className="text-sm text-muted-foreground">Additional fees for vendors</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Listing Fee ($)</label>
                      <Input type="number" min="0" step="0.10" value={marketplaceData.fees.listingFee} onChange={(e) => updateField(['fees', 'listingFee'], parseFloat(e.target.value))} />
                      <p className="text-xs text-muted-foreground mt-1">Per product listing</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Monthly Subscription Fee ($)</label>
                      <Input type="number" min="0" step="5" value={marketplaceData.fees.subscriptionFee} onChange={(e) => updateField(['fees', 'subscriptionFee'], parseFloat(e.target.value))} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Transaction Fee (%)</label>
                      <Input type="number" min="0" max="10" step="0.1" value={marketplaceData.fees.transactionFee} onChange={(e) => updateField(['fees', 'transactionFee'], parseFloat(e.target.value))} />
                      <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
                    </div>
                  </div>
                  <div>
                    <Checkbox checked={marketplaceData.fees.enableSetupFee} onChange={(e) => updateField(['fees', 'enableSetupFee'], e.target.checked)} label="One-Time Setup Fee" description="Charge fee for new vendor accounts" />
                    {marketplaceData.fees.enableSetupFee && (
                      <div className="ml-6 mt-2">
                        <label className="block text-sm font-semibold text-foreground mb-2">Setup Fee ($)</label>
                        <Input type="number" min="0" step="10" value={marketplaceData.fees.setupFee} onChange={(e) => updateField(['fees', 'setupFee'], parseFloat(e.target.value))} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
