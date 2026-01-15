# Gemini QA Workflow

This document details how Gemini CLI performs QA validation.

---

## Role

Gemini CLI acts as **QA Lead** responsible for:
- Creating test plans
- Executing comprehensive test suites
- Validating fixes meet acceptance criteria
- Reporting bugs with reproduction steps

---

## Inputs

| Input | Source | Purpose |
|-------|--------|---------|
| `tasks.json` | Codex/Claude | What was fixed |
| `implementation-notes.md` | Claude | What changed |
| `traceability.md` | Claude | Where changes are |
| Source code | Repository | Tests to run |
| `policies.md` | `/ai/policies.md` | What to validate |

---

## Outputs

| Output | Location | Purpose |
|--------|----------|---------|
| `test-plan.md` | `ai-runs/<run-id>/` | Test coverage plan |
| `test-results.md` | `ai-runs/<run-id>/` | Pass/fail results |
| `bug-reports/` | `ai-runs/<run-id>/bug-reports/` | Bug details |
| Updated `tasks.json` | `ai-runs/<run-id>/` | New bug tasks |

---

## Process Steps

### Step 1: Generate Test Plan

Based on changes in `traceability.md`, create `test-plan.md`:

```markdown
# Test Plan: [Run ID]

## Scope
Based on implementation-notes.md, the following areas require testing:
- Order tenant isolation (TASK-001)
- Payment idempotency (TASK-002)
- Auth header validation (TASK-003)

## Test Suites

### Suite 1: Tenant Isolation Tests
- **Priority**: Critical
- **Services**: orders-service
- **Tests**:
  - [ ] Orders visible only to owning tenant
  - [ ] Cross-tenant access denied
  - [ ] Missing tenant_id rejected

### Suite 2: Payment Idempotency Tests
...
```

### Step 2: Execute Tests

#### 2.1 Unit Tests

```bash
# Run unit tests for affected services
cd services/orders-service && go test ./... -v
cd services/payment-service && go test ./... -v
```

#### 2.2 Integration Tests

```bash
# Run integration tests
cd tests/integration && go test ./... -v -tags=integration
```

#### 2.3 Multi-Tenant Isolation Tests

**Required scenarios**:

| Test | Description | Expected |
|------|-------------|----------|
| Tenant A creates order | Create order with tenant_id=A | Success |
| Tenant A reads own order | Get order with tenant_id=A | Returns order |
| Tenant B reads A's order | Get order with tenant_id=B | 404 or empty |
| No tenant reads order | Get order without X-Tenant-ID | 400 error |

**Test implementation**:

```go
func TestOrderTenantIsolation(t *testing.T) {
    // Setup
    tenantA := "tenant-a"
    tenantB := "tenant-b"

    // Create order for tenant A
    orderA := createOrder(t, tenantA)

    // Tenant A can see their order
    result := getOrders(t, tenantA)
    assert.Contains(t, result, orderA.ID)

    // Tenant B cannot see tenant A's order
    resultB := getOrders(t, tenantB)
    assert.NotContains(t, resultB, orderA.ID)

    // No tenant gets rejected
    _, err := getOrdersNoTenant(t)
    assert.Error(t, err)
}
```

#### 2.4 Authentication Tests

**Required scenarios**:

| Test | Description | Expected |
|------|-------------|----------|
| Valid JWT | Request with valid Keycloak token | Success |
| Expired JWT | Request with expired token | 401 |
| Invalid signature | Request with tampered token | 401 |
| Missing JWT | Request without Authorization | 401 |
| Wrong realm | Token from wrong Keycloak realm | 401 |

#### 2.5 Checkout Idempotency Tests

**Required scenarios**:

| Test | Description | Expected |
|------|-------------|----------|
| First order creation | Create order with idempotency key | Success, new order |
| Duplicate request | Same idempotency key | Success, same order |
| Different key | New idempotency key | Success, new order |
| Concurrent requests | Same key, concurrent | One success, one returns existing |

#### 2.6 3-App Journey Regression Tests

Test the complete flow: **Onboarding → Admin → Storefront**

```markdown
## 3-App Journey Test Suite

### Onboarding Flow (apps/tenant-onboarding)
1. [ ] New tenant registration
2. [ ] Email verification
3. [ ] Business setup wizard
4. [ ] Initial admin user creation
5. [ ] Keycloak realm provisioning

### Admin Flow (apps/admin)
1. [ ] Admin login via Keycloak
2. [ ] Tenant context loading
3. [ ] Product creation (tenant-scoped)
4. [ ] Order viewing (tenant-scoped)
5. [ ] Staff management
6. [ ] Settings modification

### Storefront Flow (apps/storefront)
1. [ ] Customer registration
2. [ ] Product browsing (tenant-scoped catalog)
3. [ ] Cart management
4. [ ] Checkout with payment
5. [ ] Order confirmation
6. [ ] Order history viewing
```

### Step 3: Record Results

