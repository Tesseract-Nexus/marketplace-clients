# Tenant Onboarding App

A NextJS-based self-service tenant onboarding application for the Tesseract Hub platform. This application collects business information and verifies user emails, then hands off to dedicated admin apps (ecommerce-admin, saas-admin, etc.) for account creation and authentication.

## 🏗️ Architecture

This is a **public onboarding service** that works with backend microservices

### Frontend
- **Onboarding App** (Next.js 15) - This repository
  - Collects business information
  - Handles email verification UI
  - Redirects to admin apps with sessionId

### Backend Microservices
- **tenant-service** (Port 8086) - Stores onboarding data
- **verification-service** (Port 8088) - Email OTP verification
- **location-service** (Port 8087) - Countries, states, currencies

### Admin Apps (Separate)
- **ecommerce-admin** (Port 3001) - Receives redirect with sessionId
  - Creates user accounts
  - Handles authentication (JWT, OAuth, etc.)
  - Manages payment processing
  - Provisions tenant infrastructure

## 🚀 Features

### Onboarding Flow
- ✅ **Business Information**: Company name, type, industry
- ✅ **Contact Details**: Email, phone, job title
- ✅ **Business Address**: Country, state, city, street
- ✅ **Email Verification**: 6-digit OTP with 10-minute expiry
- ✅ **Post-Onboarding Redirect**: Auto-redirects to admin app

### Technical Features
- **TypeScript**: Fully typed codebase
- **Form Validation**: Zod schemas with real-time validation
- **State Management**: Zustand with localStorage persistence
- **UI Components**: Shadcn/ui with Apple-inspired design
- **BFF Pattern**: Next.js API routes proxy to backend services
- **Email OTP**: Real verification codes via Resend
- **Dev Mock Codes**: 000000-999999 accepted for testing

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + Shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **State**: Zustand with localStorage persistence
- **Payments**: Stripe + Razorpay integration
- **Icons**: Lucide React

## 📁 Project Structure

```
app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout
├── onboarding/
│   ├── page.tsx               # Business registration form
│   ├── verify/
│   │   └── page.tsx           # Email verification
│   ├── payment/
│   │   └── page.tsx           # Payment processing
│   ├── setup/
│   │   └── page.tsx           # Store configuration
│   └── success/
│       └── page.tsx           # Completion & welcome
├── pricing/
│   └── page.tsx               # Pricing plans & selection
lib/
├── store/
│   └── onboarding-store.ts    # Zustand state management
├── api/
│   └── onboarding.ts          # API client functions
└── validations/
    └── onboarding.ts          # Zod validation schemas
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+ and pnpm
- Go 1.21+ (for backend services)
- PostgreSQL 14+
- Resend API key (for email)

### 1. Database Setup
```bash
# Start PostgreSQL (if using Docker)
docker run --name tesseract-postgres \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=devpass \
  -e POSTGRES_DB=tesseract_hub \
  -p 5432:5432 \
  -d postgres:14
```

### 2. Backend Services

#### Verification Service
```bash
cd domains/common/services/verification-service
cp .env.example .env
# Edit .env with your Resend API key
go run cmd/main.go
# Runs on http://localhost:8088
```

#### Tenant Service
```bash
cd domains/common/services/tenant-service
cp .env.example .env
go run main.go
# Runs on http://localhost:8086
```

#### Location Service
```bash
cd domains/common/services/location-service
cp .env.example .env
go run cmd/main.go
# Runs on http://localhost:8087
```

### 3. Frontend (Onboarding App)

```bash
cd domains/ecommerce/apps/tenant-onboarding
pnpm install
cp .env.example .env.local
```

Edit `.env.local`:
```env
# Backend service URLs (server-side only)
TENANT_SERVICE_URL=http://localhost:8086
LOCATION_SERVICE_URL=http://localhost:8087

