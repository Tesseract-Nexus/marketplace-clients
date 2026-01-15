# Tenant Onboarding System - Architecture & Operations Guide

> **Purpose**: This document provides comprehensive documentation for the Marketplace tenant onboarding system to ensure reliability, troubleshooting capability, and prevention of future issues.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Components](#architecture-components)
3. [Onboarding Flow](#onboarding-flow)
4. [Configuration Reference](#configuration-reference)
5. [Database Schema](#database-schema)
6. [Keycloak Integration](#keycloak-integration)
7. [Service Dependencies](#service-dependencies)
8. [Common Issues & Solutions](#common-issues--solutions)
9. [Monitoring & Health Checks](#monitoring--health-checks)
10. [Deployment Checklist](#deployment-checklist)

---

## System Overview

The tenant onboarding system allows new merchants to create their stores on the Marketplace platform. It involves multiple services working together:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TENANT ONBOARDING FLOW                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   User Browser                                                          │
│       │                                                                 │
│       ▼                                                                 │
│   ┌─────────────────┐                                                   │
│   │ tenant-onboarding│  (Next.js Frontend)                              │
│   │ dev-onboarding.  │                                                  │
│   │ tesserix.app     │                                                  │
│   └────────┬────────┘                                                   │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
│   │  tenant-service │────▶│ verification-   │────▶│ notification-   │  │
│   │  (Go Backend)   │     │ service         │     │ service         │  │
│   └────────┬────────┘     └─────────────────┘     └─────────────────┘  │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
│   │   Keycloak      │     │  vendor-service │     │ tenant-router   │  │
│   │ (tesserix-      │     │ (storefronts)   │     │ -service        │  │
│   │  customer)      │     │                 │     │                 │  │
│   └─────────────────┘     └─────────────────┘     └─────────────────┘  │
│            │                      │                       │            │
│            ▼                      ▼                       ▼            │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                     PostgreSQL (tesseract_hub)                   │  │
│   │   - tenants        - users          - memberships               │  │
│   │   - storefronts    - vendors        - reserved_slugs            │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key URLs

| Environment | Onboarding URL | Admin URL Pattern | Storefront URL Pattern |
|-------------|----------------|-------------------|------------------------|
| Development | `dev-onboarding.tesserix.app` | `{slug}-admin.tesserix.app` | `{slug}.tesserix.app` |
| Staging | `staging-onboarding.tesserix.app` | `{slug}-admin.tesserix.app` | `{slug}.tesserix.app` |
| Production | `onboarding.tesserix.app` | `{slug}-admin.tesserix.app` | `{slug}.tesserix.app` |

---

## Architecture Components

### 1. tenant-onboarding (Frontend)
- **Repository**: `marketplace-clients/tenant-onboarding`
- **Technology**: Next.js 14, React, TypeScript
- **Purpose**: User-facing onboarding wizard

### 2. tenant-service (Backend)
- **Repository**: `global-services/tenant-service`
- **Technology**: Go, Gin framework
- **Port**: 8080
- **Purpose**: Core onboarding business logic

### 3. auth-bff (Authentication)
- **Repository**: `global-services/auth-bff`
- **Technology**: Go
- **Port**: 8081
- **Purpose**: Keycloak integration, session management

### 4. vendor-service (Storefronts)
- **Repository**: `marketplace-services/vendor-service`
- **Technology**: Node.js/TypeScript
- **Port**: 8080
- **Purpose**: Storefront and vendor management

### 5. tenant-router-service
- **Repository**: `global-services/tenant-router-service`
- **Technology**: Go
- **Port**: 8089
- **Purpose**: Virtual service creation, DNS routing

---

## Onboarding Flow

### Step-by-Step Flow

```
1. EMAIL ENTRY
   User enters email → tenant-service validates → Creates draft session

2. EMAIL VERIFICATION
   tenant-service → notification-service → Email sent
   User clicks link → verification-service validates token
   Token stored in Redis with status

3. ACCOUNT SETUP (Password)
   User sets password → tenant-service → Keycloak user created
   Auto-login via password grant

4. STORE CREATION
   User enters store details → tenant-service validates slug
   Creates: Tenant record, Vendor, Storefront

5. VIRTUAL SERVICE SETUP
   tenant-router-service creates:
   - Istio VirtualService for admin
   - Istio VirtualService for storefront
   - DNS routing configuration

6. COMPLETION
   User redirected to admin dashboard
   Session established via auth-bff
```

### Critical Checkpoints

| Step | Service | Database Table | Redis Key | Failure Mode |
|------|---------|---------------|-----------|--------------|
| Email Entry | tenant-service | `onboarding_drafts` | `draft:{session_id}` | Draft not created |
| Verification | verification-service | - | `email_verification:{email}` | Token expired/invalid |
| Password | tenant-service + Keycloak | `users` | - | Keycloak API failure |
| Store | tenant-service | `tenants`, `memberships` | - | Slug conflict |
| Storefront | vendor-service | `storefronts`, `vendors` | - | Service unavailable |
| Routing | tenant-router-service | `host_mappings` | - | Istio API failure |

---

## Configuration Reference

### Environment Variables - tenant-service

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/tesseract_hub
DB_HOST=marketplace-postgresql.marketplace.svc.cluster.local
DB_PORT=5432
DB_NAME=tesseract_hub
DB_USER=marketplace
DB_PASSWORD_SECRET_NAME=devtest-marketplace-postgresql-password

# Redis
REDIS_URL=redis://redis.redis.svc.cluster.local:6379

# NATS
NATS_URL=nats://nats.nats.svc.cluster.local:4222

# Keycloak
KEYCLOAK_URL=https://auth.tesserix.app
KEYCLOAK_REALM=tesserix-customer
KEYCLOAK_ADMIN_CLIENT_ID=marketplace-admin
KEYCLOAK_ADMIN_CLIENT_SECRET_NAME=devtest-keycloak-customer-admin-client-secret
KEYCLOAK_PUBLIC_CLIENT_ID=tesserix-onboarding
KEYCLOAK_CLIENT_SECRET_NAME=devtest-keycloak-customer-dashboard-client-secret

# Services
VENDOR_SERVICE_URL=http://vendor-service.marketplace.svc.cluster.local:8080
VERIFICATION_SERVICE_URL=http://verification-service.devtest.svc.cluster.local:8080
NOTIFICATION_SERVICE_URL=http://notification-service.marketplace.svc.cluster.local:8080
TENANT_ROUTER_SERVICE_URL=http://tenant-router-service.marketplace.svc.cluster.local:8089

# GCP
GCP_PROJECT_ID=tesseracthub-480811
SECRET_PREFIX=devtest
```

### Environment Variables - admin middleware

```bash
# Tenant validation
TENANT_SERVICE_URL=http://tenant-service.devtest.svc.cluster.local:8082

# IMPORTANT: The internal API endpoint is /internal/tenants/by-slug/{slug}
# NOT /api/v1/internal/tenants/by-slug/{slug}
```

### GCP Secret Manager Secrets

| Secret Name | Purpose | Used By |
|-------------|---------|---------|
| `devtest-marketplace-postgresql-password` | DB password | tenant-service |
| `devtest-jwt-secret` | JWT signing | tenant-service |
| `devtest-keycloak-customer-admin-client-secret` | Keycloak admin | tenant-service |
| `devtest-keycloak-customer-dashboard-client-secret` | Auto-login | tenant-service |
| `devtest-marketplace-api-key` | Service auth | notification-service |

---

## Database Schema

### Key Tables

```sql
-- Tenants table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    subdomain VARCHAR(100),
    billing_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active', -- active, creating, failed
    industry VARCHAR(100),
    primary_color VARCHAR(20),
    secondary_color VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id UUID UNIQUE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Memberships table (user-tenant relationship)
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    tenant_id UUID REFERENCES tenants(id),
    role VARCHAR(50) NOT NULL, -- owner, admin, staff
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- Reserved slugs (prevent conflicts)
CREATE TABLE reserved_slugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    reason VARCHAR(255),
    is_active BOOLEAN DEFAULT true
);

-- Onboarding drafts (temporary storage)
CREATE TABLE onboarding_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    data JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Critical Queries

```sql
-- Check tenant exists by slug
SELECT id, slug, name, status FROM tenants WHERE slug = $1;

-- Check storefront by slug (fallback lookup)
SELECT s.*, s.tenant_id FROM storefronts s WHERE s.slug = $1;

-- Get user's tenants
SELECT t.* FROM tenants t
JOIN memberships m ON t.id = m.tenant_id
WHERE m.user_id = $1 AND m.status = 'active';
```

---

## Keycloak Integration

### Realm Configuration

**Realm**: `tesserix-customer`

| Setting | Value |
|---------|-------|
| Login Theme | tesserix |
| Account Theme | tesserix |
| Email Theme | tesserix |
| Registration | Enabled |
| Email Verification | Required |
| Password Policy | minLength(8), specialCharacter(1) |

### Clients

| Client ID | Type | Purpose |
|-----------|------|---------|
| `marketplace-admin` | Confidential | Admin API access |
| `tesserix-onboarding` | Confidential | Onboarding auto-login |
| `marketplace-dashboard` | Confidential | Admin dashboard sessions |
| `marketplace-storefront` | Public | Storefront auth |

### Auto-Login Flow

```
1. User completes password setup
2. tenant-service calls Keycloak token endpoint:
   POST /realms/tesserix-customer/protocol/openid-connect/token
   grant_type=password
   client_id=tesserix-onboarding
   client_secret={from secret manager}
   username={email}
   password={user's password}

3. Keycloak returns access_token + refresh_token
4. tenant-service creates session cookie
5. User redirected to admin (already authenticated)
```

### Common Keycloak Issues

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid client credentials` | Wrong client secret | Check GCP Secret Manager |
| `Invalid user credentials` | Password mismatch | Verify Keycloak user exists |
| `Client not found` | Wrong client_id | Verify client exists in realm |
| `Realm not found` | Wrong realm name | Use `tesserix-customer` |

---

## Service Dependencies

### Dependency Graph

```
tenant-onboarding (frontend)
    └── tenant-service (backend)
            ├── PostgreSQL (database)
            ├── Redis (caching, sessions)
            ├── NATS (events)
            ├── Keycloak (auth)
            │       └── PostgreSQL (keycloak-db)
            ├── verification-service
            │       └── Redis
            ├── notification-service
            │       └── SendGrid/SMTP
            ├── vendor-service
            │       └── PostgreSQL
            └── tenant-router-service
                    └── Istio API
```

### Health Check Endpoints

| Service | Endpoint | Expected Response |
|---------|----------|-------------------|
| tenant-service | `/health` | `200 OK` |
| vendor-service | `/health` | `200 OK` |
| tenant-router-service | `/health` | `200 OK` |
| notification-service | `/health` | `200 OK` |
| auth-bff | `/health` | `200 OK` |

---

## Common Issues & Solutions

### Issue 1: "Store Not Found" Error

**Symptom**: Admin shows "Store Not Found" after onboarding

**Root Causes**:
1. Wrong API endpoint in middleware
2. Tenant slug vs storefront slug mismatch
3. Tenant status not 'active'

**Solution**:
```typescript
// admin/middleware.ts - CORRECT endpoint
const response = await fetch(
  `${TENANT_SERVICE_URL}/internal/tenants/by-slug/${slug}`,  // NOT /api/v1/internal/...
  { headers: { 'X-Internal-Service': 'admin-middleware' } }
);
```

**Verification**:
```bash
# Check tenant exists
kubectl exec -n marketplace deploy/tenant-service -c tenant-service -- \
  curl -s "http://localhost:8080/internal/tenants/by-slug/{slug}" \
  -H "X-Internal-Service: test"

# Check tenant status
kubectl exec -n marketplace deploy/tenant-service -c tenant-service -- \
  psql $DATABASE_URL -c "SELECT id, slug, status FROM tenants WHERE slug = '{slug}';"
```

### Issue 2: Email Verification Fails

**Symptom**: "Email must be verified" error after clicking verification link

**Root Causes**:
1. Redis verification status not being checked
2. Token expired
3. verification-service and tenant-service using different storage

**Solution**:
```go
// tenant-service must check Redis FIRST
func (s *VerificationService) IsEmailVerifiedByRecipient(ctx context.Context, recipient, purpose string) (bool, error) {
    // 1. Check Redis first (link-based verification)
    if s.redisClient != nil {
        status, err := s.redisClient.GetEmailVerificationStatus(ctx, recipient)
        if err == nil && status != nil && status.IsVerified {
            return true, nil
        }
    }
    // 2. Fall back to verification-service (OTP)
    ...
}
```

**Verification**:
```bash
# Check Redis for verification status
kubectl exec -n marketplace deploy/tenant-service -c tenant-service -- \
  redis-cli -h redis.redis.svc.cluster.local GET "email_verification:{email}"
```

### Issue 3: Auto-Login Fails

**Symptom**: User not logged in after password setup

**Root Causes**:
1. Keycloak client secret not loaded
2. Wrong client ID
3. Password grant disabled

**Solution**:
```go
// Ensure client secret is loaded from GCP Secret Manager
publicClientSecret := secrets.GetSecretOrEnv(
    "KEYCLOAK_CLIENT_SECRET_NAME",
    "KEYCLOAK_PUBLIC_CLIENT_SECRET",
    ""
)
```

**Verification**:
```bash
# Check tenant-service logs for secret loading
kubectl logs -l app=tenant-service -n marketplace | grep -i "keycloak.*secret"
```

### Issue 4: Storefront Shows Logged-In User

**Symptom**: Storefront auto-logs in users from admin session

**Root Causes**:
1. Shared Keycloak session cookies
2. localStorage persisting customer data

**Solution**:
```typescript
// storefront/store/auth.ts - Don't persist customer data
partialize: () => ({
    // Return empty - don't persist auth state
}),

// storefront/components/providers/AuthSessionProvider.tsx
// Don't auto-login from session, only validate existing auth
```

---

## Monitoring & Health Checks

### Key Metrics to Monitor

```yaml
# Prometheus metrics
- onboarding_sessions_total{status="completed|failed|abandoned"}
- verification_attempts_total{result="success|failed"}
- tenant_creation_duration_seconds
- keycloak_auth_failures_total
```

### Log Queries

```bash
# Onboarding errors
kubectl logs -l app=tenant-service -n marketplace --since=1h | grep -i error

# Verification issues
kubectl logs -l app=tenant-service -n marketplace --since=1h | grep -i verification

# Keycloak issues
kubectl logs -l app=tenant-service -n marketplace --since=1h | grep -i keycloak
```

### Alerts

```yaml
# Alert: High onboarding failure rate
- alert: OnboardingFailureRateHigh
  expr: rate(onboarding_sessions_total{status="failed"}[5m]) > 0.1
  for: 5m
  labels:
    severity: critical

# Alert: Verification service down
- alert: VerificationServiceDown
  expr: up{job="verification-service"} == 0
  for: 2m
  labels:
    severity: critical
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] GCP Secret Manager secrets exist and are accessible
- [ ] Database migrations applied
- [ ] Keycloak realm and clients configured
- [ ] Redis accessible
- [ ] NATS accessible
- [ ] All dependent services healthy

### Post-Deployment Verification

```bash
# 1. Check all pods running
kubectl get pods -n marketplace | grep -E "tenant-service|vendor-service|tenant-router"

# 2. Check service health
for svc in tenant-service vendor-service tenant-router-service auth-bff; do
  kubectl exec -n marketplace deploy/$svc -c $svc -- curl -s localhost:8080/health
done

# 3. Verify tenant lookup works
kubectl exec -n marketplace deploy/tenant-service -c tenant-service -- \
  curl -s "http://localhost:8080/internal/tenants/by-slug/demo-store" \
  -H "X-Internal-Service: test"

# 4. Verify Keycloak connectivity
kubectl logs -l app=tenant-service -n marketplace --tail=50 | grep -i keycloak

# 5. Test email verification flow
# (Manual test with test email)
```

### Rollback Procedure

```bash
# 1. Rollback deployment
kubectl rollout undo deployment/tenant-service -n marketplace

# 2. Verify rollback
kubectl rollout status deployment/tenant-service -n marketplace

# 3. Check logs for errors
kubectl logs -l app=tenant-service -n marketplace --tail=100
```

---

## Appendix: API Reference

### Internal Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/internal/tenants/by-slug/{slug}` | GET | Get tenant by slug (middleware) |
| `/internal/tenants/{id}` | GET | Get tenant by ID |
| `/api/v1/users/me/tenants` | GET | Get user's tenants |

### Required Headers

| Header | Value | Required For |
|--------|-------|--------------|
| `X-Internal-Service` | Service name | Internal API calls |
| `X-User-ID` | User UUID | Authenticated endpoints |
| `Authorization` | Bearer token | Public API calls |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-15 | Fixed admin middleware endpoint URL | Claude |
| 2026-01-15 | Fixed storefront auto-login issue | Claude |
| 2026-01-15 | Added Redis check for email verification | Claude |
| 2026-01-15 | Added Keycloak secret loading for auto-login | Claude |

---

**Document Version**: 1.0
**Last Updated**: 2026-01-15
**Maintainers**: Platform Team
