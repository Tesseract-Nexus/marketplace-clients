import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

// GET /api/products/[id] - Proxy product detail to products service
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenantId = request.headers.get('X-Tenant-ID') || '';
  const storefrontId = request.headers.get('X-Storefront-ID') || '';

  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: 'Tenant ID is required' },
      { status: 400 }
    );
  }

  try {
    const url = `${config.api.productsService}/products/${id}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: error.error || 'Failed to fetch product',
          message: error.message,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch product',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
