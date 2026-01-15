# Codex Review Workflow

This document details how Codex performs code review and generates tasks.

---

## Role

Codex acts as **Tech Lead / Architect** responsible for:
- Code quality assessment
- Security review
- Policy compliance verification
- Task generation with severity ratings

---

## Inputs

| Input | Source | Purpose |
|-------|--------|---------|
| `inputs.md` | Human | Scope and context |
| Source code | Repository | Code to review |
| `policies.md` | `/ai/policies.md` | Rules to enforce |
| `review-checklist.md` | `/ai/review-checklist.md` | Criteria to check |
| `severity-rules.md` | `/ai/output-spec/severity-rules.md` | Severity classification |

---

## Outputs

| Output | Location | Purpose |
|--------|----------|---------|
| `review.md` | `ai-runs/<run-id>/review.md` | Detailed findings |
| `tasks.json` | `ai-runs/<run-id>/tasks.json` | Actionable task list |

---

## Process Steps

### Step 1: Parse Inputs

Read `inputs.md` and extract:
- PR number or ticket reference
- List of changed files
- Scope description
- Known risks flagged by human
- Affected services

### Step 2: Load Context

Load these reference documents:
- `ai/policies.md` - Development policies
- `ai/review-checklist.md` - Review criteria
- `ai/repo-map.md` - Service structure
- `ai/output-spec/severity-rules.md` - Severity definitions

### Step 3: Review Code

For each changed file:

1. **Read the file**
2. **Check against policies.md**:
   - Tenant isolation rules
   - Auth/Keycloak rules
   - Database query rules
   - Checkout idempotency rules
   - Logging requirements
   - "Never do these" list

3. **Apply review-checklist.md**:
   - Multi-tenancy checks
   - Keycloak/Auth checks
   - API correctness
   - Database/migrations
   - Checkout/orders
   - Frontend/SSR
   - K8s readiness
   - Performance

4. **Document findings**

### Step 4: Classify Severity

For each finding, assign severity per `severity-rules.md`:

| Severity | Criteria |
|----------|----------|
| **P0** | Data leak, auth bypass, payment broken, tenant isolation breach |
| **P1** | Wrong tenant scoping, checkout failures, security headers missing |
| **P2** | Major regressions, broken functionality |
| **P3** | Minor bugs, UX issues, code style |

### Step 5: Generate review.md

Structure:

```markdown
# Code Review: [Run ID]

## Summary
- **Files Reviewed**: X
- **Total Findings**: Y
- **P0**: Z | **P1**: A | **P2**: B | **P3**: C

## Critical Findings (P0/P1)

### Finding 1: [Title]
- **Severity**: P0
- **File**: services/orders-service/handlers/order.go
- **Line**: 123-145
- **Policy**: policies.md#tenant-isolation-rules
- **Description**: [What's wrong]
- **Impact**: [Why it matters]
- **Recommendation**: [How to fix]

## Other Findings (P2/P3)
...

## Positive Observations
...

## Recommendations
...
```

### Step 6: Generate tasks.json

Create task for each finding:

```json
{
  "tasks": [
    {
      "id": "TASK-001",
      "title": "Add tenant_id filter to order query",
      "severity": "P0",
      "status": "pending",
      "finding_ref": "Finding 1",
      "files": [
        "services/orders-service/handlers/order.go"
      ],
      "lines": "123-145",
      "policy_ref": "policies.md#tenant-isolation-rules",
      "acceptance_criteria": [
        "Query includes WHERE tenant_id = ?",
        "Tenant ID extracted from context/header",
        "Unit test verifies tenant isolation"
      ],
      "tests_required": [
        "TestOrderQuery_TenantIsolation",
        "TestOrderQuery_MissingTenantID"
      ],
      "notes": "Critical: This allows cross-tenant data access"
    }
  ]
}
```

---

## Review Principles

### Be Strict

- Flag ALL policy violations
- Don't assume "they'll fix it later"
- Err on the side of caution for security

### Be Specific

- Include exact file paths and line numbers
- Reference specific policy sections
- Provide concrete fix recommendations

### Avoid Unnecessary Refactors

- Only flag issues, not style preferences
- Don't suggest "nice to have" improvements
- Focus on correctness, security, and policies

### Map to Policies

Every finding must reference:
- A policy section in `policies.md`, OR
- A checklist item in `review-checklist.md`

If it doesn't map to either, reconsider if it's a real issue.

---

## Severity Decision Tree

```
Is it a security vulnerability?
├─ Yes: Auth bypass, data leak, injection → P0
├─ Yes: Missing security header, weak validation → P1
└─ No: Continue ↓

Does it affect data integrity?
├─ Yes: Tenant isolation breach → P0
├─ Yes: Data corruption, wrong scoping → P1
└─ No: Continue ↓

Does it affect payments/checkout?
├─ Yes: Payment failure, double charge → P0
├─ Yes: Cart issues, inventory mismatch → P1
└─ No: Continue ↓

Does it break functionality?
├─ Yes: Core feature broken → P2
├─ Yes: Edge case broken → P3
└─ No: Continue ↓

Is it a code quality issue?
└─ Yes → P3 (or don't flag if minor)
```

---

## Output Validation

Before completing, verify:

- [ ] Every P0/P1 finding has a corresponding task
- [ ] Every task has acceptance criteria
- [ ] Every task has required tests
- [ ] File paths are accurate
- [ ] Line numbers are current
- [ ] Severity matches severity-rules.md

---

## Gate: When to Stop

**Stop and escalate to human if**:
- Changes are too large to review thoroughly
- Critical infrastructure changes detected
- Unclear requirements in inputs.md
- Conflicting policies apply

**Proceed to Claude when**:
- review.md is complete
- tasks.json is generated
- All findings documented
