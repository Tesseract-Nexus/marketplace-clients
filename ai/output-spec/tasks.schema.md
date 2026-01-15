# Tasks Schema

This document defines the schema for `tasks.json` files.

---

## Schema Overview

```json
{
  "run_id": "string (required)",
  "generated_by": "string (required)",
  "generated_at": "ISO8601 datetime (required)",
  "last_updated": "ISO8601 datetime (required)",
  "last_updated_by": "string (required)",
  "summary": { /* Summary object */ },
  "tasks": [ /* Array of Task objects */ ],
  "regression_suite": { /* Optional regression suite */ },
  "missing_fixtures": [ /* Optional fixture tracking */ ]
}
```

---

## Root Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `run_id` | string | Yes | Unique identifier for the run (e.g., "20250115-143022") |
| `generated_by` | string | Yes | Who created the file ("codex", "claude", "gemini") |
| `generated_at` | datetime | Yes | ISO8601 timestamp of creation |
| `last_updated` | datetime | Yes | ISO8601 timestamp of last update |
| `last_updated_by` | string | Yes | Who last updated ("codex", "claude", "gemini") |
| `summary` | object | Yes | Counts and statistics |
| `tasks` | array | Yes | Array of Task objects |
| `regression_suite` | object | No | Regression test tracking |
| `missing_fixtures` | array | No | Missing test fixtures |

---

## Summary Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `total` | integer | Yes | Total number of tasks |
| `p0` | integer | Yes | Count of P0 severity tasks |
| `p1` | integer | Yes | Count of P1 severity tasks |
| `p2` | integer | Yes | Count of P2 severity tasks |
| `p3` | integer | Yes | Count of P3 severity tasks |
| `completed` | integer | Yes | Count of completed tasks |
| `pending` | integer | Yes | Count of pending tasks |
| `in_progress` | integer | Yes | Count of in-progress tasks |
| `blocked` | integer | Yes | Count of blocked tasks |
| `escalated` | integer | Yes | Count of escalated tasks |

---

## Task Object

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (e.g., "TASK-001", "BUG-001") |
| `title` | string | Clear, actionable title |
| `severity` | enum | "P0", "P1", "P2", or "P3" |
| `status` | enum | "pending", "in_progress", "completed", "blocked", "escalated" |
| `type` | enum | "fix", "feature", "bug", "test", "refactor" |
| `files` | array | Array of file paths affected |
| `acceptance_criteria` | array | Array of criteria strings |
| `tests_required` | array | Array of test names to write |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `tag` | string | "PR Gate", "Extended", or "Nightly" |
| `source` | string | Who created task ("codex", "gemini-qa") |
| `finding_ref` | string | Reference to finding in review.md |
| `bug_report` | string | Path to bug report file |
| `lines` | string | Line numbers (e.g., "123-145") |
| `policy_ref` | string | Reference to policies.md section |
| `description` | string | Detailed description |
| `notes` | string | Additional context |
| `created_at` | datetime | When task was created |
| `completed_at` | datetime | When task was completed |
| `implementation_notes` | string | Notes from implementer |
| `escalation_reason` | string | Why task was escalated |
| `escalation_details` | string | Detailed escalation info |
| `blocked_by` | string | Task ID that blocks this one |

---

## Task ID Convention

| Prefix | Meaning | Example |
|--------|---------|---------|
| `TASK-` | Finding from code review | TASK-001 |
| `BUG-` | Bug from QA | BUG-001 |
| `FIX-` | Fixture needed | FIX-001 |
| `TEST-` | Test to add | TEST-001 |

---

## Status Values

| Status | Meaning | Who Sets |
|--------|---------|----------|
| `pending` | Not started | Codex, Gemini |
| `in_progress` | Being worked on | Claude |
| `completed` | Successfully done | Claude |
| `blocked` | Waiting on dependency | Claude |
| `escalated` | Cannot complete as-is | Claude |

---

## Severity Values

| Severity | Meaning | Blocks Merge |
|----------|---------|--------------|
| `P0` | Blocker - security/data | Yes |
| `P1` | Critical - major functionality | Yes |
| `P2` | Major - regression | Conditional |
| `P3` | Minor - UX/quality | No |

See `severity-rules.md` for detailed classification.

---

## Tag Values

| Tag | When Run | Blocks Merge |
|-----|----------|--------------|
| `PR Gate` | Every PR | Yes |
| `Extended` | Pre-merge | Yes |
| `Nightly` | Daily | No |

---

## Example Task

