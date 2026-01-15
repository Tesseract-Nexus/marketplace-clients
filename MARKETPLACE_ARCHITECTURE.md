# Tesseract Marketplace Platform Architecture

> **Version:** 1.0
> **Last Updated:** January 2026
> **Scope:** Complete platform architecture across all repositories

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Repository Structure](#repository-structure)
3. [System Architecture](#system-architecture)
4. [Client Applications](#client-applications-marketplace-clients)
5. [Global Services](#global-services)
6. [Marketplace Services](#marketplace-services)
7. [Technology Stack](#technology-stack)
8. [Communication Patterns](#communication-patterns)
9. [Data Architecture](#data-architecture)
10. [Deployment Architecture](#deployment-architecture)
11. [Security Architecture](#security-architecture)
12. [Development Quick Reference](#development-quick-reference)

---

## Platform Overview

**Tesseract Marketplace** is a multi-tenant SaaS e-commerce platform that enables vendors to create and manage their own storefronts. The platform is designed with a microservices architecture split across three repositories for clear separation of concerns.

### Design Principles

- **Multi-Tenancy**: Subdomain-based tenant isolation (`{tenant}.tesserix.app`)
- **Microservices**: Independent, deployable services with single responsibilities
- **Event-Driven**: Asynchronous communication via NATS for loose coupling
- **API-First**: OpenAPI specifications for all services
- **Cloud-Native**: Kubernetes-first deployment with horizontal scaling

---

## Repository Structure

```
projects/
├── marketplace-clients/          # Frontend applications (4 apps)
│   ├── admin/                    # Vendor dashboard
│   ├── storefront/               # Customer e-commerce site
│   ├── mobile/                   # React Native mobile app
│   └── tenant-onboarding/        # Self-service registration
│
├── global-services/              # Shared platform infrastructure (17 services)
│   ├── auth-bff/                 # Authentication BFF (Node.js)
│   ├── tenant-service/           # Tenant management
│   ├── notification-service/     # Multi-channel notifications
│   ├── document-service/         # File storage
│   ├── search-service/           # Global search
│   └── [12 more services...]
│
└── marketplace-services/         # Business domain services (20 services)
    ├── products-service/         # Product catalog
    ├── orders-service/           # Order management
    ├── payment-service/          # Payment processing
    ├── inventory-service/        # Stock management
    └── [16 more services...]
```

### Repository Purposes

| Repository | Scope | Primary Language | Count |
|------------|-------|------------------|-------|
| `marketplace-clients` | User-facing applications | TypeScript | 4 apps |
| `global-services` | Platform-wide shared services | Go, Node.js | 17 services |
| `marketplace-services` | Business domain logic | Go, Python | 20 services |

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                              │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐  │
│  │   Admin     │  │ Storefront  │  │   Mobile    │  │ Tenant Onboarding │  │
│  │  (Next.js)  │  │  (Next.js)  │  │(React Native│  │    (Next.js)      │  │
│  │  Port 3001  │  │  Port 3200  │  │   + Expo)   │  │    Port 4201      │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────────┬─────────┘  │
│         │                │                │                    │            │
└─────────┼────────────────┼────────────────┼────────────────────┼────────────┘
          │                │                │                    │
          └────────────────┴────────┬───────┴────────────────────┘
                                    │
                            ┌───────▼───────┐
                            │   BFF Layer   │
                            │ (API Routes)  │
                            └───────┬───────┘
                                    │
        ┌───────────────────────────┼───────────────────────────────┐
        │                           │                               │
        ▼                           ▼                               ▼
┌───────────────────┐    ┌─────────────────────┐    ┌──────────────────────┐
│  GLOBAL SERVICES  │    │       NATS          │    │ MARKETPLACE SERVICES │
│  (Platform Core)  │◄───┤   Message Broker    ├───►│  (Business Domain)   │
│                   │    │                     │    │                      │
│ • auth-bff        │    │  • Event Streaming  │    │ • products-service   │
│ • tenant-service  │    │  • Request/Reply    │    │ • orders-service     │
│ • notification-*  │    │  • Pub/Sub          │    │ • payment-service    │
│ • document-service│    │                     │    │ • inventory-service  │
│ • search-service  │    └─────────────────────┘    │ • shipping-service   │
│ • settings-service│                               │ • customers-service  │
│ • audit-service   │                               │ • vendor-service     │
│ • [10 more...]    │                               │ • [13 more...]       │
└─────────┬─────────┘                               └──────────┬───────────┘
          │                                                    │
          └──────────────────────┬─────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      DATA LAYER         │
                    │                         │
                    │  ┌─────────────────┐    │
                    │  │   PostgreSQL    │    │
                    │  │ (Per-Service DB)│    │
                    │  └─────────────────┘    │
                    │                         │
                    │  ┌─────────────────┐    │
                    │  │     Redis       │    │
                    │  │ (Cache/Session) │    │
                    │  └─────────────────┘    │
                    │                         │
                    │  ┌─────────────────┐    │
                    │  │   Typesense     │    │
                    │  │    (Search)     │    │
                    │  └─────────────────┘    │
                    │                         │
                    │  ┌─────────────────┐    │
                    │  │  Cloud Storage  │    │
                    │  │ (S3/GCS/Azure)  │    │
                    │  └─────────────────┘    │
                    └─────────────────────────┘
```

### Multi-Tenant Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         INTERNET                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER / INGRESS                       │
│              (Subdomain-based routing)                           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ tenant-a.       │ │ tenant-b.       │ │ tenant-c.       │
│ tesserix.app    │ │ tesserix.app    │ │ tesserix.app    │
│                 │ │                 │ │                 │
│  (Storefront)   │ │  (Storefront)   │ │  (Storefront)   │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │   tenant-router-service  │
              │   (Tenant Resolution)    │
              └──────────────┬───────────┘
                             │
              ┌──────────────▼───────────┐
              │     SHARED SERVICES      │
              │  (Global Namespace)      │
              │                          │
              │  All tenants share:      │
              │  • Authentication        │
              │  • Notifications         │
              │  • Document storage      │
              │  • Search infrastructure │
              └──────────────────────────┘
```

---

## Client Applications (marketplace-clients)

### Application Overview

| Application | Purpose | Port | Subdomain Pattern |
|-------------|---------|------|-------------------|
| **admin** | Vendor management dashboard | 3001 | `{tenant}-admin.tesserix.app` |
| **storefront** | Customer e-commerce website | 3200 | `{tenant}.tesserix.app` |
| **mobile** | Cross-platform mobile app | - | N/A (API-based) |
| **tenant-onboarding** | Self-service registration | 4201 | `onboarding.tesserix.app` |

### Admin Application

**Location:** `/marketplace-clients/admin/`

```
admin/
├── app/                          # Next.js App Router
│   ├── (tenant)/                 # Protected tenant routes
│   │   ├── dashboard/            # Analytics & overview
│   │   ├── orders/               # Order management
│   │   ├── products/             # Product catalog
│   │   ├── customers/            # Customer management
│   │   ├── marketing/            # Campaigns & promotions
│   │   ├── inventory/            # Stock management
│   │   ├── settings/             # Tenant configuration
│   │   ├── staff/                # Staff & permissions
│   │   └── [15+ more routes]
│   └── api/                      # BFF endpoints (70+)
├── components/
│   ├── ui/                       # Radix UI components
│   ├── dashboard/                # Dashboard widgets
│   ├── storefront-builder/       # Visual page builder
│   └── [feature components]
├── contexts/                     # React Context providers (13)
├── lib/
│   ├── api/                      # API clients (31 modules)
│   └── services/                 # Business logic (24 modules)
├── middleware.ts                 # Tenant routing
└── Dockerfile
```

**Key Features:**
- Visual storefront builder with drag-and-drop
- Real-time analytics with Recharts
- Role-based access control
- Multi-language & multi-currency support

### Storefront Application

**Location:** `/marketplace-clients/storefront/`

```
storefront/
├── app/
│   ├── account/                  # User account pages
│   ├── products/                 # Product browsing
│   ├── cart/                     # Shopping cart
│   ├── checkout/                 # Multi-step checkout
│   ├── search/                   # Product search
│   └── api/                      # BFF endpoints (30+)
├── components/
│   ├── blocks/                   # Composable page sections
│   └── layouts/                  # Layout components
├── store/                        # Zustand stores
│   ├── cart.ts                   # Shopping cart state
│   ├── auth.ts                   # Authentication state
│   ├── wishlist.ts               # Wishlist state
│   └── loyalty.ts                # Loyalty points
├── lib/
│   ├── api/                      # API clients (21 modules)
│   ├── tenant.ts                 # Tenant resolution
│   └── personalization/          # User personalization
└── middleware.ts                 # Multi-tenant routing
```

**Key Features:**
- Server-side rendering for SEO
- Wishlist & loyalty programs
- Multi-step checkout with payment integration
- Azure B2C authentication

### Mobile Application

**Location:** `/marketplace-clients/mobile/`

```
mobile/
├── app/                          # Expo Router
│   ├── (tabs)/
│   │   ├── (admin)/              # Vendor screens
│   │   └── (storefront)/         # Customer screens
│   ├── (auth)/                   # Authentication flow
│   └── (onboarding)/             # Onboarding screens
├── components/                   # React Native components
├── stores/                       # Zustand stores (8)
├── lib/
│   ├── api/                      # API modules (14)
│   └── auth/                     # OIDC integration
├── app.json                      # Expo config
└── eas.json                      # EAS Build config
```

**Key Features:**
- Unified app for vendors & customers (role-based)
- Keycloak OIDC authentication
- Offline-first with MMKV storage
- Push notifications

### Tenant Onboarding Application

**Location:** `/marketplace-clients/tenant-onboarding/`

```
tenant-onboarding/
├── app/
│   ├── onboarding/               # Registration flow
│   │   ├── verify-email/
│   │   ├── setup-password/
│   │   └── success/
│   ├── presentation/             # Marketing pages
│   ├── pricing/                  # Pricing plans
│   └── api/                      # BFF endpoints
├── components/
│   └── DocumentUpload.tsx        # KYC document handling
├── lib/
│   ├── store/                    # Form state persistence
│   ├── validations/              # Zod schemas
│   └── analytics/                # PostHog integration
└── instrumentation.ts            # OpenTelemetry
```

**Key Features:**
- Multi-step registration wizard
- Document upload for KYC
- Payment integration (Stripe, Razorpay)
- Analytics tracking

---

## Global Services

### Service Catalog

**Location:** `/global-services/`

#### Authentication & Tenant Management

| Service | Port | Language | Description |
|---------|------|----------|-------------|
| `auth-bff` | 8082 | Node.js/Fastify | OIDC/Keycloak authentication BFF |
| `auth-service` | 8081 | Go | Legacy auth (DEPRECATED) |
| `tenant-service` | 8083 | Go | Tenant lifecycle management |
| `tenant-router-service` | 8084 | Go | Subdomain-based routing |

#### Communication Services

| Service | Port | Language | Description |
|---------|------|----------|-------------|
| `verification-service` | 8085 | Go | Email/phone verification, OTP |
| `notification-service` | 8086 | Go | Email, SMS, push notifications |
| `notification-hub` | 8087 | Go | Real-time WebSocket notifications |

#### Data Services

| Service | Port | Language | Description |
|---------|------|----------|-------------|
| `location-service` | 8088 | Go | Countries, states, currencies |
| `translation-service` | 8089 | Go | i18n/l10n support |
| `document-service` | 8090 | Go | Multi-cloud file storage |
| `search-service` | 8091 | Go | Typesense global search |
| `qr-service` | 8092 | Go | QR code generation |

#### Platform Operations

| Service | Port | Language | Description |
|---------|------|----------|-------------|
| `settings-service` | 8093 | Go | Global/tenant settings |
| `audit-service` | 8094 | Go | Compliance logging |
| `feature-flags-service` | 8095 | Go | Feature toggles, A/B testing |
| `analytics-service` | 8096 | Go | Platform analytics |
| `status-dashboard-service` | 8097 | Go | Health monitoring |

### Service Directory Structure

Each Go service follows this pattern:

```
[service-name]/
├── cmd/
│   └── main.go                   # Entry point
├── internal/
│   ├── config/                   # Configuration
│   ├── handlers/                 # HTTP handlers
│   ├── middleware/               # Auth, logging, CORS
│   ├── models/                   # Domain models
│   ├── repository/               # Data access layer
│   ├── services/                 # Business logic
│   ├── nats/                     # Event handlers
│   └── clients/                  # External service clients
├── migrations/                   # SQL migrations
├── openapi.yaml                  # API specification
├── docker-compose.yml            # Local development
├── Dockerfile                    # Production image
└── go.mod                        # Dependencies
```

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────►│  auth-bff   │────►│  Keycloak   │
│   (Admin/   │     │  (Node.js)  │     │   (OIDC)    │
│  Storefront)│     │             │     │             │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │ JWT Tokens    │
                   │ (RS256)       │
                   └───────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Global    │    │ Marketplace │    │   Client    │
│  Services   │    │  Services   │    │   Apps      │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Notification Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    notification-service                   │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐         │
│  │   Email    │  │    SMS     │  │    Push    │         │
│  │  Provider  │  │  Provider  │  │  Provider  │         │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘         │
│        │               │               │                 │
│        ▼               ▼               ▼                 │
│  ┌──────────────────────────────────────────┐           │
│  │         Provider Failover Logic          │           │
│  │  (Postal → SES → SendGrid → SMTP)        │           │
│  └──────────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                    notification-hub                       │
│                                                          │
│  ┌────────────────────────────────────────────┐         │
│  │         Real-time Delivery                  │         │
│  │  (WebSocket / Server-Sent Events)           │         │
│  └────────────────────────────────────────────┘         │
└──────────────────────────────────────────────────────────┘
```

---

## Marketplace Services

### Service Catalog

**Location:** `/marketplace-services/`

#### Core Commerce

| Service | Port | Description |
|---------|------|-------------|
| `products-service` | 8101 | Product catalog, variants, attributes |
| `orders-service` | 8102 | Order lifecycle, fulfillment |
| `inventory-service` | 8103 | Stock levels, reservations |
| `payment-service` | 8104 | Payment processing |
| `shipping-service` | 8105 | Carriers, tracking |

#### Customer & Vendor

| Service | Port | Description |
|---------|------|-------------|
| `customers-service` | 8106 | Customer profiles, addresses |
| `vendor-service` | 8107 | Vendor management, payouts |
| `staff-service` | 8108 | Staff roles, permissions |
| `reviews-service` | 8109 | Ratings, moderation |

#### Marketing & Promotions

| Service | Port | Description |
|---------|------|-------------|
| `coupons-service` | 8110 | Coupon management |
| `gift-cards-service` | 8111 | Gift card issuance |
| `marketing-service` | 8112 | Email campaigns |

#### Content & Categories

| Service | Port | Description |
|---------|------|-------------|
| `categories-service` | 8113 | Product hierarchy |
| `content-service` | 8114 | CMS pages, blocks |

#### Operations

| Service | Port | Description |
|---------|------|-------------|
| `approval-service` | 8115 | Workflow approvals |
| `tickets-service` | 8116 | Support tickets |
| `tax-service` | 8117 | Tax calculation |

#### ML Translation (Python)

| Service | Port | Description |
|---------|------|-------------|
| `bergamot-service` | 8120 | Mozilla neural translation |
| `huggingface-mt-service` | 8121 | HuggingFace transformers |

#### Integrations

| Service | Port | Description |
|---------|------|-------------|
| `marketplace-connector-service` | 8130 | Amazon, eBay, Shopify |

### Order Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ORDER FLOW                               │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────┐         ┌──────────┐         ┌──────────┐
    │ Customer │────────►│Storefront│────────►│ Cart API │
    └──────────┘         └──────────┘         └────┬─────┘
                                                   │
                                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                        CHECKOUT FLOW                              │
│                                                                  │
│  ┌───────────┐    ┌───────────┐    ┌───────────┐    ┌─────────┐ │
│  │ Validate  │───►│  Reserve  │───►│  Process  │───►│ Create  │ │
│  │   Cart    │    │ Inventory │    │  Payment  │    │  Order  │ │
│  └───────────┘    └───────────┘    └───────────┘    └─────────┘ │
│        │               │                │                │       │
│        ▼               ▼                ▼                ▼       │
│  ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐  │
│  │ products- │   │ inventory-│   │ payment-  │   │  orders-  │  │
│  │  service  │   │  service  │   │  service  │   │  service  │  │
│  └───────────┘   └───────────┘   └───────────┘   └───────────┘  │
└──────────────────────────────────────────────────────────────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────┐
                                              │  NATS Events    │
                                              │                 │
                                              │ • order.created │
                                              │ • order.paid    │
                                              │ • order.shipped │
                                              └────────┬────────┘
                                                       │
                    ┌──────────────────────────────────┼──────────┐
                    ▼                                  ▼          ▼
           ┌──────────────┐                  ┌──────────┐  ┌──────────┐
           │ notification-│                  │ shipping-│  │  audit-  │
           │   service    │                  │  service │  │  service │
           └──────────────┘                  └──────────┘  └──────────┘
```

### Payment Gateway Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       payment-service                            │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │                  Gateway Abstraction                    │    │
│  └────────────────────────────────────────────────────────┘    │
│                              │                                  │
│       ┌──────────────────────┼──────────────────────┐          │
│       │                      │                      │          │
│       ▼                      ▼                      ▼          │
│  ┌─────────┐           ┌─────────┐           ┌─────────┐       │
│  │ Stripe  │           │ PayPal  │           │Razorpay │       │
│  │ Gateway │           │ Gateway │           │ Gateway │       │
│  └─────────┘           └─────────┘           └─────────┘       │
│       │                      │                      │          │
│       │                      │                      │          │
│  ┌─────────┐           ┌─────────┐           ┌─────────┐       │
│  │  PayU   │           │Cashfree │           │  Paytm  │       │
│  │ Gateway │           │ Gateway │           │ Gateway │       │
│  └─────────┘           └─────────┘           └─────────┘       │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Webhook Handler (per gateway)              │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Languages & Frameworks

| Component | Technology | Version |
|-----------|------------|---------|
| **Frontend Web** | Next.js | 16.x |
| **Frontend Mobile** | React Native + Expo | 0.74.5 / SDK 51 |
| **Backend Services** | Go | 1.25 |
| **Auth BFF** | Node.js + Fastify | 20+ |
| **ML Services** | Python + FastAPI | 3.11 |

### Frontend Stack

| Category | Technology |
|----------|------------|
| **UI Framework** | React 19, Radix UI, Shadcn/ui |
| **State Management** | Zustand v5, React Query v5 |
| **Styling** | Tailwind CSS v4, NativeWind |
| **Forms** | React Hook Form + Zod |
| **Authentication** | NextAuth v5, Azure B2C, Keycloak |
| **Testing** | Playwright (E2E), Jest |

### Backend Stack

| Category | Technology |
|----------|------------|
| **HTTP Framework** | Gin (Go), Fastify (Node.js), FastAPI (Python) |
| **ORM** | GORM |
| **Message Queue** | NATS + JetStream |
| **Cache** | Redis 7+ |
| **Database** | PostgreSQL 14+ |
| **Search** | Typesense |
| **Authentication** | Keycloak (OIDC), JWT (RS256) |
| **API Docs** | OpenAPI 3.0 / Swagger |

### Infrastructure

| Category | Technology |
|----------|------------|
| **Container Runtime** | Docker |
| **Orchestration** | Kubernetes (GKE) |
| **Container Registry** | GitHub Container Registry (ghcr.io) |
| **CI/CD** | GitHub Actions |
| **Cloud Storage** | AWS S3, Google Cloud Storage, Azure Blob |
| **Monitoring** | Prometheus, OpenTelemetry |

---

## Communication Patterns

### Synchronous (HTTP/REST)

Used for direct request-response operations:

```
┌────────────┐     HTTP/REST      ┌────────────┐
│  Client    │──────────────────►│  Service   │
│            │◄──────────────────│            │
└────────────┘     Response       └────────────┘
```

**Examples:**
- Fetching product details
- Creating orders
- User authentication

### Asynchronous (NATS)

Used for event-driven communication:

```
┌────────────┐                    ┌────────────┐
│  Service A │──── Publish ──────►│    NATS    │
└────────────┘   (order.created)  └─────┬──────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
             ┌────────────┐      ┌────────────┐      ┌────────────┐
             │  Service B │      │  Service C │      │  Service D │
             │ (inventory)│      │  (notify)  │      │  (audit)   │
             └────────────┘      └────────────┘      └────────────┘
```

**Event Topics:**
- `order.*` - Order lifecycle events
- `product.*` - Product changes
- `inventory.*` - Stock updates
- `notification.*` - Notification requests
- `tenant.*` - Tenant events

### Real-Time (WebSocket/SSE)

Used for live updates to clients:

```
┌────────────┐     WebSocket      ┌──────────────────┐
│  Browser   │◄──────────────────►│ notification-hub │
└────────────┘                    └──────────────────┘
```

---

## Data Architecture

### Database Per Service

Each service maintains its own PostgreSQL database:

```
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Cluster                          │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ products_db   │  │  orders_db    │  │ customers_db  │       │
│  │               │  │               │  │               │       │
│  │ • products    │  │ • orders      │  │ • customers   │       │
│  │ • variants    │  │ • order_items │  │ • addresses   │       │
│  │ • attributes  │  │ • payments    │  │ • preferences │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ inventory_db  │  │  tenants_db   │  │  vendors_db   │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### Caching Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                         Redis                                    │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │   Sessions     │  │   Rate Limit   │  │   Cache        │    │
│  │   (auth)       │  │   (throttle)   │  │   (products)   │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐                        │
│  │   Cart Data    │  │   Feature      │                        │
│  │   (temp)       │  │   Flags        │                        │
│  └────────────────┘  └────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Data Isolation

```
┌─────────────────────────────────────────────────────────────────┐
│                   TENANT ISOLATION STRATEGY                      │
│                                                                 │
│  Option 1: Row-Level (Current)                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  products                                                │   │
│  │  ├── id | tenant_id | name | price                      │   │
│  │  ├── 1  | tenant_a  | ...  | ...                        │   │
│  │  ├── 2  | tenant_b  | ...  | ...                        │   │
│  │  └── (All queries filtered by tenant_id)                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Option 2: Schema-Level (Future)                                │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │ tenant_a      │  │ tenant_b      │  │ tenant_c      │       │
│  │ (schema)      │  │ (schema)      │  │ (schema)      │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Kubernetes Namespaces

```
┌─────────────────────────────────────────────────────────────────┐
│                    KUBERNETES CLUSTER                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Namespace: global                                       │   │
│  │                                                          │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │   │
│  │  │ auth-bff     │ │tenant-service│ │notification- │     │   │
│  │  │ (3 replicas) │ │ (3 replicas) │ │service (3)   │     │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘     │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │   │
│  │  │document-svc  │ │ search-svc   │ │ settings-svc │     │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Namespace: marketplace                                  │   │
│  │                                                          │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │   │
│  │  │products-svc  │ │ orders-svc   │ │ payment-svc  │     │   │
│  │  │ (3-10 HPA)   │ │ (3-10 HPA)   │ │ (3-10 HPA)   │     │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘     │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │   │
│  │  │inventory-svc │ │shipping-svc  │ │customers-svc │     │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Namespace: clients                                      │   │
│  │                                                          │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │   │
│  │  │ admin        │ │ storefront   │ │ onboarding   │     │   │
│  │  │ (3 replicas) │ │ (5 replicas) │ │ (2 replicas) │     │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘     │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### CI/CD Pipeline

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Commit  │───►│  Build   │───►│   Test   │───►│  Docker  │
│  (PR)    │    │  (Go/TS) │    │ (Unit/E2E│    │  Build   │
└──────────┘    └──────────┘    └──────────┘    └────┬─────┘
                                                     │
                                                     ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Deploy  │◄───│  Push to │◄───│  Trivy   │◄───│  Tag     │
│  (GKE)   │    │  GHCR    │    │  Scan    │    │  Image   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

## Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                           │
│                                                                 │
│  1. User Login Request                                          │
│     Browser ──► Admin/Storefront ──► auth-bff ──► Keycloak     │
│                                                                 │
│  2. Token Exchange                                              │
│     Keycloak ──► auth-bff (access_token + refresh_token)       │
│                                                                 │
│  3. Session Creation                                            │
│     auth-bff ──► Redis (store session) ──► Browser (cookie)    │
│                                                                 │
│  4. Authenticated Requests                                      │
│     Browser ──► BFF ──► JWT Validation ──► Backend Services    │
│                                                                 │
│  5. Token Refresh (automatic)                                   │
│     BFF detects expiry ──► auth-bff ──► Keycloak (refresh)     │
└─────────────────────────────────────────────────────────────────┘
```

### Authorization Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     RBAC (Role-Based Access Control)             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Roles                                                   │   │
│  │  ├── Super Admin (platform-level)                       │   │
│  │  ├── Tenant Admin (tenant-level)                        │   │
│  │  ├── Staff (tenant-level, role-based)                   │   │
│  │  │   ├── Order Manager                                  │   │
│  │  │   ├── Product Manager                                │   │
│  │  │   ├── Customer Support                               │   │
│  │  │   └── Marketing Manager                              │   │
│  │  └── Customer (storefront user)                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Permissions (assigned to roles)                         │   │
│  │  ├── products:read, products:write, products:delete     │   │
│  │  ├── orders:read, orders:write, orders:cancel           │   │
│  │  ├── customers:read, customers:write                    │   │
│  │  └── settings:read, settings:write                      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Development Quick Reference

### Local Development Ports

| Service/App | Port | URL |
|-------------|------|-----|
| Admin | 3001 | http://localhost:3001 |
| Storefront | 3200 | http://localhost:3200 |
| Tenant Onboarding | 4201 | http://localhost:4201 |
| auth-bff | 8082 | http://localhost:8082 |
| tenant-service | 8083 | http://localhost:8083 |
| notification-service | 8086 | http://localhost:8086 |
| products-service | 8101 | http://localhost:8101 |
| orders-service | 8102 | http://localhost:8102 |
| payment-service | 8104 | http://localhost:8104 |

### Common Commands

```bash
# Client Applications
cd marketplace-clients/admin && pnpm dev
cd marketplace-clients/storefront && pnpm dev
cd marketplace-clients/mobile && pnpm start
cd marketplace-clients/tenant-onboarding && pnpm dev

# Go Services (any service)
cd global-services/[service] && docker-compose up -d
cd marketplace-services/[service] && docker-compose up -d

# Run specific service
cd [service-dir] && go run cmd/main.go

# Build Docker image
docker build -t [service-name]:latest .

# Run tests
pnpm test              # Client apps
go test ./...          # Go services
pytest                 # Python services
```

### Environment Variables

Each service requires a `.env` file. Key variables:

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=secret
DATABASE_NAME=service_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# NATS
NATS_URL=nats://localhost:4222

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=tesseract
KEYCLOAK_CLIENT_ID=admin-client
KEYCLOAK_CLIENT_SECRET=secret

# Service URLs (for inter-service communication)
TENANT_SERVICE_URL=http://localhost:8083
NOTIFICATION_SERVICE_URL=http://localhost:8086
```

### Task Context Guide

When working on specific tasks, focus on these repos:

| Task Type | Primary Repo | Related Services |
|-----------|--------------|------------------|
| UI/UX changes | `marketplace-clients` | - |
| Auth issues | `global-services` | auth-bff, tenant-service |
| Order flow | `marketplace-services` | orders, inventory, payment, shipping |
| Notifications | `global-services` | notification-service, notification-hub |
| Product catalog | `marketplace-services` | products, categories, inventory |
| Search | `global-services` | search-service |
| Payments | `marketplace-services` | payment-service |
| File uploads | `global-services` | document-service |

---

## Appendix

### Shared Go Library

All Go services depend on `github.com/Tesseract-Nexus/go-shared`:

- Common middleware (auth, logging, CORS)
- Database utilities
- Error handling
- HTTP client helpers
- NATS helpers

### API Documentation

OpenAPI specs are available at:
- Each service: `[service-dir]/openapi.yaml`
- Swagger UI: `http://localhost:[port]/swagger/index.html`

### Monitoring Endpoints

All services expose:
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics (when enabled)

---

*This document serves as the authoritative reference for the Tesseract Marketplace platform architecture.*
