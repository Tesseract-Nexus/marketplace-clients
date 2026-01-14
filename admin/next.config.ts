import type { NextConfig } from "next";

/**
 * Security Headers Configuration
 *
 * Implements security headers as required by:
 * - OWASP Security Headers
 * - DPDPA 2023 (India)
 * - Privacy Act 1988 (Australia)
 * - PCI-DSS
 *
 * @see docs/SECURITY_COMPLIANCE.md Part 5 - Security Headers
 */

const nextConfig: NextConfig = {
  output: 'standalone',

  // Security headers for all routes
  async headers() {
    // Content Security Policy - Production-grade CSP
    // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
    const cspDirectives = [
      "default-src 'self'",
      // Scripts: Required for Next.js - unsafe-inline and unsafe-eval are needed
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles: Required for Tailwind and inline styles
      "style-src 'self' 'unsafe-inline'",
      // Images: Allow data URIs, blobs, and trusted CDNs
      "img-src 'self' data: blob: https://storage.googleapis.com https://*.tesserix.app https://images.unsplash.com https://*.googleusercontent.com",
      // Fonts: Self and data URIs
      "font-src 'self' data:",
      // Connections: API endpoints, WebSockets, analytics, currency exchange
      "connect-src 'self' https://*.tesserix.app wss://*.tesserix.app https://storage.googleapis.com https://api.posthog.com https://www.google-analytics.com https://api.frankfurter.app",
      // Frame ancestors: Prevent clickjacking - DENY for admin
      "frame-ancestors 'none'",
      // Form actions: Only allow forms to submit to self
      "form-action 'self'",
      // Base URI: Prevent base tag hijacking
      "base-uri 'self'",
      // Object sources: Disable plugins like Flash
      "object-src 'none'",
      // Workers: Allow same-origin and blobs
      "worker-src 'self' blob:",
      // Child frames: Allow same-origin and blobs
      "child-src 'self' blob:",
      // Media: Self only
      "media-src 'self'",
      // Manifest: Self only
      "manifest-src 'self'",
      // Upgrade insecure requests in production
      ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []),
    ].join('; ');

    // Permissions Policy (formerly Feature-Policy)
    // Restricts access to browser features
    // Only include standardized features to avoid console warnings
    // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy
    const permissionsPolicy = [
      'accelerometer=()',
      'autoplay=(self)',
      'camera=()',
      'encrypted-media=(self)',
      'fullscreen=(self)',
      'geolocation=(self)', // Allow for location detection feature
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'payment=(self)', // Allow for payment features
      'picture-in-picture=(self)',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=(self)',
      'xr-spatial-tracking=()',
    ].join(', ');

    return [
      {
        // Security headers for all routes
        source: '/:path*',
        headers: [
          // DNS Prefetch - disable for privacy
          { key: 'X-DNS-Prefetch-Control', value: 'off' },

          // HSTS - Force HTTPS with preload
          // max-age=2 years, include subdomains, preload for browser list
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },

          // Prevent clickjacking - DENY for admin portal
          { key: 'X-Frame-Options', value: 'DENY' },

          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // XSS Protection - legacy but still useful
          { key: 'X-XSS-Protection', value: '1; mode=block' },

          // Referrer Policy - strict for privacy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          // Permissions Policy
          { key: 'Permissions-Policy', value: permissionsPolicy },

          // Content Security Policy
          { key: 'Content-Security-Policy', value: cspDirectives },

          // Cross-Origin Embedder Policy
          // PERFORMANCE: Changed from 'credentialless' to 'unsafe-none' to allow
          // loading external resources (CDN images, third-party integrations)
          // without cross-origin isolation issues
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },

          // Cross-Origin Opener Policy
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },

          // Cross-Origin Resource Policy
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
      {
        // CORS headers for API routes
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          // SECURITY: Restrict to specific origins - no wildcard fallback
          // In development, allow localhost; in production, must be explicitly configured
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '') },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Tenant-ID, X-User-ID, X-User-Name, X-User-Role, X-User-Email, Authorization' },
          { key: 'Access-Control-Max-Age', value: '86400' }, // Cache preflight for 24 hours
        ],
      },
    ];
  },

  // Environment variables that should be available at build time
  env: {
    // Default admin domain for URL construction
    NEXT_PUBLIC_ADMIN_DOMAIN: process.env.NEXT_PUBLIC_ADMIN_DOMAIN || 'admin.localhost:3001',
    NEXT_PUBLIC_STOREFRONT_DOMAIN: process.env.NEXT_PUBLIC_STOREFRONT_DOMAIN || 'localhost:3200',
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Images configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.tesserix.app',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  // Ignore TypeScript errors during build (for development speed)
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
};

export default nextConfig;
