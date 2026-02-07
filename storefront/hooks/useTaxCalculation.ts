'use client';

import { useState, useCallback } from 'react';

export interface ShippingAddress {
  addressLine1?: string;
  city: string;
  state: string;
  stateCode?: string;
  zip: string;
  country: string;
  countryCode?: string;
}

export interface StoreAddress {
  city?: string;
  state?: string;
  stateCode?: string;
  zip?: string;
  country: string;
  countryCode: string;
}

export interface CartItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  hsnCode?: string;
  sacCode?: string;
}

export interface TaxBreakdown {
  jurisdictionName: string;
  taxType: string;
  rate: number;
  taxAmount: number;
}

export interface GSTSummary {
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  isInterstate: boolean;
}

export interface TaxCalculationResult {
  taxAmount: number;
  taxBreakdown: TaxBreakdown[];
  gstSummary?: GSTSummary;
  isEstimate?: boolean;
}

export function useTaxCalculation() {
  const [taxResult, setTaxResult] = useState<TaxCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateTax = useCallback(
    async (
      items: CartItem[],
      shippingAddress: ShippingAddress,
      shippingAmount: number = 0,
      storeAddress?: StoreAddress,
      tenantId?: string
    ): Promise<TaxCalculationResult> => {
      setIsLoading(true);
      setError(null);

      try {
        // Build line items
        const lineItems = items.map((item) => ({
          productId: item.productId || item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity,
          hsnCode: item.hsnCode,
          sacCode: item.sacCode,
        }));

        const response = await fetch('/api/tax/calculate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenantId,
            shippingAddress,
            storeAddress,
            lineItems,
            shippingAmount,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to calculate tax');
        }

        const data = await response.json();

        const result: TaxCalculationResult = {
          taxAmount: data.taxAmount || 0,
          taxBreakdown: data.taxBreakdown || [],
          gstSummary: data.gstSummary,
          isEstimate: data.isEstimate,
        };

        setTaxResult(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Tax calculation failed';
        setError(errorMessage);

        // Return fallback estimate
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const fallbackTax = subtotal * 0.08;

        const fallbackResult: TaxCalculationResult = {
          taxAmount: fallbackTax,
          taxBreakdown: [
            {
              jurisdictionName: 'Estimated Tax',
              taxType: 'SALES',
              rate: 8,
              taxAmount: fallbackTax,
            },
          ],
          isEstimate: true,
        };

        setTaxResult(fallbackResult);
        return fallbackResult;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearTax = useCallback(() => {
    setTaxResult(null);
    setError(null);
  }, []);

  return {
    taxResult,
    isLoading,
    error,
    calculateTax,
    clearTax,
  };
}

export default useTaxCalculation;