```json
{
  "id": "TASK-001",
  "title": "Add tenant_id filter to order query",
  "severity": "P0",
  "status": "pending",
  "type": "fix",
  "tag": "PR Gate",
  "source": "codex",
  "finding_ref": "F-001",
  "files": [
    "services/orders-service/handlers/order.go"
  ],
  "lines": "123-145",
  "policy_ref": "policies.md#tenant-isolation-rules",
  "description": "The GetOrders handler queries orders without tenant_id filtering, allowing cross-tenant data access. This is a critical security issue.",
  "acceptance_criteria": [
    "Query includes WHERE tenant_id = ?",
    "Tenant ID extracted from X-Tenant-ID header",
    "Returns 400 if tenant_id is missing",
    "Unit test verifies tenant isolation"
  ],
  "tests_required": [
    "TestGetOrders_TenantIsolation",
    "TestGetOrders_MissingTenantID",
    "TestGetOrders_CrossTenantAccess"
  ],
  "notes": "Critical security issue - must fix before merge. Reference products-service for pattern.",
  "created_at": "2025-01-15T14:30:00Z",
  "completed_at": null,
  "implementation_notes": null,
  "escalation_reason": null,
  "escalation_details": null,
  "blocked_by": null,
  "bug_report": null
}
```

---

## Example Bug Task (from QA)

```json
{
  "id": "BUG-001",
  "title": "Fix: Missing tenant_id causes 500 instead of 400",
  "severity": "P1",
  "status": "pending",
  "type": "bug",
  "tag": "PR Gate",
  "source": "gemini-qa",
  "finding_ref": null,
  "bug_report": "bug-reports/BUG-001.md",
  "files": [
    "services/orders-service/handlers/order.go"
  ],
  "lines": "128",
  "policy_ref": "policies.md#tenant-isolation-rules",
  "description": "When X-Tenant-ID header is missing, API returns 500 instead of 400. Discovered during TI-003 test execution.",
  "acceptance_criteria": [
    "Missing X-Tenant-ID returns 400 status code",
    "Error message is 'tenant_id required'",
    "No nil pointer dereference occurs",
    "TI-003 test passes"
  ],
  "tests_required": [
    "TestGetOrders_MissingTenantID_Returns400"
  ],
  "notes": "Implementation may have missed nil check. See bug report for stack trace.",
  "created_at": "2025-01-15T15:00:00Z",
  "completed_at": null,
  "implementation_notes": null,
  "escalation_reason": null,
  "escalation_details": null,
  "blocked_by": null
}
```

---

## Example Escalated Task

```json
{
  "id": "TASK-005",
  "title": "Add tenant_id column to legacy_orders table",
  "severity": "P1",
  "status": "escalated",
  "type": "fix",
  "tag": "PR Gate",
  "source": "codex",
  "files": [
    "services/orders-service/migrations/"
  ],
  "acceptance_criteria": [
    "tenant_id column exists",
    "Index on tenant_id",
    "Backfill existing data"
  ],
  "tests_required": [],
  "notes": "Requires database migration",
  "created_at": "2025-01-15T14:30:00Z",
  "escalation_reason": "out_of_scope",
  "escalation_details": "The legacy_orders table doesn't have a tenant_id column. This requires a database migration which was not in the original scope. Recommended: Create a separate migration PR first.",
  "escalated_at": "2025-01-15T14:45:00Z"
}
```

---

## Regression Suite Schema

```json
{
  "regression_suite": {
    "description": "string",
    "test_categories": [
      {
        "name": "string",
        "tag": "PR Gate | Extended | Nightly",
        "tests": [
          {
            "id": "string",
            "name": "string",
            "status": "pending | passed | failed | skipped",
            "services": ["string"]
          }
        ]
      }
    ]
  }
}
```

---

## Missing Fixtures Schema

```json
{
  "missing_fixtures": [
    {
      "id": "string",
      "description": "string",
      "path": "string",
      "needed_for": ["test-id-1", "test-id-2"],
      "status": "missing | created | verified"
    }
  ]
}
```

---

## Validation Rules

1. **ID must be unique** across all tasks in the file
2. **Severity must be valid** (P0, P1, P2, P3)
3. **Status must be valid** (pending, in_progress, completed, blocked, escalated)
4. **Files must be valid paths** relative to repo root
5. **Acceptance criteria must be non-empty** for P0/P1 tasks
6. **Tests required must be non-empty** for P0/P1 tasks
7. **Bug tasks must have bug_report** field populated
8. **Escalated tasks must have escalation_reason** and **escalation_details**
9. **Blocked tasks must have blocked_by** field
