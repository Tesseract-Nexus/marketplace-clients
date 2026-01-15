# AI Development Policies

These policies are **non-negotiable**. All AI agents must enforce these rules during review, implementation, and QA.

---

## 1. Tenant Isolation Rules

### Database Queries

**REQUIRED**: Every database query on tenant-scoped tables MUST include `tenant_id` filtering.

```go
// CORRECT
db.Where("tenant_id = ?", tenantID).Find(&products)

// INCORRECT - BLOCKS MERGE
db.Find(&products) // Missing tenant_id filter
```

**Tenant-Scoped Tables** (must always filter by tenant_id):
- `products`, `variants`, `categories`
- `orders`, `order_items`, `customers`
- `vendors`, `staff`, `roles` (tenant-specific)
- `inventory`, `shipping`, `payments`
- `coupons`, `gift_cards`, `reviews`
- `tickets`, `notifications`, `settings`

### API Layer

**REQUIRED**: All API handlers must extract and validate tenant context.

```go
// CORRECT
tenantID := c.GetHeader("X-Tenant-ID")
if tenantID == "" {
    return errors.NewBadRequest("tenant_id required")
}

// INCORRECT - BLOCKS MERGE
// Proceeding without tenant validation
```

### Service-to-Service Calls

**REQUIRED**: Propagate tenant context in all internal service calls.

```go
// CORRECT
req.Header.Set("X-Tenant-ID", tenantID)

// INCORRECT - BLOCKS MERGE
// Calling internal service without tenant header
```

### Event Publishing

**REQUIRED**: All NATS events must include `tenantId` in payload.

```go
// CORRECT (camelCase per repo convention)
event := map[string]interface{}{
    "eventType": "order.created",
    "tenantId":  tenantID,  // REQUIRED
    "orderId":   order.ID,
}

// INCORRECT - BLOCKS MERGE
event := map[string]interface{}{
    "eventType": "order.created",
    "orderId":   order.ID,
    // Missing tenantId
}
```

---

## 2. Authentication Rules (Keycloak)

### JWT Validation

**REQUIRED**: Use `go-shared/auth` for all JWT validation. Never manually parse tokens.

```go
// CORRECT
claims, err := auth.ValidateToken(tokenString, jwksURL)

// INCORRECT - BLOCKS MERGE
token, _ := jwt.Parse(tokenString, ...) // Manual parsing
```

### JWKS Configuration

**REQUIRED**: Use environment-based JWKS URLs.

| Realm | Environment Variable | Purpose |
|-------|---------------------|---------|
| `tesserix-customer` | `KEYCLOAK_CUSTOMER_JWKS_URL` | Customer/vendor auth |
| `tesserix-internal` | `KEYCLOAK_INTERNAL_JWKS_URL` | Staff/admin auth |

### Claim Extraction

**REQUIRED**: Use standardized claim extraction.

```go
// CORRECT
keycloakUserID := claims.GetString("keycloak_user_id")
preferredUsername := claims.GetString("preferred_username")
tenantID := claims.GetString("tenant_id")

// INCORRECT - BLOCKS MERGE
userID := claims["sub"].(string) // Unsafe type assertion
```

### Role Mapping

**REQUIRED**: Map Keycloak roles to application permissions via RBAC system.

```go
// CORRECT
hasPermission, err := rbac.CheckPermission(ctx, userID, tenantID, "products:create")

// INCORRECT - BLOCKS MERGE
if role == "admin" { // Hardcoded role check
    // ...
}
```

### Session Handling

**REQUIRED**: Use Redis-backed sessions via auth-bff. Never store tokens in localStorage.

---

## 3. Database Query Rules

### Soft Deletes

**REQUIRED**: Always use GORM soft delete scoping.

```go
// CORRECT (GORM automatically adds deleted_at IS NULL)
db.Where("tenant_id = ?", tenantID).Find(&products)

// INCORRECT - May return deleted records
db.Unscoped().Where("tenant_id = ?", tenantID).Find(&products)
```

### Transactions

**REQUIRED**: Use transactions for multi-table operations.

```go
// CORRECT
err := db.Transaction(func(tx *gorm.DB) error {
    if err := tx.Create(&order).Error; err != nil {
        return err
    }
    if err := tx.Create(&orderItems).Error; err != nil {
        return err
    }
    return nil
})

// INCORRECT - BLOCKS MERGE
db.Create(&order)
db.Create(&orderItems) // No transaction
```

### Index Usage

**REQUIRED**: Add composite indexes for tenant + resource queries.

```sql
-- CORRECT
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_orders_tenant_customer ON orders(tenant_id, customer_id);

-- INCORRECT - Missing tenant index
CREATE INDEX idx_products_name ON products(name);
```

---

## 4. Checkout Idempotency Rules

### Order Creation

**REQUIRED**: Implement idempotency key for order creation.

