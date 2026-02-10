'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { useTenant } from './TenantContext';

export interface SubscriptionStatus {
  tenantId: string;
  status: string;
  planName: string;
  planDisplayName: string;
  currency: string;
  amount: number;
  isTrialing: boolean;
  trialDaysLeft: number;
  trialEndsAt?: string;
  isInGracePeriod: boolean;
  graceDaysLeft: number;
  graceEndsAt?: string;
  canRead: boolean;
  canWrite: boolean;
  canAccessAdmin: boolean;
  warningLevel: 'none' | 'info' | 'warning' | 'critical' | 'blocked';
  warningMessage: string;
  warningAction: string;
  hasPaymentMethod: boolean;
  maxProducts: number;
  maxUsers: number;
  maxStorageMb: number;
}

interface SubscriptionContextType {
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;
  canWrite: boolean;
  isBlocked: boolean;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { currentTenant } = useTenant();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!currentTenant?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/subscription/status', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No subscription yet — treat as not subscribed
          setSubscription(null);
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to fetch subscription status');
      }

      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      console.error('Error fetching subscription status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setIsLoading(false);
    }
  }, [currentTenant?.id]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const canWrite = subscription?.canWrite ?? true;
  const isBlocked = subscription?.warningLevel === 'blocked';

  const contextValue = useMemo(() => ({
    subscription,
    isLoading,
    error,
    canWrite,
    isBlocked,
    refresh: fetchStatus,
  }), [subscription, isLoading, error, canWrite, isBlocked, fetchStatus]);

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export function useCanWrite() {
  const { canWrite } = useSubscription();
  return canWrite;
}
