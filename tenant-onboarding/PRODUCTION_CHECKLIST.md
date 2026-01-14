# Tenant Onboarding - Production Readiness Checklist

## Overview
This document tracks the production readiness status of the tenant onboarding system, including the Next.js frontend, tenant-service, and verification-service.

**Last Updated**: November 1, 2025 (21:00 - Monitoring & Observability Phase 1 Complete)

---

## 🏗️ Architecture & Responsibilities

### Onboarding Service (This System)
**What it DOES:**
- ✅ Collect business information (business name, type, industry, etc.)
- ✅ Collect contact information (email, phone)
- ✅ Collect business address
- ✅ Email verification (OTP codes)
- ✅ Store all tenant data in database
- ✅ Redirect to admin apps with sessionId

**What it DOES NOT do:**
- ❌ User account creation
- ❌ Authentication (username/password, login, logout)
- ❌ User sessions or JWT tokens
- ❌ Payment processing
- ❌ Tenant provisioning (infrastructure setup)

### Admin Apps (Ecommerce Admin, SaaS Admin, etc.)
**Their Responsibilities:**
- ✅ Receive sessionId from onboarding redirect
- ✅ Fetch tenant data from tenant-service API
- ✅ Create user accounts in their own system
- ✅ Handle authentication (JWT, OAuth, sessions, etc.)
- ✅ User login/logout flows
- ✅ Payment processing for their specific app
- ✅ Tenant provisioning (databases, infrastructure, etc.)

**Data Flow:**
```
User → Onboarding (Public) → Stores Data → Redirects with sessionId
                                               ↓
Admin App receives sessionId → Fetches data → Creates user → Auth setup → Dashboard
```

---

## ✅ Completed Items

### Backend Services
- [x] **Verification Service** - Complete microservice with email OTP verification
  - [x] OTP generation (6-digit, cryptographically secure)
  - [x] AES-256-GCM encryption for code storage
  - [x] Email provider integration (Resend)
  - [x] Rate limiting (3 attempts per code, 5 codes/hour)
  - [x] API key authentication
  - [x] PostgreSQL database integration
  - [x] REST API endpoints (send, verify, resend, status)

- [x] **Tenant Service** - Core onboarding functionality
  - [x] Database models and migrations
  - [x] Business information collection
  - [x] Contact information collection
  - [x] Business address collection
  - [x] Integration with verification-service
  - [x] Template-based onboarding flows
  - [x] Task tracking system

- [x] **Location Service** - Countries and states data
  - [x] Pre-seeded database with countries/states
  - [x] API endpoints for location data

### Frontend
- [x] **Next.js Onboarding App** - Multi-step form
  - [x] Business information form
  - [x] Contact information form
  - [x] Business address form
  - [x] Location dropdowns (countries/states)
  - [x] Email verification UI (mock)
  - [x] Success page
  - [x] API routes as BFF (Backend for Frontend)
  - [x] Error handling and validation

### Data Persistence
- [x] PostgreSQL database running in Docker
- [x] All form data saves to database
- [x] Verification codes stored encrypted
- [x] Session management

---

## 🚧 Pending Items

### Critical Priority

#### 1. Email Verification - Frontend & Backend Integration
**Status**: ✅ Complete (Dev Environment) - ⚠️ Production Email Domain Required
**Estimated Effort**: 30 minutes to verify custom domain in Resend

**Completed Tasks**:
- [x] Update Next.js verification form to call real tenant-service endpoint
- [x] Replace mock verification with actual OTP input
- [x] Add error handling for verification failures
- [x] Add resend code functionality
- [x] Show expiry timer for verification codes
- [x] Handle rate limiting errors gracefully
- [x] Create missing Next.js API routes (email, verify, resend, status)
- [x] Fix backend VerifyCode handler to fetch email from session
- [x] Prevent duplicate email sends in React Strict Mode
- [x] Add automatic email sending on verification page load
- [x] Implement real-time countdown timer for code expiry
- [x] Test with dev mock codes (000000-999999) - working ✅

**Remaining for Production**:
- [ ] **Fix Resend email delivery** - Verify custom domain `tesseract-hub.com` in Resend dashboard
- [ ] Update EMAIL_FROM to use verified domain (e.g., `noreply@tesseract-hub.com`)
- [ ] Test end-to-end with real email delivery

