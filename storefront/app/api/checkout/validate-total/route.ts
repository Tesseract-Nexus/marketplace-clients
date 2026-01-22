/**
 * Server-side Price Validation API
 *
 * SECURITY: This endpoint validates that the order total calculated by the client
 * matches the server-side calculation. This prevents price manipulation attacks.
 *
 * Usage:
 * - Call before initiating payment to ensure price integrity
 * - Returns validated total and any discrepancies
 */

import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';

interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number; // Client-provided price for validation
}

interface ValidateTotalRequest {
  items: CartItem[];
  clientTotal: number;
  shippingCost?: number;
  discountCode?: string;
  tenantId: string;
  storefrontId: string;
}

interface ValidateTotalResponse {
  valid: boolean;
  serverTotal: number;
  clientTotal: number;
  discrepancy?: number;
  itemsValidated: number;
  errors?: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse<ValidateTotalResponse>> {
  try {
    const body = await request.json() as ValidateTotalRequest;
    const { items, clientTotal, shippingCost = 0, discountCode, tenantId, storefrontId } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        valid: false,
        serverTotal: 0,
        clientTotal: clientTotal || 0,
        itemsValidated: 0,
        errors: ['No items provided for validation'],
      }, { status: 400 });
    }

    if (!tenantId || !storefrontId) {
      return NextResponse.json({
        valid: false,
        serverTotal: 0,
        clientTotal: clientTotal || 0,
        itemsValidated: 0,
        errors: ['Missing tenantId or storefrontId'],
      }, { status: 400 });
    }

    // Fetch current prices from the products service
    const productIds = [...new Set(items.map(item => item.productId))];
    const errors: string[] = [];
    let serverSubtotal = 0;

    // Validate each item's price against the backend
    for (const item of items) {
      try {
        const productUrl = `${config.api.productsService}/api/v1/storefronts/${storefrontId}/products/${item.productId}`;

        const response = await fetch(productUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId,
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          errors.push(`Product ${item.productId} not found or unavailable`);
          continue;
        }

        const product = await response.json();

        // Get the correct price (variant price or base price)
        let serverPrice: number;
        if (item.variantId && product.variants) {
          const variant = product.variants.find((v: { id: string; price?: number }) => v.id === item.variantId);
          serverPrice = variant?.price ?? product.price ?? 0;
        } else {
          serverPrice = product.price ?? 0;
        }

        // Check for price mismatch
        if (Math.abs(serverPrice - item.price) > 0.01) {
          errors.push(
            `Price mismatch for ${product.name || item.productId}: ` +
            `client=${item.price}, server=${serverPrice}`
          );
        }

        serverSubtotal += serverPrice * item.quantity;
      } catch (error) {
        logger.error(`Error validating product ${item.productId}:`, error);
        errors.push(`Failed to validate product ${item.productId}`);
      }
    }

    // Apply discount if provided
    let discountAmount = 0;
    if (discountCode) {
      // TODO: Implement discount validation via discount service
      // For now, we trust the client discount but log a warning
      logger.warn('Discount validation not implemented, trusting client discount');
    }

    // Calculate server total
    const serverTotal = serverSubtotal + shippingCost - discountAmount;

    // Check for total discrepancy (allow small rounding differences)
    const discrepancy = Math.abs(serverTotal - clientTotal);
    const valid = discrepancy < 0.01 && errors.length === 0;

    if (!valid) {
      logger.warn('Price validation failed', {
        clientTotal,
        serverTotal,
        discrepancy,
        errors,
        itemCount: items.length,
      });
    }

    return NextResponse.json({
      valid,
      serverTotal: Math.round(serverTotal * 100) / 100,
      clientTotal,
      discrepancy: discrepancy > 0.01 ? discrepancy : undefined,
      itemsValidated: items.length - errors.filter(e => e.includes('not found')).length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.error('Price validation error:', error);
    return NextResponse.json({
      valid: false,
      serverTotal: 0,
      clientTotal: 0,
      itemsValidated: 0,
      errors: ['Internal server error during price validation'],
    }, { status: 500 });
  }
}
