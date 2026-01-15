# Test Results: [Run ID]

**Executed**: YYYY-MM-DD HH:MM
**QA Lead**: Gemini CLI
**Duration**: X minutes

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tests | XX |
| Passed | XX |
| Failed | XX |
| Skipped | XX |
| Bugs Found | XX |

### Pass Rate by Tag

| Tag | Pass | Fail | Rate |
|-----|------|------|------|
| PR Gate | XX | XX | XX% |
| Extended | XX | XX | XX% |
| Nightly | XX | XX | XX% |

---

## Overall Result

### ✅ PASS / ❌ FAIL

**Decision**: [Ready for merge / Loop back to review]

**Reason**: [If fail, list blocking issues]

---

## Detailed Results

### Suite 1: Tenant Isolation (PR Gate)

| ID | Test Case | Status | Duration | Notes |
|----|-----------|--------|----------|-------|
| TI-001 | Tenant A data only visible to Tenant A | ✅ PASS | 1.2s | |
| TI-002 | Tenant B cannot access Tenant A data | ✅ PASS | 0.8s | |
| TI-003 | Missing X-Tenant-ID returns 400 | ❌ FAIL | 0.5s | BUG-001 |
| TI-004 | Cannot inject tenant_id in request body | ✅ PASS | 0.3s | |
| TI-005 | Tenant context propagated to events | ✅ PASS | 1.5s | |

**Suite Result**: 4/5 PASS (80%)

---

### Suite 2: Keycloak Authentication (PR Gate)

| ID | Test Case | Status | Duration | Notes |
|----|-----------|--------|----------|-------|
| AUTH-001 | Valid JWT accepted | ✅ PASS | 0.5s | |
| AUTH-002 | Expired JWT returns 401 | ✅ PASS | 0.3s | |
| AUTH-003 | Invalid signature returns 401 | ✅ PASS | 0.3s | |
| AUTH-004 | Missing Authorization returns 401 | ✅ PASS | 0.2s | |
| AUTH-005 | Wrong realm token returns 401 | ✅ PASS | 0.4s | |
| AUTH-006 | JWKS refresh works | ✅ PASS | 2.1s | |

**Suite Result**: 6/6 PASS (100%)

---

### Suite 3: Checkout Idempotency (PR Gate)

| ID | Test Case | Status | Duration | Notes |
|----|-----------|--------|----------|-------|
| IDEM-001 | First order creation succeeds | ✅ PASS | 1.5s | |
| IDEM-002 | Same idempotency key returns same order | ✅ PASS | 0.8s | |
| IDEM-003 | Different key creates new order | ✅ PASS | 1.2s | |
| IDEM-004 | Concurrent requests with same key | ❌ FAIL | 3.5s | BUG-002 |
| IDEM-005 | Payment provider idempotency | ✅ PASS | 2.1s | |
| IDEM-006 | Inventory not double-decremented | ✅ PASS | 1.8s | |

**Suite Result**: 5/6 PASS (83%)

---

### Suite 4: Onboarding Flow (Extended)

| ID | Test Case | Status | Duration | Notes |
|----|-----------|--------|----------|-------|
| ONB-001 | New tenant registration | ✅ PASS | 3.2s | |
| ONB-002 | Email verification OTP | ✅ PASS | 2.5s | |
| ONB-003 | Business wizard completion | ✅ PASS | 4.1s | |
| ONB-004 | First admin user created | ✅ PASS | 2.8s | |
| ONB-005 | Keycloak realm provisioned | ✅ PASS | 5.5s | |

**Suite Result**: 5/5 PASS (100%)

---

### Suite 5: Admin Portal Flow (Extended)

| ID | Test Case | Status | Duration | Notes |
|----|-----------|--------|----------|-------|
| ADM-001 | Admin Keycloak login | ✅ PASS | 2.1s | |
| ADM-002 | Tenant context from subdomain | ✅ PASS | 1.5s | |
| ADM-003 | Create product (tenant-scoped) | ✅ PASS | 1.8s | |
| ADM-004 | View orders (tenant-scoped) | ✅ PASS | 1.2s | |
| ADM-005 | Invite and activate staff | ✅ PASS | 4.5s | |
| ADM-006 | Staff role assignment | ✅ PASS | 2.3s | |

**Suite Result**: 6/6 PASS (100%)

---

### Suite 6: Storefront Flow (Extended)

