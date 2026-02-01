'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useTenantCurrency } from '@/hooks/useTenantCurrency';
import {
  ExchangeRates,
  CurrencyInfo,
  SUPPORTED_CURRENCIES,
  fetchExchangeRates,
  convertCurrency,
  formatCurrency,
  getCurrencyInfo,
} from '@/lib/api/currency';

// ========================================
// Types
// ========================================

interface AdminCurrencyContextValue {
  // Admin's preferred display currency
  adminCurrency: string;
  adminCurrencyInfo: CurrencyInfo | undefined;

  // Store's base currency (from tenant settings)
  storeCurrency: string;

  // Whether admin currency differs from store currency
  isConverted: boolean;

  // Exchange rates
  rates: ExchangeRates | null;
  isLoadingRates: boolean;

  // Actions
  setAdminCurrency: (code: string) => void;

  // Formatting functions
  formatAdminPrice: (amount: number, sourceCurrency?: string) => string;
  convertToAdminCurrency: (amount: number, sourceCurrency?: string) => number;

  // Available currencies
  supportedCurrencies: CurrencyInfo[];
}

const STORAGE_KEY = 'tesseract-admin-currency';
const EXPLICIT_KEY = 'tesseract-admin-currency-explicit'; // Tracks if user explicitly chose a currency

// ========================================
// Context
// ========================================

const AdminCurrencyContext = createContext<AdminCurrencyContextValue | undefined>(undefined);

// ========================================
// Provider
// ========================================

interface AdminCurrencyProviderProps {
  children: React.ReactNode;
}

export function AdminCurrencyProvider({ children }: AdminCurrencyProviderProps) {
  const { currency: storeCurrency, isLoading: isLoadingStoreCurrency } = useTenantCurrency();

  // Admin's preferred display currency
  const [adminCurrency, setAdminCurrencyState] = useState<string>(storeCurrency);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount, but only honor it if user explicitly chose a currency.
  // This prevents stale localStorage values (e.g. USD set by a previous bug) from overriding
  // the correct store currency derived from tenant settings.
  useEffect(() => {
    if (typeof window === 'undefined' || isLoadingStoreCurrency) return;

    const stored = localStorage.getItem(STORAGE_KEY);
    const isExplicit = localStorage.getItem(EXPLICIT_KEY) === 'true';

    if (stored && isExplicit) {
      // Only use stored currency if user explicitly chose it and it's valid
      const isValid = SUPPORTED_CURRENCIES.some(c => c.code === stored);
      if (isValid) {
        setAdminCurrencyState(stored);
      } else {
        setAdminCurrencyState(storeCurrency);
      }
    } else {
      // No explicit user preference — always follow the store's currency
      setAdminCurrencyState(storeCurrency);
      // Clean up stale localStorage from before this fix
      if (stored && !isExplicit) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsInitialized(true);
  }, [storeCurrency, isLoadingStoreCurrency]);

  // Fetch exchange rates when initialized
  useEffect(() => {
    if (!isInitialized) return;

    let cancelled = false;

    async function loadRates() {
      setIsLoadingRates(true);
      try {
        // Always fetch rates based on USD for consistent cross-currency conversion
        const newRates = await fetchExchangeRates('USD');
        if (!cancelled) {
          setRates(newRates);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
      } finally {
        if (!cancelled) {
          setIsLoadingRates(false);
        }
      }
    }

    loadRates();

    return () => {
      cancelled = true;
    };
  }, [isInitialized]);

  // Set admin currency and persist to localStorage
  const setAdminCurrency = useCallback((code: string) => {
    const isValid = SUPPORTED_CURRENCIES.some(c => c.code === code);
    if (!isValid) return;

    setAdminCurrencyState(code);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, code);
      localStorage.setItem(EXPLICIT_KEY, 'true');
    }
  }, []);

  // Convert amount from source currency to admin's display currency
  const convertToAdminCurrency = useCallback((amount: number, sourceCurrency?: string): number => {
    const fromCurrency = sourceCurrency || storeCurrency;

    if (adminCurrency === fromCurrency) {
      return amount;
    }

    // Use loaded rates if available
    if (rates) {
      return convertCurrency(amount, fromCurrency, adminCurrency, rates);
    }

    // Fallback: use hardcoded approximate rates if API hasn't loaded yet
    const fallbackUsdRates: Record<string, number> = {
      USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.5, AUD: 1.56, CAD: 1.44,
      SGD: 1.35, NZD: 1.77, JPY: 157.0, CHF: 0.90, AED: 3.67,
      CNY: 7.30, HKD: 7.79, MXN: 20.50, BRL: 6.10, SAR: 3.75,
    };

    const fromRateInUsd = fallbackUsdRates[fromCurrency] || 1;
    const toRateInUsd = fallbackUsdRates[adminCurrency] || 1;

    // Convert: amount in source currency -> USD -> admin currency
    const amountInUsd = amount / fromRateInUsd;
    return amountInUsd * toRateInUsd;
  }, [adminCurrency, storeCurrency, rates]);

  // Format price in admin's preferred currency
  const formatAdminPrice = useCallback((amount: number, sourceCurrency?: string): string => {
    const converted = convertToAdminCurrency(amount, sourceCurrency);
    return formatCurrency(converted, adminCurrency);
  }, [convertToAdminCurrency, adminCurrency]);

  const value = useMemo<AdminCurrencyContextValue>(() => ({
    adminCurrency,
    adminCurrencyInfo: getCurrencyInfo(adminCurrency),
    storeCurrency,
    isConverted: adminCurrency !== storeCurrency,
    rates,
    isLoadingRates,
    setAdminCurrency,
    formatAdminPrice,
    convertToAdminCurrency,
    supportedCurrencies: SUPPORTED_CURRENCIES,
  }), [
    adminCurrency,
    storeCurrency,
    rates,
    isLoadingRates,
    setAdminCurrency,
    formatAdminPrice,
    convertToAdminCurrency,
  ]);

  return (
    <AdminCurrencyContext.Provider value={value}>
      {children}
    </AdminCurrencyContext.Provider>
  );
}

// ========================================
// Hooks
// ========================================

export function useAdminCurrencyContext(): AdminCurrencyContextValue {
  const context = useContext(AdminCurrencyContext);
  if (context === undefined) {
    throw new Error('useAdminCurrencyContext must be used within an AdminCurrencyProvider');
  }
  return context;
}

/**
 * Convenience hook for components that just need formatting
 */
export function useAdminPriceFormatting() {
  const {
    formatAdminPrice,
    convertToAdminCurrency,
    isConverted,
    storeCurrency,
    adminCurrency,
  } = useAdminCurrencyContext();

  return {
    formatPrice: formatAdminPrice,
    convertPrice: convertToAdminCurrency,
    isConverted,
    storeCurrency,
    adminCurrency,
  };
}

/**
 * Convenience hook for the currency selector
 */
export function useAdminCurrencySelector() {
  const {
    adminCurrency,
    adminCurrencyInfo,
    setAdminCurrency,
    supportedCurrencies,
    isConverted,
  } = useAdminCurrencyContext();

  return {
    selectedCurrency: adminCurrency,
    selectedCurrencyInfo: adminCurrencyInfo,
    setCurrency: setAdminCurrency,
    currencies: supportedCurrencies,
    isConverted,
  };
}
