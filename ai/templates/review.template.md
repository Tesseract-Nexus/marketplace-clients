# Code Review: [Run ID]

**Reviewer**: Codex
**Date**: YYYY-MM-DD
**Scope**: [Brief description from inputs.md]

---

## Summary

| Metric | Count |
|--------|-------|
| Files Reviewed | X |
| Total Findings | Y |
| P0 (Blocker) | Z |
| P1 (Critical) | A |
| P2 (Major) | B |
| P3 (Minor) | C |

### Verdict

- [ ] **Approved** - No blockers, ready for merge
- [ ] **Approved with conditions** - P2/P3 issues to address
- [ ] **Requires changes** - P0/P1 issues must be fixed
- [ ] **Blocked** - Fundamental issues, needs rearchitecture

---

## Critical Findings (P0/P1)

### Finding 1: [Descriptive Title]

| Field | Value |
|-------|-------|
| **ID** | F-001 |
| **Severity** | P0 / P1 |
| **File** | services/xxx-service/handlers/xxx.go |
| **Lines** | 123-145 |
| **Policy** | policies.md#section-name |

**Description**:
[Clear description of what is wrong]

**Impact**:
[Why this matters - security, data integrity, user impact]

**Current Code**:
```go
// Problematic code
db.Find(&records)  // Missing tenant filter
```

**Recommended Fix**:
```go
// Correct approach
db.Where("tenant_id = ?", tenantID).Find(&records)
```

**Task Reference**: TASK-001

---

### Finding 2: [Title]

| Field | Value |
|-------|-------|
| **ID** | F-002 |
| **Severity** | P0 / P1 |
| **File** | ... |
| **Lines** | ... |
| **Policy** | ... |

...

---

## Other Findings (P2/P3)

### Finding N: [Title]

| Field | Value |
|-------|-------|
| **ID** | F-00N |
| **Severity** | P2 / P3 |
| **File** | ... |
| **Lines** | ... |

**Description**: [What's wrong]

**Recommendation**: [How to fix]

---

## Positive Observations

- [Pattern used correctly]
- [Good test coverage for X]
- [Followed existing conventions for Y]

---

## Recommendations

### Immediate (must fix)
1. [Recommendation tied to P0/P1 finding]

### Suggested (should fix)
1. [Recommendation tied to P2/P3 finding]

### Future consideration
1. [Not blocking, but worth noting for future]

---

## Checklist Summary

| Category | Pass | Fail | N/A |
|----------|------|------|-----|
| Multi-Tenancy | ✅ / ❌ | | |
| Keycloak/Auth | ✅ / ❌ | | |
| API Correctness | ✅ / ❌ | | |
| DB/Migrations | ✅ / ❌ | | |
| Checkout/Orders | ✅ / ❌ | | |
| Frontend/SSR | ✅ / ❌ | | |
| K8s Readiness | ✅ / ❌ | | |
| Performance | ✅ / ❌ | | |

---

## Findings Table

| ID | Title | Severity | File | Task |
|----|-------|----------|------|------|
| F-001 | [Title] | P0 | services/xxx/... | TASK-001 |
| F-002 | [Title] | P1 | services/yyy/... | TASK-002 |
| F-003 | [Title] | P2 | apps/admin/... | TASK-003 |

---

## Next Steps

1. Claude: Implement tasks TASK-001 through TASK-00N
2. Focus on P0/P1 first
3. After implementation, proceed to Gemini QA
