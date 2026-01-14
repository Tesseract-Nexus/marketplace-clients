# Tesserix Marketplace Clients

A multi-tenant ecommerce marketplace platform consisting of four interconnected client applications.

## Applications

| App | Port | Purpose | Tech Stack |
|-----|------|---------|------------|
| **admin** | 3001 | Vendor/staff management dashboard | Next.js, Radix UI, React Query |
| **storefront** | 3200 | Customer-facing ecommerce website | Next.js, Zustand, NextAuth |
| **mobile** | Expo | Cross-platform mobile app | React Native, Expo, NativeWind |
| **tenant-onboarding** | 4201 | Self-service tenant registration | Next.js, Shadcn/ui, Zod |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MARKETPLACE CLIENTS                       │
├─────────────────┬─────────────────┬──────────────┬──────────────┤
│     Admin       │   Storefront    │    Mobile    │  Onboarding  │
│   (Vendors)     │  (Customers)    │    (Both)    │  (New Tenants)│
├─────────────────┴─────────────────┴──────────────┴──────────────┤
│                      BFF (Backend for Frontend)                  │
├─────────────────────────────────────────────────────────────────┤
│                        Backend Services                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Keycloak │ │ Products │ │  Orders  │ │ Settings │  ...      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Multi-Tenancy

| App | Strategy | Example URL |
|-----|----------|-------------|
| Admin | Subdomain | `{tenant}-admin.tesserix.app` |
| Storefront | Subdomain | `{tenant}.tesserix.app` |
| Mobile | Role-based | User context determines admin/customer view |
| Onboarding | Session-based | Temporary session until verification |

---

## Admin App

**Purpose**: Dashboard for vendors and staff to manage their storefront operations.

### Features
- **Dashboard**: Real-time analytics, sales metrics, KPIs
- **Orders**: Order management, fulfillment, returns, refunds
- **Products**: Catalog management, inventory tracking, bulk operations
- **Customers**: Customer profiles, segments, loyalty programs
- **Marketing**: Campaigns, coupons, promotions, ad manager
- **Settings**: Store configuration, payments, shipping, taxes
- **Staff**: Team management, roles, permissions
- **Multi-storefront**: Manage multiple storefronts from one dashboard

### Tech Stack
- Next.js 16 (App Router)
- Radix UI + Tailwind CSS
- TanStack React Query v5
- TipTap (rich text editor)
- Recharts (analytics)
- Keycloak OIDC (via BFF)

### Key Files
- `contexts/AuthProvider.tsx` - BFF-based session management with smart refresh
- `lib/api/` - Service-specific API clients
- `app/(tenant)/` - Protected tenant routes

---

## Storefront App

**Purpose**: Public customer-facing ecommerce website with multi-tenant support.

### Features
- **Product Catalog**: Browse, search, filter products
- **Shopping Cart**: Anonymous & authenticated cart with persistence
- **Checkout**: Multi-step checkout with address validation
- **User Accounts**: Profile, order history, addresses, wishlist
- **Gift Cards**: Purchase and redemption
- **Loyalty**: Points accumulation, referral program
- **Multi-language**: Dynamic language switching
- **Multi-currency**: Real-time currency conversion

### Tech Stack
- Next.js 16 (App Router)
- Radix UI + Headless UI + Tailwind CSS
- Zustand v5 (state management)
- TanStack React Query v5
- NextAuth v5 + Azure MSAL
- Framer Motion (animations)

### Key Files
- `lib/tenant.ts` - Subdomain-based tenant resolution
- `store/` - Zustand stores (cart, auth, wishlist, loyalty)
- `components/blocks/` - Composable page sections

---

## Mobile App

**Purpose**: Cross-platform mobile app for customers and vendors.

### Features
**Customer (Storefront Tab)**:
- Browse & search products
- Shopping cart & checkout
- Order tracking
- Push notifications

**Vendor (Admin Tab)**:
- Dashboard with KPIs
- Order management
- Inventory management
- Analytics

### Tech Stack
- React Native + Expo SDK 51
- Expo Router (file-based navigation)
- NativeWind (Tailwind for RN)
- Zustand + React Query
- expo-auth-session (OIDC)
- React Native Reanimated

### Key Files
- `app/(tabs)/(admin)/` - Vendor screens
- `app/(tabs)/(storefront)/` - Customer screens
- `stores/oidc-auth-store.ts` - Keycloak integration

---

## Tenant Onboarding App

**Purpose**: Self-service registration for new marketplace tenants.

