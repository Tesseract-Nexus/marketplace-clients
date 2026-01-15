# Definition of Done

A change is ONLY ready for merge when ALL of the following criteria are met.

---

## Hard Merge Gates

These are **non-negotiable**. All must pass.

### 1. Code Quality

- [ ] **Build succeeds**: All services compile without errors
- [ ] **Lint passes**: No linting errors in modified files
- [ ] **No new warnings**: No new compiler/linter warnings introduced

### 2. Test Coverage

- [ ] **Unit tests pass**: 100% of unit tests pass
- [ ] **Integration tests pass**: All integration tests pass
- [ ] **New code has tests**: Every new function/method has tests
- [ ] **Modified code has tests**: Every modified function has updated tests

### 3. Security & Compliance

- [ ] **No P0 issues**: Zero P0 (blocker) issues remaining
- [ ] **No P1 issues**: Zero P1 (critical) issues remaining
- [ ] **Policy compliance**: All changes comply with policies.md
- [ ] **No secrets**: No hardcoded secrets, tokens, or credentials
- [ ] **No sensitive logs**: No PII or secrets in log statements

### 4. Multi-Tenancy

- [ ] **Tenant isolation verified**: Tests confirm tenant data isolation
- [ ] **tenant_id in queries**: All DB queries include tenant filtering
- [ ] **tenant_id in events**: All NATS events include tenantId
- [ ] **tenant_id in logs**: All log entries include tenant_id

### 5. Authentication

- [ ] **JWT validation**: Keycloak tokens validated correctly
- [ ] **RBAC enforced**: Permissions checked via go-shared/rbac
- [ ] **No auth bypass**: No code paths skip authentication

### 6. Documentation

- [ ] **Traceability complete**: traceability.md maps all changes
- [ ] **Implementation notes**: implementation-notes.md complete
- [ ] **API docs updated**: OpenAPI specs updated if endpoints changed

---

## Required Tests by Change Type

### Backend Service Changes

| Change Type | Required Tests |
|-------------|----------------|
| New endpoint | Unit + Integration + Auth + Tenant isolation |
| Modified endpoint | Regression + Modified behavior tests |
| Database migration | Migration up/down + Data integrity |
| Event publishing | Event format + Consumer compatibility |
| Auth changes | All auth scenarios + Token validation |

### Frontend Changes

| Change Type | Required Tests |
|-------------|----------------|
| New component | Component tests + Accessibility |
| Modified component | Regression tests |
| Auth flow | E2E auth flow tests |
| Checkout flow | E2E checkout tests |

### Infrastructure Changes

| Change Type | Required Tests |
|-------------|----------------|
| K8s manifest | Deployment test in staging |
| Istio config | Routing verification |
| Secrets | Secret access verification |

---

## Test Execution Requirements

### PR Gate (Must pass before merge)

```bash
# Backend
go test ./... -tags=pr_gate

# Frontend
npm test -- --testPathPattern="pr-gate"
```

Tests included:
- Unit tests
- Tenant isolation tests
- Auth validation tests
- Input validation tests

### Extended (Must pass before merge)

```bash
# Backend
go test ./... -tags=extended

# Frontend
npm test -- --testPathPattern="extended"
```

Tests included:
- Integration tests
- Full auth flow tests
- Multi-service interaction tests

### Nightly (Informational, not blocking)

```bash
# Backend
go test ./... -tags=nightly

# Frontend
npm test -- --testPathPattern="nightly"
```

Tests included:
- Load tests
- Soak tests
- Full regression suite
- Performance benchmarks

---

## Acceptance Criteria Verification

Every task in tasks.json must have:

1. **All acceptance criteria checked**: Every criterion marked as verified
2. **Tests proving criteria**: Each criterion has a corresponding test
3. **Manual verification note**: For non-automatable criteria

Example verification:

```json
{
  "id": "TASK-001",
  "acceptance_criteria": [
    {
      "criterion": "Query includes WHERE tenant_id = ?",
      "verified": true,
      "verification": "Code review + TestOrderQuery_TenantFilter"
    },
    {
      "criterion": "Tenant ID extracted from header",
      "verified": true,
      "verification": "Code review + TestOrderQuery_ExtractsHeader"
    }
  ]
}
```

---

## Checklist Before Merge

### Reviewer Checklist

- [ ] All tasks in tasks.json are `completed` or `escalated`
- [ ] No `pending` or `in_progress` tasks remaining
- [ ] test-results.md shows all PASS
- [ ] No bug reports in `bug-reports/` with severity P0 or P1
- [ ] implementation-notes.md reviewed
- [ ] traceability.md reviewed

### Author Checklist

- [ ] Ran full test suite locally
- [ ] Addressed all review comments
- [ ] Updated documentation if needed
- [ ] Rebased on latest main
- [ ] No merge conflicts

### CI/CD Checklist

- [ ] CI pipeline passed
- [ ] All required checks green
- [ ] Coverage threshold met (if applicable)
- [ ] Security scan passed

---

## P2/P3 Handling

P2 and P3 issues do NOT block merge but must be:

1. **Documented**: Listed in implementation-notes.md
2. **Tracked**: Created as follow-up tickets
3. **Prioritized**: Added to backlog with timeline

Example:

```markdown
## P2/P3 Follow-ups

| Bug | Severity | Follow-up Ticket |
|-----|----------|------------------|
| BUG-005: Minor UI glitch | P3 | JIRA-1234 |
| BUG-006: Edge case error message | P2 | JIRA-1235 |
```

---

## Exception Process

If any hard gate cannot be met:

1. **Document the exception** in implementation-notes.md
2. **Provide justification** (technical, timeline, etc.)
3. **Identify mitigations** (what compensating controls exist)
4. **Get explicit approval** from human reviewer
5. **Create follow-up task** to address the gap

Exceptions are tracked:

```markdown
## Exceptions Granted

| Gate | Reason | Mitigation | Approved By | Follow-up |
|------|--------|------------|-------------|-----------|
| Integration tests | Test env down | Manual QA | @tech-lead | JIRA-1236 |
```

---

## Merge Commands

Once all gates pass:

```bash
# Squash and merge
git checkout main
git pull origin main
git merge --squash feature/branch-name
git commit -m "feat: description

- Implements TASK-001, TASK-002, TASK-003
- Reviewed by: Codex
- QA by: Gemini
- Run ID: 20250115-143022

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

git push origin main
```

Archive the run:

```bash
mv ai-runs/20250115-143022 ai-runs/archive/
```
