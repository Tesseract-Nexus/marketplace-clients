# Inputs: [Run ID]

**Created**: YYYY-MM-DD HH:MM
**Author**: [Your name]

---

## PR / Ticket Reference

| Field | Value |
|-------|-------|
| PR Number | #XXX |
| Ticket | JIRA-XXXX |
| Branch | feature/xxx |
| Base Branch | main |

---

## Scope of Changes

### Summary
[One paragraph describing what this change does]

### Services Affected

| Service | Type of Change |
|---------|----------------|
| orders-service | Modified |
| products-service | Modified |
| admin (frontend) | Modified |

### Files Changed

```
services/orders-service/handlers/order.go
services/orders-service/handlers/order_test.go
services/products-service/handlers/product.go
apps/admin/components/OrderList.tsx
```

### Change Type

- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Performance improvement
- [ ] Security fix
- [ ] Database migration
- [ ] Infrastructure change
- [ ] Documentation

---

## Known Risks

### Risk 1: [Title]
- **Description**: [What could go wrong]
- **Mitigation**: [How we're handling it]
- **Severity**: High / Medium / Low

### Risk 2: [Title]
...

---

## Areas Requiring Extra Attention

- [ ] **Tenant isolation**: Changes affect multi-tenant data access
- [ ] **Authentication**: Changes affect Keycloak/JWT handling
- [ ] **Payment flow**: Changes affect checkout/payment processing
- [ ] **Data migration**: Changes require database migration
- [ ] **API contract**: Changes affect API interface
- [ ] **Performance**: Changes may impact performance

---

## Context for Reviewer

### Why this change?
[Business context, user story, or technical driver]

### Alternatives considered
[What other approaches were evaluated and why this one was chosen]

### Related PRs/Tickets
- Related: #XXX, #YYY
- Depends on: #ZZZ
- Blocks: #AAA

---

## Testing Notes

### Manual testing done
- [ ] [Test case 1]
- [ ] [Test case 2]

### Automated tests added
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

### Areas needing additional testing
[Specific scenarios to focus on during QA]

---

## Deployment Notes

### Pre-deployment steps
1. [Step 1]
2. [Step 2]

### Post-deployment verification
1. [Verification step 1]
2. [Verification step 2]

### Rollback plan
[How to rollback if issues are found]
