'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, CreditCard, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

export function SubscriptionBanner() {
  const { subscription, isLoading } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  // Check dismiss cookie on mount
  useEffect(() => {
    const dismissedAt = getCookie('subscription_banner_dismissed_at');
    if (dismissedAt) {
      setDismissed(true);
    }
  }, []);

  if (isLoading || !subscription || subscription.warningLevel === 'none') {
    return null;
  }

  const { warningLevel, warningMessage, warningAction, isTrialing, trialDaysLeft } = subscription;

  // Dismissible only for info and warning levels
  const isDismissible = warningLevel === 'info' || warningLevel === 'warning';

  if (dismissed && isDismissible) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    // info = 24h dismiss, warning = 6h dismiss
    const maxAge = warningLevel === 'info' ? 86400 : 21600;
    setCookie('subscription_banner_dismissed_at', new Date().toISOString(), maxAge);
  };

  const handleAction = async () => {
    if (warningAction === 'add_payment' || warningAction === 'update_payment') {
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
      }
    } else if (warningAction === 'contact_support') {
      window.location.href = '/support';
    }
  };

  let variant: 'info' | 'warning' | 'error' | 'destructive' = 'info';
  let Icon = Clock;
  let title = 'Trial Information';

  switch (warningLevel) {
    case 'info':
      variant = 'info';
      Icon = Clock;
      title = isTrialing ? `Trial: ${trialDaysLeft} days remaining` : 'Subscription Info';
      break;
    case 'warning':
      variant = 'warning';
      Icon = AlertTriangle;
      title = `Trial ends in ${trialDaysLeft} days`;
      break;
    case 'critical':
      variant = 'error';
      Icon = ShieldAlert;
      title = 'Payment Required';
      break;
    case 'blocked':
      variant = 'destructive';
      Icon = ShieldAlert;
      title = 'Store Access Limited';
      break;
  }

  const actionLabel = warningAction === 'contact_support' ? 'Contact Support' : 'Add Payment Method';

  return (
    <Alert variant={variant} className="mb-4 relative">
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>{title}</span>
        {isDismissible && (
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-md hover:bg-black/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between mt-1">
        <span>{warningMessage}</span>
        {(warningLevel === 'warning' || warningLevel === 'critical' || warningLevel === 'blocked') && (
          <Button
            size="sm"
            variant={warningLevel === 'blocked' ? 'destructive' : 'default'}
            onClick={handleAction}
            className="ml-4 shrink-0"
          >
            <CreditCard className="h-4 w-4 mr-1" />
            {actionLabel}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
