# Claude Implementation Workflow

This document details how Claude Code implements fixes and changes.

---

## Role

Claude Code acts as **Senior Developer** responsible for:
- Implementing fixes from tasks.json
- Writing tests for each fix
- Maintaining code quality
- Documenting changes

---

## Inputs

| Input | Source | Purpose |
|-------|--------|---------|
| `tasks.json` | Codex output | What to implement |
| `review.md` | Codex output | Context for findings |
| Source code | Repository | Code to modify |
| `policies.md` | `/ai/policies.md` | Rules to follow |

---

## Outputs

| Output | Location | Purpose |
|--------|----------|---------|
| Code changes | Repository | Actual fixes |
| `implementation-notes.md` | `ai-runs/<run-id>/` | What was done |
| `traceability.md` | `ai-runs/<run-id>/` | Change mapping |
| Updated `tasks.json` | `ai-runs/<run-id>/` | Status updates |

---

## Process Steps

### Step 1: Load Tasks

Read `tasks.json` and sort by:
1. Severity (P0 first, then P1, P2, P3)
2. Dependencies (if task B depends on task A, do A first)

### Step 2: For Each Task

#### 2.1 Understand the Task

Read:
- `title` - What needs to be done
- `finding_ref` - Link to review.md for context
- `files` - Which files to modify
- `acceptance_criteria` - What "done" means
- `tests_required` - What tests to write

#### 2.2 Locate Code

1. Open the file(s) listed in `files`
2. Go to lines listed in `lines`
3. Understand surrounding context
4. Identify the minimal change needed

#### 2.3 Implement Fix

**Follow these principles**:

1. **Minimal changes**: Only change what's necessary
2. **Policy compliance**: Verify fix follows policies.md
3. **Existing patterns**: Match existing code style
4. **No side effects**: Don't break other functionality

**Example - Adding tenant isolation**:

```go
// BEFORE (from review)
func (h *Handler) GetOrders(c *gin.Context) {
    var orders []Order
    h.db.Find(&orders)  // Missing tenant filter
    // ...
}

// AFTER (implemented fix)
func (h *Handler) GetOrders(c *gin.Context) {
    tenantID := c.GetHeader("X-Tenant-ID")
    if tenantID == "" {
        c.JSON(400, gin.H{"error": "tenant_id required"})
        return
    }

    var orders []Order
    h.db.Where("tenant_id = ?", tenantID).Find(&orders)
    // ...
}
```

#### 2.4 Write Tests

For each fix, write tests as specified in `tests_required`:

```go
func TestGetOrders_TenantIsolation(t *testing.T) {
    // Setup: Create orders for tenant A and tenant B
    // Action: Get orders for tenant A
    // Assert: Only tenant A orders returned
}

func TestGetOrders_MissingTenantID(t *testing.T) {
    // Setup: Create orders
    // Action: Get orders without X-Tenant-ID header
    // Assert: Returns 400 error
}
```

#### 2.5 Verify Acceptance Criteria

Check each criterion in `acceptance_criteria`:

- [ ] Query includes WHERE tenant_id = ?
- [ ] Tenant ID extracted from context/header
- [ ] Unit test verifies tenant isolation

#### 2.6 Update Status

In `tasks.json`, update task status:

```json
{
  "id": "TASK-001",
  "status": "completed",
  "completed_at": "2025-01-15T14:30:00Z",
  "implementation_notes": "Added tenant_id filter and header extraction"
}
```

#### 2.7 Document in Traceability

Add entry to `traceability.md`:

```markdown
## TASK-001: Add tenant_id filter to order query

| Field | Value |
|-------|-------|
| Task | TASK-001 |
| File | services/orders-service/handlers/order.go |
| Lines Changed | 123-135 |
| Tests Added | handlers/order_test.go:TestGetOrders_TenantIsolation |
| Commit | [staged] |
```

### Step 3: Update Implementation Notes

Add summary to `implementation-notes.md`:

```markdown
# Implementation Notes: [Run ID]

## Summary
- **Tasks Completed**: 5/6
- **Tasks Blocked**: 1
- **Tests Added**: 12
- **Files Modified**: 8

## Task Details

### TASK-001: Add tenant_id filter to order query ✅
- **Status**: Completed
- **Changes**: Added tenant_id filtering and header extraction
- **Tests**: TestGetOrders_TenantIsolation, TestGetOrders_MissingTenantID
- **Notes**: Used existing pattern from products-service

### TASK-002: ...
```

---

## Implementation Principles

### Follow Existing Patterns

Look for similar implementations in the codebase:

```bash
# Find similar patterns
grep -r "tenant_id" services/products-service/
grep -r "X-Tenant-ID" services/
```

### Don't Over-Engineer

- Implement exactly what the task requires
- Don't add "nice to have" features
- Don't refactor surrounding code
- Don't add comments unless necessary

### Policy Compliance

Before committing any change, verify:

- [ ] Follows tenant isolation rules (policies.md#1)
- [ ] Follows auth rules (policies.md#2)
- [ ] Follows database rules (policies.md#3)
- [ ] Follows checkout rules (policies.md#4)
- [ ] Follows logging rules (policies.md#5)
- [ ] Doesn't violate "Never do" list (policies.md#6)

### Test Coverage

Every fix must have:
1. **Unit test** - Tests the specific fix
2. **Edge case test** - Tests boundary conditions
3. **Negative test** - Tests error handling

---

## Traceability Requirements

For every change, document:

| Field | Required |
|-------|----------|
| Task ID | Yes |
| File path | Yes |
| Lines changed | Yes |
| Tests added | Yes |
| Commit/staged | Yes |
| Dependencies | If applicable |

---

## When to Escalate

**Stop and escalate to Codex/Human if**:

1. **Task is unclear**
   - Acceptance criteria don't make sense
   - File doesn't exist or was moved
   - Code structure changed significantly

2. **Task conflicts with policy**
   - Required change would violate policies.md
   - Two policies conflict

3. **Task requires architectural change**
   - Change affects multiple services
   - Change requires new dependencies
   - Change requires database migration

4. **Task is blocked**
   - Depends on another task that failed
   - Requires access not available

**Escalation format**:

```json
{
  "id": "TASK-003",
  "status": "escalated",
  "escalation_reason": "Task requires database migration which wasn't in scope",
  "escalation_details": "The tenant_id column doesn't exist in this table. Need migration to add it first.",
  "blocked_by": null,
  "escalated_at": "2025-01-15T14:45:00Z"
}
```

---

## Output Validation

Before completing, verify:

- [ ] All P0 tasks completed or escalated
- [ ] All P1 tasks completed or escalated
- [ ] Tests pass locally
- [ ] implementation-notes.md updated
- [ ] traceability.md updated
- [ ] tasks.json statuses updated

---

## Gate: When to Proceed to QA

**Proceed to Gemini QA when**:
- All P0/P1 tasks completed or escalated
- Tests added for each fix
- Code compiles/builds successfully
- implementation-notes.md complete
- traceability.md complete

**Do not proceed if**:
- Any P0 task incomplete without escalation
- Tests not written
- Build fails
