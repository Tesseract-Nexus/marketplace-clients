/**
 * Custom Domain Validation API Route
 *
 * POST /api/onboarding/validate/custom-domain
 *
 * Validates a custom domain and checks DNS configuration.
 * Uses the custom-domain-service to verify domain ownership.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SERVICES, validateRequest, errorResponse, generateRequestId } from '../../../lib/api-handler';

interface ValidateCustomDomainRequest {
  domain: string;
  session_id?: string;
}

interface DNSRecord {
  type: string;
  host: string;
  value: string;
  ttl?: number;
  purpose?: string;
}

interface ValidateCustomDomainResponse {
  valid: boolean;
  available: boolean;
  dns_configured: boolean;
  dns_records?: DNSRecord[];
  verification_record?: DNSRecord;
  verification_records?: DNSRecord[];
  message?: string;
  suggestions?: string[];
}

export async function POST(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) {
    return validationError;
  }

  try {
    const body: ValidateCustomDomainRequest = await request.json();

    if (!body.domain || body.domain.length < 4) {
      return errorResponse('Invalid domain', 400);
    }

    // Clean the domain (remove protocol, trailing slashes, whitespace)
    const cleanDomain = body.domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .replace(/\s/g, '')
      .trim();

    // RFC 1035: Domain name max length is 253 characters
    if (cleanDomain.length > 253) {
      return NextResponse.json({
        data: {
          valid: false,
          available: false,
          dns_configured: false,
          message: 'Domain name is too long. Maximum length is 253 characters.',
        },
      });
    }

    // RFC 1123: Each label (part between dots) max 63 characters, cannot start/end with hyphen
    const labels = cleanDomain.split('.');
    for (const label of labels) {
      if (label.length > 63) {
        return NextResponse.json({
          data: {
            valid: false,
            available: false,
            dns_configured: false,
            message: 'Domain label is too long. Each part between dots must be 63 characters or less.',
          },
        });
      }
      if (label.startsWith('-') || label.endsWith('-')) {
        return NextResponse.json({
          data: {
            valid: false,
            available: false,
            dns_configured: false,
            message: 'Domain labels cannot start or end with a hyphen.',
          },
        });
      }
    }

    // Check for punycode (internationalized domain names) - block for now to prevent homograph attacks
    if (cleanDomain.includes('xn--')) {
      return NextResponse.json({
        data: {
          valid: false,
          available: false,
          dns_configured: false,
          message: 'Internationalized domain names (IDN/punycode) are not currently supported.',
        },
      });
    }

    // Basic domain format validation (ASCII only)
    const domainRegex = /^(?!:\/\/)([a-z0-9-]+\.)+[a-z]{2,}$/;
    if (!domainRegex.test(cleanDomain)) {
      return NextResponse.json({
        data: {
          valid: false,
          available: false,
          dns_configured: false,
          message: 'Invalid domain format. Please enter a valid domain (e.g., store.example.com)',
        },
      });
    }

    // Expanded blocked domains list for security
    const blockedDomains = [
      // Our own domains
      'tesserix.app',
      'tesserix.com',
      'tesserix.io',
      'tesserix.net',
      'tesserix.org',
      // Local/internal domains
      'localhost',
      'local',
      'internal',
      'intranet',
      'corp',
      'home',
      'lan',
      // IP-based domains that could bypass restrictions
      'nip.io',
      'sslip.io',
      'xip.io',
      // Common test/example domains
      'example.com',
      'example.org',
      'example.net',
      'test.com',
      'invalid',
      // Government/sensitive TLDs (shouldn't be used for storefronts)
      'gov',
      'mil',
      'edu',
    ];

    const isBlocked = blockedDomains.some(blocked => {
      const lowerBlocked = blocked.toLowerCase();
      return (
        cleanDomain === lowerBlocked ||
        cleanDomain.endsWith(`.${lowerBlocked}`)
      );
    });

    if (isBlocked) {
      return NextResponse.json({
        data: {
          valid: false,
          available: false,
          dns_configured: false,
          message: 'This domain is reserved or not allowed for storefront use.',
        },
      });
    }

    // Call custom-domain-service to validate the domain
    const requestId = generateRequestId();
    const serviceUrl = `${SERVICES.CUSTOM_DOMAIN}/api/v1/domains/validate`;

    try {
      const response = await fetch(serviceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': requestId,
        },
        body: JSON.stringify({
          domain: cleanDomain,
          session_id: body.session_id,
          check_dns: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Handle wrapped response from custom-domain-service
        const responseData = data.data || data;
        // Sanitize response - only return expected fields
        const sanitizedData: ValidateCustomDomainResponse = {
          valid: Boolean(responseData.valid),
          available: Boolean(responseData.available),
          dns_configured: Boolean(responseData.dns_configured),
          message: typeof responseData.message === 'string' ? responseData.message : undefined,
        };
        if (responseData.verification_record) {
          sanitizedData.verification_record = {
            type: String(responseData.verification_record.record_type || responseData.verification_record.type || 'CNAME'),
            host: String(responseData.verification_record.host || ''),
            value: String(responseData.verification_record.value || ''),
            ttl: Number(responseData.verification_record.ttl) || 3600,
          };
        }
        // Include all verification options (CNAME and TXT)
        if (responseData.verification_records && Array.isArray(responseData.verification_records)) {
          sanitizedData.verification_records = responseData.verification_records.map((rec: Record<string, unknown>) => ({
            type: String(rec.record_type || rec.type || 'CNAME'),
            host: String(rec.host || ''),
            value: String(rec.value || ''),
            ttl: Number(rec.ttl) || 3600,
            purpose: String(rec.purpose || 'verification'),
          }));
        }
        return NextResponse.json({ data: sanitizedData });
      }

      // If service is unavailable, return basic validation result
      // The domain can still be registered and verified later
      // Note: Logging status code only, no sensitive data
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Custom Domain] Service returned status ${response.status}`);
      }
    } catch {
      // Service might not be available, continue with basic validation
      // Note: Not logging error details to avoid exposing internal information
    }

    // Return basic validation result if service is unavailable
    // Domain will be verified during the provisioning phase
    const verificationToken = `tesserix-verify-${Date.now().toString(36)}`;

    return NextResponse.json({
      data: {
        valid: true,
        available: true,
        dns_configured: false,
        verification_record: {
          type: 'CNAME',
          host: `_tesserix.${cleanDomain}`,
          value: 'verify.tesserix.app',
          ttl: 3600,
        },
        verification_records: [
          {
            type: 'CNAME',
            host: `_tesserix.${cleanDomain}`,
            value: 'verify.tesserix.app',
            ttl: 3600,
            purpose: 'verification',
          },
          {
            type: 'TXT',
            host: `_tesserix.${cleanDomain}`,
            value: verificationToken,
            ttl: 3600,
            purpose: 'verification',
          },
        ],
        message: 'Domain format is valid. DNS verification will be completed during setup.',
      } as ValidateCustomDomainResponse,
    });
  } catch (error) {
    // Log error internally but don't expose details to client
    if (process.env.NODE_ENV === 'development') {
      console.error('[Custom Domain Validation] Error:', error instanceof Error ? error.message : 'Unknown error');
    }
    // Return generic error message without internal details
    return errorResponse('Failed to validate domain', 500);
  }
}
