# =============================================================================
# Storefront - Dockerfile
# Multi-stage build for Next.js 15 application with standalone output
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for Next.js public environment variables
ARG NEXT_PUBLIC_OPENPANEL_CLIENT_ID=""

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_OPENPANEL_CLIENT_ID=$NEXT_PUBLIC_OPENPANEL_CLIENT_ID

# Build argument to determine which .env file to use
ARG ENV_FILE=.env

# Use the specified environment file for the build, fallback to .env.example
RUN if [ -f "$ENV_FILE" ]; then cp "$ENV_FILE" .env.production; \
    elif [ -f ".env.example" ]; then cp ".env.example" .env.production; fi

# Clean up any stale build artifacts
RUN rm -rf .next

# Build the application (source env vars if available)
RUN if [ -f .env.production ]; then set -a && . .env.production && set +a; fi && npm run build

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
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Labels
LABEL org.label-schema.name="storefront" \
      org.label-schema.description="Tesseract Hub Storefront" \
      org.label-schema.vcs-url="https://github.com/Tesseract-Nexus/marketplace-clients"

# Start the application
CMD ["node", "server.js"]
