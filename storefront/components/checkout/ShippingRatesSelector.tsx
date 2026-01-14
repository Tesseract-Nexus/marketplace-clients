'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Zap, Clock, Check, Loader2, Package, Shield, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenant } from '@/context/TenantContext';
import {
  getShippingRatesForOrder,
  formatShippingRate,
  formatRateDelivery,
  sortRatesByCheapest,
  sortRatesByFastest,
  type ShippingRate,
} from '@/lib/api/shipping';

export type RateSortOrder = 'cheapest' | 'fastest';

interface ShippingRatesSelectorProps {
  fromCountry: string;
  fromPostalCode: string;
  toCountry: string;
  toPostalCode: string;
  toCity?: string;
  toState?: string;
  totalWeight: number;
  weightUnit?: 'kg' | 'lb' | 'g' | 'oz';
  currency?: string;
  selectedRateId?: string;
  onSelect: (rate: ShippingRate) => void;
  disabled?: boolean;
  sortOrder?: RateSortOrder;
  showCarrierLogos?: boolean;
}

export function ShippingRatesSelector({
  fromCountry,
  fromPostalCode,
  toCountry,
  toPostalCode,
  toCity,
  toState,
  totalWeight,
  weightUnit = 'kg',
  currency,
  selectedRateId,
  onSelect,
  disabled = false,
  sortOrder = 'cheapest',
  showCarrierLogos = true,
}: ShippingRatesSelectorProps) {
  const { tenant } = useTenant();
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRates = async () => {
      if (!tenant || !toPostalCode || !fromPostalCode) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await getShippingRatesForOrder(tenant.id, tenant.storefrontId, {
          fromCountry,
          fromPostalCode,
          toCountry,
          toPostalCode,
          toCity,
          toState,
          totalWeight,
          weightUnit,
          currency,
        });

        // Sort rates based on preference
        const sortedRates = sortOrder === 'fastest'
          ? sortRatesByFastest(data)
          : sortRatesByCheapest(data);

        setRates(sortedRates);

        // Auto-select first rate if none selected
        if (sortedRates.length > 0 && !selectedRateId) {
          onSelect(sortedRates[0]!);
        }
      } catch (err) {
        console.error('Failed to fetch shipping rates:', err);
        setError('Unable to load shipping rates. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, [tenant, fromCountry, fromPostalCode, toCountry, toPostalCode, toCity, toState, totalWeight, weightUnit, currency, sortOrder]);

  const getCarrierIcon = (carrier: string) => {
    const lowerCarrier = carrier.toLowerCase();
    if (lowerCarrier.includes('express') || lowerCarrier.includes('priority')) {
      return <Zap className="h-5 w-5" />;
    }
    if (lowerCarrier.includes('overnight') || lowerCarrier.includes('next')) {
      return <Clock className="h-5 w-5" />;
    }
    return <Truck className="h-5 w-5" />;
  };

  const handleSelect = (rate: ShippingRate) => {
    if (disabled) return;
    onSelect(rate);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Fetching real-time shipping rates...
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 rounded-lg border bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-200">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4" />
          <p className="text-sm">No shipping rates available for this destination.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {rates.map((rate, index) => {
          const isSelected = selectedRateId === rate.id;

          return (
            <motion.button
              key={rate.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelect(rate)}
              disabled={disabled}
              className={cn(
                'w-full p-4 rounded-lg border text-left transition-all',
                'hover:border-tenant-primary/50 hover:shadow-sm',
                'focus:outline-none focus:ring-2 focus:ring-tenant-primary/20',
                isSelected
                  ? 'border-tenant-primary bg-tenant-primary/5 ring-2 ring-tenant-primary/20'
                  : 'border-border bg-card',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'mt-0.5 w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                      isSelected
                        ? 'bg-tenant-primary text-on-tenant-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {getCarrierIcon(rate.service)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rate.serviceDisplayName}</span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-tenant-primary flex items-center justify-center"
                        >
                          <Check className="h-3 w-3 text-on-tenant-primary" />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {rate.carrierDisplayName}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRateDelivery(rate)}
                      </span>
                      {rate.trackingSupported && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <Package className="h-3 w-3" />
                          Tracking
                        </span>
                      )}
                      {rate.insuranceAvailable && (
                        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Shield className="h-3 w-3" />
                          Insurance
                        </span>
                      )}
                      {rate.isGuaranteed && (
                        <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                          <Check className="h-3 w-3" />
                          Guaranteed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-lg">
                    {formatShippingRate(rate)}
                  </span>
                  {index === 0 && sortOrder === 'cheapest' && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                      Best value
                    </p>
                  )}
                  {index === 0 && sortOrder === 'fastest' && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                      Fastest
                    </p>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
