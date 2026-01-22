import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone for Docker deployment
  output: 'standalone',

  // TypeScript strict mode - all errors must be fixed before build
  // If workspace packages have errors, fix them or exclude specific paths
  typescript: {
    ignoreBuildErrors: false,
  },

  // Server external packages (native modules that shouldn't be bundled)
  serverExternalPackages: [
    'nats',
    '@google-cloud/secret-manager',
    '@google-cloud/storage',
    'pg',
  ],

  // Security headers configuration
  // SOC2 CC6.7/CC6.8: Security and Confidentiality controls
  async headers() {
    // Content Security Policy
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // SECURITY: unsafe-eval removed for production safety
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://storage.googleapis.com https://*.tesserix.app https://images.unsplash.com",
      "font-src 'self' data:",
      "connect-src 'self' https://*.tesserix.app wss://*.tesserix.app https://storage.googleapis.com https://api.posthog.com https://api.frankfurter.app",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : []),
    ].join('; ');

    return [
      {
        // Security headers for all routes
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: cspDirectives },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        // SECURITY: Stricter Referrer-Policy for verification pages
        // These pages may contain tokens in URLs (before we strip them)
        // Using 'no-referrer' ensures no referrer is sent when navigating away
        source: '/onboarding/verify-email',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
      {
        source: '/onboarding/verify',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
        ],
      },
    ];
  },
};

export default nextConfig;