Update `test-results.md`:

```markdown
# Test Results: [Run ID]

## Summary
- **Total Tests**: 45
- **Passed**: 42
- **Failed**: 3
- **Skipped**: 0

## Results by Suite

### Suite 1: Tenant Isolation Tests
| Test | Status | Duration | Notes |
|------|--------|----------|-------|
| TestOrderTenantIsolation | ✅ PASS | 1.2s | |
| TestCrossTenantAccess | ✅ PASS | 0.8s | |
| TestMissingTenantID | ❌ FAIL | 0.5s | Returns 500 instead of 400 |

### Suite 2: Payment Idempotency Tests
...

## Failed Tests Detail

### TestMissingTenantID
- **File**: services/orders-service/handlers/order_test.go:156
- **Error**: Expected status 400, got 500
- **Logs**: [attached]
```

### Step 4: Report Bugs

For each failure, create `bug-reports/BUG-XXX.md`:

```markdown
# BUG-001: Missing tenant_id returns 500 instead of 400

## Severity
P1 - Wrong tenant scoping behavior

## Environment
- Service: orders-service
- Endpoint: GET /api/orders
- Version: commit abc123

## Description
When X-Tenant-ID header is missing, the API returns 500 Internal Server Error instead of 400 Bad Request.

## Expected Behavior
- Status: 400 Bad Request
- Body: `{"error": "tenant_id required"}`

## Actual Behavior
- Status: 500 Internal Server Error
- Body: `{"error": "internal server error"}`

## Steps to Reproduce
1. Start orders-service
2. Send GET /api/orders without X-Tenant-ID header
3. Observe response

## Reproduction Command
```bash
curl -X GET http://localhost:8080/api/orders \
  -H "Authorization: Bearer $TOKEN"
# Note: No X-Tenant-ID header
```

## Logs
```
2025/01/15 14:30:00 ERROR nil pointer dereference in GetOrders
```

## Suspected Component
- File: services/orders-service/handlers/order.go
- Function: GetOrders
- Issue: Missing nil check after tenant_id extraction

## Related Task
- TASK-001 (implementation may be incomplete)
```

### Step 5: Update tasks.json

Add new tasks for bugs:

```json
{
  "id": "BUG-001",
  "title": "Fix: Missing tenant_id returns 500 instead of 400",
  "severity": "P1",
  "status": "pending",
  "type": "bug",
  "source": "gemini-qa",
  "bug_report": "bug-reports/BUG-001.md",
  "files": [
    "services/orders-service/handlers/order.go"
  ],
  "acceptance_criteria": [
    "Missing X-Tenant-ID returns 400 status",
    "Error message is 'tenant_id required'",
    "No 500 errors for missing tenant"
  ],
  "tests_required": [
    "TestGetOrders_MissingTenantID_Returns400"
  ]
}
```

---

## Required Test Scenarios

### Tenant Isolation (CRITICAL)

Every PR must include:

1. **Data isolation test**: Tenant A data not visible to Tenant B
2. **Missing tenant test**: Requests without tenant_id rejected
3. **Tenant injection test**: Cannot override tenant_id in body

### Authentication (CRITICAL)

Every PR must include:

1. **Valid token test**: Authorized access works
2. **Invalid token test**: Bad tokens rejected
3. **Expired token test**: Expired tokens rejected
4. **Missing token test**: No token rejected

### Checkout Idempotency (CRITICAL for payment flows)

Every checkout PR must include:

1. **Idempotency key test**: Same key returns same result
2. **Concurrent request test**: Race conditions handled
3. **Inventory atomicity test**: No overselling

---

## Test Tagging

Categorize tests by execution frequency:

| Tag | When to Run | Examples |
|-----|-------------|----------|
| `PR Gate` | Every PR | Unit tests, tenant isolation |
| `Extended` | Pre-merge | Integration, auth flows |
| `Nightly` | Daily | Full regression, load tests |

```go
// +build pr_gate
func TestOrderTenantIsolation(t *testing.T) { ... }

// +build extended
func TestFullCheckoutFlow(t *testing.T) { ... }

// +build nightly
func TestLoadCheckout(t *testing.T) { ... }
```

---

## Gate: Pass/Fail Criteria

### PASS - Ready for Merge

- [ ] All PR Gate tests pass
- [ ] All Extended tests pass
- [ ] No P0 bugs found
- [ ] No P1 bugs found
- [ ] All acceptance criteria verified

### FAIL - Loop Back

If any of the following:
- Any P0/P1 bug found → Add to tasks.json, loop to Codex
- PR Gate test fails → Add bug, loop to Claude
- Acceptance criteria not met → Update task, loop to Claude

---

## Output Validation

Before completing QA:

- [ ] test-plan.md complete
- [ ] test-results.md complete
- [ ] All failures have bug reports
- [ ] Bug reports have reproduction steps
- [ ] tasks.json updated with bugs
- [ ] Pass/fail decision documented
