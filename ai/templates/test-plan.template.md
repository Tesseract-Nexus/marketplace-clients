# Test Plan: [Run ID]

**Created**: YYYY-MM-DD HH:MM
**QA Lead**: Gemini CLI

---

## Scope

Based on `traceability.md`, the following areas require testing:

| Area | Services | Priority |
|------|----------|----------|
| Tenant Isolation | orders-service, products-service | Critical |
| Authentication | auth-bff, all services | Critical |
| Checkout Flow | orders-service, payment-service | Critical |
| Admin Portal | admin app, staff-service | High |
| Storefront | storefront app, customers-service | High |

---

## Test Suites

### Suite 1: Tenant Isolation (PR Gate)

**Priority**: CRITICAL - Blocks merge if fails
**Services**: All tenant-scoped services
**Tag**: `PR Gate`

| ID | Test Case | Status | Notes |
|----|-----------|--------|-------|
| TI-001 | Tenant A data only visible to Tenant A | ⬜ Pending | |
| TI-002 | Tenant B cannot access Tenant A data | ⬜ Pending | |
| TI-003 | Missing X-Tenant-ID returns 400 | ⬜ Pending | |
| TI-004 | Cannot inject tenant_id in request body | ⬜ Pending | |
| TI-005 | Tenant context propagated to events | ⬜ Pending | |

**Test Commands**:
```bash
cd services/orders-service && go test ./... -v -run TestTenantIsolation
cd services/products-service && go test ./... -v -run TestTenantIsolation
```

---

### Suite 2: Keycloak Authentication (PR Gate)

**Priority**: CRITICAL - Blocks merge if fails
**Services**: auth-bff, all protected endpoints
**Tag**: `PR Gate`

| ID | Test Case | Status | Notes |
|----|-----------|--------|-------|
| AUTH-001 | Valid JWT accepted | ⬜ Pending | |
| AUTH-002 | Expired JWT returns 401 | ⬜ Pending | |
| AUTH-003 | Invalid signature returns 401 | ⬜ Pending | |
| AUTH-004 | Missing Authorization returns 401 | ⬜ Pending | |
| AUTH-005 | Wrong realm token returns 401 | ⬜ Pending | |
| AUTH-006 | JWKS refresh works | ⬜ Pending | |

**Test Commands**:
```bash
cd services/auth-bff && npm test
cd services/orders-service && go test ./... -v -run TestAuth
```

---

### Suite 3: Checkout Idempotency (PR Gate)

**Priority**: CRITICAL - Blocks merge if fails
**Services**: orders-service, payment-service, inventory-service
**Tag**: `PR Gate`

| ID | Test Case | Status | Notes |
|----|-----------|--------|-------|
| IDEM-001 | First order creation succeeds | ⬜ Pending | |
| IDEM-002 | Same idempotency key returns same order | ⬜ Pending | |
| IDEM-003 | Different key creates new order | ⬜ Pending | |
| IDEM-004 | Concurrent requests with same key | ⬜ Pending | Race condition |
| IDEM-005 | Payment provider idempotency | ⬜ Pending | |
| IDEM-006 | Inventory not double-decremented | ⬜ Pending | |

**Test Commands**:
```bash
cd services/orders-service && go test ./... -v -run TestIdempotency
cd services/payment-service && go test ./... -v -run TestIdempotency
```

---

### Suite 4: Onboarding Flow (Extended)

**Priority**: HIGH
**Services**: tenant-service, verification-service, auth-bff
**Tag**: `Extended`

| ID | Test Case | Status | Notes |
|----|-----------|--------|-------|
| ONB-001 | New tenant registration | ⬜ Pending | |
| ONB-002 | Email verification OTP | ⬜ Pending | |
| ONB-003 | Business wizard completion | ⬜ Pending | |
| ONB-004 | First admin user created | ⬜ Pending | |
| ONB-005 | Keycloak realm provisioned | ⬜ Pending | |

**Test Commands**:
```bash
cd tests/e2e && npm test -- --testPathPattern="onboarding"
```

---

### Suite 5: Admin Portal Flow (Extended)

