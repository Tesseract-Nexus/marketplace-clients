# Repository Map

This document maps all services, applications, and packages in the Tesseract Hub monorepo.

---

## Backend Services (Go)

Location: `/services/`

### Core Platform Services

| Service | Path | Purpose | Database |
|---------|------|---------|----------|
| `auth-bff` | `/services/auth-bff` | Keycloak BFF (Fastify) | Redis (sessions) |
| `auth-service` | `/services/auth-service` | **DEPRECATED** Legacy auth | auth DB |
| `tenant-service` | `/services/tenant-service` | Tenant management, onboarding | tenants DB |
| `tenant-router-service` | `/services/tenant-router-service` | Tenant slug routing | - |

### E-commerce Core

| Service | Path | Purpose | Database |
|---------|------|---------|----------|
| `products-service` | `/services/products-service` | Product catalog, variants | products DB |
| `categories-service` | `/services/categories-service` | Category hierarchy | categories DB |
| `orders-service` | `/services/orders-service` | Order management, cart | orders DB |
| `customers-service` | `/services/customers-service` | Customer profiles | customers DB |
| `inventory-service` | `/services/inventory-service` | Stock management | inventory DB |
| `vendors-service` | `/services/vendors-service` | Multi-vendor management | vendors DB |
| `payment-service` | `/services/payment-service` | Payment processing | payments DB |
| `shipping-service` | `/services/shipping-service` | Shipping & logistics | shipping DB |
| `tax-service` | `/services/tax-service` | Tax calculations (GST) | tax DB |

### Commerce Features

| Service | Path | Purpose | Database |
|---------|------|---------|----------|
| `coupons-service` | `/services/coupons-service` | Discounts, promotions | coupons DB |
| `reviews-service` | `/services/reviews-service` | Product reviews | reviews DB |
| `gift-cards-service` | `/services/gift-cards-service` | Gift card management | gift_cards DB |
| `tickets-service` | `/services/tickets-service` | Support tickets | tickets DB |

### Platform Services

| Service | Path | Purpose | Database |
|---------|------|---------|----------|
| `staff-service` | `/services/staff-service` | Staff RBAC management | staff DB |
| `notification-service` | `/services/notification-service` | Email/SMS (NATS consumer) | notifications DB |
| `notification-hub` | `/services/notification-hub` | In-app notifications | notification_hub DB |
| `search-service` | `/services/search-service` | Search indexing | Elasticsearch |
| `analytics-service` | `/services/analytics-service` | Platform analytics | analytics DB |
| `approval-service` | `/services/approval-service` | Workflow approvals | approvals DB |
| `audit-service` | `/services/audit-service` | Audit logging | audit DB |
| `feature-flags-service` | `/services/feature-flags-service` | Feature toggles | feature_flags DB |
| `verification-service` | `/services/verification-service` | OTP, email verification | verification DB |
| `settings-service` | `/services/settings-service` | Platform settings | settings DB |
| `document-service` | `/services/document-service` | File uploads, storage | documents DB |

### Specialized Services

| Service | Path | Purpose | Database |
|---------|------|---------|----------|
| `translation-service` | `/services/translation-service` | i18n translations | translations DB |
| `location-service` | `/services/location-service` | Geolocation | locations DB |
| `qr-service` | `/services/qr-service` | QR code generation | - |
| `status-dashboard-service` | `/services/status-dashboard-service` | System health | - |
| `marketplace-connector-service` | `/services/marketplace-connector-service` | Third-party marketplaces | connectors DB |
| `content-service` | `/services/content-service` | CMS | content DB |
| `bergamot-service` | `/services/bergamot-service` | Neural MT | - |
| `huggingface-mt-service` | `/services/huggingface-mt-service` | ML models | - |

---

## Frontend Applications

Location: `/apps/`

| App | Path | Framework | Port | Purpose |
|-----|------|-----------|------|---------|
| `admin` | `/apps/admin` | Next.js 16 | 3001 | Admin dashboard |
| `storefront` | `/apps/storefront` | Next.js | 3000 | Customer store |
| `mobile` | `/apps/mobile` | Expo React Native | - | Mobile app |
| `tenant-onboarding` | `/apps/tenant-onboarding` | Next.js | 3002 | Onboarding wizard |

### Admin Portal (`/apps/admin`)

Key directories:
```
apps/admin/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── settings/          # Settings pages
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities
├── hooks/                 # Custom hooks
└── store/                 # Zustand stores
```

### Storefront (`/apps/storefront`)

Key directories:
```
apps/storefront/
├── app/                   # Next.js App Router
│   ├── products/         # Product pages
│   ├── cart/             # Cart pages
│   ├── checkout/         # Checkout flow
│   └── account/          # Customer account
├── components/           # React components
└── lib/                  # Utilities
```

### Mobile App (`/apps/mobile`)

Key directories:
```
apps/mobile/
├── app/                  # Expo Router
├── components/           # React Native components
├── hooks/                # Custom hooks
├── store/                # Zustand stores
└── services/             # API services
```

---

## Shared Packages

Location: `/packages/`

