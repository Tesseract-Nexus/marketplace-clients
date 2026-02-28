# =============================================================================
# Tenant Onboarding - Dockerfile
# Multi-stage build for Next.js application with standalone output
# Build from app directory: docker build -t tenant-onboarding .
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Install dependencies (support both npm and pnpm)
RUN if [ -f pnpm-lock.yaml ]; then \
      corepack enable && corepack prepare pnpm@10.13.1 --activate && pnpm install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install; \
    fi

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_ECOMMERCE_ADMIN_URL=https://admin.tesserix.app
ARG NEXT_PUBLIC_OPENPANEL_CLIENT_ID=""
ARG NEXT_PUBLIC_BASE_DOMAIN=tesserix.app
ARG NEXT_PUBLIC_SITE_URL=https://onboarding.tesserix.app
ARG NEXT_PUBLIC_POSTHOG_KEY=""
ARG NEXT_PUBLIC_POSTHOG_HOST=""
ARG NEXT_PUBLIC_OPENPANEL_ENABLED=false
ARG NEXT_PUBLIC_OPENPANEL_API_URL=""
ARG NEXT_PUBLIC_SUPPORT_EMAIL=support@tesserix.com
ARG NEXT_PUBLIC_ENABLE_PHONE_VERIFICATION=false
ARG NEXT_PUBLIC_ENABLE_DOCUMENTS=true
ARG NEXT_PUBLIC_REQUIRE_ADDRESS_PROOF=false
ARG NEXT_PUBLIC_REQUIRE_BUSINESS_PROOF=false
ARG NEXT_PUBLIC_REQUIRE_LOGO=false
ARG NEXT_PUBLIC_DOMAIN_VERIFICATION_TARGET=""

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_ECOMMERCE_ADMIN_URL=$NEXT_PUBLIC_ECOMMERCE_ADMIN_URL
ENV NEXT_PUBLIC_OPENPANEL_CLIENT_ID=$NEXT_PUBLIC_OPENPANEL_CLIENT_ID
ENV NEXT_PUBLIC_BASE_DOMAIN=$NEXT_PUBLIC_BASE_DOMAIN
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_OPENPANEL_ENABLED=$NEXT_PUBLIC_OPENPANEL_ENABLED
ENV NEXT_PUBLIC_OPENPANEL_API_URL=$NEXT_PUBLIC_OPENPANEL_API_URL
ENV NEXT_PUBLIC_SUPPORT_EMAIL=$NEXT_PUBLIC_SUPPORT_EMAIL
ENV NEXT_PUBLIC_ENABLE_PHONE_VERIFICATION=$NEXT_PUBLIC_ENABLE_PHONE_VERIFICATION
ENV NEXT_PUBLIC_ENABLE_DOCUMENTS=$NEXT_PUBLIC_ENABLE_DOCUMENTS
ENV NEXT_PUBLIC_REQUIRE_ADDRESS_PROOF=$NEXT_PUBLIC_REQUIRE_ADDRESS_PROOF
ENV NEXT_PUBLIC_REQUIRE_BUSINESS_PROOF=$NEXT_PUBLIC_REQUIRE_BUSINESS_PROOF
ENV NEXT_PUBLIC_REQUIRE_LOGO=$NEXT_PUBLIC_REQUIRE_LOGO
ENV NEXT_PUBLIC_DOMAIN_VERIFICATION_TARGET=$NEXT_PUBLIC_DOMAIN_VERIFICATION_TARGET

# Build the application
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application from standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Change ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "server.js"]