```go
// CORRECT
func CreateOrder(ctx context.Context, req CreateOrderRequest) (*Order, error) {
    // Check idempotency key
    existing, err := repo.FindByIdempotencyKey(ctx, req.IdempotencyKey)
    if err == nil && existing != nil {
        return existing, nil // Return existing order
    }

    // Create new order with idempotency key
    order := &Order{
        IdempotencyKey: req.IdempotencyKey,
        // ...
    }
    // ...
}

// INCORRECT - BLOCKS MERGE
func CreateOrder(ctx context.Context, req CreateOrderRequest) (*Order, error) {
    order := &Order{/* ... */}
    db.Create(&order) // No idempotency check
}
```

### Payment Processing

**REQUIRED**: Use payment provider's idempotency mechanisms.

```go
// CORRECT
paymentIntent, err := stripe.PaymentIntents.New(&stripe.PaymentIntentParams{
    IdempotencyKey: stripe.String(orderID),
    // ...
})

// INCORRECT - BLOCKS MERGE
paymentIntent, err := stripe.PaymentIntents.New(&stripe.PaymentIntentParams{
    // Missing idempotency key
})
```

### Inventory Deduction

**REQUIRED**: Use optimistic locking for inventory updates.

```go
// CORRECT
result := db.Model(&Inventory{}).
    Where("product_id = ? AND version = ?", productID, currentVersion).
    Updates(map[string]interface{}{
        "quantity": gorm.Expr("quantity - ?", qty),
        "version":  gorm.Expr("version + 1"),
    })
if result.RowsAffected == 0 {
    return errors.NewConflict("inventory changed")
}

// INCORRECT - BLOCKS MERGE
db.Model(&Inventory{}).
    Where("product_id = ?", productID).
    Update("quantity", gorm.Expr("quantity - ?", qty)) // No version check
```

---

## 5. Logging & Observability Rules

### Required Context Fields

**REQUIRED**: All logs must include:

```go
// CORRECT
logger.WithFields(logrus.Fields{
    "tenant_id":   tenantID,   // REQUIRED
    "request_id":  requestID,  // REQUIRED
    "user_id":     userID,     // When available
    "service":     "orders-service",
    "operation":   "create_order",
}).Info("Order created")

// INCORRECT - BLOCKS MERGE
logger.Info("Order created") // Missing context
```

### Error Logging

**REQUIRED**: Log errors with full context and stack trace.

```go
// CORRECT
logger.WithFields(logrus.Fields{
    "tenant_id":  tenantID,
    "request_id": requestID,
    "error":      err.Error(),
    "stack":      debug.Stack(),
}).Error("Failed to create order")

// INCORRECT - BLOCKS MERGE
log.Println("error:", err) // Insufficient context
```

### Metrics

**REQUIRED**: Expose Prometheus metrics for all operations.

```go
// CORRECT
orderCreatedTotal.WithLabelValues(tenantID, status).Inc()
orderDuration.WithLabelValues(tenantID, operation).Observe(duration)

// INCORRECT - Missing tenant label
orderCreatedTotal.Inc()
```

---

## 6. Never Do These (Immediate Block)

### Security Violations

- [ ] **NEVER** store JWT tokens in localStorage or sessionStorage
- [ ] **NEVER** log sensitive data (passwords, tokens, PII)
- [ ] **NEVER** disable CORS in production
- [ ] **NEVER** use `*` for allowed origins in production
- [ ] **NEVER** skip JWT signature validation
- [ ] **NEVER** hardcode secrets in code
- [ ] **NEVER** commit `.env` files or credentials

### Data Integrity Violations

- [ ] **NEVER** delete data without soft delete (unless required by regulation)
- [ ] **NEVER** modify tenant_id after record creation
- [ ] **NEVER** allow cross-tenant data access
- [ ] **NEVER** skip transaction for multi-table writes
- [ ] **NEVER** process payments without idempotency keys

### Code Quality Violations

- [ ] **NEVER** use `panic()` for error handling in handlers
- [ ] **NEVER** swallow errors silently
- [ ] **NEVER** use global mutable state
- [ ] **NEVER** bypass the RBAC system
- [ ] **NEVER** use raw SQL without parameterization

### Infrastructure Violations

- [ ] **NEVER** expose internal services directly to internet
- [ ] **NEVER** skip health checks in K8s deployments
- [ ] **NEVER** deploy without resource limits
- [ ] **NEVER** use `latest` tag for production images

---

## Policy Enforcement

### During Review (Codex)

- Flag all policy violations as **P0 (Blocker)**
- Require explicit justification for any exception
- Map each finding to a specific policy section

### During Implementation (Claude)

- Check implementation against all applicable policies
- Add tests that verify policy compliance
- Document any policy-related decisions

### During QA (Gemini)

- Test all policy-critical scenarios
- Include tenant isolation tests in every suite
- Verify idempotency for all checkout flows

---

## Exception Process

If a policy exception is required:

1. Document the specific policy being excepted
2. Provide technical justification
3. Identify compensating controls
4. Get explicit approval (human reviewer)
5. Add to technical debt tracking

**No AI agent can approve policy exceptions.**
