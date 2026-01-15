# Traceability Matrix: [Run ID]

**Generated**: YYYY-MM-DD HH:MM
**By**: Claude Code

This document maps every task to its implementation changes.

---

## Summary

| Metric | Count |
|--------|-------|
| Tasks Traced | X |
| Files Modified | Y |
| Tests Added | Z |
| Lines Changed | ~N |

---

## Task-to-Code Mapping

### TASK-001: Add tenant_id filter to order query

| Field | Value |
|-------|-------|
| Status | ✅ Completed |
| Severity | P0 |
| Policy | policies.md#tenant-isolation-rules |

#### Files Modified

| File | Lines | Change |
|------|-------|--------|
| `services/orders-service/handlers/order.go` | 123-140 | Added tenant_id extraction and filtering |
| `services/orders-service/handlers/order.go` | 145-150 | Added error handling for missing tenant |

#### Tests Added

| File | Test Name | Purpose |
|------|-----------|---------|
| `services/orders-service/handlers/order_test.go` | `TestGetOrders_TenantIsolation` | Verify tenant A can't see tenant B data |
| `services/orders-service/handlers/order_test.go` | `TestGetOrders_MissingTenantID` | Verify 400 returned when header missing |

#### Code Diff Summary

```diff
// services/orders-service/handlers/order.go

 func (h *Handler) GetOrders(c *gin.Context) {
+    tenantID := c.GetHeader("X-Tenant-ID")
+    if tenantID == "" {
+        c.JSON(400, gin.H{"error": "tenant_id required"})
+        return
+    }
+
     var orders []Order
-    h.db.Find(&orders)
+    if err := h.db.Where("tenant_id = ?", tenantID).Find(&orders).Error; err != nil {
+        c.JSON(500, gin.H{"error": "failed to fetch orders"})
+        return
+    }
+
     c.JSON(200, orders)
 }
```

#### Acceptance Criteria Verification

| Criterion | Verified | How |
|-----------|----------|-----|
| Query includes WHERE tenant_id = ? | ✅ | Code review |
| Tenant ID extracted from header | ✅ | Code review |
| Returns 400 if missing | ✅ | TestGetOrders_MissingTenantID |
| Unit test verifies isolation | ✅ | TestGetOrders_TenantIsolation |

---

### TASK-002: [Title]

| Field | Value |
|-------|-------|
| Status | ✅ Completed |
| Severity | P1 |
| Policy | ... |

#### Files Modified

| File | Lines | Change |
|------|-------|--------|
| ... | ... | ... |

#### Tests Added

| File | Test Name | Purpose |
|------|-----------|---------|
| ... | ... | ... |

#### Acceptance Criteria Verification

| Criterion | Verified | How |
|-----------|----------|-----|
| ... | ✅/❌ | ... |

---

### TASK-003: [Title] (Escalated)

| Field | Value |
|-------|-------|
| Status | ⚠️ Escalated |
| Severity | P1 |
| Reason | Requires database migration |

#### Escalation Details

No code changes made. Task requires:
1. Database migration to add `tenant_id` column
2. Backfill existing data
3. Then implement the code change

#### Follow-up Required

- [ ] Create migration task
- [ ] Schedule migration
- [ ] Retry this task after migration

---

## File Change Summary

| File | Tasks | Lines Changed |
|------|-------|---------------|
| `services/orders-service/handlers/order.go` | TASK-001 | +15, -2 |
| `services/orders-service/handlers/order_test.go` | TASK-001 | +45, -0 |
| `services/products-service/handlers/product.go` | TASK-002 | +8, -3 |
| `services/products-service/handlers/product_test.go` | TASK-002 | +30, -0 |

---

## Test Coverage Added

| Service | Before | After | Tests Added |
|---------|--------|-------|-------------|
| orders-service | 65% | 78% | 3 |
| products-service | 70% | 75% | 2 |

---

## Dependencies

### Code Dependencies

| Task | Depends On | Status |
|------|------------|--------|
| TASK-004 | TASK-001 | Completed |
| TASK-006 | TASK-005 | Blocked (TASK-005 escalated) |

### External Dependencies

| Task | External Dependency | Status |
|------|---------------------|--------|
| TASK-005 | Database migration | Pending |

---

## Commits

| Commit | Tasks | Message |
|--------|-------|---------|
| [staged] | TASK-001, TASK-002 | feat: add tenant isolation to orders and products |
| [staged] | TASK-004 | fix: add RBAC check to order endpoints |

---

## QA Handoff Checklist

- [ ] All task changes documented above
- [ ] All tests listed with purpose
- [ ] Escalated tasks documented with reasons
- [ ] Dependencies clearly mapped
- [ ] Ready for Gemini QA validation
