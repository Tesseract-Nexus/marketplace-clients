'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Zap, Clock, Check, Loader2, Package, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenant } from '@/context/TenantContext';
import { usePriceFormatting } from '@/context/CurrencyContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { useTranslatedText } from '@/hooks/useTranslatedText';
import {
  getShippingMethods,
  getShippingRatesForOrder,
  getShippingSettings,
  calculateShippingCost,
  getEstimatedDeliveryDate,
  type ShippingMethod,
  type ShippingRate,
  type WarehouseAddress,
} from '@/lib/api/shipping';

interface ShippingMethodSelectorProps {
  orderSubtotal: number;
  countryCode?: string;
  postalCode?: string;
  city?: string;
  state?: string;
  selectedMethodId?: string;
  onSelect: (method: ShippingMethod | ShippingRate, cost: number) => void;
  disabled?: boolean;
  // Package details for rate calculation
  packageWeight?: number;
  weightUnit?: 'kg' | 'lb' | 'g' | 'oz';
  packageDimensions?: {
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: 'cm' | 'in' | 'm';
  };
  useCarrierRates?: boolean;
}

// Convert carrier rate to ShippingMethod format for compatibility
function rateToMethod(rate: ShippingRate): ShippingMethod {
  return {
    id: `${rate.carrier}-${rate.service}`,
    name: `${rate.carrierDisplayName} - ${rate.serviceDisplayName}`,
    description: rate.isGuaranteed ? 'Guaranteed delivery' : undefined,
    estimatedDaysMin: rate.estimatedDays,
    estimatedDaysMax: rate.estimatedDays,
    baseRate: rate.rate,
    isActive: true,
    sortOrder: 0,
  };
}

