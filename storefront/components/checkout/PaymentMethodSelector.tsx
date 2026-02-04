'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Clock,
  Shield,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
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

const defaultLogo = { bg: 'from-gray-400 to-gray-600', text: 'text-white', letter: 'M' };

const providerLogos: Record<string, { bg: string; text: string; letter: string }> = {
  Stripe: { bg: 'from-indigo-500 to-purple-600', text: 'text-white', letter: 'S' },
  PayPal: { bg: 'from-blue-500 to-blue-700', text: 'text-white', letter: 'P' },
  Razorpay: { bg: 'from-blue-500 to-blue-700', text: 'text-white', letter: 'R' },
  Afterpay: { bg: 'from-teal-500 to-teal-700', text: 'text-white', letter: 'A' },
  Zip: { bg: 'from-purple-500 to-purple-700', text: 'text-white', letter: 'Z' },
  Manual: defaultLogo,
};

// Get compact badge list for each provider
const getProviderBadges = (provider: string, type: string): string[] => {
  if (provider === 'Stripe') return ['Cards', 'Apple Pay', 'Google Pay'];
  if (provider === 'PayPal') return ['PayPal', 'Pay Later'];
  if (provider === 'Razorpay') return ['Cards', 'UPI', 'Netbanking', 'Wallets'];
  if (type === 'bnpl') return ['Interest-free'];
  if (type === 'cod') return ['Pay on delivery'];
  return [];
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
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          <TranslatedUIText text="Loading payment methods..." />
        </span>
      </div>
    );
  }

  if (methods.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <CreditCard className="h-6 w-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm"><TranslatedUIText text="No payment methods available" /></p>
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
    <div className="space-y-3">
      {sortedTypes.map((type) => (
        <div key={type}>
          {sortedTypes.length > 1 && (
            <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              {typeLabels[type] || type}
            </h4>
          )}
          <div className="space-y-2">
            {groupedMethods[type]?.map((method) => {
              const isSelected = selectedMethod === method.code;
              const logo = providerLogos[method.provider] || defaultLogo;
              const isBnpl = method.type === 'bnpl';
              const installmentText = isBnpl ? calculateInstallments(orderTotal, method.provider) : '';
              const badges = getProviderBadges(method.provider, method.type);
              const isExpanded = expandedMethod === method.code;

              return (
                <motion.button
                  key={method.code}
                  type="button"
                  onClick={() => !disabled && onSelect(method.code)}
                  disabled={disabled}
                  className={cn(
                    'w-full text-left rounded-lg border p-3 transition-all duration-200',
                    isSelected
                      ? 'border-tenant-primary bg-tenant-primary/5 ring-1 ring-tenant-primary/20'
                      : 'border-border hover:border-tenant-primary/50 hover:bg-muted/30',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  whileTap={disabled ? {} : { scale: 0.995 }}
                >
                  <div className="flex items-center gap-3">
                    {/* Selection indicator */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center',
                        isSelected
                          ? 'border-tenant-primary bg-tenant-primary'
                          : 'border-muted-foreground/40'
                      )}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>

                    {/* Provider logo */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center bg-gradient-to-br',
                        logo.bg
                      )}
                    >
                      {method.iconUrl ? (
                        <img
                          src={method.iconUrl}
                          alt={method.provider}
                          className="w-5 h-5 object-contain"
                        />
                      ) : (
                        <span className={cn('font-bold text-sm', logo.text)}>
                          {logo.letter}
                        </span>
                      )}
                    </div>

                    {/* Method info - compact */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {method.displayName || method.name}
                        </span>
                        <Shield className="h-3 w-3 text-green-500 flex-shrink-0" />
                      </div>

                      {/* Compact badges - show first 2 inline, rest on expand */}
                      {badges.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] text-muted-foreground">
                            {badges.slice(0, 2).join(' • ')}
                            {badges.length > 2 && !isExpanded && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedMethod(isExpanded ? null : method.code);
                                }}
                                className="ml-1 text-tenant-primary hover:underline"
                              >
                                +{badges.length - 2} more
                              </button>
                            )}
                          </span>
                        </div>
                      )}

                      {/* BNPL installment preview */}
                      {isBnpl && installmentText && orderTotal > 0 && (
                        <p className="text-xs font-medium text-tenant-primary mt-0.5">
                          {installmentText}
                        </p>
                      )}
                    </div>

                    {/* Expand/collapse for details */}
                    {(method.checkoutMessage || badges.length > 2) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedMethod(isExpanded ? null : method.code);
                        }}
                        className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-2 pt-2 border-t border-dashed text-xs text-muted-foreground"
                    >
                      {method.checkoutMessage && (
                        <p className="mb-2">{method.checkoutMessage}</p>
                      )}
                      {badges.length > 2 && (
                        <div className="flex flex-wrap gap-1">
                          {badges.map((badge, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                              {badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
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
