import { NextRequest, NextResponse } from 'next/server';
import { getProxyHeaders, handleApiError } from '@/lib/utils/api-route-handler';

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:8084';

export async function POST(request: NextRequest) {
  try {
    const headers = await getProxyHeaders(request) as Record<string, string>;
    const formData = await request.formData();

    // Remove Content-Type as it's set by FormData
    const { 'Content-Type': _, ...uploadHeaders } = headers;

    // Forward to the inventory service with Istio JWT headers
    const response = await fetch(`${INVENTORY_SERVICE_URL}/warehouses/import`, {
      method: 'POST',
      headers: uploadHeaders,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || { message: 'Import failed' } },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'POST inventory/warehouses/import');
  }
}
