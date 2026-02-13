import { NextResponse } from 'next/server';

/**
 * Runtime Configuration API
 *
 * Returns backend service URLs and app configuration based on environment.
 * This allows dynamic URL routing without rebuilding the app.
 *
 * Environment Variables:
 * - TENANT_SERVICE_PUBLIC_URL: Public ingress URL for tenant-service (optional)
 *   If not set, the API routes (BFF pattern) will be used
 * - LOCATION_SERVICE_PUBLIC_URL: Public ingress URL for location-service (optional)
 * - ECOMMERCE_ADMIN_URL: Admin panel URL (e.g., https://dev-admin.mark8ly.com)
 * - BASE_DOMAIN: Base domain for tenant subdomains (e.g., mark8ly.com)
 *
 * URL Format:
 * - Tenant admin URLs use subdomain pattern: {slug}-admin.{baseDomain}
 * - Example: mystore-admin.mark8ly.com
 */
export async function GET() {
  const defaultBaseDomain = 'mark8ly.com';

  // Get public URLs from environment (these would be ingress URLs)
  const tenantServicePublicUrl = process.env.TENANT_SERVICE_PUBLIC_URL;
  const locationServicePublicUrl = process.env.LOCATION_SERVICE_PUBLIC_URL;

  // Admin URL - environment specific
  // devtest: https://dev-admin.mark8ly.com
  // pilot: https://pilot-admin.mark8ly.com
  // prod: https://admin.mark8ly.com
  const ecommerceAdminUrl = process.env.ECOMMERCE_ADMIN_URL || process.env.NEXT_PUBLIC_ECOMMERCE_ADMIN_URL || `https://admin.${defaultBaseDomain}`;

  // Base domain for subdomain-based tenant URLs
  // Format: {slug}-admin.{baseDomain} (e.g., mystore-admin.mark8ly.com)
  const baseDomain = process.env.BASE_DOMAIN || process.env.NEXT_PUBLIC_BASE_DOMAIN || defaultBaseDomain;

  // Extract hostname from admin URL for display
  let adminHostname = `admin.${defaultBaseDomain}`;
  try {
    const url = new URL(ecommerceAdminUrl);
    adminHostname = url.hostname;
  } catch {
    // Use default if URL parsing fails
  }

  // If public URLs are configured, use them directly
  // Otherwise, use the local API routes (BFF pattern)
  const config = {
    // Base domain for subdomain-based tenant URLs
    // URL pattern: {slug}-admin.{baseDomain}
    baseDomain,
    // Admin panel configuration
    admin: {
      url: ecommerceAdminUrl,
      hostname: adminHostname,
    },
    services: {
      tenant: {
        // Base URL for tenant service API calls
        baseUrl: tenantServicePublicUrl || '',
        // Draft API endpoints
        draft: {
          save: tenantServicePublicUrl
            ? `${tenantServicePublicUrl}/api/v1/onboarding/draft/save`
            : '/api/onboarding/draft/save',
          // URL pattern with {sessionId} placeholder
          get: tenantServicePublicUrl
            ? `${tenantServicePublicUrl}/api/v1/onboarding/draft/{sessionId}`
            : '/api/onboarding/draft/{sessionId}',
          heartbeat: tenantServicePublicUrl
            ? `${tenantServicePublicUrl}/api/v1/onboarding/draft/heartbeat`
            : '/api/onboarding/draft/heartbeat',
          browserClose: tenantServicePublicUrl
            ? `${tenantServicePublicUrl}/api/v1/onboarding/draft/browser-close`
            : '/api/onboarding/draft/browser-close',
        },
        // Use BFF pattern (local API routes) if no public URL
        useBFF: !tenantServicePublicUrl,
      },
      location: {
        baseUrl: locationServicePublicUrl || '',
        useBFF: !locationServicePublicUrl,
      },
    },
    // Environment info (useful for debugging)
    environment: process.env.NODE_ENV || 'development',
  };

  return NextResponse.json(config);
}
