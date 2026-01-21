/**
 * Domain Verification API Route
 *
 * POST /api/onboarding/verify-domain
 *
 * Verifies DNS propagation for a custom domain by calling the custom-domain-service.
 * Checks if the CNAME or TXT record has been configured correctly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateRequest, errorResponse, SERVICES, generateRequestId } from '../../lib/api-handler';

interface VerifyDomainRequest {
  domain: string;
  verification_host: string;
  verification_value: string;
  verification_token?: string; // Optional: full token for more precise verification
}

interface VerificationStatus {
  dns_verified: boolean;
  dns_record_found: boolean;
  dns_record_value: string | null;
  expected_value: string;
  ssl_provisioning: boolean;
  ssl_status: 'pending' | 'provisioning' | 'active' | 'failed';
  message: string;
  can_proceed: boolean;
  domain_id?: string; // ID of the pending domain record if exists
}

export async function POST(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) {
    return validationError;
  }

  try {
    const body: VerifyDomainRequest = await request.json();

    if (!body.domain || !body.verification_host || !body.verification_value) {
      return errorResponse('Missing required fields: domain, verification_host, verification_value', 400);
    }

    // Call custom-domain-service for verification
    const requestId = generateRequestId();
    const serviceUrl = `${SERVICES.CUSTOM_DOMAIN}/api/v1/domains/verify-by-name`;

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[verify-domain] Calling custom-domain-service:', {
        domain: body.domain,
        verification_host: body.verification_host,
        verification_value: body.verification_value,
      });
    }

    try {
      const response = await fetch(serviceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
        },
        body: JSON.stringify({
          domain: body.domain,
          verification_host: body.verification_host,
          verification_value: body.verification_value,
          verification_token: body.verification_token || '',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Handle wrapped response from custom-domain-service
        const responseData = data.data || data;

        // Map the response to our expected format
        const status: VerificationStatus = {
          dns_verified: Boolean(responseData.dns_verified),
          dns_record_found: Boolean(responseData.dns_record_found),
          dns_record_value: responseData.dns_record_value || null,
          expected_value: responseData.expected_value || body.verification_value,
          ssl_provisioning: Boolean(responseData.ssl_provisioning),
          ssl_status: responseData.ssl_status || 'pending',
          message: responseData.message || 'Verification completed',
          can_proceed: Boolean(responseData.can_proceed),
          domain_id: responseData.domain_id,
        };

        if (process.env.NODE_ENV === 'development') {
          console.log('[verify-domain] Service response:', status);
        }

        return NextResponse.json({ data: status });
      }

      // If service returned an error
      if (process.env.NODE_ENV === 'development') {
        console.log('[verify-domain] Service returned status:', response.status);
      }
    } catch (serviceError) {
      // Service might not be available, fall back to local verification
      if (process.env.NODE_ENV === 'development') {
        console.log('[verify-domain] Service unavailable, falling back to local verification');
      }
    }

    // Fallback: Local DNS verification if custom-domain-service is unavailable
    // This ensures the onboarding flow still works
    const status = await verifyDNSLocally(body);

    return NextResponse.json({ data: status });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Domain Verification] Error:', error instanceof Error ? error.message : 'Unknown error');
    }
    return errorResponse('Failed to verify domain', 500);
  }
}

// Fallback local DNS verification using Node.js dns module
async function verifyDNSLocally(body: VerifyDomainRequest): Promise<VerificationStatus> {
  const dns = await import('dns');
  const { promisify } = await import('util');
  const resolveCname = promisify(dns.resolveCname);
  const resolveTxt = promisify(dns.resolveTxt);

  const verificationHost = body.verification_host.toLowerCase().trim();
  const expectedValue = body.verification_value.toLowerCase().trim();

  const status: VerificationStatus = {
    dns_verified: false,
    dns_record_found: false,
    dns_record_value: null,
    expected_value: expectedValue,
    ssl_provisioning: false,
    ssl_status: 'pending',
    message: 'Checking DNS configuration...',
    can_proceed: false,
  };

  try {
    // Try CNAME lookup first
    const cnameRecords = await resolveCname(verificationHost);

    if (cnameRecords && cnameRecords.length > 0) {
      status.dns_record_found = true;
      status.dns_record_value = cnameRecords[0].toLowerCase();

      // Check if the CNAME points to our verification target
      if (status.dns_record_value === expectedValue ||
          status.dns_record_value.endsWith('.' + expectedValue) ||
          status.dns_record_value === expectedValue + '.') {
        status.dns_verified = true;
        status.ssl_provisioning = true;
        status.ssl_status = 'provisioning';
        status.message = 'DNS verified! SSL certificate will be provisioned when onboarding completes.';
        status.can_proceed = true;
      } else {
        status.message = `DNS record found but points to "${status.dns_record_value}" instead of "${expectedValue}". Please update your DNS settings.`;
      }
    }
  } catch (cnameError: unknown) {
    const errCode = (cnameError as NodeJS.ErrnoException)?.code;
    // CNAME lookup failed, try TXT lookup as fallback
    try {
      const txtRecords = await resolveTxt(verificationHost);

      if (txtRecords && txtRecords.length > 0) {
        status.dns_record_found = true;
        // TXT records come as arrays of strings, join them
        const txtValue = txtRecords.flat().join('').toLowerCase();
        status.dns_record_value = txtValue;

        if (txtValue.includes(expectedValue) || txtValue === expectedValue) {
          status.dns_verified = true;
          status.ssl_provisioning = true;
          status.ssl_status = 'provisioning';
          status.message = 'DNS verified! SSL certificate will be provisioned when onboarding completes.';
          status.can_proceed = true;
        } else {
          status.message = `TXT record found but has incorrect value. Please verify your DNS configuration.`;
        }
      }
    } catch (txtError: unknown) {
      // Both lookups failed
      const txtErrCode = (txtError as NodeJS.ErrnoException)?.code;
      if (process.env.NODE_ENV === 'development') {
        console.log('[verify-domain] DNS lookup errors:', { cname: errCode, txt: txtErrCode });
      }
      status.message = 'DNS record not found yet. DNS changes can take up to 48 hours to propagate. Please try again later.';
    }
  }

  return status;
}
