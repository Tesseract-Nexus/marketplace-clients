# Code Review Checklist

Use this checklist during code review. Each section maps to specific policies in `policies.md`.

---

## 1. Multi-Tenancy

### Database Layer
- [ ] All queries on tenant-scoped tables include `tenant_id` filter
- [ ] Composite indexes exist for `(tenant_id, <resource_id>)` patterns
- [ ] No raw SQL without tenant scoping
- [ ] GORM scopes properly applied

### API Layer
- [ ] `X-Tenant-ID` header extracted and validated in all handlers
- [ ] Tenant context passed to all service methods
- [ ] Error returned if tenant_id missing (not silent fail)

### Service Layer
- [ ] Tenant context propagated to internal service calls
- [ ] Cache keys include tenant_id prefix
- [ ] Redis operations tenant-scoped

### Event Layer
- [ ] All NATS events include `tenantId` field (camelCase)
- [ ] Event consumers validate tenant context
- [ ] No cross-tenant event processing

### Tests
- [ ] Tests verify tenant isolation (create data in tenant A, verify not visible in tenant B)
- [ ] Tests cover missing tenant_id scenarios

---

## 2. Keycloak / Authentication

### JWT Handling
- [ ] Using `go-shared/auth` for token validation
- [ ] JWKS URL from environment variables
- [ ] Token validation includes signature verification
- [ ] Expired tokens rejected

### Claim Extraction
- [ ] `keycloak_user_id` extracted correctly
- [ ] `preferred_username` used for display
- [ ] Custom claims handled safely (nil checks)

### Session Management
- [ ] Sessions stored in Redis (not memory)
- [ ] Session expiration configured
- [ ] Logout invalidates session

### RBAC Integration
- [ ] Permissions checked via `go-shared/rbac`
- [ ] No hardcoded role checks
- [ ] Permission format: `resource:action`
- [ ] Tenant-scoped permission evaluation

### Tests
- [ ] Tests cover invalid token scenarios
- [ ] Tests cover expired token scenarios
- [ ] Tests verify permission enforcement

---

## 3. API Correctness

### Request Handling
- [ ] Input validation on all required fields
- [ ] UUID validation for ID parameters
- [ ] Pagination limits enforced (max 100)
- [ ] Request body size limits

### Response Format
- [ ] Consistent response structure
- [ ] Appropriate HTTP status codes
- [ ] Error messages don't leak internal details
- [ ] camelCase for JSON fields (frontend-facing APIs)

### Error Handling
- [ ] Errors wrapped with context
- [ ] `go-shared/errors` used for error types
- [ ] No panic in handlers
- [ ] Appropriate error codes returned

### Idempotency
- [ ] POST endpoints support idempotency keys where needed
- [ ] Duplicate requests return same response
- [ ] Idempotency key included in logs

### Tests
- [ ] Happy path covered
- [ ] Error cases covered
- [ ] Boundary conditions tested
- [ ] Concurrent request handling tested

---

## 4. Database / Migrations / Indexes

### Schema Design
- [ ] `tenant_id` column on all tenant-scoped tables
- [ ] `id` is UUID (not auto-increment integer)
- [ ] `created_at`, `updated_at` timestamps present
- [ ] `deleted_at` for soft deletes
- [ ] Foreign key constraints defined

### Migrations
- [ ] Up and down migrations present
- [ ] Migrations are idempotent
- [ ] Data migrations handle existing data
- [ ] No breaking changes without migration path

### Indexes
- [ ] Primary key index (automatic)
- [ ] `(tenant_id)` index on all tenant tables
- [ ] `(tenant_id, <resource_id>)` composite indexes
- [ ] Indexes on frequently filtered columns
- [ ] No unnecessary indexes (write performance)

### Queries
- [ ] GORM queries use proper scoping
- [ ] N+1 queries avoided (preloading)
- [ ] Large result sets paginated
- [ ] Transactions used for multi-table operations

### Tests
- [ ] Migration up/down tested
- [ ] Query performance acceptable
- [ ] Deadlock scenarios considered

---

## 5. Checkout / Orders / Inventory

### Order Creation
- [ ] Idempotency key required and checked
- [ ] Stock validated before order creation
- [ ] Price snapshot at order time (not live lookup)
- [ ] Order status state machine enforced

