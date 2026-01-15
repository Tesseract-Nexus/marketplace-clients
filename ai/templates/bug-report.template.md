# BUG-XXX: [Clear, Descriptive Title]

**Reported**: YYYY-MM-DD HH:MM
**Reporter**: Gemini CLI
**Run ID**: [run-id]

---

## Classification

| Field | Value |
|-------|-------|
| **Severity** | P0 / P1 / P2 / P3 |
| **Type** | Security / Data Integrity / Functionality / UX |
| **Tag** | PR Gate / Extended / Nightly |
| **Blocks Merge** | Yes / No |

---

## Environment

| Field | Value |
|-------|-------|
| Service | [service-name] |
| Endpoint | [HTTP method + path] |
| Version | [commit hash] |
| Branch | [branch name] |

---

## Description

[Clear description of the bug - what is happening vs what should happen]

---

## Expected Behavior

**Status Code**: [expected status]

**Response Body**:
```json
{
  "expected": "response"
}
```

**Behavior**: [Description of expected behavior]

---

## Actual Behavior

**Status Code**: [actual status]

**Response Body**:
```json
{
  "actual": "response"
}
```

**Behavior**: [Description of actual behavior]

---

## Steps to Reproduce

### Prerequisites

1. [Setup step 1]
2. [Setup step 2]

### Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]
4. Observe: [What goes wrong]

---

## Reproduction Commands

```bash
# Setup (if needed)
export TOKEN="eyJ..."
export TENANT_ID="tenant-a"

# Reproduce the bug
curl -v -X [METHOD] http://localhost:8080/api/[endpoint] \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: $TENANT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "request": "body"
  }'

# Expected: [what should happen]
# Actual: [what happens]
```

---

## Logs / Stack Trace

```
[Relevant log output or stack trace]

2025/01/15 14:30:00 ERROR [error message]
    at file.go:123
    at runtime/panic.go:221
```

---

## Suspected Root Cause

| Field | Value |
|-------|-------|
| **File** | [path/to/file.go] |
| **Line** | [line number] |
| **Function** | [function name] |

**Analysis**:
[Your analysis of what's causing the bug]

**Suspected Code**:
```go
// This code appears to be the issue
func problematicFunction() {
    // Missing check here
}
```

---

## Suggested Fix

```go
// Suggested fix
func fixedFunction() {
    // Add check here
    if condition {
        return error
    }
}
```

---

## Impact Assessment

### Users Affected
- [ ] All users
- [ ] Specific tenant
- [ ] Admin users only
- [ ] Customer users only

### Data Impact
- [ ] Data corruption possible
- [ ] Data leak possible
- [ ] No data impact

### Business Impact
[Description of business impact]

---

## Related Items

| Type | Reference |
|------|-----------|
| Task | TASK-XXX (if implementation issue) |
| Policy | policies.md#section |
| Test | TestXxx_Scenario |
| Previous Bug | BUG-YYY (if regression) |

---

## Attachments

### Screenshots
[If applicable]

### Test Output
```
[Full test output]
```

### Network Request
```
[Request/response details]
```

---

## Resolution

### Status
- [ ] Open
- [ ] In Progress
- [ ] Fixed
- [ ] Verified
- [ ] Closed

### Fix Commit
[Commit hash when fixed]

### Verified By
[Who verified the fix]

### Verification Date
[When verified]
