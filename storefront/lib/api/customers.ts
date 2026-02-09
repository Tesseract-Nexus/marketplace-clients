// Customer Address API - Uses Next.js API routes (BFF pattern)

// ========================================
// Types
// ========================================

export type AddressType = 'SHIPPING' | 'BILLING' | 'BOTH';

export interface CustomerAddress {
  id: string;
  customerId: string;
  type: AddressType;
  isDefault: boolean;
  label?: string; // User-defined label (e.g., "Home", "Work")
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  type: AddressType;
  isDefault?: boolean;
  label?: string; // User-defined label (e.g., "Home", "Work")
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode: string;
  phone?: string;
}

export interface UpdateAddressRequest extends Partial<CreateAddressRequest> {}

// ========================================
// API Functions (via Next.js BFF routes)
// ========================================

export async function getCustomerAddresses(
  tenantId: string,
  storefrontId: string,
  customerId: string,
  accessToken?: string | null
): Promise<CustomerAddress[]> {
  const headers: Record<string, string> = {
    'X-Tenant-ID': tenantId,
    'X-Storefront-ID': storefrontId,
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const response = await fetch(
    `/api/customers/${customerId}/addresses`,
    {
      headers,
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to fetch addresses');
  }

  const data = await response.json();
  return data.data || data.addresses || data || [];
}

export async function addCustomerAddress(
  tenantId: string,
  storefrontId: string,
  customerId: string,
  address: CreateAddressRequest,
  accessToken?: string | null
): Promise<CustomerAddress> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': tenantId,
    'X-Storefront-ID': storefrontId,
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const response = await fetch(
    `/api/customers/${customerId}/addresses`,
    {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(address),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to add address');
  }

  const data = await response.json();
  return data.data || data;
}

export async function updateCustomerAddress(
  tenantId: string,
  storefrontId: string,
  customerId: string,
  addressId: string,
  address: UpdateAddressRequest,
  accessToken?: string | null
): Promise<CustomerAddress> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': tenantId,
    'X-Storefront-ID': storefrontId,
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const response = await fetch(
    `/api/customers/${customerId}/addresses/${addressId}`,
    {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify(address),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to update address');
  }

  const data = await response.json();
  return data.data || data;
}

export async function deleteCustomerAddress(
  tenantId: string,
  storefrontId: string,
  customerId: string,
  addressId: string,
  accessToken?: string | null
): Promise<void> {
  const headers: Record<string, string> = {
    'X-Tenant-ID': tenantId,
    'X-Storefront-ID': storefrontId,
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const response = await fetch(
    `/api/customers/${customerId}/addresses/${addressId}`,
    {
      method: 'DELETE',
      headers,
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to delete address');
  }
}

export async function setDefaultAddress(
  tenantId: string,
  storefrontId: string,
  customerId: string,
  addressId: string,
  accessToken?: string | null
): Promise<CustomerAddress> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Tenant-ID': tenantId,
    'X-Storefront-ID': storefrontId,
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  const response = await fetch(
    `/api/customers/${customerId}/addresses/${addressId}`,
    {
      method: 'PATCH',
      headers,
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to set default address');
  }

  const data = await response.json();
  return data.data || data;
}

// ========================================
// Order Stats
// ========================================

export interface RecordOrderRequest {
  orderId: string;
  orderNumber?: string;
  totalAmount: number;
}

export async function recordCustomerOrder(
  tenantId: string,
  storefrontId: string,
  customerId: string,
  orderData: RecordOrderRequest
): Promise<void> {
  const response = await fetch(
    `/api/customers/${customerId}/record-order`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
      credentials: 'include',
      body: JSON.stringify(orderData),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.warn('Failed to record order for customer:', error);
    // Don't throw - this is non-critical
  }
}
