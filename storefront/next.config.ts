import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Gzip compression
  compress: true,

  // Output as standalone for Docker deployment
  output: "standalone",

  // Enable React strict mode
  reactStrictMode: true,

  // Ignore TypeScript errors during production build (for CI/CD speed)
  // Type checking should be done separately in CI
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
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
        hostname: "*.tesserix.app",
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

  // Security headers for all routes
  async headers() {
    // Allow localhost connections in development
    const isDev = process.env.NODE_ENV === 'development';
    const devConnectSrc = isDev ? ' http://localhost:* ws://localhost:*' : '';

    // Content Security Policy - storefront needs external image sources and fonts
    const cspHeader = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://*.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://storage.googleapis.com https://storage.cloud.google.com https://*.storage.googleapis.com https://*.googleusercontent.com https://*.tesserix.app https://images.unsplash.com https://picsum.photos https://*.blob.core.windows.net",
      "font-src 'self' data: https://fonts.gstatic.com",
      `connect-src 'self' https://*.tesserix.app https://storage.googleapis.com https://api.stripe.com https://*.razorpay.com wss://*.tesserix.app${devConnectSrc}`,
      "frame-src 'self' https://js.stripe.com https://*.razorpay.com",
      "frame-ancestors 'self' https://*.tesserix.app",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; ');

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
      // Default headers for all routes
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
          { key: "Content-Security-Policy", value: cspHeader },
        ],
      },
    ];
  },
};

export default nextConfig;