**Current Workaround**:
- Dev mock codes (`000000` to `999999`) work for testing
- Backend properly validates codes and updates verification status
- Using `onboarding@resend.dev` (Resend test domain) - hit rate limits

**Implementation Details**:
- Frontend automatically sends verification email on page mount
- Backend fetches email from onboarding session ContactInformation
- Calls `VerifyCodeWithRecipient` with sessionID, email, code, and purpose
- Returns verified status with timestamp

**Files Created/Updated**:
- `/domains/ecommerce/apps/tenant-onboarding/app/onboarding/verify/page.tsx` ✅
- `/domains/ecommerce/apps/tenant-onboarding/lib/api/onboarding.ts` ✅
- `/domains/ecommerce/apps/tenant-onboarding/app/api/onboarding/[sessionId]/verification/email/route.ts` ✅ NEW
- `/domains/ecommerce/apps/tenant-onboarding/app/api/onboarding/[sessionId]/verification/verify/route.ts` ✅ NEW
- `/domains/ecommerce/apps/tenant-onboarding/app/api/onboarding/[sessionId]/verification/resend/route.ts` ✅ NEW
- `/domains/ecommerce/apps/tenant-onboarding/app/api/onboarding/[sessionId]/verification/status/route.ts` ✅ NEW
- `/domains/common/services/tenant-service/internal/handlers/verification_handler.go` ✅ FIXED
- `/domains/common/services/tenant-service/main.go` ✅ UPDATED

---

#### 2. Post-Onboarding Redirect & Multi-App Support
**Status**: ✅ Phase 1 Complete - ⚠️ Multi-App Support Pending
**Estimated Effort**: 2 weeks (future multi-app support)

**Architecture Clarification**:
- ✅ **Onboarding flow is PUBLIC** - No auth required for signup
- ❌ **DO NOT** add authentication to onboarding endpoints
- ✅ **Inter-service API keys** already implemented
- ✅ Database already supports `application_type` field

**Phase 1 - Simple Redirect (✅ Completed)**:
- [x] After onboarding completion, redirect to ecommerce admin portal
- [x] Pass session data via URL params (sessionId)
- [x] Add countdown timer (5 seconds with skip option)
- [x] Environment variable for admin URL (`NEXT_PUBLIC_ECOMMERCE_ADMIN_URL`)
- [x] Ecommerce admin will handle account creation and auth on their side

**Implementation Details**:
- Success page auto-redirects after 5 seconds
- Redirects to: `${ECOMMERCE_ADMIN_URL}/onboarding/complete?sessionId=${sessionId}`
- User can skip countdown with "Go Now" button
- Environment variable configurable per environment (dev/staging/prod)

**Files Updated**:
- `/domains/ecommerce/apps/tenant-onboarding/app/onboarding/success/page.tsx` ✅
- `/domains/ecommerce/apps/tenant-onboarding/.env.example` ✅
- `/domains/ecommerce/apps/tenant-onboarding/.env.local` ✅ (created)

**Phase 2 - Multi-App Support (Future)**:
- [ ] Support multiple application types (ecommerce, saas, marketplace, etc.)
- [ ] Redirect to different admin portals based on `application_type`
- [ ] Template-based customization per app type
- [ ] Different onboarding flows per application type

**Current Flow**:
```
1. User (no auth) → Public Onboarding App
2. Complete onboarding + email verification
3. Onboarding service stores tenant data in database
4. Redirect to Ecommerce Admin with sessionId
5. Ecommerce Admin:
   - Fetches tenant data from tenant-service using sessionId
   - Creates user account in THEIR system
   - Sets up THEIR authentication (username/password, OAuth, etc.)
   - Logs user in with THEIR auth system
6. User is now in ecommerce admin dashboard (authenticated)
```

**Future Multi-App Flow**:
```
1. User selects application type (ecommerce, saas, etc.)
2. Complete app-specific onboarding flow
3. Redirect to appropriate admin portal with sessionId:
   - Ecommerce → ecommerce-admin/onboarding/complete?sessionId=xxx
   - SaaS → saas-admin/onboarding/complete?sessionId=xxx
   - Marketplace → marketplace-admin/onboarding/complete?sessionId=xxx
4. Each admin portal:
   - Fetches session data from tenant-service
   - Creates user account in their own system
   - Handles their own authentication independently
```

