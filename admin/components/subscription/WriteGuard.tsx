'use client';

import { ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface WriteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function WriteGuard({ children, fallback }: WriteGuardProps) {
  const { canWrite, subscription } = useSubscription();

  if (!canWrite) {
    if (fallback) return <>{fallback}</>;
    return (
      <Alert variant="warning" className="my-4">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Read-Only Mode</AlertTitle>
        <AlertDescription>
          {subscription?.warningMessage || 'Your subscription does not allow modifications. Please update your payment method to continue.'}
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
