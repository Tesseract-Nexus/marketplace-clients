# Storefront - Production Readiness Document

## Table of Contents

1. [Readiness Status](#readiness-status)
2. [Critical Blockers](#critical-blockers)
3. [Security Assessment](#security-assessment)
4. [Overview](#overview)
5. [Architecture](#architecture)
6. [Prerequisites](#prerequisites)
7. [Configuration](#configuration)
8. [Build & Deployment](#build--deployment)
9. [Health Checks & Monitoring](#health-checks--monitoring)
10. [Security Configuration](#security-configuration)
11. [Performance & Scaling](#performance--scaling)
12. [Disaster Recovery](#disaster-recovery)
13. [Troubleshooting](#troubleshooting)
14. [Runbook](#runbook)
15. [Production Checklist](#production-checklist)

---

## Readiness Status

### Current Status: NOT PRODUCTION READY

| Category | Status | Notes |
|----------|--------|-------|
| **Core Features** | Implemented | Multi-tenant, theming, checkout, cart |
| **Security** | Needs Work | XSS, CSRF, token storage issues |
| **Payment Integration** | Incomplete | Webhook handling missing |
| **Error Handling** | Partial | Error boundaries exist, API resilience needed |
| **SEO** | Basic | Sitemap/robots done, structured data missing |
| **Performance** | Good | Image optimization, code splitting done |
| **Monitoring** | Missing | No Sentry/error tracking integration |

### Estimated Effort to Production

| Category | Effort | Priority |
|----------|--------|----------|
| Security fixes | 5-7 days | CRITICAL |
| Payment webhooks | 2-3 days | CRITICAL |
| Error handling & resilience | 2 days | HIGH |
| Token refresh implementation | 1 day | HIGH |
| SEO improvements | 1-2 days | MEDIUM |
| Monitoring integration | 1 day | MEDIUM |
| **Total** | **~2-3 weeks** | - |

---

## Critical Blockers

### BLOCKER 1: Payment Webhook Handling Missing

**Status**: CRITICAL - Must fix before launch

**Issue**: Payment confirmation is not processed server-side. The Razorpay handler is empty and Stripe webhooks are not implemented.

**Files Affected**:
- `apps/storefront/app/checkout/page.tsx` (lines 306-382)

**Current Code**:
```typescript
const paymentResponse = await initiateRazorpayPayment({
  key: keyId,
  amount: Math.round(total * 100),
  currency: 'INR',
  handler: () => {}, // EMPTY HANDLER - payment success not processed!
});
```

**Required Fix**:
1. Implement `POST /api/webhooks/razorpay` endpoint
2. Implement `POST /api/webhooks/stripe` endpoint
3. Verify webhook signatures
4. Update order status based on payment confirmation
5. Send order confirmation email

---

### BLOCKER 2: Placeholder Payment Keys

**Status**: CRITICAL - Security risk

**Issue**: Test placeholder keys are hardcoded as fallbacks. If env vars not set, payments fail silently.

**Files Affected**:
- `apps/storefront/app/checkout/page.tsx` (lines 311, 373)

**Current Code**:
```typescript
const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder';
```

**Required Fix**:
```typescript
const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
if (!keyId) {
  throw new Error('Razorpay key not configured');
}
```

---

### BLOCKER 3: XSS Vulnerability in Content Pages

**Status**: CRITICAL - Security vulnerability

**Issue**: Content pages render unsanitized HTML, enabling stored XSS attacks.

**Files Affected**:
- `apps/storefront/app/pages/[pageSlug]/ContentPageClient.tsx` (line 64)

**Current Code**:
```typescript
<article dangerouslySetInnerHTML={{ __html: page.content }} />
```

**Required Fix**:
```typescript
import DOMPurify from 'dompurify';

const sanitizedContent = DOMPurify.sanitize(page.content, {
  ALLOWED_TAGS: ['p', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'strong', 'em'],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'class']
});

<article dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
```

---

### BLOCKER 4: Access Tokens in localStorage

**Status**: HIGH - Security vulnerability

**Issue**: Access tokens stored in localStorage are vulnerable to XSS attacks.

**Files Affected**:
- `apps/storefront/store/auth.ts` (lines 77-84)

**Required Fix**:
1. Move access tokens to httpOnly cookies (set via backend)
2. Use server-side sessions for sensitive data
3. Implement token rotation

---

### BLOCKER 5: No CSRF Protection

**Status**: HIGH - Security vulnerability

**Issue**: No CSRF tokens in state-changing operations (POST, PUT, DELETE).

**Required Fix**:
1. Implement double-submit CSRF tokens
2. Add CSRF middleware to API routes
3. Set `SameSite=Strict` on all cookies

---

### BLOCKER 6: Token Refresh Not Implemented

**Status**: HIGH - Authentication gap

**Issue**: `expiresIn` and `refreshToken` are returned but never used. Users get logged out unexpectedly.

**Files Affected**:
- `apps/storefront/lib/api/auth.ts`
- `apps/storefront/store/auth.ts`

**Required Fix**:
1. Implement `/api/auth/refresh` endpoint
2. Auto-refresh tokens 5 minutes before expiration
3. Store `expiresAt` timestamp
4. Implement automatic logout on expiration

---

### BLOCKER 7: Discount Validated Client-Side Only

**Status**: HIGH - Business logic vulnerability

**Issue**: Coupon/discount amounts are calculated client-side and sent to payment. Malicious users can modify amounts.

**Files Affected**:
- `apps/storefront/app/checkout/page.tsx` (lines 81-82, 213-216)

**Required Fix**:
1. Recalculate order total on backend before payment
2. Validate coupon server-side
3. Check coupon eligibility (expiry, min amount, usage limits)

---

### BLOCKER 8: No Order Idempotency

**Status**: HIGH - Data integrity risk

**Issue**: Duplicate order creation possible if user clicks twice or refreshes.

**Required Fix**:
1. Generate idempotency key client-side before order creation
2. Send `X-Idempotency-Key` header
3. Backend returns same order if duplicate request

---

## Security Assessment

### Vulnerabilities Found

| Issue | Severity | File | Line |
|-------|----------|------|------|
| XSS via dangerouslySetInnerHTML | CRITICAL | ContentPageClient.tsx | 64 |
| Placeholder payment keys | CRITICAL | checkout/page.tsx | 311, 373 |
| Tokens in localStorage | HIGH | store/auth.ts | 77-84 |
| No CSRF protection | HIGH | Multiple | - |
| CSP allows unsafe-inline | MEDIUM | next.config.ts | 44-45 |
| OAuth cookies without Secure flag | MEDIUM | login/page.tsx | 67-73 |
| No token refresh | HIGH | lib/api/auth.ts | - |

### Content Security Policy Issues

**Current CSP** (too permissive):
```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.razorpay.com",
"style-src 'self' 'unsafe-inline'",
```

**Issues**:
- `'unsafe-inline'` enables XSS attacks
- `'unsafe-eval'` allows code injection
- No nonce-based protection

**Recommended CSP**:
```typescript
"script-src 'self' 'nonce-{random}' https://js.stripe.com https://checkout.razorpay.com",
"style-src 'self' 'nonce-{random}'",
```

### Authentication Security

| Aspect | Status | Notes |
|--------|--------|-------|
| Password hashing | N/A | Backend handles |
| Token storage | VULNERABLE | localStorage instead of httpOnly cookies |
| Token refresh | NOT IMPLEMENTED | Users logged out unexpectedly |
| Session timeout | NO WARNING | User loses progress |
| CSRF protection | MISSING | Form submissions vulnerable |

---

## Overview

### Application Summary

| Property | Value |
|----------|-------|
| **Name** | Storefront |
| **Type** | Multi-tenant ecommerce frontend |
| **Framework** | Next.js 16.x (App Router) |
| **Runtime** | Node.js 22 (Alpine) |
| **Port** | 3000 |
| **Output** | Standalone |

### Key Features

- **Multi-tenant Architecture**: Dynamic storefront per tenant via `[slug]` routing
- **Theme System**: CSS variables for real-time theme customization (client-side)
- **Server-Side Rendering**: SEO-optimized with Next.js Server Components
- **Mobile-First**: Responsive design with mobile navigation
- **Cart & Checkout**: Full ecommerce flow with guest checkout support
- **Push Notifications**: Firebase Cloud Messaging integration

### Route Structure

```
/                           # Landing page (static)
/api/health                 # Health endpoint
/[slug]                     # Tenant storefront homepage
/[slug]/products            # Product listing
/[slug]/products/[id]       # Product detail
/[slug]/cart                # Shopping cart
/[slug]/checkout            # Checkout flow
/[slug]/search              # Search results
/[slug]/account             # User account
/[slug]/account/orders      # Order history
/[slug]/account/tickets     # Support tickets
/[slug]/account/wishlist    # Wishlist
/[slug]/account/payment     # Payment methods
/[slug]/account/settings    # User settings
/[slug]/verify-email        # Email verification
```

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           INGRESS (Kong/Istio)                       │
│                        dev-store.mark8ly.app                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │ Storefront│   │ Storefront│   │ Storefront│
            │  Pod #1   │   │  Pod #2   │   │  Pod #n   │
            │           │   │           │   │           │
            │ ┌───────┐ │   │ ┌───────┐ │   │ ┌───────┐ │
            │ │Next.js│ │   │ │Next.js│ │   │ │Next.js│ │
            │ │ :3000 │ │   │ │ :3000 │ │   │ │ :3000 │ │
            │ └───────┘ │   │ └───────┘ │   │ └───────┘ │
            └───────────┘   └───────────┘   └───────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVICES                             │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┤
│  Settings   │  Products   │  Categories │   Orders    │  Customers  │
│  Service    │  Service    │  Service    │  Service    │  Service    │
│   :8085     │   :8080     │   :8080     │   :8080     │   :8080     │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

### Pod Architecture

Each storefront pod contains:

1. **Main Container (storefront)**: Next.js application on port 3000

> Note: Theme conversion is handled client-side via `lib/theme/theme-utils.ts` and CSS utilities in `globals.css`.

### Data Flow

1. **Request arrives** at ingress with tenant slug (e.g., `/demo/products`)
2. **Storefront** extracts slug from URL path
3. **Settings fetch** from Settings Service for theme/config
4. **Theme injection** via CSS variables in ThemeProvider
5. **Product data** fetched from Products Service with tenant headers
6. **Response rendered** with tenant-specific styling

---

## Prerequisites

### Infrastructure Requirements

| Component | Requirement | Notes |
|-----------|-------------|-------|
| Kubernetes | 1.28+ | EKS, AKS, or GKE |
| Node.js | 22.x | Alpine image |
| Memory | 256Mi - 512Mi | Per pod |
| CPU | 100m - 500m | Per pod |
| Storage | None | Stateless application |

### Backend Dependencies

| Service | URL Pattern | Required |
|---------|-------------|----------|
| Settings Service | `http://settings-service:8085` | Yes |
| Products Service | `http://products-service:8080/api/v1` | Yes |
| Categories Service | `http://categories-service:8080/api/v1` | Yes |
| Orders Service | `http://orders-service:8080/api/v1` | Yes |
| Customers Service | `http://customers-service:8080/api/v1` | Yes |
| Reviews Service | `http://reviews-service:8080/api/v1` | Optional |
| Coupons Service | `http://coupons-service:8080/api/v1` | Optional |
| Tickets Service | `http://tickets-service:8080/api/v1` | Optional |
| Tenant Service | `http://tenant-service:8080/api/v1` | Yes |
| Notification Service | `http://notification-service:8080/api/v1` | Optional |

### External Dependencies

| Service | Purpose | Required |
|---------|---------|----------|
| Stripe | Payment processing | Yes (if used) |
| Razorpay | Payment processing | Yes (if used) |
| Firebase | Push notifications | Optional |
| Azure AD | Authentication | Optional |
| CDN | Static assets | Recommended |
| Image CDN | Product images | Recommended |

---

## Configuration

### Environment Variables

#### Server-Side Variables

```bash
# Application
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Telemetry
NEXT_TELEMETRY_DISABLED=1

# Backend Services (Kubernetes DNS)
SETTINGS_SERVICE_URL=http://settings-service.devtest.svc.cluster.local:8085
PRODUCTS_SERVICE_URL=http://products-service.devtest.svc.cluster.local:8080/api/v1
CATEGORIES_SERVICE_URL=http://categories-service.devtest.svc.cluster.local:8080/api/v1
ORDERS_SERVICE_URL=http://orders-service.devtest.svc.cluster.local:8080/api/v1
CUSTOMERS_SERVICE_URL=http://customers-service.devtest.svc.cluster.local:8080/api/v1
REVIEWS_SERVICE_URL=http://reviews-service.devtest.svc.cluster.local:8080/api/v1
COUPONS_SERVICE_URL=http://coupons-service.devtest.svc.cluster.local:8080/api/v1
TICKETS_SERVICE_URL=http://tickets-service.devtest.svc.cluster.local:8080/api/v1
VENDORS_SERVICE_URL=http://vendor-service.devtest.svc.cluster.local:8080/api/v1
TENANT_SERVICE_URL=http://tenant-service.devtest.svc.cluster.local:8080/api/v1
NOTIFICATION_SERVICE_URL=http://notification-service.devtest.svc.cluster.local:8080/api/v1
```

#### Client-Side Variables (NEXT_PUBLIC_*)

```bash
# Application URLs
NEXT_PUBLIC_APP_URL=https://dev-store.mark8ly.app
NEXT_PUBLIC_STOREFRONT_URL=https://dev-store.mark8ly.app

# API Endpoints (browser requests through ingress)
NEXT_PUBLIC_PRODUCTS_API_URL=https://dev-store.mark8ly.app/api/v1
NEXT_PUBLIC_ORDERS_API_URL=https://dev-store.mark8ly.app/api/v1
NEXT_PUBLIC_CATEGORIES_API_URL=https://dev-store.mark8ly.app/api/v1
NEXT_PUBLIC_SETTINGS_API_URL=https://dev-store.mark8ly.app/api/v1
NEXT_PUBLIC_NOTIFICATION_API_URL=https://dev-store.mark8ly.app/api/v1

# Payment Gateways (REQUIRED - no defaults!)
NEXT_PUBLIC_RAZORPAY_KEY_ID=<your-razorpay-key>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-key>

# Firebase (for push notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=<api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project-id>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<app-id>
NEXT_PUBLIC_FIREBASE_VAPID_KEY=<vapid-key>

# Azure AD (if enabled)
NEXT_PUBLIC_AZURE_CLIENT_ID=<client-id>
NEXT_PUBLIC_AZURE_AUTHORITY=https://login.microsoftonline.com/<tenant-id>
NEXT_PUBLIC_REDIRECT_URI=https://dev-store.mark8ly.app

# Feature Flags
NEXT_PUBLIC_ENABLE_REVIEWS=true
NEXT_PUBLIC_ENABLE_WISHLIST=true
NEXT_PUBLIC_ENABLE_MULTI_CURRENCY=false
NEXT_PUBLIC_ENABLE_DARK_MODE=true

# Version
NEXT_PUBLIC_APP_VERSION=0.1.0
```

### Helm Values Configuration

Key values in `values.yaml`:

```yaml
# Replicas
replicaCount: 1          # Minimum for dev
autoscaling:
  enabled: true
  minReplicas: 2         # Minimum for production
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

# Resources
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 256Mi

# Probes
livenessProbe:
  httpGet:
    path: /api/health
    port: http
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /api/health
    port: http
  initialDelaySeconds: 5
  periodSeconds: 10

# Theme Converter Sidecar (DISABLED - theme handled client-side)
sidecar:
  enabled: false
```

---

## Build & Deployment

### Docker Build

```bash
# From monorepo root
docker build -f apps/storefront/Dockerfile -t storefront:latest .

# With specific environment file
docker build -f apps/storefront/Dockerfile \
  --build-arg ENV_FILE=.env.production \
  -t storefront:v1.0.0 .
```

### Docker Build Stages

| Stage | Purpose | Output |
|-------|---------|--------|
| deps | Install pnpm dependencies | node_modules |
| builder | Build Next.js application | .next/standalone |
| runner | Production runtime | Final image |

### Image Registry

```bash
# GitHub Container Registry
ghcr.io/tesseract-nexus/tesseract-hub/storefront:latest
ghcr.io/tesseract-nexus/tesseract-hub/storefront:v1.0.0
ghcr.io/tesseract-nexus/tesseract-hub/storefront:main-abc1234
```

### CI/CD Pipelines

#### Build Pipeline (`storefront-build.yml`)

Triggers:
- Push to `main`, `feat/**`, `feature/**`, `bugfix/**`, `hotfix/**`
- Pull requests to `main`
- Changes in `apps/storefront/**`, `packages/**`

Actions:
1. Checkout code
2. Build Docker image
3. Push to GHCR (non-PR only)
4. Run Trivy vulnerability scan
5. Upload security results

### Kubernetes Deployment

```bash
# Via ArgoCD (recommended)
kubectl apply -f argocd/devtest/apps/storefront.yaml

# Via Helm
helm upgrade --install storefront charts/apps/storefront \
  --namespace devtest \
  --values charts/apps/storefront/values.yaml \
  --set image.tag=v1.0.0
```

---

## Health Checks & Monitoring

### Health Endpoint

**Endpoint**: `GET /api/health`

**Response (200 OK)**:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-22T13:52:00.000Z",
  "service": "storefront",
  "version": "0.1.0",
  "uptime": 3600,
  "checks": [
    {
      "name": "runtime",
      "status": "pass",
      "message": "Node.js runtime is operational"
    },
    {
      "name": "memory",
      "status": "pass",
      "message": "Heap used: 128MB"
    }
  ]
}
```

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30
  timeoutSeconds: 3
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3
```

### Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Response Time (p50) | < 100ms | > 500ms |
| Response Time (p99) | < 500ms | > 2000ms |
| Error Rate | < 0.1% | > 1% |
| CPU Usage | < 70% | > 85% |
| Memory Usage | < 75% | > 90% |
| Pod Restarts | 0 | > 3 in 10 min |

### Missing Monitoring (TODO)

- [ ] Sentry integration for error tracking
- [ ] Custom metrics for business events (orders, cart abandonment)
- [ ] Real User Monitoring (RUM) for Core Web Vitals
- [ ] Structured logging with trace IDs

---

## Security Configuration

### Container Security

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1001
  runAsGroup: 1001
  capabilities:
    drop:
      - ALL
  readOnlyRootFilesystem: false
  allowPrivilegeEscalation: false
```

### Security Headers

Applied via `next.config.ts`:

```typescript
headers: [
  {
    source: "/:path*",
    headers: [
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "origin-when-cross-origin" }
    ]
  }
]
```

### Additional Headers (via Ingress)

```yaml
# Recommended additional headers
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' https://js.stripe.com https://checkout.razorpay.com; ...
```

### Secret Management

| Secret Type | Storage | Rotation |
|-------------|---------|----------|
| Payment API Keys | SealedSecret | 90 days |
| Azure AD Client Secret | SealedSecret | 90 days |
| Firebase Config | Kubernetes Secret | As needed |
| Image Pull Secret | ghcr-secret | Never (PAT-based) |

### Vulnerability Scanning

- **Trivy**: Container image scanning in CI
- **Dependabot**: Dependency updates
- **SBOM**: Generated on release

---

## Performance & Scaling

### Caching Strategy

| Cache Type | TTL | Location |
|------------|-----|----------|
| Settings | 60s | Server-side (fetch cache) |
| Product data | 30s | Server-side (fetch cache) |
| Static assets | 1 year | CDN/Browser |
| Theme CSS | Client-side | Browser (CSS variables) |

### Image Optimization

```typescript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "*.mark8ly.app" },
    { protocol: "https", hostname: "*.blob.core.windows.net" }
  ],
  formats: ["image/avif", "image/webp"]
}
```

### Auto-Scaling Configuration

```yaml
# HPA
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 75

# KEDA (optional)
keda:
  enabled: true
  pollingInterval: 30
  cooldownPeriod: 300
  minReplicaCount: 2
  maxReplicaCount: 10
```

### Performance Targets

| Metric | Development | Production |
|--------|-------------|------------|
| LCP | < 2.5s | < 1.5s |
| FID | < 100ms | < 50ms |
| CLS | < 0.1 | < 0.05 |
| TTFB | < 500ms | < 200ms |

---

## Disaster Recovery

### Backup Strategy

The storefront is **stateless**. No backup required for the application itself.

**What to backup**:
- Helm values (in Git)
- Sealed secrets (in Git)
- Container images (in GHCR)

### Recovery Procedures

#### Pod Failure

Automatic recovery via Kubernetes:
1. Pod fails health check
2. Kubernetes restarts pod
3. New pod joins service

#### Node Failure

```bash
# Pods automatically rescheduled to other nodes
kubectl get pods -n devtest -o wide
```

#### Complete Cluster Failure

```bash
# 1. Provision new cluster
# 2. Apply ArgoCD configurations
kubectl apply -f argocd/devtest/apps/storefront.yaml

# 3. Verify deployment
kubectl get pods -n devtest
```

### Rollback Procedures

```bash
# Helm rollback
helm rollback storefront 1 -n devtest

# ArgoCD rollback
argocd app rollback storefront

# Manual image rollback
kubectl set image deployment/storefront \
  storefront=ghcr.io/tesseract-nexus/tesseract-hub/storefront:v0.9.0 \
  -n devtest
```

---

## Troubleshooting

### Common Issues

#### 1. Settings Service Connection Failed

**Symptoms**:
- Default theme displayed
- Console error: "Failed to fetch storefront settings"

**Resolution**:
```bash
# Check settings service
kubectl get pods -n devtest -l app=settings-service
kubectl logs -n devtest deployment/settings-service

# Verify network policy
kubectl get networkpolicy -n devtest
```

#### 2. Images Not Loading

**Symptoms**:
- Broken image placeholders
- Console error: "Invalid src prop"

**Resolution**:
1. Add hostname to `next.config.ts` remotePatterns
2. Rebuild and redeploy

#### 3. Theme Not Applied

**Symptoms**:
- Default violet theme instead of tenant theme
- CSS variables not set

**Resolution**:
```bash
# Verify settings API response
curl http://settings-service:8085/api/v1/storefronts/<slug>/settings

# Check browser console for theme-related errors
# Theme is handled client-side in lib/theme/theme-utils.ts
```

#### 4. Pod CrashLoopBackOff

**Symptoms**:
- Pod repeatedly restarting
- Status: CrashLoopBackOff

**Resolution**:
```bash
# Check pod logs
kubectl logs -n devtest <pod-name> --previous

# Check events
kubectl describe pod -n devtest <pod-name>

# Common causes:
# - Missing environment variables
# - Port conflict
# - Memory limit too low
```

#### 5. Payment Failing

**Symptoms**:
- Payment button does nothing
- Console errors about undefined keys

**Resolution**:
```bash
# Verify payment keys are set
kubectl exec -n devtest <pod-name> -- env | grep -E "RAZORPAY|STRIPE"

# Check for placeholder values (should not be present)
# Keys should be actual production/test keys, not 'rzp_test_placeholder'
```

### Debug Commands

```bash
# Pod status
kubectl get pods -n devtest -l app=storefront

# Pod logs
kubectl logs -n devtest deployment/storefront -f

# Describe pod
kubectl describe pod -n devtest <pod-name>

# Execute into pod
kubectl exec -it -n devtest <pod-name> -- sh

# Check environment variables
kubectl exec -n devtest <pod-name> -- env | grep -E "(SERVICE|NEXT)"

# Port forward for local testing
kubectl port-forward -n devtest svc/storefront 3000:80

# Check endpoints
kubectl get endpoints -n devtest storefront
```

---

## Runbook

### Deployment Runbook

#### Pre-Deployment Checklist

- [ ] All tests passing in CI
- [ ] Docker image built and pushed
- [ ] Helm values updated (if needed)
- [ ] Backend services running
- [ ] Database migrations applied (backend)
- [ ] Payment keys configured (not placeholders)

#### Deployment Steps

1. **Verify current state**
   ```bash
   kubectl get pods -n devtest -l app=storefront
   helm status storefront -n devtest
   ```

2. **Deploy new version**
   ```bash
   # Option A: ArgoCD sync
   argocd app sync storefront

   # Option B: Helm upgrade
   helm upgrade storefront charts/apps/storefront \
     --set image.tag=v1.0.0 \
     -n devtest
   ```

3. **Monitor rollout**
   ```bash
   kubectl rollout status deployment/storefront -n devtest
   ```

4. **Verify health**
   ```bash
   curl https://dev-store.mark8ly.app/api/health
   ```

5. **Smoke test**
   - [ ] Landing page loads
   - [ ] Tenant store loads (`/demo`)
   - [ ] Products page loads
   - [ ] Theme applied correctly
   - [ ] Add to cart works
   - [ ] Checkout page loads
   - [ ] Login/register works

#### Rollback Steps

1. **Identify issue**
   ```bash
   kubectl logs -n devtest deployment/storefront --tail=100
   ```

2. **Rollback**
   ```bash
   helm rollback storefront -n devtest
   ```

3. **Verify recovery**
   ```bash
   kubectl get pods -n devtest -l app=storefront
   curl https://dev-store.mark8ly.app/api/health
   ```

### Incident Response

#### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P1 | Complete outage | 15 minutes |
| P2 | Major feature broken (checkout, payments) | 1 hour |
| P3 | Minor feature broken | 4 hours |
| P4 | Cosmetic issue | 24 hours |

---

## Production Checklist

### BEFORE LAUNCH (Blockers)

#### Security
- [ ] Remove all placeholder payment keys
- [ ] Implement XSS sanitization (DOMPurify)
- [ ] Move access tokens to httpOnly cookies
- [ ] Implement CSRF protection
- [ ] Fix CSP to remove unsafe-inline
- [ ] Implement token refresh logic
- [ ] Set Secure flag on all cookies

#### Payment & Checkout
- [ ] Implement Razorpay webhook endpoint
- [ ] Implement Stripe webhook endpoint
- [ ] Verify webhook signatures
- [ ] Server-side discount/coupon validation
- [ ] Implement order idempotency
- [ ] Test payment flow end-to-end

#### Error Handling
- [ ] Add API timeout handling (15s)
- [ ] Implement retry logic for transient failures
- [ ] Add Sentry/error tracking integration
- [ ] Improve user-facing error messages

#### Notifications
- [ ] Order confirmation email integration
- [ ] Push notification testing

### RECOMMENDED (Launch + 1 Month)

#### SEO
- [ ] Dynamic meta tags for product pages
- [ ] JSON-LD structured data (Product, Organization)
- [ ] Breadcrumb schema
- [ ] Review/Rating schema

#### Performance
- [ ] Bundle size monitoring
- [ ] Core Web Vitals monitoring
- [ ] Cache headers optimization
- [ ] ISR for product pages

#### Compliance
- [ ] Cookie consent banner (GDPR)
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] Data export mechanism

### Infrastructure
- [ ] Kubernetes cluster provisioned
- [ ] Ingress controller configured
- [ ] TLS certificates issued
- [ ] DNS records configured
- [ ] Network policies applied

### Monitoring
- [ ] Logging configured
- [ ] Metrics collection enabled
- [ ] Alerts configured
- [ ] Dashboards created

---

## Appendix

### Quick Reference

| Item | Value |
|------|-------|
| Docker Image | `ghcr.io/tesseract-nexus/tesseract-hub/storefront` |
| Port | 3000 |
| Health Endpoint | `/api/health` |
| Helm Chart | `charts/apps/storefront` |
| ArgoCD App | `argocd/devtest/apps/storefront.yaml` |
| Namespace | `devtest` |

### Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Razorpay Documentation](https://razorpay.com/docs)

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.2.0 | 2024-12-23 | Added security assessment, blockers, updated checklist |
| 0.1.0 | 2024-12-22 | Initial release |

---

*Document maintained by: Platform Team*
*Last updated: 2024-12-23*
*Status: NOT PRODUCTION READY - See [Critical Blockers](#critical-blockers)*
