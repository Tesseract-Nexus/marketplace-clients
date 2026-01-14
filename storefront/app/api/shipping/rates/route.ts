import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const normalizeWeightToKg = (value: number, unit?: string) => {
  const normalizedUnit = unit?.toLowerCase();
  if (normalizedUnit === 'g') return value / 1000;
  if (normalizedUnit === 'lb') return value * 0.45359237;
  if (normalizedUnit === 'oz') return value * 0.0283495231;
  return value;
};

const normalizeLengthToCm = (value: number, unit?: string) => {
  const normalizedUnit = unit?.toLowerCase();
  if (normalizedUnit === 'm') return value * 100;
  if (normalizedUnit === 'in') return value * 2.54;
  return value;
};

export interface RateRequest {
  fromAddress: {
    postalCode: string;
    city?: string;
    state?: string;
    country: string;
  };
  toAddress: {
    postalCode: string;
    city?: string;
    state?: string;
    country: string;
  };
  packages: Array<{
    weight: number;
    weightUnit?: string;
    length?: number;
    width?: number;
    height?: number;
    dimensionUnit?: string;
  }>;
  currency?: string;
  declaredValue?: number; // Order subtotal for accurate rate calculation
}

// POST /api/shipping/rates - Get shipping rates from carriers
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('X-Tenant-ID') || '';
  const storefrontId = request.headers.get('X-Storefront-ID') || '';

  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: 'Tenant ID is required' },
      { status: 400 }
    );
  }

  try {
    const body: RateRequest = await request.json();

    // Validate required fields
    if (!body.fromAddress || !body.toAddress || !body.packages?.length) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fromAddress, toAddress, packages' },
        { status: 400 }
      );
    }

    // Strip /v1 from base URL - shipping service routes are at /api/* not /api/v1/*
    const baseUrl = config.api.shippingService.replace(/\/api\/v1$/, '');
    const url = `${baseUrl}/api/rates`;

    // Transform request - shipping service expects flat weight/dimensions, not packages array
    // Also add required fields for address validation (name, street, city)
    let totalWeightKg = 0;
    let maxLengthCm = 0;
    let maxWidthCm = 0;
    let maxHeightCm = 0;

    body.packages.forEach((pkg) => {
      const normalizedWeight = normalizeWeightToKg(pkg.weight || 0, pkg.weightUnit);
      if (normalizedWeight > 0) {
        totalWeightKg += normalizedWeight;
      }
      if (pkg.length) {
        maxLengthCm = Math.max(maxLengthCm, normalizeLengthToCm(pkg.length, pkg.dimensionUnit));
      }
      if (pkg.width) {
        maxWidthCm = Math.max(maxWidthCm, normalizeLengthToCm(pkg.width, pkg.dimensionUnit));
      }
      if (pkg.height) {
        maxHeightCm = Math.max(maxHeightCm, normalizeLengthToCm(pkg.height, pkg.dimensionUnit));
      }
    });

    const weight = totalWeightKg > 0 ? totalWeightKg : 0.5;
    const length = maxLengthCm > 0 ? maxLengthCm : 20;
    const width = maxWidthCm > 0 ? maxWidthCm : 15;
    const height = maxHeightCm > 0 ? maxHeightCm : 10;

    const serviceRequest = {
      fromAddress: {
        name: 'Warehouse',
        street: body.fromAddress.city || 'Warehouse',
        city: body.fromAddress.city || 'City',
        state: body.fromAddress.state || '',
        postalCode: body.fromAddress.postalCode,
        country: body.fromAddress.country,
      },
      toAddress: {
        name: 'Customer',
        street: body.toAddress.city || 'Address',
        city: body.toAddress.city || 'City',
        state: body.toAddress.state || '',
        postalCode: body.toAddress.postalCode,
        country: body.toAddress.country,
      },
      weight,
      length,
      width,
      height,
      declaredValue: body.declaredValue || 0,
    };

    console.log('[BFF Shipping] Fetching rates for tenant:', tenantId, 'request:', JSON.stringify(serviceRequest));

    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
          'X-Storefront-ID': storefrontId,
        },
        body: JSON.stringify(serviceRequest),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[BFF Shipping] Rates error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.error || 'Failed to fetch shipping rates',
          message: error.message,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawRates = data.rates || data.data || [];

    // Transform shipping service response to frontend ShippingRate format
    // Service returns: { carrier, serviceName, serviceCode, rate, currency, estimatedDays, available }
    // Frontend expects: { id, carrier, carrierDisplayName, service, serviceDisplayName, rate, ... }
    interface ServiceRate {
      carrier: string;
      serviceName: string;
      serviceCode: string;
      rate: number;
      baseRate?: number;
      markupAmount?: number;
      markupPercent?: number;
      currency: string;
      estimatedDays: number;
      estimatedDelivery?: string;
      available?: boolean;
    }

    const transformedRates = rawRates.map((r: ServiceRate) => ({
      id: `${r.carrier}-${r.serviceCode}`,
      carrier: r.carrier,
      carrierDisplayName: r.carrier === 'SHIPROCKET' ? 'Shiprocket' : r.carrier,
      service: r.serviceCode,
      serviceDisplayName: r.serviceName,
      rate: r.rate,
      baseRate: r.baseRate,
      markupAmount: r.markupAmount,
      markupPercent: r.markupPercent,
      currency: r.currency || 'INR',
      estimatedDays: r.estimatedDays,
      estimatedDeliveryDate: r.estimatedDelivery,
      isGuaranteed: false,
      trackingSupported: true,
      insuranceAvailable: false,
    }));

    console.log('[BFF Shipping] Transformed', rawRates.length, 'rates');

    return NextResponse.json({
      success: true,
      data: transformedRates,
    });
  } catch (error) {
    console.error('[BFF Shipping] Failed to fetch rates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch shipping rates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