| Package | Path | Purpose |
|---------|------|---------|
| `go-shared` | `/packages/go-shared` | Go utilities (auth, rbac, events, etc.) |
| `ui` | `/packages/ui` | React component library |
| `api-contracts` | `/packages/api-contracts` | OpenAPI contracts |
| `shared` | `/packages/shared` | Common JS/TS utilities |
| `settings` | `/packages/settings` | Settings schema |
| `feature-flags` | `/packages/feature-flags` | Feature flag client |
| `translation-client` | `/packages/translation-client` | i18n client |
| `search-client` | `/packages/search-client` | Search client |
| `mfe-theme-utils` | `/packages/mfe-theme-utils` | Theme utilities |
| `eslint-config` | `/packages/eslint-config` | ESLint config |
| `typescript-config` | `/packages/typescript-config` | TypeScript config |

### go-shared Package Structure

```
packages/go-shared/
├── auth/           # Keycloak JWT validation, JWKS
├── rbac/           # Permission checking
├── events/         # NATS event publishing
├── database/       # GORM helpers
├── errors/         # Error types
├── http/           # HTTP utilities
├── logger/         # Structured logging
├── metrics/        # Prometheus metrics
├── cache/          # Redis utilities
├── middleware/     # HTTP middleware
├── validation/     # Input validation
├── security/       # Security utilities
├── tracing/        # Distributed tracing
└── secrets/        # Secret management
```

---

## Infrastructure

### Kubernetes (`/k8s/`)

```
k8s/
├── api-gateway/           # Istio Gateway, VirtualServices
├── identity/              # Keycloak deployments
│   ├── keycloak-customer.yaml
│   ├── keycloak-internal.yaml
│   ├── bff-service.yaml
│   └── postgres.yaml
└── monitoring/            # Prometheus, Grafana
```

### Infrastructure as Code (`/infra/`)

```
infra/
├── terraform/             # GCP infrastructure
├── helm/                  # Helm charts
└── scripts/               # Deployment scripts
```

**Note**: Main infrastructure lives in separate repo.

---

## Documentation (`/docs/`)

Key documents:
- `HIGH_LEVEL_DESIGN.md` - System architecture
- `DATABASE_SCHEMA.md` - Complete schema
- `RBAC.md` - Role-based access control
- `NATS_EVENT_PAYLOADS.md` - Event schemas
- `API_DOCUMENTATION.md` - API reference
- `PRODUCTION_READINESS.md` - Deployment checklist

---

## Key Patterns Reference

### Multi-Tenancy

- **Database**: `tenant_id` column, row-level filtering
- **API**: `X-Tenant-ID` header
- **Web**: Subdomain routing (`{tenant}.admin.tesserix.app`)
- **Cache**: Tenant-prefixed Redis keys

### Authentication

- **Keycloak Realms**:
  - `tesserix-customer` (customers, vendors)
  - `tesserix-internal` (staff, admins)
- **JWT Claims**: `keycloak_user_id`, `preferred_username`, `tenant_id`
- **BFF**: Cookie-based sessions via `auth-bff`

### Events (NATS)

- **Streams**: `ORDER_EVENTS`, `PAYMENT_EVENTS`, `CUSTOMER_EVENTS`, etc.
- **Payload**: camelCase JSON
- **Required fields**: `eventType`, `tenantId`, `timestamp`

### RBAC

- **Roles**: owner, admin, manager, member, viewer, vendor, customer
- **Permissions**: `resource:action` format
- **Scoping**: Tenant-level permission evaluation

---

## Service Communication Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Istio Gateway                                │
│                    (api-devtest.tesserix.app)                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
    ┌────────────────────────┼────────────────────────────────────────┐
    │                        │                                        │
    ▼                        ▼                                        ▼
┌─────────┐            ┌──────────┐                            ┌──────────┐
│ auth-bff│            │ products │                            │  orders  │
│         │            │ service  │                            │ service  │
└────┬────┘            └────┬─────┘                            └────┬─────┘
     │                      │                                       │
     ▼                      │                                       │
┌─────────┐                 │                                       │
│Keycloak │                 ▼                                       ▼
└─────────┘            ┌─────────┐                            ┌──────────┐
                       │inventory│◄───────────────────────────│ payment  │
                       │ service │                            │ service  │
                       └─────────┘                            └──────────┘
                                                                    │
                                                                    ▼
                                                              ┌──────────┐
                                                              │   NATS   │
                                                              │JetStream │
                                                              └────┬─────┘
                                                                   │
                    ┌──────────────────────────────────────────────┼───┐
                    │                      │                       │   │
                    ▼                      ▼                       ▼   ▼
              ┌──────────┐          ┌──────────┐            ┌──────────┐
              │notif-svc │          │analytics │            │  audit   │
              └──────────┘          └──────────┘            └──────────┘
```

---

## Quick Reference

### Start Local Development

```bash
# Start infrastructure
docker-compose up -d postgres redis nats

# Start specific service
cd services/products-service && go run main.go

# Start admin portal
cd apps/admin && npm run dev
```

### Run Tests

```bash
# Go service tests
cd services/products-service && go test ./...

# Frontend tests
cd apps/admin && npm test
```

### Build for Production

```bash
# Build all
turbo run build

# Build specific service
cd services/products-service && go build -o bin/products-service
```
