'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import { useCurrencyContext } from '@/context/CurrencyContext';
import { CurrencyInfo } from '@/lib/api/currency';

interface CurrencySelectorProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export function CurrencySelector({ variant = 'compact', className = '' }: CurrencySelectorProps) {
  const {
    displayCurrency,
    displayCurrencyInfo,
    setDisplayCurrency,
    supportedCurrencies,
    isLoadingRates,
    isConverted,
    storeCurrency,
  } = useCurrencyContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (currency: CurrencyInfo) => {
    setDisplayCurrency(currency.code);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Select currency"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {isLoadingRates ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        ) : null}
        {variant === 'full' ? (
          <>
            {displayCurrencyInfo?.flag && (
              <span className="text-base">{displayCurrencyInfo.flag}</span>
            )}
            <span>{displayCurrency}</span>
            <span className="text-gray-500 dark:text-gray-400">
              ({displayCurrencyInfo?.symbol || displayCurrency})
            </span>
          </>
        ) : (
          <>
            <span className="font-semibold">{displayCurrencyInfo?.symbol || displayCurrency}</span>
            <span className="text-gray-500 dark:text-gray-400">{displayCurrency}</span>
          </>
        )}
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
          role="listbox"
          aria-label="Select display currency"
        >
          {/* Conversion note */}
          {isConverted && (
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
              Prices converted from {storeCurrency} (approximate)
            </div>
          )}
          <div className="max-h-64 overflow-y-auto">
            {supportedCurrencies.map((currency) => (
              <button
                key={currency.code}
                onClick={() => handleSelect(currency)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  currency.code === displayCurrency
                    ? 'bg-primary/5 text-primary'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
                role="option"
                aria-selected={currency.code === displayCurrency}
              >
                {currency.flag && (
                  <span className="text-lg">{currency.flag}</span>
                )}
                <div className="flex-1">
                  <div className="font-medium">
                    {currency.code}
                    {currency.code === storeCurrency && (
                      <span className="ml-1.5 text-xs text-gray-400">(Store)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {currency.name}
                  </div>
                </div>
                <span className="text-gray-400">{currency.symbol}</span>
                {currency.code === displayCurrency && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
