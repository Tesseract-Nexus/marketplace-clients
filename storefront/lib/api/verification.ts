import { config } from '@/lib/config';

const CUSTOMERS_SERVICE_URL = config.api.customersService;

// ========================================
// Types
// ========================================

export interface SendVerificationResponse {
  message: string;
  token?: string; // Only in dev mode
}

export interface VerifyEmailResponse {
  message: string;
  customer: {
    id: string;
    email: string;
    emailVerified: boolean;
    firstName: string;
    lastName: string;
  };
}

// ========================================
// API Functions
// ========================================

export async function sendVerificationEmail(
  tenantId: string,
  storefrontId: string,
  customerId: string
): Promise<SendVerificationResponse> {
  const response = await fetch(
    `${CUSTOMERS_SERVICE_URL}/api/v1/customers/${customerId}/send-verification`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to send verification email');
  }

  return response.json();
}

export async function verifyEmail(
  tenantId: string,
  storefrontId: string,
  token: string
): Promise<VerifyEmailResponse> {
  const response = await fetch(
    `${CUSTOMERS_SERVICE_URL}/api/v1/customers/verify-email`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
        'X-Storefront-ID': storefrontId,
      },
      body: JSON.stringify({ token }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'Failed to verify email');
  }

  return response.json();
}
