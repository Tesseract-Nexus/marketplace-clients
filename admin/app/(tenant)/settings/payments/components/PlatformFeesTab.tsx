'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Clock, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/Select';
import { useDialog } from '@/contexts/DialogContext';
import {
  paymentsService,
  PaymentSettings,
  FeeSummary,
  FeeLedgerEntry,
  FeePayer,
} from '@/lib/api/payments';

const feePayerOptions = [
  { value: 'merchant', label: 'Deduct from Merchant Payout (Recommended)' },
  { value: 'customer', label: 'Add to Customer Total' },
  { value: 'split', label: 'Split 50/50' },
];

export function PlatformFeesTab() {
  const { showSuccess, showError } = useDialog();
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [ledger, setLedger] = useState<FeeLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<PaymentSettings>>({
    platformFeeEnabled: true,
    platformFeePercent: 0.05,
    feePayer: 'merchant',
    collectFeesOnRefund: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, summaryData, ledgerData] = await Promise.all([
        paymentsService.getPaymentSettings(),
        paymentsService.getFeeSummary(),
        paymentsService.getFeeLedger({ limit: 10 }),
      ]);
      setSettings(settingsData);
      setFormData(settingsData);
      setSummary(summaryData.summary);
      setLedger(ledgerData.entries);
    } catch (error) {
      console.error('Failed to load fee settings:', error);
      // Set defaults on error
      setFormData({
        platformFeeEnabled: true,
        platformFeePercent: 0.05,
        feePayer: 'merchant',
        collectFeesOnRefund: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await paymentsService.updatePaymentSettings(formData);
      showSuccess('Success', 'Platform fee settings updated successfully');
      loadData();
    } catch (error: any) {
      showError('Error', error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fee Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Collected</span>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalCollected)}</p>
            <p className="text-xs text-muted-foreground mt-1">{summary.collectionCount} transactions</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Refunded</span>
              <TrendingDown className="h-4 w-4 text-error" />
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalRefunded)}</p>
            <p className="text-xs text-muted-foreground mt-1">{summary.refundCount} refunds</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Pending</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(summary.totalPending)}</p>
            <p className="text-xs text-muted-foreground mt-1">{summary.pendingCount} pending</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Net Fees</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-success">{formatCurrency(summary.netFees)}</p>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </div>
        </div>
      )}

      {/* Platform Fee Configuration */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-4">Platform Fee Configuration</h3>

        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">How Platform Fees Work</p>
            <p className="text-sm text-primary mt-1">
              Platform fees are automatically collected on each successful payment. For Stripe, this uses
              the Application Fee feature with Stripe Connect. The fee is deducted before funds are
              transferred to the merchant's connected account.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-semibold text-foreground">Enable Platform Fees</label>
              <p className="text-sm text-muted-foreground">Automatically collect a percentage of each transaction</p>
            </div>
            <Checkbox
              checked={formData.platformFeeEnabled}
              onChange={(e) => setFormData({ ...formData, platformFeeEnabled: e.target.checked })}
            />
          </div>

          {formData.platformFeeEnabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Platform Fee Percentage
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={(formData.platformFeePercent || 0) * 100}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          platformFeePercent: parseFloat(e.target.value) / 100,
                        })
                      }
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {formatPercent(formData.platformFeePercent || 0.05)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Minimum Fee (optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.minimumPlatformFee || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minimumPlatformFee: parseFloat(e.target.value) || undefined,
                        })
                      }
                      className="pl-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Maximum Fee (optional)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maximumPlatformFee || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maximumPlatformFee: parseFloat(e.target.value) || undefined,
                        })
                      }
                      className="pl-8"
                      placeholder="No limit"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Fee Payer
                </label>
                <Select
                  value={formData.feePayer || 'merchant'}
                  onChange={(value) => setFormData({ ...formData, feePayer: value as FeePayer })}
                  options={feePayerOptions}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Determines who pays the platform fee
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-foreground">Collect Fees on Refund</label>
                  <p className="text-sm text-muted-foreground">
                    Keep platform fees when a refund is processed
                  </p>
                </div>
                <Checkbox
                  checked={formData.collectFeesOnRefund}
                  onChange={(e) =>
                    setFormData({ ...formData, collectFeesOnRefund: e.target.checked })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Platform Account ID (for Stripe Connect)
                </label>
                <Input
                  value={formData.platformAccountId || ''}
                  onChange={(e) => setFormData({ ...formData, platformAccountId: e.target.value })}
                  placeholder="acct_xxxxx"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your Stripe Connect platform account ID where fees are deposited
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-border">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Fee Calculator */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <h3 className="text-lg font-bold text-foreground mb-4">Fee Calculator</h3>
        <FeeCalculator platformFeePercent={formData.platformFeePercent || 0.05} />
      </div>

      {/* Recent Ledger Entries */}
      {ledger.length > 0 && (
        <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-4">Recent Fee Activity</h3>
          <div className="space-y-2">
            {ledger.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      entry.status === 'collected'
                        ? 'bg-success'
                        : entry.status === 'pending'
                        ? 'bg-warning'
                        : entry.status === 'refunded'
                        ? 'bg-primary'
                        : 'bg-error'
                    }`}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {entry.entryType === 'collection' ? 'Fee Collection' : 'Fee Refund'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    entry.amount >= 0 ? 'text-success' : 'text-error'
                  }`}
                >
                  {entry.amount >= 0 ? '+' : ''}
                  {formatCurrency(entry.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FeeCalculator({ platformFeePercent }: { platformFeePercent: number }) {
  const [amount, setAmount] = useState<number>(100);
  const [gatewayFeePercent] = useState<number>(0.029); // Stripe default
  const [gatewayFixedFee] = useState<number>(0.30);

  const platformFee = amount * platformFeePercent;
  const gatewayFee = amount * gatewayFeePercent + gatewayFixedFee;
  const totalFees = platformFee + gatewayFee;
  const merchantReceives = amount - totalFees;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Transaction Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Platform Fee ({(platformFeePercent * 100).toFixed(2)}%)</span>
          <span className="font-medium text-foreground">${platformFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Gateway Fee (est. 2.9% + $0.30)</span>
          <span className="font-medium text-foreground">${gatewayFee.toFixed(2)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between text-sm">
          <span className="text-muted-foreground">Total Fees</span>
          <span className="font-medium text-error">${totalFees.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-bold">
          <span className="text-foreground">Merchant Receives</span>
          <span className="text-success">${merchantReceives.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