| ID | Test Case | Status | Duration | Notes |
|----|-----------|--------|----------|-------|
| SF-001 | Customer registration | ✅ PASS | 2.5s | |
| SF-002 | Product catalog display | ✅ PASS | 1.8s | |
| SF-003 | Add to cart | ✅ PASS | 1.2s | |
| SF-004 | Cart persistence | ✅ PASS | 2.1s | |
| SF-005 | Complete checkout | ✅ PASS | 5.5s | |
| SF-006 | Order history | ✅ PASS | 1.5s | |

**Suite Result**: 6/6 PASS (100%)

---

### Suite 7: Full Regression (Nightly)

| ID | Test Case | Status | Duration | Notes |
|----|-----------|--------|----------|-------|
| REG-001 | End-to-end journey | ⏭️ SKIP | - | Nightly only |
| REG-002 | Multi-tenant concurrent | ⏭️ SKIP | - | Nightly only |
| REG-003 | Load test | ⏭️ SKIP | - | Nightly only |
| REG-004 | Failure recovery | ⏭️ SKIP | - | Nightly only |
| REG-005 | Data consistency | ⏭️ SKIP | - | Nightly only |

**Suite Result**: N/A (Nightly)

---

## Failed Test Details

### TI-003: Missing X-Tenant-ID returns 400 ❌

**Location**: services/orders-service/handlers/order_test.go:156

**Expected**:
- Status: 400 Bad Request
- Body: `{"error": "tenant_id required"}`

**Actual**:
- Status: 500 Internal Server Error
- Body: `{"error": "internal server error"}`

**Error Output**:
```
--- FAIL: TestGetOrders_MissingTenantID (0.50s)
    order_test.go:162: Expected status 400, got 500
    order_test.go:165: Response body: {"error":"internal server error"}
```

**Bug Report**: [BUG-001](bug-reports/BUG-001.md)

---

### IDEM-004: Concurrent requests with same key ❌

**Location**: services/orders-service/handlers/order_test.go:245

**Expected**:
- Both requests return same order ID
- Only one order created in database

**Actual**:
- Two different order IDs returned
- Two orders created (race condition)

**Error Output**:
```
--- FAIL: TestIdempotency_ConcurrentRequests (3.50s)
    order_test.go:260: Expected same order ID, got different
    order_test.go:262: Request 1 order: ord_abc123
    order_test.go:263: Request 2 order: ord_def456
```

**Bug Report**: [BUG-002](bug-reports/BUG-002.md)

---

## Bugs Found

| Bug ID | Title | Severity | Tag | Status |
|--------|-------|----------|-----|--------|
| BUG-001 | Missing tenant_id returns 500 instead of 400 | P1 | PR Gate | Added to tasks.json |
| BUG-002 | Concurrent idempotency race condition | P0 | PR Gate | Added to tasks.json |

---

## Console Output

### orders-service Tests

```
=== RUN   TestGetOrders_TenantIsolation
--- PASS: TestGetOrders_TenantIsolation (1.20s)
=== RUN   TestGetOrders_MissingTenantID
    order_test.go:162: Expected status 400, got 500
--- FAIL: TestGetOrders_MissingTenantID (0.50s)
=== RUN   TestIdempotency_ConcurrentRequests
    order_test.go:260: Expected same order ID, got different
--- FAIL: TestIdempotency_ConcurrentRequests (3.50s)
FAIL
exit status 1
FAIL    services/orders-service/handlers    8.123s
```

---

## Acceptance Criteria Verification

### TASK-001: Add tenant_id filter to order query

| Criterion | Test | Result |
|-----------|------|--------|
| Query includes WHERE tenant_id = ? | TI-001, TI-002 | ✅ Verified |
| Tenant ID extracted from header | TI-001 | ✅ Verified |
| Returns 400 if missing | TI-003 | ❌ Failed |
| Unit test verifies isolation | TI-001, TI-002 | ✅ Verified |

**Status**: PARTIAL - 3/4 criteria met, BUG-001 filed

---

## Next Steps

### If PASS
1. All PR Gate and Extended tests passed
2. Proceed to merge per definition-of-done.md
3. Archive run to `ai-runs/archive/`

### If FAIL (Current)
1. BUG-001 and BUG-002 added to tasks.json
2. Loop back to Codex for review of new bugs
3. Claude implements fixes
4. Re-run QA suite