**Database Support** (Already Exists):
- `onboarding_templates.application_type` ✅
- `onboarding_sessions.application_type` ✅
- Template-based task configuration ✅

**Requirements for Admin Apps**:
Each admin app must implement:
- [ ] `/onboarding/complete` endpoint to receive sessionId
- [ ] API call to tenant-service to fetch session data
- [ ] User account creation logic
- [ ] Their own authentication system (JWT, OAuth, sessions, etc.)
- [ ] Redirect to their admin dashboard after login

**API Available for Admin Apps**:
Ecommerce admin (and other admin apps) can use these tenant-service APIs:
```
GET /api/v1/onboarding/sessions/{sessionId}
Response: {
  "id": "uuid",
  "business_information": { business_name, business_type, etc. },
  "contact_information": { email, phone, etc. },
  "business_addresses": [{ street, city, country, etc. }],
  "verification_status": { email_verified: true, phone_verified: false }
}
```

**Example Implementation for Ecommerce Admin**:
```typescript
// /ecommerce-admin/app/onboarding/complete/page.tsx
const { sessionId } = searchParams;

// 1. Fetch onboarding data
const response = await fetch(`http://tenant-service:8086/api/v1/onboarding/sessions/${sessionId}`);
const onboardingData = await response.json();

// 2. Create user account in ecommerce admin database
const user = await createUser({
  email: onboardingData.contact_information.email,
  businessName: onboardingData.business_information.business_name,
  // ... other fields
});

// 3. Set up authentication (generate JWT, create session, etc.)
const authToken = generateJWT(user);
setCookie('auth_token', authToken);

