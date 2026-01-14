import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
