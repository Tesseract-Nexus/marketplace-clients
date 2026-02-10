import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Gzip compression
  compress: true,

  // Output as standalone for Docker deployment
  output: "standalone",

  // Enable React strict mode
  reactStrictMode: true,

  // SECURITY: TypeScript errors must be fixed - no ignoring in production builds
  // Type safety is critical for preventing runtime errors and security issues
  typescript: {
    ignoreBuildErrors: false,
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.mark8ly.app",
      },
      {
        protocol: "https",
        hostname: "*.blob.core.windows.net",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      // GCS URL formats - standard
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
      // GCS URL format - cloud console
      {
        protocol: "https",
        hostname: "storage.cloud.google.com",
      },
      // GCS URL format - bucket subdomain
      {
        protocol: "https",
        hostname: "*.storage.googleapis.com",
      },
      // Google user content (for uploaded images)
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      // Facebook profile pictures (social login)
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
      },
      {
        protocol: "https",
        hostname: "*.fbcdn.net",
      },
    ],
    // Allow local API routes serving images
    localPatterns: [
      {
        pathname: "/api/media/**",
      },
    ],
    // Optimize images with CDN-friendly settings
    formats: ["image/avif", "image/webp"],
    // Cache optimized images for 1 year (immutable)
    minimumCacheTTL: 31536000,
    // Allow larger images for high-res displays
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || "0.1.0",
  },

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

  // Security headers for all routes
  // NOTE: CSP is set dynamically in middleware.ts with per-request nonces
  async headers() {
    return [
      // Cache static assets (JS, CSS, fonts) for 1 year with immutable
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache optimized images for 1 year
      {
        source: "/_next/image",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=86400" },
        ],
      },
      // Cache static images for 1 year
      {
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache product/category images proxy routes (if any)
      {
        source: "/api/media/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400" },
        ],
      },
      // Default security headers for all routes
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
};

export default nextConfig;
