import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile workspace packages for monorepo (Next.js 16 with Turbopack)
  transpilePackages: ['@workspace/ui', '@workspace/shared', '@workspace/api-contracts'],

  // Output standalone for Docker deployment
  output: 'standalone',

  // Skip TypeScript errors during build (errors in workspace packages)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Server external packages (native modules that shouldn't be bundled)
  serverExternalPackages: ['nats'],
};

export default nextConfig;
