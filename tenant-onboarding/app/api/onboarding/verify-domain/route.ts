/**
 * Domain Verification API Route
 *
 * POST /api/onboarding/verify-domain
 *
 * Verifies DNS propagation for a custom domain.
 * Checks if the CNAME record has been configured correctly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateRequest, errorResponse } from '../../lib/api-handler';
import dns from 'dns';
import { promisify } from 'util';

const resolveCname = promisify(dns.resolveCname);
const resolveTxt = promisify(dns.resolveTxt);

interface VerifyDomainRequest {
  domain: string;
  verification_host: string;
  verification_value: string;
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

    // Clean the verification host (extract just the subdomain part for DNS lookup)
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
          status.message = 'DNS verified! SSL certificate is being provisioned automatically.';
          status.can_proceed = true;
        } else {
          status.message = `DNS record found but points to "${status.dns_record_value}" instead of "${expectedValue}". Please update your DNS settings.`;
        }
      }
    } catch (cnameError) {
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
            status.message = 'DNS verified! SSL certificate is being provisioned automatically.';
            status.can_proceed = true;
          } else {
            status.message = `TXT record found but has incorrect value. Please verify your DNS configuration.`;
          }
        }
      } catch {
        // Both lookups failed
        status.message = 'DNS record not found yet. DNS changes can take up to 48 hours to propagate. Please try again later.';
      }
    }

    // If DNS is verified, simulate SSL provisioning status
    // In production, this would call the custom-domain-service to check actual cert status
    if (status.dns_verified) {
      // The cert-manager will automatically provision certificates once DNS is verified
      // For now, we'll indicate that provisioning has started
      status.ssl_status = 'provisioning';
    }

    return NextResponse.json({ data: status });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Domain Verification] Error:', error instanceof Error ? error.message : 'Unknown error');
    }
    return errorResponse('Failed to verify domain', 500);
  }
}