**Priority**: HIGH
**Services**: admin app, products-service, orders-service, staff-service
**Tag**: `Extended`

| ID | Test Case | Status | Notes |
|----|-----------|--------|-------|
| ADM-001 | Admin Keycloak login | ⬜ Pending | |
| ADM-002 | Tenant context from subdomain | ⬜ Pending | |
| ADM-003 | Create product (tenant-scoped) | ⬜ Pending | |
| ADM-004 | View orders (tenant-scoped) | ⬜ Pending | |
| ADM-005 | Invite and activate staff | ⬜ Pending | |
| ADM-006 | Staff role assignment | ⬜ Pending | |

**Test Commands**:
```bash
cd apps/admin && npm test
cd tests/e2e && npm test -- --testPathPattern="admin"
```

---

### Suite 6: Storefront Flow (Extended)

**Priority**: HIGH
**Services**: storefront app, customers-service, orders-service
**Tag**: `Extended`

| ID | Test Case | Status | Notes |
|----|-----------|--------|-------|
| SF-001 | Customer registration | ⬜ Pending | |
| SF-002 | Product catalog display | ⬜ Pending | |
| SF-003 | Add to cart | ⬜ Pending | |
| SF-004 | Cart persistence | ⬜ Pending | |
| SF-005 | Complete checkout | ⬜ Pending | |
| SF-006 | Order history | ⬜ Pending | |

**Test Commands**:
```bash
cd apps/storefront && npm test
cd tests/e2e && npm test -- --testPathPattern="storefront"
```

---

### Suite 7: Full Regression (Nightly)

**Priority**: MEDIUM (informational)
**Services**: All
**Tag**: `Nightly`

| ID | Test Case | Status | Notes |
|----|-----------|--------|-------|
| REG-001 | End-to-end: Onboarding to first sale | ⬜ Pending | |
| REG-002 | Multi-tenant concurrent operations | ⬜ Pending | |
| REG-003 | Load test: 100 concurrent checkouts | ⬜ Pending | |
| REG-004 | Failure recovery scenarios | ⬜ Pending | |
| REG-005 | Data consistency after failures | ⬜ Pending | |

**Test Commands**:
```bash
cd tests/e2e && npm test -- --testPathPattern="regression"
cd tests/load && k6 run checkout-load.js
```

---

## Test Data Requirements

### Fixtures Needed

| Fixture | Path | Purpose | Status |
|---------|------|---------|--------|
| Multi-tenant orders | `testdata/orders/` | TI-* tests | ⬜ Check |
| Keycloak test tokens | `testdata/tokens/` | AUTH-* tests | ⬜ Check |
| Idempotency scenarios | `testdata/checkout/` | IDEM-* tests | ⬜ Check |
| E2E seed data | `tests/fixtures/` | Extended tests | ⬜ Check |

### Environment Setup

```bash
# Start local services
docker-compose up -d postgres redis nats

# Start affected services
cd services/orders-service && go run main.go &
cd services/products-service && go run main.go &

# Setup test database
psql -h localhost -U dev -d tesseract_hub < tests/fixtures/seed.sql
```

---

## Execution Order

1. **Phase 1: PR Gate Tests** (Must all pass)
   - Suite 1: Tenant Isolation
   - Suite 2: Authentication
   - Suite 3: Checkout Idempotency

2. **Phase 2: Extended Tests** (Must all pass)
   - Suite 4: Onboarding Flow
   - Suite 5: Admin Portal Flow
   - Suite 6: Storefront Flow

3. **Phase 3: Nightly Tests** (Informational)
   - Suite 7: Full Regression

---

## Pass/Fail Criteria

### Pass (Ready for Merge)
- [ ] All PR Gate tests pass (Suites 1-3)
- [ ] All Extended tests pass (Suites 4-6)
- [ ] No P0 bugs discovered
- [ ] No P1 bugs discovered

### Fail (Loop Back)
- [ ] Any PR Gate test fails → Report bug, loop to Codex
- [ ] Any P0/P1 bug found → Report bug, loop to Codex
- [ ] Acceptance criteria not met → Update task status

---

## Notes

[Space for QA notes during test execution]