// 4. Redirect to admin dashboard
redirect('/dashboard');
```

---

#### 3. Environment Configuration
**Status**: ✅ Development Complete - ⚠️ Production Pending
**Estimated Effort**: 1-2 days (production setup)

**Completed**:
- [x] Create `.env.example` files for all services
- [x] Document all required environment variables
- [x] Environment variable validation (verification-service)
- [x] Updated README with setup instructions

**Remaining for Production**:
- [ ] Create separate configs for staging/prod
- [ ] Move sensitive credentials to secret management (AWS Secrets Manager, Vault)
- [ ] Set up environment-specific feature flags
- [ ] Add CI/CD environment variable injection

**Services Configured**:
- ✅ verification-service - Full documentation with validation
- ✅ tenant-service - Complete `.env.example`
- ✅ location-service - Complete `.env.example`
- ✅ Next.js frontend - Already had `.env.example`

**Files Created**:
- `/domains/common/services/verification-service/.env.example` ✅
- `/domains/common/services/tenant-service/.env.example` ✅
- `/domains/common/services/location-service/.env.example` ✅
- Updated `/domains/ecommerce/apps/tenant-onboarding/README.md` ✅

---

#### 3. Add Comprehensive Error Handling
**Status**: ✅ Complete (Dev Environment) - ⚠️ Production Monitoring Pending
**Estimated Effort**: 1-2 days (production setup)

**Completed Tasks**:

**Backend (Go) - Error Handling & Structured Logging**:
- [x] Create shared `go-shared` package for reusable components
- [x] Implement structured logger with JSON/text format support
  - [x] Log levels (DEBUG, INFO, WARN, ERROR, FATAL)
  - [x] Structured fields support
  - [x] Request ID extraction and logging
  - [x] Timestamp with RFC3339 format
  - [x] Service name tagging
- [x] Add correlation ID middleware (X-Request-ID)
  - [x] Generate UUIDs for requests without IDs
  - [x] Propagate request IDs through entire request lifecycle
  - [x] Return request IDs in response headers
- [x] Add structured logging middleware
  - [x] Log every request with method, path, status, duration
  - [x] Automatic log level based on status code (500+, 400+, 2xx)
  - [x] Client IP and user agent tracking
- [x] Enhance error response utilities
  - [x] Standardized error responses with request_id and timestamp
  - [x] User-friendly error messages
  - [x] Internal error details only in debug mode
  - [x] Validation error responses with field-level errors
- [x] Apply middleware stack to tenant-service

**Frontend (React/Next.js) - Error Boundaries & Analytics**:
- [x] Create Error Boundary component
  - [x] Graceful error UI with reload/home buttons
  - [x] Error details shown only in development
  - [x] Component stack trace logging
- [x] Add toast notifications (Sonner library)
  - [x] User-friendly error/success messages
  - [x] Auto-dismiss functionality
  - [x] Rich colors and icons
- [x] Install and configure PostHog analytics
  - [x] PostHog provider with automatic page view tracking
  - [x] Privacy-first, self-hostable analytics
  - [x] Client-side event tracking
- [x] Implement onboarding funnel tracking
  - [x] `onboarding_started` - Track when user begins onboarding
  - [x] `business_info_completed` - Business form submission
  - [x] `contact_info_completed` - Contact form submission
  - [x] `address_completed` - Address form submission
  - [x] `verification_code_sent` - Email verification sent (initial + resend)
  - [x] `verification_succeeded` - Successful email verification
  - [x] `verification_failed` - Failed verification attempts
  - [x] `verification_code_expired` - Code expiry tracking
  - [x] `verification_rate_limit_hit` - Rate limit detection
  - [x] `onboarding_completed` - Successful onboarding completion
  - [x] `redirected_to_admin` - Admin redirect tracking
- [x] Add error tracking utilities
  - [x] `error_caught` - Error boundary catches
  - [x] `api_error` - API error tracking with endpoint, status, message
- [x] Update environment configuration
  - [x] Add PostHog configuration to .env.example
  - [x] Documentation for self-hosted PostHog setup

**Files Created/Updated**:
- `/go-shared/logger/logger.go` ✅ NEW - Structured logger
- `/go-shared/middleware/middleware.go` ✅ NEW - RequestID and StructuredLogger middleware
- `/domains/common/services/tenant-service/internal/handlers/response.go` ✅ UPDATED - Enhanced error responses
- `/domains/common/services/tenant-service/internal/middleware/middleware.go` ✅ UPDATED - Added new middleware
- `/domains/common/services/tenant-service/main.go` ✅ UPDATED - Applied middleware stack
- `/domains/ecommerce/apps/tenant-onboarding/components/errors/ErrorBoundary.tsx` ✅ NEW
- `/domains/ecommerce/apps/tenant-onboarding/lib/analytics/posthog.tsx` ✅ NEW
- `/domains/ecommerce/apps/tenant-onboarding/app/layout.tsx` ✅ UPDATED - Added ErrorBoundary, Toaster, PostHogProvider
- `/domains/ecommerce/apps/tenant-onboarding/app/onboarding/page.tsx` ✅ UPDATED - Added analytics tracking
- `/domains/ecommerce/apps/tenant-onboarding/app/onboarding/verify/page.tsx` ✅ UPDATED - Added analytics tracking
- `/domains/ecommerce/apps/tenant-onboarding/app/onboarding/success/page.tsx` ✅ UPDATED - Added analytics tracking
- `/domains/ecommerce/apps/tenant-onboarding/.env.example` ✅ UPDATED - Added PostHog configuration

**Remaining for Production**:
- [ ] Set up log aggregation (e.g., Logstash, Loki, CloudWatch)
- [ ] Configure PostHog (cloud or self-hosted instance)
- [ ] Add production error monitoring/alerting
- [ ] Set up production analytics dashboards
- [ ] Create error response standards documentation

---

### Important Priority

#### 5. API Security
**Status**: Basic API key auth only
**Estimated Effort**: 1 week

**Tasks**:
- [ ] Add rate limiting per tenant/user
- [ ] Implement request throttling
- [ ] Add CORS configuration
- [ ] Enable HTTPS/TLS
- [ ] Add API versioning strategy
- [ ] Implement request signing
- [ ] Add DDoS protection (e.g., Cloudflare)
- [ ] API documentation with OpenAPI/Swagger

---

#### 6. Database Strategy
**Status**: Single database, no backup
**Estimated Effort**: 1 week

**Tasks**:
- [ ] Set up automated backups
- [ ] Implement database replication
- [ ] Add connection pooling (PgBouncer)
- [ ] Set up monitoring (slow queries, connections)
- [ ] Create database migration strategy
- [ ] Add database indexing optimization
- [ ] Plan for database sharding (future)

---

#### 7. Monitoring & Observability
**Status**: ✅ Phase 1 Complete (Dev Environment) - ⚠️ Production Setup Pending
**Estimated Effort**: 2-3 days (production setup)

**Completed Tasks**:

**Infrastructure**:
- [x] Created shared `go-shared/metrics` package for Prometheus integration
- [x] Set up Prometheus + Grafana stack with docker-compose
- [x] Configured Prometheus to scrape all microservices
- [x] Created auto-provisioned Grafana dashboards
- [x] Added comprehensive monitoring documentation

**Metrics Implementation (Tenant Service)**:
- [x] HTTP request metrics (total, duration, in-flight)
  - [x] Request counters by method, endpoint, status
  - [x] Request duration histograms with quantiles
  - [x] In-flight requests gauge
- [x] Business metrics
  - [x] Onboarding sessions created counter
  - [x] Verification attempts counter (by type and status)
  - [x] Active sessions gauge
  - [x] Verification codes generated counter
- [x] Database metrics
  - [x] Connection pool stats (open, in-use, idle)
  - [x] Auto-updating every 10 seconds
- [x] Enhanced health check endpoints
  - [x] `/health` - Basic + detailed system info
  - [x] `/ready` - Readiness with dependency checks
  - [x] Database connectivity checks
  - [x] Connection pool statistics
  - [x] Runtime metrics (goroutines, memory, CPU)

**Files Created**:
- `/go-shared/metrics/metrics.go` ✅ - Reusable Prometheus metrics package
- `/monitoring/docker-compose.yml` ✅ - Prometheus + Grafana stack
- `/monitoring/prometheus/prometheus.yml` ✅ - Prometheus configuration
- `/monitoring/grafana/dashboards/tenant-service.json` ✅ - Pre-built dashboard
- `/monitoring/grafana/provisioning/datasources/prometheus.yml` ✅ - Datasource config
- `/monitoring/README.md` ✅ - Complete monitoring documentation

**Services Status**:
- ✅ **Prometheus** - Running on http://localhost:9090
- ✅ **Grafana** - Running on http://localhost:3000 (admin/admin)
- ✅ **Node Exporter** - System metrics on port 9100
- ✅ **Tenant Service** - Metrics endpoint `/metrics` active
- ⚠️ **Verification Service** - Metrics pending
- ⚠️ **Location Service** - Metrics pending

**Key Metrics Tracked**:
- ✅ API response times (histogram with quantiles)
- ✅ Error rates (by status code)
- ✅ Database connection pool usage
- ✅ Active sessions count
- ⚠️ Verification success rates (pending service integration)
- ⚠️ Email delivery rates (pending)
- ⚠️ Signup funnel drop-off (frontend analytics in place)

**Remaining for Production**:
- [ ] Add metrics to verification-service
- [ ] Add metrics to location-service
- [ ] Set up alerting rules (Alertmanager)
- [ ] Implement distributed tracing (Jaeger/Zipkin)
- [ ] Configure production Prometheus (remote storage, federation)
- [ ] Set up production Grafana (HA mode, SSO)
- [ ] Create alerting channels (Slack, PagerDuty, email)
- [ ] Add PostgreSQL exporter for database metrics
- [ ] Document runbooks for common alerts

---

#### 8. Deployment & Infrastructure
**Status**: Local development only
**Estimated Effort**: 2 weeks

**Tasks**:
- [ ] Containerize all services (Dockerfile for each)
- [ ] Create docker-compose for local dev
- [ ] Set up Kubernetes manifests (or alternative)
- [ ] Configure CI/CD pipeline (GitHub Actions)
- [ ] Set up staging environment
- [ ] Configure production environment
- [ ] Implement blue-green deployment
- [ ] Add rollback strategy
- [ ] Set up CDN for static assets
- [ ] Configure load balancers

**Infrastructure Choices**:
- AWS, GCP, Azure, or DigitalOcean?
- Kubernetes vs. Serverless?
- Database hosting (managed vs. self-hosted)?

---

### Nice to Have

#### 9. Testing
**Status**: ✅ Initial Tests Complete - 🚧 Advanced Testing Pending
**Estimated Effort**: 1 week (for remaining tasks)

**Completed Tasks**:
- [x] Write unit tests for tenant-service validation logic
- [x] Add integration tests for onboarding API endpoints
- [x] Create test documentation and README
- [x] Set up test database configuration
- [x] Create Makefile for easy test execution
- [x] Implement mock repositories for unit testing
- [x] Add test cleanup utilities

**Remaining Tasks**:
- [ ] Expand unit test coverage to 80%+
- [ ] Add tests for verification-service and location-service
- [ ] Implement end-to-end tests (Playwright/Cypress)
- [ ] Add load testing (k6/Artillery)
- [ ] Set up CI test automation (GitHub Actions)
- [ ] Add mutation testing

**Test Files Created**:
- `/domains/common/services/tenant-service/tests/integration/onboarding_test.go` ✅
  - Complete onboarding flow test
  - Validation error tests
  - Subdomain validation tests
- `/domains/common/services/tenant-service/tests/unit/validation_test.go` ✅
  - Subdomain validation unit tests
  - Business name validation tests
  - Progress calculation tests
- `/domains/common/services/tenant-service/tests/README.md` ✅
- `/domains/common/services/tenant-service/Makefile` ✅

**Test Coverage Status**:
- Backend integration tests: ✅ Core flows covered
- Backend unit tests: ✅ Validation logic covered
- API handlers: 🚧 Partial coverage
- Frontend components: ⚠️ Not yet implemented

**How to Run Tests**:
```bash
cd domains/common/services/tenant-service
make test                  # Run all tests
make test-integration      # Integration tests only
make test-coverage         # Generate coverage report
```

---

#### 10. Documentation
**Status**: Minimal
**Estimated Effort**: 1 week

**Tasks**:
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Architecture diagrams
- [ ] Database schema documentation
- [ ] Deployment runbooks
- [ ] Troubleshooting guides
- [ ] Developer onboarding guide
- [ ] User guide for onboarding flow

---

#### 11. Frontend Enhancements
**Status**: Analytics Complete - Other Enhancements Pending
**Estimated Effort**: 1-2 weeks

**Completed**:
- [x] Implement analytics tracking (PostHog)
- [x] Create onboarding progress indicator

**Remaining Tasks**:
- [ ] Add form auto-save (draft mode)
- [ ] Implement form field validation feedback
- [ ] Add loading states and skeletons
- [ ] Improve mobile responsiveness
- [ ] Add accessibility (WCAG 2.1 AA)
- [ ] Add A/B testing framework (can use PostHog feature flags)

---

#### 12. Email Service Enhancements
**Status**: Basic Resend integration
**Estimated Effort**: 3-5 days

**Tasks**:
- [ ] Add email templates with branding
- [ ] Implement email preview functionality
- [ ] Add multi-language support
- [ ] Set up custom domain for emails
- [ ] Add email analytics (open rates, clicks)
- [ ] Implement email queue with retry logic
- [ ] Add SMS verification (Twilio integration)

**Current Email Domain**:
- Using `onboarding@resend.dev` (test domain)
- Need to verify `tesseract-hub.com` for production

---

#### 13. Advanced Features (Optional)
**Status**: Not started
**Estimated Effort**: Ongoing

**Onboarding Service Enhancements**:
- [ ] Business document upload (tax documents, licenses)
- [ ] KYC/AML verification integration (optional verification step)
- [ ] Automated business verification via third-party APIs
- [ ] Admin dashboard for viewing/managing onboarding sessions
- [ ] Webhook system to notify admin apps when onboarding completes
- [ ] GraphQL API (in addition to REST)
- [ ] Phone verification (SMS via Twilio)

**Note**: The following are NOT onboarding service responsibilities:
- ❌ Tenant provisioning (infrastructure, databases) → Admin app responsibility
- ❌ User account creation → Admin app responsibility
- ❌ Payment processing → Admin app responsibility
- ❌ Multi-step approval workflow → Admin app responsibility

---

## Service URLs

### Development
- **Frontend (Onboarding)**: http://localhost:3002
- **Tenant Service**: http://localhost:8086
- **Verification Service**: http://localhost:8088
- **Location Service**: http://localhost:8084
- **Ecommerce Admin** (redirect target): http://localhost:3001
- **PostgreSQL**: localhost:5432

### Staging
- [ ] Not configured

### Production
- [ ] Not configured

---

## Database Credentials

### Development
- **Host**: localhost
- **Port**: 5432
- **User**: dev
- **Password**: devpass
- **Database**: tesseract_hub

### Production
- [ ] Not configured (use managed database with secrets management)

---

## API Keys & Secrets

### Resend Email
- **Current**: Using test API key
- **Production**: [ ] Need production API key
- **Domain**: Currently `onboarding@resend.dev` → Need to verify `tesseract-hub.com`

### Inter-Service Authentication
- **Current**: `tesseract_verification_dev_key_2025`
- **Production**: [ ] Generate secure API keys with rotation

---

## Security Checklist

- [ ] Enable HTTPS everywhere
- [ ] Implement rate limiting
- [ ] Add request validation and sanitization
- [ ] Enable SQL injection protection (using ORM)
- [ ] Add XSS protection
- [ ] Implement CSRF tokens
- [ ] Configure security headers
- [ ] Set up WAF (Web Application Firewall)
- [ ] Implement secrets rotation
- [ ] Add audit logging
- [ ] Conduct security audit/pen test

---

## Performance Optimization

- [ ] Add database query optimization
- [ ] Implement caching (Redis)
- [ ] Add CDN for static assets
- [ ] Optimize frontend bundle size
- [ ] Add lazy loading for components
- [ ] Implement image optimization
- [ ] Add service worker for offline support
- [ ] Database connection pooling

---

## Compliance & Legal

- [ ] GDPR compliance
- [ ] Data retention policies
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Cookie consent
- [ ] Data export functionality
- [ ] Right to deletion (RTBF)

---

## Next Steps (Recommended Priority)

### Phase 1 - Production Readiness (Onboarding Service)
**Estimated: 2-3 weeks**

1. **Week 1 - Email & Environment**
   - ✅ ~~Update frontend to use real verification API~~ (DONE)
   - ✅ ~~Implement post-onboarding redirect~~ (DONE)
   - ✅ ~~Create .env.example files for all services~~ (DONE)
   - ✅ ~~Update README with microservices info~~ (DONE)
   - ✅ ~~Add comprehensive error handling~~ (DONE)
   - ✅ ~~Add analytics tracking (PostHog)~~ (DONE)
   - [ ] Fix Resend email delivery (verify custom domain)

2. **Week 2 - Quality & Monitoring**
   - ✅ ~~Set up basic monitoring (health checks, metrics)~~ (DONE)
   - ✅ ~~Add structured logging with correlation IDs~~ (DONE)
   - ✅ ~~Enhanced health check endpoints~~ (DONE)
   - [ ] Write integration tests for onboarding flow
   - [ ] API documentation (OpenAPI/Swagger)

3. **Week 3 - Deployment**
   - [ ] Create Dockerfiles for all services
   - [ ] Set up CI/CD pipeline
   - [ ] Deploy to staging environment
   - [ ] Security hardening (rate limiting, HTTPS)

### Phase 2 - Admin App Integration
**Estimated: 1-2 weeks (Ecommerce Admin team)**

The ecommerce admin team needs to implement:
1. `/onboarding/complete` endpoint to receive sessionId
2. Fetch onboarding data from tenant-service API
3. Create user accounts in their system
4. Set up authentication (JWT, OAuth, etc.)
5. Redirect to admin dashboard

### Phase 3 - Enhancements (Optional)
**Ongoing**

- Multi-app support (saas-admin, marketplace-admin, etc.)
- Document upload functionality
- KYC/AML verification
- Webhook notifications
- Admin dashboard for managing sessions

---

## Notes

### ✅ Completed & Working
- **Email Verification**: Fully functional with OTP codes (dev mock codes work)
- **Post-Onboarding Redirect**: Auto-redirects to ecommerce admin with sessionId
- **Database**: All migrations working, data persisting correctly
- **Verification Service**: Real email sending via Resend (test domain)
- **Architecture**: Microservices with clear separation of concerns
- **Code Quality**: Well-structured, following Go best practices

### ⚠️ Known Issues
- **Email Delivery**: Using Resend test domain (`onboarding@resend.dev`) - hit rate limits
- **Production Email**: Need to verify custom domain in Resend dashboard

### 🏗️ Architecture Design
- **Onboarding Service**: Collects data, verifies email, redirects with sessionId
- **Admin Apps**: Handle user accounts, authentication, payment, provisioning
- **Clean Separation**: Each service has clear, focused responsibilities

---

## Contact & Support

**Questions or Issues?**
- Create an issue in the GitHub repository
- Review the architecture documentation
- Check the API documentation

**Last Reviewed**: November 1, 2025
**Next Review Date**: TBD (after deployment to staging)
