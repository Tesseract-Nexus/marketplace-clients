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

  // OpenPanel analytics proxy rewrites (avoids ad blockers)
  async rewrites() {
    return [
      {
        source: '/op1.js',
        destination: `https://${process.env.OPENPANEL_URL || 'dev-analytics.tesserix.app'}/op1.js`,
      },
      {
        source: '/api/op/:path*',
        destination: `https://${process.env.OPENPANEL_URL || 'dev-analytics.tesserix.app'}/:path*`,
      },
    ];
  },

  // Security headers configuration
  // SOC2 CC6.7/CC6.8: Security and Confidentiality controls
  // Security headers configuration
  // CSP is now handled by middleware.ts (per-request nonce)
  async headers() {
    return [
      {
        // Security headers for all routes
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
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
