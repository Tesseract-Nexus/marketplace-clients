import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { extractCustomerId } from '@/lib/server/auth';

// Remove /api/v1 suffix if present (env var may include it)
const ORDERS_SERVICE_URL = (process.env.ORDERS_SERVICE_URL || 'http://localhost:3108').replace(/\/api\/v1\/?$/, '');

// Storefront request format (from checkout page)
interface StorefrontOrderRequest {
  tenantId?: string;
  customerId?: string;
  customerEmail: string;
  customerPhone?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  shippingMethod?: string;
  shippingCarrier?: string;
  shippingServiceCode?: string; // Carrier-specific service code (e.g., Shiprocket courier_company_id)
  shippingCost?: number;
  // Package dimensions captured at checkout for accurate shipping
  packageWeight?: number; // Weight in kg
  packageLength?: number; // Length in cm
  packageWidth?: number;  // Width in cm
  packageHeight?: number; // Height in cm
  // Shipping rate breakdown (for admin transparency)
  shippingBaseRate?: number;      // Original carrier rate before markup
  shippingMarkupAmount?: number;  // Markup amount applied
  shippingMarkupPercent?: number; // Markup percentage (e.g., 10 for 10%)
  notes?: string;
  status?: string;
}

// Orders-service request format
interface OrdersServiceRequest {
  customerId: string;
  currency: string;
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    image?: string;
    quantity: number;
    unitPrice: number;
  }>;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  shipping: {
    method: string;
    carrier?: string;
    courierServiceCode?: string; // Carrier-specific service code for auto-assignment
    cost: number;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    // Package dimensions for accurate shipping
    packageWeight?: number;
    packageLength?: number;
    packageWidth?: number;
    packageHeight?: number;
    // Rate breakdown for admin transparency
    baseRate?: number;
    markupAmount?: number;
    markupPercent?: number;
  };
  payment: {
    method: string;
    amount: number;
    currency: string;
    transactionId?: string;
  };
  discounts?: Array<{
    couponCode?: string;
    discountType: string;
    amount: number;
    description?: string;
  }>;
  notes?: string;
}

// Transform storefront request to orders-service format
function transformRequest(body: StorefrontOrderRequest, accessToken?: string | null): OrdersServiceRequest {
  // Calculate subtotal
  const subtotal = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = body.shippingCost ?? 9.99; // Default shipping
  const taxEstimate = subtotal * 0.08; // 8% fallback tax
  const total = subtotal + shippingCost + taxEstimate;

  // Use provided customerId, or extract from JWT for authenticated checkout, or generate guest UUID
  const customerId = body.customerId || (accessToken ? extractCustomerId(accessToken) : null) || uuidv4();

  // Determine currency based on country
  const currency = body.shippingAddress.country === 'IN' ? 'INR' : 'USD';

  return {
    customerId,
    currency,
    items: body.items.map(item => ({
      productId: item.productId,
      productName: item.name,
      sku: item.variantId || 'DEFAULT',
      image: item.image,
      quantity: item.quantity,
      unitPrice: item.price,
    })),
    customer: {
      firstName: body.shippingAddress.firstName,
      lastName: body.shippingAddress.lastName,
      email: body.customerEmail,
      phone: body.customerPhone || body.shippingAddress.phone,
    },
    shipping: {
      method: body.shippingMethod || 'standard',
      carrier: body.shippingCarrier || '',
      courierServiceCode: body.shippingServiceCode || '', // Pass through for auto-carrier selection
      cost: shippingCost,
      street: body.shippingAddress.addressLine1,
      city: body.shippingAddress.city,
      state: body.shippingAddress.state,
      postalCode: body.shippingAddress.postalCode,
      country: body.shippingAddress.country,
      // Pass package dimensions for accurate shipping calculations
      packageWeight: body.packageWeight,
      packageLength: body.packageLength,
      packageWidth: body.packageWidth,
      packageHeight: body.packageHeight,
      // Pass rate breakdown for admin transparency
      baseRate: body.shippingBaseRate,
      markupAmount: body.shippingMarkupAmount,
      markupPercent: body.shippingMarkupPercent,
    },
    payment: {
      method: currency === 'INR' ? 'razorpay' : 'stripe',
      amount: total,
      currency,
      transactionId: '', // Will be updated after payment
    },
    notes: body.notes,
  };
}

// POST /api/orders - Create order
export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('X-Tenant-ID');
    const storefrontId = request.headers.get('X-Storefront-ID');

    console.log('[BFF Orders] POST request received');
    console.log('[BFF Orders] Headers - Tenant:', tenantId, 'Storefront:', storefrontId);

    if (!tenantId) {
      console.log('[BFF Orders] Error: No tenant ID');
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 });
    }

    // Get access token from cookie or header (for authenticated checkout)
    const accessToken = request.cookies.get('accessToken')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');

    let body: StorefrontOrderRequest;
    try {
      const bodyText = await request.text();
      if (!bodyText) {
        console.log('[BFF Orders] Error: Empty body');
        return NextResponse.json({ error: 'Request body is empty' }, { status: 400 });
      }
      body = JSON.parse(bodyText);
      console.log('[BFF Orders] Parsed body - items count:', body.items?.length);
    } catch (parseError) {
      console.error('[BFF Orders] Body parse error:', parseError);
      return NextResponse.json({ error: 'Invalid request body - JSON parse failed' }, { status: 400 });
    }

    // Transform storefront format to orders-service format
    const transformedBody = transformRequest(body, accessToken);
    console.log('[BFF Orders] Transformed request for orders-service');
    console.log('[BFF Orders] Customer:', transformedBody.customer.email);
    console.log('[BFF Orders] Items:', transformedBody.items.length);

    // Build headers - include Authorization if present for authenticated checkout
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    };
    if (storefrontId) {
      headers['X-Storefront-ID'] = storefrontId;
    }
    // Pass the storefront host so orders-service can build correct email URLs
    // This supports both custom domains (e.g., yahvismartfarm.com) and default subdomains
    const host = request.headers.get('host');
    if (host) {
      headers['X-Storefront-Host'] = host;
    }
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Use storefront endpoint which supports both guest and authenticated checkout
    const response = await fetch(`${ORDERS_SERVICE_URL}/api/v1/storefront/orders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(transformedBody),
    });

    console.log('[BFF Orders] Orders service response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[BFF Orders] Orders service error:', errorText);
      let errorObj: { error?: string; message?: string } = {};
      try {
        errorObj = JSON.parse(errorText);
      } catch {
        errorObj = { message: errorText };
      }
      // Pass through both error and message for better error display
      return NextResponse.json(
        {
          error: errorObj.error || 'Failed to create order',
          message: errorObj.message || errorObj.error || 'An error occurred while creating your order'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[BFF Orders] Order created:', data.id || data.orderNumber);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[BFF Orders] Failed to create order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