# Admin app redirect URL (client-side)
NEXT_PUBLIC_ECOMMERCE_ADMIN_URL=http://localhost:3001
```

Start development server:
```bash
pnpm dev
# Runs on http://localhost:3002
```

### 4. Access Points
- **Onboarding App**: http://localhost:3002
- **Tenant Service**: http://localhost:8086
- **Verification Service**: http://localhost:8088
- **Location Service**: http://localhost:8087
- **Health Checks**: `/health` on each service

## 📋 Onboarding Flow

### 1. Business Information (`/onboarding`)
- Business name, type, industry
- Subdomain selection
- Validated against existing tenants

### 2. Contact Details (`/onboarding/contact`)
- Full name, email, phone
- Job title
- Saves to tenant-service

### 3. Business Address (`/onboarding/address`)
- Country and state selection (from location-service)
- City, street address, postal code
- Timezone and currency auto-detected

### 4. Email Verification (`/onboarding/verify`)
- 6-digit OTP sent via Resend
- 10-minute expiry
- 3 attempts per code
- Resend functionality (max 5 codes/hour)
- Dev mock codes: 000000-999999 (for testing)

### 5. Success & Redirect (`/onboarding/success`)
- Shows completion message
- **Auto-redirects after 5 seconds** to ecommerce admin
- Redirects to: `${ECOMMERCE_ADMIN_URL}/onboarding/complete?sessionId={id}`
- User can skip countdown with "Go Now" button

## 🔌 What Happens Next (Ecommerce Admin)

After redirect, the ecommerce admin app:
1. Receives `sessionId` from URL params
2. Fetches onboarding data from tenant-service API
3. Creates user account in their database
4. Sets up authentication (JWT, OAuth, etc.)
5. Provisions tenant infrastructure
6. Redirects to admin dashboard

## 🔌 API Endpoints

### Frontend → Next.js API Routes (BFF Pattern)
```typescript
POST   /api/onboarding                          # Start onboarding session
GET    /api/onboarding/{sessionId}              # Get session data
POST   /api/onboarding/{sessionId}/business     # Save business info
POST   /api/onboarding/{sessionId}/contact      # Save contact info
POST   /api/onboarding/{sessionId}/address      # Save business address
POST   /api/onboarding/{sessionId}/verification/email   # Send OTP
POST   /api/onboarding/{sessionId}/verification/verify  # Verify OTP
POST   /api/onboarding/{sessionId}/verification/resend  # Resend OTP
GET    /api/locations/countries                 # Get countries list
GET    /api/locations/countries/{code}/states   # Get states by country
```

### Next.js API Routes → Backend Services
```typescript
// Tenant Service (http://localhost:8086)
POST   /api/v1/onboarding/sessions
POST   /api/v1/onboarding/sessions/:id/business-information
POST   /api/v1/onboarding/sessions/:id/contact-information
POST   /api/v1/onboarding/sessions/:id/business-addresses
POST   /api/v1/onboarding/sessions/:id/verification/email
POST   /api/v1/onboarding/sessions/:id/verification/verify

// Location Service (http://localhost:8087)
GET    /api/v1/countries
GET    /api/v1/countries/:code/states
GET    /api/v1/currencies
GET    /api/v1/timezones
```

## 🗄️ Database Schema

### PostgreSQL Tables
- `onboarding_sessions` - Main session data
- `business_information` - Company details
- `contact_information` - Contact details
- `business_addresses` - Physical addresses
- `verification_codes` - OTP codes (encrypted)
- `countries` - Pre-seeded country data
- `states` - Pre-seeded state/province data

## 🔒 Security Features

- **Input Validation**: Zod schemas on client and server
- **CSRF Protection**: Built-in Next.js protection
- **Rate Limiting**: 3 attempts/code, 5 codes/hour
- **API Key Auth**: Inter-service authentication
- **AES-256 Encryption**: OTP codes encrypted in database
- **BFF Pattern**: Backend URLs not exposed to client
- **No Authentication**: Public onboarding (by design)

## 🌍 Environment Variables

### Frontend (Next.js)
```env
# Server-side only (not exposed to browser)
TENANT_SERVICE_URL=http://localhost:8086
LOCATION_SERVICE_URL=http://localhost:8087

# Client-side (NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_ECOMMERCE_ADMIN_URL=http://localhost:3001
```

### Backend Services

**tenant-service**:
```env
PORT=8086
DB_HOST=localhost
DB_NAME=tesseract_hub
VERIFICATION_SERVICE_URL=http://localhost:8088
VERIFICATION_SERVICE_API_KEY=tesseract_verification_dev_key_2025
```

**verification-service**:
```env
PORT=8088
EMAIL_API_KEY=re_your_resend_api_key
EMAIL_FROM=onboarding@resend.dev
API_KEY=tesseract_verification_dev_key_2025
ENCRYPTION_KEY=your_32_character_key_here____
```

**location-service**:
```env
PORT=8087
DB_HOST=localhost
DB_NAME=tesseract_hub
```

See `.env.example` files in each service for full documentation.

## 📚 Documentation

- **Production Checklist**: `PRODUCTION_CHECKLIST.md`
- **API Contracts**: `@workspace/api-contracts` package
- **Architecture**: See "Architecture" section above

## 📄 License

This project is part of the Tesseract Hub e-commerce platform.

## 🆘 Support

For technical support or questions:
- Email: support@tesseract-hub.com
- Documentation: /docs
- Community: /community

---

Built with ❤️ for the Tesseract Hub ecosystem
