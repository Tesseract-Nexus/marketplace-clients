'use client';

import { useState } from 'react';
import { CreditCard, Clock, ExternalLink, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/contexts/SubscriptionContext';

function formatCurrency(cents: number, currency: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency.toUpperCase() }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active': return <Badge variant="success">Active</Badge>;
    case 'trialing': return <Badge variant="info">Trial</Badge>;
    case 'past_due': return <Badge variant="warning">Past Due</Badge>;
    case 'expired': return <Badge variant="destructive">Expired</Badge>;
    case 'suspended': return <Badge variant="destructive">Suspended</Badge>;
    case 'canceled': return <Badge variant="secondary">Canceled</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function SubscriptionSettingsPage() {
  const { subscription, isLoading, refresh } = useSubscription();
  const [actionLoading, setActionLoading] = useState(false);

  const handleAddPayment = async () => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/subscription/setup-payment', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          successUrl: window.location.origin + '/settings/subscription?payment=success',
          cancelUrl: window.location.origin + '/settings/subscription?payment=canceled',
        }),
      });
      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error('Failed to create setup payment session:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });
      const data = await response.json();
      if (data.portalUrl) {
        window.location.href = data.portalUrl;
      }
    } catch (err) {
      console.error('Failed to create portal session:', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Subscription</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Subscription</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No subscription found for this store.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const trialProgress = subscription.isTrialing && subscription.trialEndsAt
    ? Math.max(0, Math.min(100, (subscription.trialDaysLeft / 180) * 100))
    : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Subscription</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Plan</span>
              {getStatusBadge(subscription.status)}
            </CardTitle>
            <CardDescription>{subscription.planDisplayName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">
              {formatCurrency(subscription.amount, subscription.currency)}
              <span className="text-base font-normal text-muted-foreground">/month</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Products</span>
                <span>{subscription.maxProducts === -1 ? 'Unlimited' : subscription.maxProducts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Users</span>
                <span>{subscription.maxUsers === -1 ? 'Unlimited' : subscription.maxUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Storage</span>
                <span>{subscription.maxStorageMb === -1 ? 'Unlimited' : `${(subscription.maxStorageMb / 1024).toFixed(1)}GB`}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trial / Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {subscription.isTrialing ? (
                <><Clock className="h-5 w-5" /> Trial Period</>
              ) : (
                <><CreditCard className="h-5 w-5" /> Payment Status</>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription.isTrialing && (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Days remaining</span>
                    <span className="font-medium">{subscription.trialDaysLeft} days</span>
                  </div>
                  {trialProgress !== null && (
                    <div className="w-full bg-muted rounded-full h-2.5">
                      <div
                        className="bg-primary h-2.5 rounded-full transition-all"
                        style={{ width: `${trialProgress}%` }}
                      />
                    </div>
                  )}
                  {subscription.trialEndsAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Trial ends: {new Date(subscription.trialEndsAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              {subscription.hasPaymentMethod ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Payment method on file</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm">No payment method</span>
                </>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {!subscription.hasPaymentMethod && (
                <Button onClick={handleAddPayment} disabled={actionLoading}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              )}
              {subscription.hasPaymentMethod && (
                <Button variant="outline" onClick={handleManageBilling} disabled={actionLoading}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Billing
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
