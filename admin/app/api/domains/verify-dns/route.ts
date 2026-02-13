/**
 * DNS Verification API Route
 *
 * POST /api/domains/verify-dns
 *
 * Verifies DNS propagation for a custom domain.
 * Uses direct DNS lookups to check if records have propagated.
 */

import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns';
import { promisify } from 'util';
import { getProxyHeaders } from '@/lib/utils/api-route-handler';

const resolveCname = promisify(dns.resolveCname);
const resolveTxt = promisify(dns.resolveTxt);

interface VerifyDNSRequest {
  domain: string;
  verification_host: string;
  verification_value: string;
}

interface VerificationStatus {
  dns_verified: boolean;
  dns_record_found: boolean;
  dns_record_value: string | null;
  expected_value: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const proxyHeaders = await getProxyHeaders(request) as Record<string, string>;
    const tenantId = proxyHeaders['x-jwt-claim-tenant-id'];
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: 'Missing tenant context' },
        { status: 401 }
      );
    }

    const body: VerifyDNSRequest = await request.json();

    if (!body.domain || !body.verification_host || !body.verification_value) {
      return NextResponse.json(
        { error: 'Missing required fields: domain, verification_host, verification_value' },
        { status: 400 }
      );
    }

    const verificationHost = body.verification_host.toLowerCase().trim();
    const expectedValue = body.verification_value.toLowerCase().trim();

    const status: VerificationStatus = {
      dns_verified: false,
      dns_record_found: false,
      dns_record_value: null,
      expected_value: expectedValue,
      message: 'Checking DNS configuration...',
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
          status.message = 'DNS verified! The domain is correctly configured.';
        } else {
          status.message = `DNS record found but points to "${status.dns_record_value}" instead of "${expectedValue}". Please update your DNS settings.`;
        }
      }
    } catch {
      // CNAME lookup failed, try TXT lookup as fallback
      try {
        const txtRecords = await resolveTxt(verificationHost);

        if (txtRecords && txtRecords.length > 0) {
          status.dns_record_found = true;
          const txtValue = txtRecords.flat().join('').toLowerCase();
          status.dns_record_value = txtValue;

          if (txtValue.includes(expectedValue) || txtValue === expectedValue) {
            status.dns_verified = true;
            status.message = 'DNS verified! The domain is correctly configured.';
          } else {
            status.message = 'TXT record found but has incorrect value. Please verify your DNS configuration.';
          }
        }
      } catch {
        // Both lookups failed
        status.message = 'DNS record not found yet. DNS changes can take up to 48 hours to propagate. Please try again later.';
      }
    }

    return NextResponse.json({ data: status });
  } catch (error) {
    console.error('[DNS Verification] Error:', error);
    return NextResponse.json(
      { error: 'Failed to verify DNS' },
      { status: 500 }
    );
  }
}
