# Severity Rules

This document defines severity classification for all findings, bugs, and tasks.

---

## Severity Levels

### P0 - Blocker (Critical Security/Data)

**Definition**: Issues that MUST be fixed before any merge. Represent immediate security risk, data integrity breach, or complete feature failure.

**Criteria** (any one qualifies as P0):

| Category | Examples |
|----------|----------|
| **Data Leak** | Tenant A can see Tenant B data |
| **Auth Bypass** | Endpoints accessible without valid JWT |
| **Payment Broken** | Payments fail, double-charge, or charge wrong amount |
| **Tenant Isolation Breach** | Cross-tenant data access possible |
| **Security Vulnerability** | SQL injection, XSS, command injection |
| **Credential Exposure** | Secrets, tokens, or PII in logs/responses |

**Action Required**:
- Blocks all merges
- Must be fixed immediately
- Requires re-review after fix
- All tests must pass

**SLA**: Fix within same run (no merge until resolved)

---

### P1 - Critical (Major Functionality)

**Definition**: Issues that significantly impact functionality, security posture, or data correctness. Must be fixed before merge.

**Criteria** (any one qualifies as P1):

| Category | Examples |
|----------|----------|
| **Wrong Tenant Scoping** | Query works but doesn't filter by tenant |
| **Checkout Failures** | Cart issues, inventory mismatch, order state errors |
| **Missing Security Headers** | CSP, X-Frame-Options, etc. not set |
| **Auth Edge Cases** | Expired token returns 500 instead of 401 |
| **Missing Validation** | Required fields not validated |
| **Error Response Leaks** | Stack traces in production errors |
| **RBAC Bypass** | Permission checks missing on endpoints |

**Action Required**:
- Blocks merge
- Must be fixed in current run
- Requires verification test

**SLA**: Fix within same run (no merge until resolved)

---

### P2 - Major (Significant Regression)

**Definition**: Issues that break existing functionality but don't pose security or data integrity risks.

**Criteria** (any one qualifies as P2):

| Category | Examples |
|----------|----------|
| **Feature Regression** | Previously working feature now broken |
| **API Contract Violation** | Response format changed unexpectedly |
| **Performance Degradation** | Significant slowdown (>2x) |
| **Missing Error Handling** | Unhandled errors cause 500s |
| **Logging Issues** | Missing required log fields |
| **Test Failures** | Existing tests fail after change |

**Action Required**:
- Should be fixed before merge (preferred)
- Can be merged with tracking ticket (with justification)
- Requires follow-up task

**SLA**: Fix before merge OR create tracking ticket

---

### P3 - Minor (Low Impact)

**Definition**: Issues that are cosmetic, minor inconveniences, or code quality concerns.

**Criteria**:

| Category | Examples |
|----------|----------|
| **UX Issues** | Confusing error message text |
| **Minor Bugs** | Edge case with workaround |
| **Code Style** | Inconsistent naming, formatting |
| **Documentation** | Missing or outdated comments |
| **Tech Debt** | Suboptimal implementation |
| **Warnings** | Compiler/linter warnings |

**Action Required**:
- Does not block merge
- Document for future improvement
- Create tracking ticket

**SLA**: Create tracking ticket for backlog

---

## Severity Decision Tree

```
START
  │
  ▼
Is it a security vulnerability?
├─ YES: Can attacker access data/bypass auth?
│   ├─ YES → P0
│   └─ NO (missing headers, weak validation) → P1
│
└─ NO: Continue
       │
       ▼
   Does it affect data integrity?
   ├─ YES: Is tenant isolation breached?
   │   ├─ YES → P0
   │   └─ NO (wrong data, corruption risk) → P1
   │
   └─ NO: Continue
          │
          ▼
      Does it affect payments/checkout?
      ├─ YES: Payment failure/double-charge?
      │   ├─ YES → P0
      │   └─ NO (cart bugs, inventory issues) → P1
      │
      └─ NO: Continue
             │
             ▼
         Does it break existing functionality?
         ├─ YES: Core feature broken?
         │   ├─ YES → P2
         │   └─ NO (edge case) → P3
         │
         └─ NO: Continue
                │
                ▼
            Is it code quality/UX only?
            └─ YES → P3
```

---

## Examples by Service

### orders-service

| Issue | Severity | Reason |
|-------|----------|--------|
| Orders visible across tenants | P0 | Data leak |
| Missing idempotency key check | P0 | Payment risk |
| Order status update fails | P1 | Core functionality |
| Pagination off by one | P2 | Minor bug |
| Log missing request_id | P3 | Logging improvement |

### auth-bff

| Issue | Severity | Reason |
|-------|----------|--------|
| Any request accepted without JWT | P0 | Auth bypass |
| Expired token returns 500 | P1 | Error handling |
| Session not invalidated on logout | P1 | Security posture |
| Slow token validation | P2 | Performance |
| Verbose error messages | P3 | UX |

### products-service

| Issue | Severity | Reason |
|-------|----------|--------|
| Products visible across tenants | P0 | Data leak |
| Missing vendor permission check | P1 | RBAC bypass |
| Search returns wrong results | P2 | Feature bug |
| Image upload slow | P3 | Performance minor |

### staff-service

| Issue | Severity | Reason |
|-------|----------|--------|
| Staff can see other tenant staff | P0 | Data leak |
| Role assignment without check | P1 | RBAC issue |
| Email template not sent | P2 | Feature bug |
| Name validation too strict | P3 | UX |

---

## Tag Classification

### PR Gate (Blocks PR)

Issues that MUST be fixed before PR merge:
- All P0 issues
- All P1 issues
- Test failures that indicate regression

### Extended (Pre-Release)

Issues that should be fixed before release:
- P2 issues
- Integration test failures

### Nightly (Monitoring)

Issues tracked but don't block releases:
- P3 issues
- Performance benchmarks
- Load test results

---

## Escalation Matrix

| Severity | Auto-Block Merge | Notify | Resolution Time |
|----------|------------------|--------|-----------------|
| P0 | Yes | Immediate | Same run |
| P1 | Yes | Within 1h | Same run |
| P2 | No (with tracking) | Daily | Before release |
| P3 | No | Weekly | Backlog |

---

## Severity Change Rules

### Upgrade Conditions

- P1 → P0: If repeated in multiple iterations
- P2 → P1: If blocking customer-facing feature
- P3 → P2: If affecting multiple users

### Downgrade Conditions

- P0 → P1: Only with compensating control + human approval
- P1 → P2: Only if confirmed not security-related
- P2 → P3: Only if isolated edge case

**Note**: AI agents cannot downgrade severity. Only human reviewers can approve downgrades.
