import type { Product } from '@/types/storefront';

export type ProductShippingData = {
  weight?: number;
  weightUnit?: 'kg' | 'lb' | 'g' | 'oz';
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: 'cm' | 'in' | 'm';
};

const parseNumber = (value?: string | number) => {
  if (value == null) return undefined;
  // Handle both string and number types (DB stores dimensions as numbers)
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseWeightUnit = (value?: string): ProductShippingData['weightUnit'] => {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower.includes('kg')) return 'kg';
  if (lower.includes('lb')) return 'lb';
  if (lower.includes('oz')) return 'oz';
  if (lower.includes('g')) return 'g';
  return undefined;
};

const parseDimensionUnit = (value?: string): ProductShippingData['dimensionUnit'] => {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower === 'cm' || lower.includes('centimeter')) return 'cm';
  if (lower === 'in' || lower.includes('inch')) return 'in';
  if (lower === 'm' || lower.includes('meter')) return 'm';
  return undefined;
};

export const getProductShippingData = (product: Product): ProductShippingData => {
  return {
    weight: parseNumber(product.weight),
    weightUnit: parseWeightUnit(product.weight),
    length: parseNumber(product.dimensions?.length),
    width: parseNumber(product.dimensions?.width),
    height: parseNumber(product.dimensions?.height),
    dimensionUnit: parseDimensionUnit(product.dimensions?.unit),
  };
};
