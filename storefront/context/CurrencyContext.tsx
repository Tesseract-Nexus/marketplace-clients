'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useTenant } from './TenantContext';
import {
  ExchangeRates,
  CurrencyInfo,
  SUPPORTED_CURRENCIES,
  fetchExchangeRates,
  convertCurrency,
  formatCurrency,
  detectPreferredCurrency,
  getCurrencyInfo,
} from '@/lib/api/currency';

// ========================================
// Types
// ========================================

interface CurrencyContextValue {
  // Current display currency (customer's preference)
  displayCurrency: string;
  displayCurrencyInfo: CurrencyInfo | undefined;

  // Store's base currency (from settings)
  storeCurrency: string;
  storeCurrencySymbol: string;

  // Whether display currency differs from store currency
  isConverted: boolean;

  // Exchange rates
  rates: ExchangeRates | null;
  isLoadingRates: boolean;

  // Actions
  setDisplayCurrency: (code: string) => void;

  // Formatting functions
  formatDisplayPrice: (amount: number) => string;
  formatStorePrice: (amount: number) => string;
  convertToDisplayCurrency: (amount: number) => number;

  // Available currencies
  supportedCurrencies: CurrencyInfo[];
}

const STORAGE_KEY = 'tesserix-display-currency';

// ========================================
// Context
// ========================================

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

// ========================================
// Provider
// ========================================

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const { localization } = useTenant();
  const storeCurrency = localization.currency || 'USD';
  const storeCurrencySymbol = localization.currencySymbol || '$';

  // Customer's preferred display currency
  const [displayCurrency, setDisplayCurrencyState] = useState<string>(storeCurrency);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount - only use stored preference if user explicitly set it
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // Only use stored currency if it's valid and user explicitly selected it
      const isValid = SUPPORTED_CURRENCIES.some(c => c.code === stored);
      if (isValid) {
        setDisplayCurrencyState(stored);
      } else {
        // Invalid stored currency, default to store currency
        setDisplayCurrencyState(storeCurrency);
      }
    } else {
      // No stored preference - default to store's currency (not browser locale)
      setDisplayCurrencyState(storeCurrency);
    }
    setIsInitialized(true);
  }, [storeCurrency]);

  // Always fetch exchange rates when initialized (for instant conversion support)
  useEffect(() => {
    if (!isInitialized) return;

    let cancelled = false;

    async function loadRates() {
      setIsLoadingRates(true);
      try {
        const newRates = await fetchExchangeRates(storeCurrency);
        if (!cancelled) {
          setRates(newRates);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        // Even on error, fetchExchangeRates returns fallback rates
        // But set rates to null to trigger fallback handling
      } finally {
        if (!cancelled) {
          setIsLoadingRates(false);
        }
      }
    }

    // Always load rates, even if display === store currency
    // This ensures instant conversion when user switches currencies
    loadRates();

    return () => {
      cancelled = true;
    };
  }, [storeCurrency, isInitialized]);

  // Set display currency and persist to localStorage
  const setDisplayCurrency = useCallback((code: string) => {
    const isValid = SUPPORTED_CURRENCIES.some(c => c.code === code);
    if (!isValid) return;

    setDisplayCurrencyState(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, code);
    }
  }, []);

  // Convert amount from store currency to display currency
  const convertToDisplayCurrency = useCallback((amount: number): number => {
    if (displayCurrency === storeCurrency) {
      return amount;
    }

    // Use loaded rates if available
    if (rates) {
      return convertCurrency(amount, storeCurrency, displayCurrency, rates);
    }

    // Fallback: use hardcoded approximate rates if API hasn't loaded yet
    // These are relative to USD
    const fallbackUsdRates: Record<string, number> = {
      USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.5, AUD: 1.56, CAD: 1.44,
      SGD: 1.35, NZD: 1.77, JPY: 157.0, CHF: 0.90, AED: 3.67,
    };

    const fromRateInUsd = fallbackUsdRates[storeCurrency] || 1;
    const toRateInUsd = fallbackUsdRates[displayCurrency] || 1;

    // Convert: amount in store currency → USD → display currency
    const amountInUsd = amount / fromRateInUsd;
    return amountInUsd * toRateInUsd;
  }, [displayCurrency, storeCurrency, rates]);

  // Format price in display currency
  const formatDisplayPrice = useCallback((amount: number): string => {
    const converted = convertToDisplayCurrency(amount);
    return formatCurrency(converted, displayCurrency);
  }, [convertToDisplayCurrency, displayCurrency]);

  // Format price in store currency
  const formatStorePrice = useCallback((amount: number): string => {
    return formatCurrency(amount, storeCurrency);
  }, [storeCurrency]);

  const value = useMemo<CurrencyContextValue>(() => ({
    displayCurrency,
    displayCurrencyInfo: getCurrencyInfo(displayCurrency),
    storeCurrency,
    storeCurrencySymbol,
    isConverted: displayCurrency !== storeCurrency,
    rates,
    isLoadingRates,
    setDisplayCurrency,
    formatDisplayPrice,
    formatStorePrice,
    convertToDisplayCurrency,
    supportedCurrencies: SUPPORTED_CURRENCIES,
  }), [
    displayCurrency,
    storeCurrency,
    storeCurrencySymbol,
    rates,
    isLoadingRates,
    setDisplayCurrency,
    formatDisplayPrice,
    formatStorePrice,
    convertToDisplayCurrency,
  ]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

// ========================================
// Hooks
// ========================================

export function useCurrencyContext(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrencyContext must be used within a CurrencyProvider');
  }
  return context;
}

export function useDisplayCurrency() {
  const { displayCurrency, displayCurrencyInfo, setDisplayCurrency, supportedCurrencies } = useCurrencyContext();
  return { displayCurrency, displayCurrencyInfo, setDisplayCurrency, supportedCurrencies };
}

export function usePriceFormatting() {
  const { formatDisplayPrice, formatStorePrice, convertToDisplayCurrency, isConverted, storeCurrency, displayCurrency } = useCurrencyContext();
  return { formatDisplayPrice, formatStorePrice, convertToDisplayCurrency, isConverted, storeCurrency, displayCurrency };
}