### Features
- **Business Registration**: Company info, industry, business type
- **Email Verification**: OTP-based (6-digit code)
- **Subdomain Selection**: Unique storefront URL with availability check
- **Document Upload**: KYC documents, business licenses
- **Payment Setup**: Pricing plan selection, subscription
- **Auto-redirect**: Seamless redirect to admin after completion

### Tech Stack
- Next.js 16 (App Router)
- Shadcn/ui (Apple-inspired design)
- React Hook Form + Zod
- Zustand (localStorage-persisted)
- PostHog (analytics)
- Google Cloud Storage (documents)

### Key Files
- `lib/store/onboarding-store.ts` - Form state persistence
- `app/api/onboarding/` - Session management endpoints
- `components/DocumentUpload.tsx` - KYC document handling

---

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended)

### Installation

```bash
# Install dependencies for all apps
pnpm install --recursive

# Or individually
cd admin && pnpm install
cd storefront && pnpm install
cd mobile && pnpm install
cd tenant-onboarding && pnpm install
```

### Environment Setup

Copy `.env.example` to `.env.local` in each app:

```bash
cp admin/.env.example admin/.env.local
cp storefront/.env.example storefront/.env.local
cp mobile/.env.example mobile/.env.local
cp tenant-onboarding/.env.example tenant-onboarding/.env.local
```

### Running Locally

```bash
# Admin (http://localhost:3001)
cd admin && pnpm dev

# Storefront (http://localhost:3200)
cd storefront && pnpm dev

# Mobile (Expo)
cd mobile && pnpm start

# Tenant Onboarding (http://localhost:4201)
cd tenant-onboarding && pnpm dev
```

---

## Backend Services

All apps connect to these backend services via BFF pattern:

| Service | Purpose |
|---------|---------|
| **auth-bff** | Session management, CSRF protection |
| **keycloak** | Identity & access management (OIDC) |
| **tenant-service** | Multi-tenancy, tenant configuration |
| **products-service** | Catalog management |
| **orders-service** | Order processing |
| **customers-service** | Customer profiles |
| **settings-service** | Store configuration |
| **payment-service** | Payment gateways |
| **shipping-service** | Shipping rates & carriers |
| **notifications-service** | Email, SMS, push |

---

## Authentication

| App | Method | Details |
|-----|--------|---------|
| Admin | Keycloak OIDC via BFF | HttpOnly cookies, smart refresh |
| Storefront | NextAuth + Azure B2C | Social login support |
| Mobile | expo-auth-session | Secure device storage |
| Onboarding | OTP-based | Email verification, no user auth |

---

## Project Structure

```
marketplace-clients/
├── admin/                 # Vendor dashboard
│   ├── app/              # Next.js routes
│   ├── components/       # UI components
│   ├── contexts/         # React contexts
│   ├── lib/              # Utilities & API clients
│   └── tests/            # Playwright E2E tests
├── storefront/           # Customer website
│   ├── app/              # Next.js routes
│   ├── components/       # UI components
│   ├── store/            # Zustand stores
│   └── lib/              # Utilities & API clients
├── mobile/               # React Native app
│   ├── app/              # Expo Router
│   ├── components/       # RN components
│   ├── stores/           # Zustand stores
│   └── lib/              # Utilities
├── tenant-onboarding/    # Registration flow
│   ├── app/              # Next.js routes
│   ├── components/       # UI components
│   └── lib/              # Utilities & stores
└── README.md             # This file
```

---

## Documentation

Each app contains additional documentation:

**Admin**:
- `FEATURE_COMPARISON.md` - Feature implementation status
- `SERVICE_AUDIT.md` - Backend service integration audit
- `SETTINGS_SERVICE_INTEGRATION.md` - Settings architecture

**Storefront**:
- `DEPLOYMENT_GUIDE.md` - Production deployment guide
- `PENDING_FEATURES.md` - Feature roadmap
- `PRODUCTION_READINESS.md` - Production checklist

**Mobile**:
- `docs/ANDROID_SETUP.md` - Android development setup

**Tenant Onboarding**:
- `PRODUCTION_CHECKLIST.md` - Comprehensive production readiness

---

## Deployment

### Web Apps (Admin, Storefront, Onboarding)
- Docker containerization
- Kubernetes (Helm charts)
- Environment-specific configs via ConfigMaps/Secrets

### Mobile App
- EAS Build for Android/iOS
- Distribution via Play Store / App Store

---

## Contributing

1. Create a feature branch from `main`
2. Make changes with tests
3. Submit PR with description
4. Ensure CI passes

---

## License

Proprietary - Tesserix
