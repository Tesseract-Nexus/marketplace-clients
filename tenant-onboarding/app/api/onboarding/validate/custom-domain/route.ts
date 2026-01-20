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
}

interface ValidateCustomDomainResponse {
  valid: boolean;
  available: boolean;
  dns_configured: boolean;
  dns_records?: DNSRecord[];
  verification_record?: DNSRecord;
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

    // Clean the domain (remove protocol, trailing slashes)
    const cleanDomain = body.domain
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .trim();

    // Basic domain format validation
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
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

    // Check if domain is a reserved/blocked domain
    const blockedDomains = ['tesserix.app', 'tesserix.com', 'localhost'];
    const isBlocked = blockedDomains.some(blocked =>
      cleanDomain === blocked || cleanDomain.endsWith(`.${blocked}`)
    );

    if (isBlocked) {
      return NextResponse.json({
        data: {
          valid: false,
          available: false,
          dns_configured: false,
          message: 'This domain is reserved and cannot be used',
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
        return NextResponse.json({ data });
      }

      // If service is unavailable, return basic validation result
      // The domain can still be registered and verified later
      console.warn(`[Custom Domain] Service returned ${response.status}, using basic validation`);
    } catch (serviceError) {
      // Service might not be available, continue with basic validation
      console.warn('[Custom Domain] Service unavailable, using basic validation:', serviceError);
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
        message: 'Domain format is valid. DNS verification will be completed during setup.',
      } as ValidateCustomDomainResponse,
    });
  } catch (error) {
    console.error('[Custom Domain Validation] Error:', error);
    return errorResponse(
      'Failed to validate domain',
      500,
      process.env.NODE_ENV === 'development' ? { error: String(error) } : undefined
    );
  }
}
