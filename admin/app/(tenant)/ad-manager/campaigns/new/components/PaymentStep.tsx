'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  Percent,
  Info,
  Check,
  Loader2,
  Sparkles,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { adBillingService } from '@/lib/services/adBillingService';
import type {
  AdPaymentType,
  AdCommissionTier,
  CommissionCalculation,
} from '@/lib/api/types';
import { cn } from '@/lib/utils';

interface PaymentStepProps {
  budgetTotal: number;
  startDate: string;
  endDate: string;
  currency?: string;
  paymentType: AdPaymentType;
  setPaymentType: (type: AdPaymentType) => void;
}

function CommissionTiersTable({ tiers, currentDays }: { tiers: AdCommissionTier[]; currentDays: number }) {
  if (tiers.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h4 className="text-sm font-medium text-muted-foreground mb-3">Commission Rate Tiers</h4>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Duration</th>
              <th className="text-right px-4 py-2 font-medium">Rate</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => {
              const isApplicable = currentDays >= tier.minDays && (!tier.maxDays || currentDays <= tier.maxDays);
              return (
                <tr
                  key={tier.id}
                  className={cn(
                    'border-t',
                    isApplicable && 'bg-primary/5'
                  )}
                >
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {isApplicable && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                      <span>{tier.name}</span>
                    </div>
                  </td>
                  <td className="text-right px-4 py-2">
                    <span className={cn(isApplicable && 'font-semibold text-primary')}>
                      {adBillingService.formatCommissionRate(tier.commissionRate)}
                    </span>
                    {tier.taxInclusive && (
                      <span className="text-xs text-muted-foreground ml-1">(incl. tax)</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentTypeCard({
  type,
  title,
  description,
  amount,
  currency,
  isSelected,
  onClick,
  recommended,
  children,
}: {
  type: AdPaymentType;
  title: string;
  description: string;
  amount: number;
  currency: string;
  isSelected: boolean;
  onClick: () => void;
  recommended?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative border-2 rounded-xl p-4 sm:p-6 cursor-pointer transition-all',
        isSelected
          ? 'border-primary bg-primary/5 shadow-md'
          : 'border-muted hover:border-muted-foreground/30 hover:shadow-sm'
      )}
    >
      {recommended && (
        <div className="absolute -top-3 left-4">
          <Badge className="bg-primary text-primary-foreground">
            <Sparkles className="w-3 h-3 mr-1" />
            Recommended
          </Badge>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
            isSelected
              ? 'border-primary bg-primary'
              : 'border-muted-foreground/30'
          )}
        >
          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            <div className="text-xl sm:text-2xl font-bold">
              {adBillingService.formatCurrency(amount, currency)}
            </div>
          </div>
          <p className="text-muted-foreground mt-1">{description}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function PaymentStep({
  budgetTotal,
  startDate,
  endDate,
  currency = 'USD',
  paymentType,
  setPaymentType,
}: PaymentStepProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commissionTiers, setCommissionTiers] = useState<AdCommissionTier[]>([]);
  const [commissionCalc, setCommissionCalc] = useState<CommissionCalculation | null>(null);

  const campaignDays = startDate && endDate
    ? adBillingService.calculateCampaignDays(startDate, endDate)
    : 0;

  useEffect(() => {
    async function loadData() {
      if (budgetTotal <= 0 || campaignDays <= 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [tiersRes, calcRes] = await Promise.all([
          adBillingService.getCommissionTiers(),
          adBillingService.calculateCommission({
            campaignDays,
            budgetAmount: budgetTotal,
            currency,
          }),
        ]);

        if (tiersRes.success) {
          setCommissionTiers(tiersRes.data);
        }

        if (calcRes.success) {
          setCommissionCalc(calcRes.data);
        }
      } catch (err) {
        console.error('Failed to load commission data:', err);
        setError('Failed to load commission information. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [budgetTotal, campaignDays, currency]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Choose how you want to pay for this campaign</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Choose how you want to pay for this campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (budgetTotal <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Choose how you want to pay for this campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-warning-muted border border-warning/30 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
            <p className="text-amber-800">
              Please set a campaign budget in the previous step to see payment options.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>
            Choose how you want to pay for this campaign. Platform fees apply based on your selection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Campaign Info Summary */}
          <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Budget:</span>
              <span className="font-semibold">{adBillingService.formatCurrency(budgetTotal, currency)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-semibold">{campaignDays} days</span>
            </div>
          </div>

          {/* Payment Type Selection */}
          <div className="space-y-4 pt-2">
            {/* Direct Payment Option */}
            <PaymentTypeCard
              type="DIRECT"
              title="Direct Ad Purchase"
              description="Pay the full campaign budget upfront. Your ads will run with the allocated budget with no additional fees."
              amount={budgetTotal}
              currency={currency}
              isSelected={paymentType === 'DIRECT'}
              onClick={() => setPaymentType('DIRECT')}
              recommended
            >
              <div className="mt-4 flex items-center gap-2 text-sm text-success">
                <Check className="w-4 h-4" />
                <span>No commission fees</span>
              </div>
            </PaymentTypeCard>

            {/* Sponsored Payment Option */}
            <PaymentTypeCard
              type="SPONSORED"
              title="Sponsored Ads"
              description="Pay a commission fee based on campaign duration. Ideal for sponsored campaigns where a third party is funding your ads."
              amount={commissionCalc?.totalAmount || 0}
              currency={currency}
              isSelected={paymentType === 'SPONSORED'}
              onClick={() => setPaymentType('SPONSORED')}
            >
              {commissionCalc && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Percent className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Commission Rate:</span>
                    <Badge variant="secondary">
                      {adBillingService.formatCommissionRate(commissionCalc.commissionRate)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ({commissionCalc.tierName})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="w-4 h-4" />
                    <span>
                      Commission: {adBillingService.formatCurrency(commissionCalc.commissionAmount, currency)}
                      {commissionCalc.taxInclusive && ' (tax inclusive)'}
                    </span>
                  </div>
                </div>
              )}
            </PaymentTypeCard>
          </div>

          {/* Commission Tiers Table */}
          {paymentType === 'SPONSORED' && (
            <CommissionTiersTable tiers={commissionTiers} currentDays={campaignDays} />
          )}
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Campaign Budget</span>
              <span>{adBillingService.formatCurrency(budgetTotal, currency)}</span>
            </div>

            {paymentType === 'SPONSORED' && commissionCalc && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Platform Commission ({adBillingService.formatCommissionRate(commissionCalc.commissionRate)})
                  </span>
                  <span>{adBillingService.formatCurrency(commissionCalc.commissionAmount, currency)}</span>
                </div>
                {commissionCalc.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{adBillingService.formatCurrency(commissionCalc.taxAmount, currency)}</span>
                  </div>
                )}
              </>
            )}

            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total Due Now</span>
                <span className="text-primary">
                  {paymentType === 'DIRECT'
                    ? adBillingService.formatCurrency(budgetTotal, currency)
                    : adBillingService.formatCurrency(commissionCalc?.totalAmount || 0, currency)}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Payment will be processed securely via {paymentType === 'DIRECT' ? 'direct payment' : 'our payment gateway'}.
              {paymentType === 'SPONSORED' && ' Commission rates are tax inclusive.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-800">Payment after campaign creation</p>
          <p className="text-sm text-blue-700">
            After creating your campaign, you&apos;ll be redirected to complete the payment.
            Your campaign will remain in draft status until payment is confirmed.
          </p>
        </div>
      </div>
    </div>
  );
}
