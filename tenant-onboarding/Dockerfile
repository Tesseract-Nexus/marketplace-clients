# =============================================================================
# Tenant Onboarding - Dockerfile
# Multi-stage build for Next.js 15 application with standalone output
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.13.1 --activate

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./

# Copy workspace packages that tenant-onboarding depends on
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui
COPY packages/api-contracts ./packages/api-contracts
COPY packages/eslint-config ./packages/eslint-config
COPY packages/typescript-config ./packages/typescript-config

# Copy tenant-onboarding app
COPY apps/tenant-onboarding ./apps/tenant-onboarding

# Install dependencies for the entire workspace
RUN pnpm install --filter=@ecommerce/tenant-onboarding...

# Build the application
WORKDIR /app/apps/tenant-onboarding

# Build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_BASE_DOMAIN=tesserix.app

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_BASE_DOMAIN=$NEXT_PUBLIC_BASE_DOMAIN

RUN pnpm --filter=@ecommerce/tenant-onboarding build

# -----------------------------------------------------------------------------
# Stage 2: Production
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy built application from standalone output
COPY --from=builder /app/apps/tenant-onboarding/.next/standalone ./
COPY --from=builder /app/apps/tenant-onboarding/.next/static ./apps/tenant-onboarding/.next/static
COPY --from=builder /app/apps/tenant-onboarding/public ./apps/tenant-onboarding/public

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check using Node.js (wget/curl not needed)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "apps/tenant-onboarding/server.js"]
