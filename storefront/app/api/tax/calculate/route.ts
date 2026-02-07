import { NextRequest, NextResponse } from 'next/server';

const TAX_SERVICE_URL = process.env.TAX_SERVICE_URL || 'http://localhost:8091/api/v1';

export interface TaxCalculationRequest {
  tenantId: string;
  shippingAddress: {
    city: string;
    state: string;
    stateCode?: string;
    zip: string;
    country: string;
    countryCode?: string;
  };
  storeAddress?: {
    city?: string;
    state?: string;
    stateCode?: string;
    zip?: string;
    country: string;
    countryCode: string;
  };
  lineItems: {
    productId?: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    hsnCode?: string;
    sacCode?: string;
  }[];
  shippingAmount: number;
}

export interface TaxCalculationResponse {
  subtotal: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
  taxBreakdown: {
    jurisdictionName: string;
    taxType: string;
    rate: number;
    taxAmount: number;
  }[];
  gstSummary?: {
    cgst: number;
    sgst: number;
    igst: number;
    totalGst: number;
    isInterstate: boolean;
  };
  vatSummary?: {
    vatAmount: number;
    vatRate: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get tenant ID from request body (preferred), then fallback to env
    const tenantId = body.tenantId || process.env.DEV_TENANT_ID || 'global';

    // Map storeAddress to originAddress for tax service
    // Only include originAddress if it has required fields (city is required by tax service)
    const { storeAddress, tenantId: _bodyTenantId, ...restBody } = body;
    const originAddress = storeAddress?.city && storeAddress?.country ? storeAddress : undefined;
    const taxRequest = {
      ...restBody,
      tenantId,
      originAddress, // Tax service expects originAddress for GST/VAT calculation
    };

    console.log('[Tax Route] Calculating tax for tenant:', tenantId, 'address:', taxRequest.shippingAddress?.countryCode || taxRequest.shippingAddress?.country);

    // Forward request to tax service (use public storefront endpoint)
    const response = await fetch(`${TAX_SERVICE_URL}/storefront/tax/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taxRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Tax Route] Tax service error:', response.status, errorText);

      // Return fallback calculation if tax service fails
      const subtotal = body.lineItems?.reduce(
        (sum: number, item: { subtotal: number }) => sum + item.subtotal,
        0
      ) || 0;
      const fallbackTax = subtotal * 0.08; // 8% fallback

      return NextResponse.json({
        subtotal,
        shippingAmount: body.shippingAmount || 0,
        taxAmount: fallbackTax,
        total: subtotal + (body.shippingAmount || 0) + fallbackTax,
        taxBreakdown: [
          {
            jurisdictionName: 'Estimated Tax',
            taxType: 'SALES',
            rate: 8,
            taxAmount: fallbackTax,
          },
        ],
        isEstimate: true, // Flag to indicate this is a fallback estimate
      });
    }

    const taxData = await response.json();
    return NextResponse.json(taxData);
  } catch (error) {
    console.error('Tax calculation error:', error);

    // Return error response
    return NextResponse.json(
      { error: 'Failed to calculate tax', message: String(error) },
      { status: 500 }
    );
  }
}
