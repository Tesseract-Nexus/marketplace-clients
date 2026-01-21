'use client';

import { motion } from 'framer-motion';
import { Truck, Check, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePriceFormatting } from '@/context/CurrencyContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

interface FreeShippingProgressProps {
  /** Current cart subtotal */
  subtotal: number;
  /** Threshold for free shipping */
  threshold: number;
  /** Optional className for styling */
  className?: string;
}

/**
 * FreeShippingProgress Component
 *
 * Shows progress towards free shipping threshold with an animated progress bar.
 * Celebrates when threshold is reached.
 */
export function FreeShippingProgress({
  subtotal,
  threshold,
  className,
}: FreeShippingProgressProps) {
  const { formatDisplayPrice } = usePriceFormatting();

  const remaining = Math.max(0, threshold - subtotal);
  const progress = Math.min(100, (subtotal / threshold) * 100);
  const isQualified = subtotal >= threshold;

  if (threshold <= 0) return null;

  return (
    <div className={cn('rounded-lg border p-3', className)}>
      {isQualified ? (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 text-green-600"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
            <Check className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-sm">
              <TranslatedUIText text="You've unlocked FREE shipping!" />
            </p>
            <p className="text-xs text-green-600/80">
              <TranslatedUIText text="Your order qualifies for free standard shipping" />
            </p>
          </div>
          <Gift className="h-5 w-5 ml-auto animate-bounce" aria-hidden="true" />
        </motion.div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">
              <TranslatedUIText text="Add" />{' '}
              <span className="font-semibold text-foreground">{formatDisplayPrice(remaining)}</span>{' '}
              <TranslatedUIText text="more for" />{' '}
              <span className="font-semibold text-green-600"><TranslatedUIText text="FREE shipping" /></span>
            </span>
          </div>
          {/* Progress bar */}
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-tenant-primary to-green-500 rounded-full"
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {formatDisplayPrice(subtotal)} / {formatDisplayPrice(threshold)}
          </p>
        </div>
      )}
    </div>
  );
}

export default FreeShippingProgress;