export function ShippingMethodSelector({
  orderSubtotal,
  countryCode,
  postalCode,
  city,
  state,
  selectedMethodId,
  onSelect,
  disabled = false,
  packageWeight = 0.5,
  weightUnit = 'kg',
  packageDimensions,
  useCarrierRates = true,
}: ShippingMethodSelectorProps) {
  const { tenant, settings } = useTenant();
  const { formatDisplayPrice } = usePriceFormatting();
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [carrierRates, setCarrierRates] = useState<ShippingRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingCarrierRates, setUsingCarrierRates] = useState(false);
  const [warehouseAddress, setWarehouseAddress] = useState<WarehouseAddress | null>(null);

  // Translated strings
  const { translatedText: loadingText } = useTranslatedText('Loading shipping options...', { context: 'checkout' });
  const { translatedText: noMethodsText } = useTranslatedText('No shipping methods available for your location.', { context: 'checkout' });
  const { translatedText: liveRatesText } = useTranslatedText('Live carrier rates', { context: 'checkout' });
  const { translatedText: standardShippingText } = useTranslatedText('Standard Shipping', { context: 'shipping' });
  const { translatedText: freeText } = useTranslatedText('FREE', { context: 'shipping' });
  const { translatedText: freeOverText } = useTranslatedText('Free over', { context: 'shipping' });
  const { translatedText: estDeliveryText } = useTranslatedText('Est. delivery', { context: 'shipping' });
  const { translatedText: businessDaysText } = useTranslatedText('business days', { context: 'shipping' });
  const { translatedText: guaranteedText } = useTranslatedText('Guaranteed', { context: 'shipping' });
  const { translatedText: optionsAvailableText } = useTranslatedText('options available', { context: 'shipping' });
  const { translatedText: optionAvailableText } = useTranslatedText('option available', { context: 'shipping' });

  // Fetch warehouse address from shipping settings
  useEffect(() => {
    const fetchWarehouse = async () => {
      if (!tenant) return;
      const shippingSettings = await getShippingSettings(tenant.id, tenant.storefrontId);
      if (shippingSettings?.warehouse) {
        console.log('[ShippingMethodSelector] Got warehouse:', shippingSettings.warehouse);
        setWarehouseAddress(shippingSettings.warehouse);
      }
    };
    fetchWarehouse();
  }, [tenant]);

  useEffect(() => {
    const fetchRates = async () => {
      if (!tenant) return;

      setIsLoading(true);
      setError(null);

      try {
        // Try to fetch real-time carrier rates if we have address info
        if (useCarrierRates && postalCode && countryCode && warehouseAddress?.postalCode) {
          try {
            console.log('[ShippingMethodSelector] Fetching carrier rates...');
            const rates = await getShippingRatesForOrder(tenant.id, tenant.storefrontId, {
              fromCountry: warehouseAddress.country || 'IN',
              fromPostalCode: warehouseAddress.postalCode,
              toCountry: countryCode,
              toPostalCode: postalCode,
              toCity: city,
              toState: state,
              totalWeight: packageWeight,
              weightUnit,
              length: packageDimensions?.length,
              width: packageDimensions?.width,
              height: packageDimensions?.height,
              dimensionUnit: packageDimensions?.dimensionUnit,
              currency: settings?.localization?.currency || 'INR',
            });

            if (rates && rates.length > 0) {
              console.log('[ShippingMethodSelector] Got carrier rates:', rates.length);
              setCarrierRates(rates);
              setUsingCarrierRates(true);

              // Auto-select cheapest rate
              if (!selectedMethodId && rates[0]) {
                const cheapest = rates.reduce((min, r) => r.rate < min.rate ? r : min, rates[0]);
                onSelect(cheapest, cheapest.rate);
              }
              return;
            }
          } catch (rateErr) {
            console.log('[ShippingMethodSelector] Carrier rates not available, falling back to methods:', rateErr);
          }
        }

        // Fall back to predefined shipping methods
        console.log('[ShippingMethodSelector] Using predefined shipping methods');
        setUsingCarrierRates(false);
        const data = await getShippingMethods(tenant.id, tenant.storefrontId, countryCode);
        setMethods(data);

        // Auto-select first method if none selected
        const firstMethod = data[0];
        if (firstMethod && !selectedMethodId) {
          const cost = calculateShippingCost(firstMethod, orderSubtotal);
          onSelect(firstMethod, cost);
        }
      } catch (err) {
        console.error('Failed to fetch shipping options:', err);
        setError('Unable to load shipping options');
        // Provide fallback shipping methods
        const fallback: ShippingMethod[] = [
          {
            id: 'standard',
            name: 'Standard Shipping',
            description: 'Delivery in 5-7 business days',
            estimatedDaysMin: 5,
            estimatedDaysMax: 7,
            baseRate: 9.99,
            freeShippingThreshold: 100,
            isActive: true,
            sortOrder: 1,
          },
        ];
        setMethods(fallback);
        if (!selectedMethodId && fallback[0]) {
          const cost = calculateShippingCost(fallback[0], orderSubtotal);
          onSelect(fallback[0], cost);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchRates();
  }, [tenant, countryCode, postalCode, city, state, packageWeight, weightUnit, packageDimensions, useCarrierRates, warehouseAddress]);

  const getMethodIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('express') || lowerName.includes('fast') || lowerName.includes('priority')) {
      return <Zap className="h-5 w-5" />;
    }
    if (lowerName.includes('next day') || lowerName.includes('overnight') || lowerName.includes('same day')) {
      return <Clock className="h-5 w-5" />;
    }
    if (lowerName.includes('economy') || lowerName.includes('surface')) {
      return <Package className="h-5 w-5" />;
    }
    return <Truck className="h-5 w-5" />;
  };

  const handleSelectMethod = (method: ShippingMethod) => {
    if (disabled) return;
    const cost = calculateShippingCost(method, orderSubtotal);
    onSelect(method, cost);
  };

  const handleSelectRate = (rate: ShippingRate) => {
    if (disabled) return;
    onSelect(rate, rate.rate);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText}
        </div>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-20 rounded-lg border bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Render carrier rates
  if (usingCarrierRates && carrierRates.length > 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <Truck className="h-3 w-3" />
            {liveRatesText}
          </span>
          <span>{carrierRates.length} {carrierRates.length !== 1 ? optionsAvailableText : optionAvailableText}</span>
        </div>
        <AnimatePresence mode="popLayout">
          {carrierRates.map((rate, index) => {
            const rateId = `${rate.carrier}-${rate.service}`;
            const isSelected = selectedMethodId === rateId;

            return (
              <motion.button
                key={rateId}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelectRate(rate)}
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
                      {getMethodIcon(rate.serviceDisplayName)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{rate.carrierDisplayName}</span>
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
                        {rate.serviceDisplayName}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          <TranslatedUIText text="Est." /> {rate.estimatedDays} {businessDaysText}
                          {rate.isGuaranteed && (
                            <span className="ml-1 text-green-600 dark:text-green-400">({guaranteedText})</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold">{formatDisplayPrice(rate.rate)}</span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    );
  }

  // Render predefined methods
  if (methods.length === 0) {
    return (
      <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-200">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <p className="text-sm">{noMethodsText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {methods.map((method, index) => {
          const cost = calculateShippingCost(method, orderSubtotal);
          const isFree = cost === 0;
          const isSelected = selectedMethodId === method.id;
          const deliveryDates = getEstimatedDeliveryDate(method);

          return (
            <motion.button
              key={method.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelectMethod(method)}
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
                    {getMethodIcon(method.name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{method.name}</span>
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
                    {method.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {method.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {estDeliveryText}:{' '}
                        {deliveryDates.min.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                        {method.estimatedDaysMin !== method.estimatedDaysMax && (
                          <>
                            {' '}
                            -{' '}
                            {deliveryDates.max.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {isFree ? (
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {freeText}
                    </span>
                  ) : (
                    <span className="font-semibold">{formatDisplayPrice(cost)}</span>
                  )}
                  {method.freeShippingThreshold && !isFree && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {freeOverText} {formatDisplayPrice(method.freeShippingThreshold)}
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
