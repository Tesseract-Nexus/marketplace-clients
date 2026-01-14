'use client';

import React from 'react';
import { usePriceFormatting } from '@/context/CurrencyContext';

interface PriceDisplayProps {
  /** Price amount in store's base currency */
  amount: number;
  /** Show original store price when converted */
  showOriginal?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
  /** Strike-through style (for original prices with discounts) */
  strikethrough?: boolean;
  /** Sale price to show alongside original */
  saleAmount?: number;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg font-semibold',
  xl: 'text-2xl font-bold',
};

export function PriceDisplay({
  amount,
  showOriginal = false,
  size = 'md',
  className = '',
  strikethrough = false,
  saleAmount,
}: PriceDisplayProps) {
  const { formatDisplayPrice, formatStorePrice, isConverted } = usePriceFormatting();

  const displayPrice = formatDisplayPrice(amount);
  const storePrice = formatStorePrice(amount);

  // If there's a sale price, show both
  if (saleAmount !== undefined && saleAmount < amount) {
    const displaySalePrice = formatDisplayPrice(saleAmount);
    const storeSalePrice = formatStorePrice(saleAmount);

    return (
      <div className={`flex flex-wrap items-baseline gap-2 ${className}`}>
        {/* Sale price */}
        <span className={`text-primary ${sizeClasses[size]}`}>
          {displaySalePrice}
        </span>
        {/* Original price (strikethrough) */}
        <span className={`text-gray-400 line-through ${sizeClasses.sm}`}>
          {displayPrice}
        </span>
        {/* Show store currency if converted */}
        {isConverted && showOriginal && (
          <span className="text-xs text-gray-500">
            ({storeSalePrice} {isConverted ? 'actual' : ''})
          </span>
        )}
      </div>
    );
  }

  // Standard price display
  if (strikethrough) {
    return (
      <span className={`text-gray-400 line-through ${sizeClasses[size]} ${className}`}>
        {displayPrice}
      </span>
    );
  }

  return (
    <span className={`${sizeClasses[size]} ${className}`}>
      {displayPrice}
      {isConverted && showOriginal && (
        <span className="ml-1.5 text-xs font-normal text-gray-500">
          ({storePrice})
        </span>
      )}
    </span>
  );
}

/**
 * Compact price range display (e.g., "$10 - $50")
 */
interface PriceRangeProps {
  minAmount: number;
  maxAmount: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PriceRange({ minAmount, maxAmount, size = 'md', className = '' }: PriceRangeProps) {
  const { formatDisplayPrice } = usePriceFormatting();

  if (minAmount === maxAmount) {
    return <PriceDisplay amount={minAmount} size={size} className={className} />;
  }

  return (
    <span className={`${sizeClasses[size]} ${className}`}>
      {formatDisplayPrice(minAmount)} - {formatDisplayPrice(maxAmount)}
    </span>
  );
}

/**
 * Price with discount badge
 */
interface PriceWithDiscountProps {
  originalAmount: number;
  saleAmount: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showPercentage?: boolean;
}

export function PriceWithDiscount({
  originalAmount,
  saleAmount,
  size = 'md',
  className = '',
  showPercentage = true,
}: PriceWithDiscountProps) {
  const { formatDisplayPrice } = usePriceFormatting();
  const discountPercentage = Math.round(((originalAmount - saleAmount) / originalAmount) * 100);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className={`font-semibold text-primary ${sizeClasses[size]}`}>
        {formatDisplayPrice(saleAmount)}
      </span>
      <span className={`text-gray-400 line-through ${sizeClasses.sm}`}>
        {formatDisplayPrice(originalAmount)}
      </span>
      {showPercentage && discountPercentage > 0 && (
        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
          -{discountPercentage}%
        </span>
      )}
    </div>
  );
}