### Payment Processing
- [ ] Payment provider idempotency used
- [ ] Payment status synced with order status
- [ ] Failed payments don't create orders
- [ ] Refund handling implemented

### Inventory Management
- [ ] Optimistic locking for stock updates
- [ ] Stock reserved on cart, deducted on payment
- [ ] Concurrent purchase handling
- [ ] Oversell prevention

### Order Fulfillment
- [ ] Status transitions validated
- [ ] Shipping integration error handling
- [ ] Partial fulfillment supported
- [ ] Cancellation handling

### Tests
- [ ] Concurrent checkout tests
- [ ] Double-submit prevention tests
- [ ] Stock boundary tests (last item)
- [ ] Payment failure recovery tests

---

## 6. Frontend (Next.js) + SSR + Security

### SSR / Data Fetching
- [ ] Server components used where appropriate
- [ ] Client components marked with `'use client'`
- [ ] Data fetched server-side when possible
- [ ] Loading states implemented

### Authentication
- [ ] Auth state from auth-bff (not localStorage)
- [ ] Protected routes check auth
- [ ] Redirect to login on 401
- [ ] Token refresh handled

### Security Headers
- [ ] CSP headers configured
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options: nosniff
- [ ] HTTPS enforced

### XSS Prevention
- [ ] User input sanitized before render
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] URL parameters validated

### Performance
- [ ] Images optimized (next/image)
- [ ] Code splitting implemented
- [ ] Bundle size monitored
- [ ] Core Web Vitals acceptable

### Tests
- [ ] Component tests present
- [ ] E2E tests for critical flows
- [ ] Accessibility tests

---

## 7. Kubernetes Readiness

### Deployment Configuration
- [ ] Resource requests and limits set
- [ ] Replica count appropriate
- [ ] Rolling update strategy configured
- [ ] Pod disruption budget defined

### Health Checks
- [ ] Liveness probe configured
- [ ] Readiness probe configured
- [ ] Startup probe for slow-starting services
- [ ] Health check endpoints implemented

### Service Configuration
- [ ] Service type appropriate (ClusterIP for internal)
- [ ] Port configuration correct
- [ ] Labels and selectors match

### Istio Integration
- [ ] VirtualService routing correct
- [ ] DestinationRule configured
- [ ] mTLS enabled
- [ ] Circuit breaker settings

### Secrets Management
- [ ] No secrets in code or ConfigMaps
- [ ] SealedSecrets for sensitive data
- [ ] Secret rotation supported

### Tests
- [ ] Deployment tested in staging
- [ ] Rolling update tested
- [ ] Rollback procedure verified

---

## 8. Performance + Resilience

### Caching
- [ ] Redis caching for hot data
- [ ] Cache TTL configured
- [ ] Cache invalidation implemented
- [ ] Cache stampede prevention

### Database
- [ ] Connection pooling configured
- [ ] Query timeout set
- [ ] Slow query logging enabled
- [ ] Read replicas used where appropriate

### Service Communication
- [ ] Timeouts configured
- [ ] Retries with backoff
- [ ] Circuit breaker patterns
- [ ] Graceful degradation

### Rate Limiting
- [ ] API rate limits configured
- [ ] Per-tenant rate limiting
- [ ] Rate limit headers returned

### Observability
- [ ] Structured logging with context
- [ ] Prometheus metrics exposed
- [ ] Distributed tracing enabled
- [ ] Alerts configured

### Tests
- [ ] Load testing performed
- [ ] Failure injection tested
- [ ] Recovery scenarios verified

---

## Review Summary Template

```markdown
## Review Summary

**Reviewer**: [Codex/Human]
**Date**: YYYY-MM-DD
**Run ID**: <run-id>

### Checklist Completion

| Section | Pass | Fail | N/A |
|---------|------|------|-----|
| Multi-Tenancy | | | |
| Keycloak/Auth | | | |
| API Correctness | | | |
| DB/Migrations | | | |
| Checkout/Orders | | | |
| Frontend/SSR | | | |
| K8s Readiness | | | |
| Performance | | | |

### Critical Findings (P0/P1)

1. [Finding description]
   - **Severity**: P0
   - **Policy**: policies.md#tenant-isolation-rules
   - **File**: services/orders-service/handlers/order.go:123

### Recommendations

1. [Recommendation]

### Decision

- [ ] Approved
- [ ] Approved with conditions
- [ ] Requires changes
- [ ] Blocked
```
