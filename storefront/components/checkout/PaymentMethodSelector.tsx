'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Clock,
  Shield,
  Check,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

export interface EnabledPaymentMethod {
  code: string;
  name: string;
  description: string;
  provider: string;
  type: string;
  supportedRegions: string[];
  supportedCurrencies: string[];
  iconUrl?: string;
  transactionFeePercent: number;
  transactionFeeFixed: number;
  displayName?: string;
  checkoutMessage?: string;
  isTestMode: boolean;
}

interface PaymentMethodSelectorProps {
  methods: EnabledPaymentMethod[];
  selectedMethod: string | null;
  onSelect: (code: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  orderTotal?: number;
  currency?: string;
}

const methodTypeIcons: Record<string, React.ElementType> = {
  card: CreditCard,
  wallet: Wallet,
  bnpl: Clock,
  upi: Smartphone,
  netbanking: Building2,
  gateway: CreditCard,
  cod: Wallet,
  bank: Building2,
};

const providerLogos: Record<string, { bg: string; text: string; letter: string }> = {
  Stripe: { bg: 'from-indigo-500 to-purple-600', text: 'text-white', letter: 'S' },
  PayPal: { bg: 'from-blue-500 to-blue-700', text: 'text-white', letter: 'P' },
  Razorpay: { bg: 'from-blue-500 to-blue-700', text: 'text-white', letter: 'R' },
  Afterpay: { bg: 'from-teal-500 to-teal-700', text: 'text-white', letter: 'A' },
  Zip: { bg: 'from-purple-500 to-purple-700', text: 'text-white', letter: 'Z' },
  Manual: { bg: 'from-gray-400 to-gray-600', text: 'text-white', letter: 'M' },
};

// Calculate BNPL installment preview
const calculateInstallments = (total: number, provider: string): string => {
  if (provider === 'Afterpay') {
    const installment = (total / 4).toFixed(2);
    return `4 payments of $${installment}`;
  }
  if (provider === 'Zip') {
    const installment = (total / 4).toFixed(2);
    return `Pay in 4: $${installment}/fortnight`;
  }
  return '';
};

export function PaymentMethodSelector({
  methods,
  selectedMethod,
  onSelect,
  isLoading = false,
  disabled = false,
  orderTotal = 0,
  currency = 'USD',
}: PaymentMethodSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          <TranslatedUIText text="Loading payment methods..." />
        </span>
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p><TranslatedUIText text="No payment methods available" /></p>
      </div>
    );
  }

  // Group methods by type for better organization
  const groupedMethods = methods.reduce((acc, method) => {
    const type = method.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(method);
    return acc;
  }, {} as Record<string, EnabledPaymentMethod[]>);

  const typeLabels: Record<string, string> = {
    card: 'Cards',
    wallet: 'Digital Wallets',
    bnpl: 'Buy Now, Pay Later',
    upi: 'UPI',
    netbanking: 'Net Banking',
    gateway: 'Payment Gateway',
    cod: 'Cash on Delivery',
    bank: 'Bank Transfer',
  };

  // Order of types to display
  const typeOrder = ['card', 'gateway', 'wallet', 'upi', 'netbanking', 'bnpl', 'bank', 'cod'];
  const sortedTypes = Object.keys(groupedMethods).sort(
    (a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b)
  );

  return (
    <div className="space-y-4">
      {sortedTypes.map((type) => (
        <div key={type}>
          {sortedTypes.length > 1 && (
            <h4 className="text-sm font-medium text-muted-foreground mb-2">
              {typeLabels[type] || type}
            </h4>
          )}
          <div className="space-y-2">
            {groupedMethods[type]?.map((method) => {
              const isSelected = selectedMethod === method.code;
              const Icon = methodTypeIcons[method.type] || CreditCard;
              const logo = providerLogos[method.provider] || providerLogos.Manual;
              const isBnpl = method.type === 'bnpl';
              const installmentText = isBnpl ? calculateInstallments(orderTotal, method.provider) : '';

              return (
                <motion.button
                  key={method.code}
                  type="button"
                  onClick={() => !disabled && onSelect(method.code)}
                  disabled={disabled}
                  className={cn(
                    'w-full text-left rounded-xl border-2 p-4 transition-all duration-200',
                    isSelected
                      ? 'border-tenant-primary bg-tenant-primary/5 ring-1 ring-tenant-primary/20'
                      : 'border-border hover:border-tenant-primary/50 hover:bg-muted/50',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  whileTap={disabled ? {} : { scale: 0.99 }}
                >
                  <div className="flex items-start gap-4">
                    {/* Selection indicator */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5',
                        isSelected
                          ? 'border-tenant-primary bg-tenant-primary'
                          : 'border-muted-foreground/40'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>

                    {/* Provider logo */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br',
                        logo.bg
                      )}
                    >
                      {method.iconUrl ? (
                        <img
                          src={method.iconUrl}
                          alt={method.provider}
                          className="w-6 h-6 object-contain"
                        />
                      ) : (
                        <span className={cn('font-bold text-lg', logo.text)}>
                          {logo.letter}
                        </span>
                      )}
                    </div>

                    {/* Method info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">
                          {method.displayName || method.name}
                        </span>
                        {method.isTestMode && (
                          <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">
                            Test
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <Shield className="h-3 w-3" />
                          <TranslatedUIText text="Secure" />
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mt-0.5">
                        {method.checkoutMessage || method.description}
                      </p>

                      {/* BNPL installment preview */}
                      {isBnpl && installmentText && orderTotal > 0 && (
                        <p className="text-sm font-medium text-tenant-primary mt-1">
                          {installmentText}
                        </p>
                      )}

                      {/* Supported payment types badge */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {method.provider === 'Stripe' && (
                          <>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded border">
                              <TranslatedUIText text="Cards" />
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded border">
                              Apple Pay
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded border">
                              Google Pay
                            </span>
                          </>
                        )}
                        {method.provider === 'PayPal' && (
                          <>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded border">
                              PayPal
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded border">
                              Pay Later
                            </span>
                          </>
                        )}
                        {method.provider === 'Razorpay' && (
                          <>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded border">
                              <TranslatedUIText text="Cards" />
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded border">
                              UPI
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded border">
                              Netbanking
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-muted rounded border">
                              Wallets
                            </span>
                          </>
                        )}
                        {method.type === 'bnpl' && (
                          <span className="text-xs px-2 py-0.5 bg-muted rounded border">
                            <TranslatedUIText text="Interest-free" />
                          </span>
                        )}
                        {method.type === 'cod' && (
                          <span className="text-xs px-2 py-0.5 bg-muted rounded border">
                            <TranslatedUIText text="Pay on delivery" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PaymentMethodSelector;
