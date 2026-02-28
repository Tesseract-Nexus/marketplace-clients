# Tenant Onboarding App - Comprehensive Review

**Date:** 2026-02-28
**App:** `marketplace-clients/tenant-onboarding`
**Reviewer:** Claude Code

---

## Table of Contents

1. [Critical Issues](#1-critical-issues)
2. [Hardcoded Currency Issues](#2-hardcoded-currency-issues)
3. [UX & Flow Issues](#3-ux--flow-issues)
4. [Code Quality Issues](#4-code-quality-issues)
5. [Current Step Architecture](#5-current-step-architecture)
6. [Proposed Step Rewrite](#6-proposed-step-rewrite)
7. [Post-Submission Flow](#7-post-submission-flow)
8. [Production Readiness](#8-production-readiness)
9. [Recommendations Priority](#9-recommendations-priority)

---

## 1. Critical Issues

### 1.1 `completedSteps` is NEVER populated — step restoration broken

**Severity:** CRITICAL
**Files:** `app/onboarding/page.tsx`, `lib/store/onboarding-store.ts:382-385`

The `markStepCompleted()` function exists in the store but is **never called** from the page component. All step handlers (`handleBusinessSubmit`, `handleContactSubmit`, `handleAddressSubmit`, `handleStoreSetupContinue`, etc.) use `setCurrentSection()` to navigate forward but never mark the step as completed.

**Impact:**
- `completedSteps` is always `[]` in localStorage
- Step-restore logic on page reload (`page.tsx:520-533`) checks `completedSteps` to determine where to resume — always resets to step 0
- `canProceedToStep()` always returns `false` for step > 0
- `getProgress()` always returns `0%`
- Users who refresh the page mid-onboarding **lose their position entirely**

**Fix:** Call `markStepCompleted(n)` at the end of each successful step handler before navigating to the next step.

---

### 1.2 `totalSteps: 4` is wrong — should be `6`

**Severity:** HIGH
**File:** `lib/store/onboarding-store.ts:226`

```typescript
totalSteps: 4, // Business Info, Contact Details, Address, Store Setup
```

The UI defines **6 steps** in the `steps` array (`page.tsx:81-88`), but the store hardcodes `totalSteps: 4`. This is a leftover from before Documents and Legal steps were added.

**Impact:**
- `getProgress()` calculates percentage against 4 instead of 6
- `nextStep()` maxes out at step 3 instead of step 5
- Progress tracking is inaccurate

**Fix:** Change `totalSteps: 4` to `totalSteps: 6`, or derive it from the steps array length.

---

### 1.3 Steps 2–5 share one `<form>` — accidental form submission

**Severity:** CRITICAL
**File:** `app/onboarding/page.tsx:2401-2402`

```tsx
{(currentSection === 2 || currentSection === 3 || currentSection === 4 || currentSection === 5) && (
  <form onSubmit={storeSetupForm.handleSubmit(handleStoreSetupSubmit, ...)} ...>
```

Steps 2 (Store Setup), 3 (Documents), 4 (Legal), and 5 (Launch) are all wrapped in the **same `<form>` element** with `onSubmit` bound to `handleStoreSetupSubmit`.

**Impact:**
- Pressing **Enter** on any `<input>` field in steps 2, 3, or 4 triggers `handleStoreSetupSubmit`
- This saves store setup, validates everything, and **navigates directly to `/onboarding/verify`** — completely skipping Documents, Legal, and the Launch review
- The Documents "Continue" and Legal "Continue" buttons are `type="button"` (correct), but Enter key on any input bypasses them

**Fix:** Either:
- Split into separate `<form>` elements per step, or
- Add `onKeyDown` handler to prevent Enter submission on steps 2-4, or
- Wrap step-specific content in `<div>` with its own form only for the Launch step

---

### 1.4 Legal acceptance state is not persisted

**Severity:** HIGH
**File:** `app/onboarding/page.tsx:236-237`

```typescript
const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
const [legalAccepted, setLegalAccepted] = useState(false);
```

These are local `useState` values — not persisted to the Zustand store or localStorage.

**Impact:**
- If a user scrolls through Legal, accepts, goes to Launch (step 5), then clicks "Edit" on any section and comes back to Legal — they must scroll and accept again
- On page refresh, legal acceptance is lost even though all other form data is restored
- Poor UX especially on mobile where scrolling through the entire legal doc is tedious

**Fix:** Add `legalAccepted` to the Zustand store and persist it.

---

### 1.5 Persisted rehydration uses mismatched field names (data loss on refresh)

**Severity:** HIGH
**File:** `app/onboarding/page.tsx:398-440, 1361-1362, 1436, 1632-1634`

The page saves onboarding data to the store using one set of keys, then restores forms using different keys:

- Contact save uses `phone` + `phone_country_code`, but restore reads `phone_number`
- Address save uses `state_province`, but restore reads `state`
- Store setup save uses snake_case (`business_model`, `storefront_slug`), but restore applies values to camelCase form fields (`businessModel`, `storefrontSlug`) via direct key passthrough

**Impact:**
- Phone number may not repopulate after refresh
- State/province may not repopulate after refresh
- Store setup fields (business model/storefront slug) may not repopulate reliably
- Users can see partially empty forms despite persisted session data

**Fix:** Normalize field mapping in one direction (recommended: explicit mapper functions `api -> form` and `form -> api`) and avoid direct `Object.entries(...).setValue(...)` across mixed naming conventions.

---

## 2. Hardcoded Currency Issues

### 2.1 Payment plans DB schema defaults to INR

**Severity:** HIGH
**File:** `db/schema/payment-plans.ts:9`

```typescript
currency: varchar('currency', { length: 3 }).default('INR').notNull(),
```

The `payment_plans` table has a hard-coded default of `'INR'` for the currency column. Any plan inserted without an explicit currency will silently default to INR.

---

### 2.2 Seed data is INR-only

**Severity:** HIGH
**File:** `db/seed/payment-plans.ts:9,34`

```typescript
{ name: 'Free Trial', slug: 'free-trial', price: '0', currency: 'INR', ... },
{ name: 'Pro', slug: 'pro', price: '299', currency: 'INR', ... },
```

Both seed plans are hardcoded to INR with INR-specific pricing (₹299/mo). No regional pricing seeds exist.

**Impact:** Non-Indian users see pricing in INR by default with no conversion.

---

### 2.3 API fallback hardcodes INR

**Severity:** HIGH
**File:** `app/api/content/payment-plans/route.ts:40`

```typescript
// Fallback data
const fallbackPlans = [{ ..., currency: 'INR', ... }];
```

When the database is unreachable, the fallback plan data is hardcoded to INR.

---

### 2.4 Landing page pricing defaults to INR

**Severity:** MEDIUM
**File:** `app/page.tsx:84,101,179,213,331,350`

```typescript
currency: 'INR',                    // line 84, 101
{ currency: 'INR', value: 103750 }, // line 179
INR: '₹',                           // line 213
const currency = plan.currency || 'INR'; // line 331
const detectedCurrency = userCurrency || 'USD'; // line 350
```

The landing page metrics (revenue, orders) default to INR. The pricing page has INR as the primary display currency. Only a small `currencySymbols` map covers INR/USD/GBP/EUR.

**Inconsistency:** Line 350 falls back to `'USD'` while line 331 falls back to `'INR'` — mixed defaults on the same page.

---

### 2.5 Pricing page defaults to INR

**Severity:** MEDIUM
**File:** `app/pricing/page.tsx:53,70,95,136,245`

```typescript
currency: 'INR',                           // hardcoded plan fallback
if (currency === 'INR') return amount.toLocaleString('en-IN'); // special INR formatting
const currency = plan.currency || 'INR';   // fallback
```

The pricing page treats INR as the default currency with special formatting logic.

---

### 2.6 Layout JSON-LD schema hardcodes INR

**Severity:** LOW
**File:** `app/layout.tsx:179`

```typescript
priceCurrency: 'INR',
```

The structured data (JSON-LD) for search engines hardcodes the price currency as INR.

---

### 2.7 Presentation page defaults to INR

**Severity:** LOW
**File:** `app/presentation/page.tsx:263`

```typescript
const proCurrency = (proPlan as { currency?: string } | undefined)?.currency || 'INR';
```

---

### 2.8 OAuth callback defaults to USD

**Severity:** MEDIUM
**File:** `app/onboarding/setup-password/callback/page.tsx:56`

```typescript
currency: resolvedCurrency || 'USD',
```

When a Google OAuth user completes onboarding and localStorage is missing, the currency falls back to `'USD'` — inconsistent with the INR defaults elsewhere.

---

### 2.9 Account setup API defaults to USD

**Severity:** MEDIUM
**File:** `lib/api/onboarding.ts:424`

```typescript
currency: storeSetup?.currency || 'USD',
```

The `completeAccountSetup()` API call falls back to `'USD'` if store setup currency is missing. This conflicts with the INR defaults in pricing/plans.

---

### 2.10 Country-currency fallback map defaults to USD

**Severity:** LOW
**File:** `lib/config/settings.ts:514`, `lib/utils/country-defaults.ts:99`

```typescript
currency: COUNTRY_CURRENCY_MAP[countryCode] || 'USD', // settings.ts
return countryDefaults[code] || { currency: 'USD', timezone: 'UTC' }; // country-defaults.ts
```

Several countries (Russia, Ukraine, Turkey, Argentina, Panama, Costa Rica, Jamaica) are mapped to `'USD'` instead of their local currencies.

---

### 2.11 E2E tests hardcode INR

**Severity:** LOW
**Files:** `tests/onboarding.spec.ts:56`, `tests/full-onboarding-with-staff.spec.ts:61`, `tests/australia-store.spec.ts:70`

All E2E test fixtures use `currency: 'INR'` — even the Australia store test (`australia-store.spec.ts:70`) which should use AUD.

---

### Summary: Currency Default Inconsistency

| Location | Default | Should Be |
|---|---|---|
| `payment-plans` DB schema | INR | Derived from tenant's country |
| Seed data | INR | Multi-currency seeds |
| API fallback plans | INR | Detect from user's location |
| Landing page metrics | INR | Detect from user's location |
| Pricing page | INR | Detect from user's location |
| Layout JSON-LD | INR | Dynamic or USD (international) |
| OAuth callback | USD | From store setup (persisted) |
| Account setup API | USD | From store setup (required field) |
| Country fallback | USD | Per-country map |
| E2E tests | INR | Per-test locale |

**Core problem:** There is no single source of truth for the default currency. The app mixes INR (India-first pricing) and USD (international fallback) across different layers.

---

## 3. UX & Flow Issues

### 3.1 Missing "Personal/Contact" step visibility in stepper

**File:** `app/onboarding/page.tsx:81-88, 121-122`

The stepper shows 6 nodes: `Business & Contact > Location > Store Setup > Documents > Legal > Launch`. But "Business & Contact" hides **two distinct sub-steps** (business info + contact/personal details) under a single stepper icon.

When the user is on the Contact sub-step:
- The stepper still shows "Business & Contact" as active (step 0)
- The progress bar hasn't moved at all
- No visual indicator that the business sub-step is completed
- Feels like you're stuck on the same step

**Fix:** Either split into 2 stepper nodes or add a sub-step indicator (e.g., "Step 1 of 2" inside the form card).

---

### 3.2 Stepper icons are not clickable

**File:** `app/onboarding/page.tsx:1888-1926`

The stepper icons are purely visual `<div>` elements. Users cannot click on a completed step to navigate back — they must click "Back" repeatedly through each step.

Standard wizard UX allows clicking any completed step to jump back to it.

---

### 3.3 Business type shows raw enum in Launch review

**File:** `app/onboarding/page.tsx:3669-3673`

```tsx
<span>{businessForm.watch('businessType')}</span>
```

Displays `sole_proprietorship` instead of "Sole Proprietorship". Same issue with:
- Country: shows `US` instead of "United States"
- State: shows `US-CA` instead of "California"
- Phone: shows `US 5551234567` instead of `+1 (555) 123-4567`

---

### 3.4 Validation functions are mocked

**File:** `lib/api/onboarding.ts:432-459`

```typescript
async validateBusinessName(businessName: string): Promise<ValidationResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ available: true, message: undefined });
    }, 300);
  });
}
```

Both `validateBusinessName()` and `validateEmail()` always return `available: true` with a fake 300ms delay. Duplicate businesses and emails pass client validation and only fail later at the backend.

---

### 3.5 `formDataForDraft` useMemo is ineffective

**File:** `app/onboarding/page.tsx:582-588`

```typescript
const formDataForDraft = useMemo(() => ({...}), [
  currentSection, businessForm.watch(), contactForm.watch(), ...
]);
```

`form.watch()` returns a new object reference on every render, causing this `useMemo` to recompute every render — defeating its purpose entirely.

---

## 4. Code Quality Issues

### 4.1 Monolithic page component (~3900 lines)

The entire onboarding wizard lives in a single `page.tsx` file with ~3900 lines. This includes:
- All 6 step form UIs
- All form handlers
- All validation logic
- All state management
- Slug/domain validation UI with DNS tables
- Draft recovery banners
- Session management

This makes the code very difficult to maintain, test, or modify.

### 4.2 Excessive state variables

The component has 30+ `useState` calls, many of which could be grouped into reducers or moved to the Zustand store. Notable examples:
- `slugValidation` state object (4 fields)
- `storefrontValidation` state object (4 fields)
- `customDomainValidation` state object (12 fields)
- `domainVerification` state object (6 fields)

### 4.3 Duplicated reset logic

`handleStartFresh()` and `handleSessionNotFound()` contain nearly identical code (reset forms, clear localStorage, reset UI state). This should be extracted into a shared function.

---

## 5. Current Step Architecture

### Current Steps Array
```typescript
const steps = [
  { id: 0, label: 'Business & Contact', icon: Building2 },     // Sub-steps: business, contact
  { id: 1, label: 'Location', icon: MapPin },                   // Address form
  { id: 2, label: 'Store Setup', icon: Store },                 // URLs, currency, timezone
  { id: 3, label: 'Documents', icon: FileText, optional: true },// Document uploads
  { id: 4, label: 'Legal', icon: Scale },                       // Scroll + accept
  { id: 5, label: 'Launch', icon: Rocket },                     // Review + submit
];
```

### Current Navigation
```
Step 0 (Business) → Step 0 (Contact) → Step 1 (Location)
→ Step 2 (Store Setup) → Step 3 (Documents) → Step 4 (Legal)
→ Step 5 (Launch) → /onboarding/verify → /onboarding/setup-password → /onboarding/success
```

### Problems with Current Architecture

| Problem | Impact |
|---|---|
| Business & Contact are merged in one step | User can't see progress after completing business info |
| Steps 2-5 share one `<form>` | Enter key on any input triggers final submission |
| `completedSteps` never populated | Step restoration on refresh is broken |
| `totalSteps: 4` doesn't match 6 steps | Progress calculation is wrong |
| Legal state is local-only | Lost on navigation or refresh |
| Rehydration key mismatch (`phone` vs `phone_number`, `state_province` vs `state`) | Persisted fields disappear after refresh |
| No clickable stepper | Can't jump to completed steps |

---

## 6. Proposed Step Rewrite

### Option A: 7 Visible Steps (Recommended)

Split Business & Contact into separate stepper nodes for clear progress indication:

```typescript
const steps = [
  { id: 0, label: 'Business',  icon: Building2 },
  { id: 1, label: 'Personal',  icon: User },       // <-- Now visible
  { id: 2, label: 'Location',  icon: MapPin },
  { id: 3, label: 'Store',     icon: Store },
  { id: 4, label: 'Documents', icon: FileText, optional: true },
  { id: 5, label: 'Legal',     icon: Scale },
  { id: 6, label: 'Launch',    icon: Rocket },
];
```

**Benefits:**
- Each step has its own stepper node — clear progress
- No hidden sub-steps
- `currentSection` maps 1:1 to stepper position
- `businessContactSubStep` state variable is eliminated

**Changes needed:**
- Remove `businessContactSubStep` state
- Each step gets its own `<form>` element
- Update all `setCurrentSection()` calls to new indices
- Update `totalSteps` to 7
- Call `markStepCompleted()` in every handler

### Option B: Keep 6 Steps with Sub-step Indicator

Keep merged "Business & Contact" but add visual indicator:

```
Business & Contact (1 of 2) → Business & Contact (2 of 2) → Location → ...
```

Show a mini progress bar or "Step 1 of 2" text inside the form card.

**Benefits:** Fewer stepper nodes (cleaner for mobile)
**Drawback:** Still has hidden sub-step complexity

### Recommended Architecture Changes

Regardless of option chosen:

1. **One `<form>` per step** — prevents accidental submission
2. **Extract step components** — each step becomes its own component file:
   ```
   components/steps/BusinessStep.tsx
   components/steps/PersonalStep.tsx
   components/steps/LocationStep.tsx
   components/steps/StoreSetupStep.tsx
   components/steps/DocumentsStep.tsx
   components/steps/LegalStep.tsx
   components/steps/LaunchStep.tsx
   ```
3. **Call `markStepCompleted()`** at the end of each successful handler
4. **Make stepper clickable** for completed steps
5. **Persist legal acceptance** in the store
6. **Derive `totalSteps`** from the steps array instead of hardcoding

---

## 7. Post-Submission Flow

### What happens when the user clicks "Launch Store" on Step 5

```
[Launch Button Click]
       │
       ▼
handleStoreSetupSubmit()
  ├── Validate subdomain/storefront slug availability
  ├── POST /api/onboarding/{sessionId}/store-setup
  ├── Verify contact info exists in backend (backfill if missing)
  └── Navigate to /onboarding/verify?session={id}&email={email}
       │
       ▼
[Email Verification Page]
  ├── Auto-sends verification email (link-based)
  ├── SSE listener for real-time verification
  ├── Fallback polling every 3 seconds
  └── On verified → navigate to /onboarding/setup-password
       │
       ▼
[Password Setup Page]
  ├── Set password (10+ chars, upper, lower, number, special)
  │   OR Google OAuth (redirect flow)
  └── POST /api/onboarding/{sessionId}/account-setup
       │
       ▼
[Backend: CompleteAccountSetup()] ← CRITICAL PATH
  ├── 1.  Validate session has all required data
  ├── 2.  Generate unique tenant slug
  ├── 3.  CREATE tenant record (status: "creating")
  ├── 4.  CREATE Keycloak Organization (customer realm)
  ├── 5.  Register Keycloak redirect URIs
  ├── 6.  CREATE Keycloak user + set password + assign "store_owner" role
  ├── 7.  CREATE/link user record in DB
  ├── 8.  CREATE owner membership (user → tenant)
  ├── 9.  Bootstrap owner RBAC via staff-service (3 retries)
  ├── 10. Update Keycloak user attributes (staff_id, tenant_id, tenant_slug)
  ├── 11. Create tenant credentials + auth policy
  └── 12. Publish NATS "session.completed" event
       │
       ▼
[Infrastructure Provisioning] (Async via NATS)
  ├── tenant-router-service creates:
  │   ├── K8s TLS Certificate (cert-manager)
  │   ├── Istio Gateway configuration
  │   ├── VirtualService: admin
  │   ├── VirtualService: storefront
  │   └── VirtualService: API
  └── Frontend polls GET /provisioning-status every 2s (max 60s)
       │
       ▼
[Health Check]
  ├── Frontend health-checks admin URL (5 retries, 3s delay)
  ├── Success → auto-redirect to admin dashboard
  └── Failure → show manual "Go to Dashboard" button
       │
       ▼
[Success Page]
  ├── Personalized greeting + store URLs
  ├── Next steps: Add Products, Set Up Payments, Customize Design
  └── Clear localStorage after 3 seconds
```

### Resources Created on Successful Onboarding

| Resource | Location | Created By |
|---|---|---|
| Tenant | `tenants` table | OnboardingService |
| User | `users` table | OnboardingService |
| Keycloak User | INTERNAL realm | OnboardingService |
| Keycloak Org | CUSTOMER realm | OnboardingService |
| Membership | `memberships` table | MembershipService |
| Staff Record | staff-service DB | StaffClient.BootstrapOwner() |
| Credential | `tenant_credentials` table | CredentialService |
| TLS Certificate | cert-manager | tenant-router-service |
| Istio Gateway | K8s | tenant-router-service |
| VirtualServices (x3) | K8s | tenant-router-service |

### Rollback on Failure

If RBAC bootstrap or Keycloak attribute update fails:
- Tenant status set to `"failed"`
- Membership deleted
- Slug reservation released
- Session status set to `"failed"`

---

## 8. Production Readiness

### 8.1 Weak Request ID Generation (`Math.random()`)

**Severity:** MEDIUM
**Files:** 12+ files

`Math.random()` is not cryptographically secure and produces predictable, collision-prone IDs. Found in:

| File | Line |
|---|---|
| `app/api/lib/api-handler.ts` | 11 |
| `lib/api/onboarding.ts` | 332 |
| `lib/api/location.ts` | 141 |
| `app/api/onboarding/[sessionId]/verification/email/route.ts` | 19 |
| `app/api/onboarding/[sessionId]/verification/verify/route.ts` | 19 |
| `app/api/onboarding/[sessionId]/verification/resend/route.ts` | 19 |
| `app/api/onboarding/[sessionId]/verification/status/route.ts` | 25 |
| `app/api/onboarding/[sessionId]/events/route.ts` | 36 |
| `app/api/onboarding/draft/save/route.ts` | 15 |
| `app/api/onboarding/draft/browser-close/route.ts` | 15 |
| `app/api/onboarding/draft/[sessionId]/route.ts` | 18, 58 |
| `app/api/onboarding/draft/heartbeat/route.ts` | 15 |
| `app/api/verify/token/route.ts` | 15 |
| `app/api/verify/token-info/route.ts` | 26 |
| `app/api/verify/method/route.ts` | 13 |

**Fix:** Replace all instances with `crypto.randomUUID()` (Node.js built-in, zero imports needed in Next.js).

---

### 8.2 In-Memory Rate Limiting (Not Distributed)

**Severity:** HIGH
**Files:** `app/api/lib/api-handler.ts:182-203`, `lib/api-handler.ts:14-36`

Two separate `Map`-based rate limiters exist — both per-process only:

```typescript
// app/api/lib/api-handler.ts:182
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// lib/api-handler.ts:14
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
```

**Impact:**
- State resets on every pod restart
- Not shared across K8s replicas — attacker can exceed limits by hitting different pods
- IP extraction trusts `x-forwarded-for` header (line 217) without validation — bypassable via header spoofing

**Fix:** Use Redis-backed rate limiting (`@upstash/ratelimit` or `ioredis` + sliding window), or rely on Istio ingress rate limiting at the gateway layer.

---

### 8.3 No Next.js `middleware.ts`

**Severity:** HIGH
**File:** (absent — no `middleware.ts` at project root)

The app has **no Next.js middleware**. This means:
- No middleware-level auth checks before route handlers execute
- No CSRF token enforcement at the middleware layer
- No request-level guards as a backstop

All route protection relies entirely on individual handler-level `validateAdminAuth()` calls inside `/api/internal/*` routes. Public `/api/*` and `/api/test/*` routes have no middleware backstop.

**Fix:** Add `middleware.ts` with at minimum:
- CSRF token validation for state-mutating requests (POST/PUT/DELETE)
- Rate limiting headers
- Security headers enforcement
- Auth checks for `/api/internal/*` as a defense-in-depth layer

---

### 8.4 CSP Allows `unsafe-inline`

**Severity:** HIGH
**File:** `next.config.ts:41-42`

```typescript
"script-src 'self' 'unsafe-inline'",  // line 41
"style-src 'self' 'unsafe-inline'",   // line 42
```

`unsafe-inline` in `script-src` **defeats XSS protection entirely** — any injected inline `<script>` tag will execute. The comment in the file notes `unsafe-eval` was removed "for production safety" but `unsafe-inline` is equally dangerous.

**Fix:** Use nonce-based CSP (`'nonce-{random}'`). Next.js 13+ supports this natively via middleware. For styles, Tailwind's build-time compilation avoids the need for inline styles.

---

### 8.5 Admin API Key Exposed via Query Parameter

**Severity:** MEDIUM
**File:** `lib/admin-auth.ts:47-57`

```typescript
const headerKey = request.headers.get('X-Admin-Key');   // line 47
const queryKey = searchParams.get('key');                // line 49
const providedKey = headerKey || queryKey;               // line 51
```

The admin API key can be passed as a URL query parameter (`?key=YOUR_KEY`). Query params appear in:
- Server access logs
- Browser history
- Referer headers sent to third-party resources
- CDN/proxy logs

Additionally, the key comparison at line 57 uses `!==` (not timing-safe). Should use `crypto.timingSafeEqual()`.

**Fix:** Remove query parameter support; require `X-Admin-Key` header only. Use `crypto.timingSafeEqual()` for comparison.

---

### 8.6 File Upload: No Magic Byte Validation

**Severity:** HIGH
**File:** `app/api/documents/upload/route.ts:91-97, 118`

```typescript
const allowedTypes = ALLOWED_MIME_TYPES[category];   // line 92
if (!allowedTypes.includes(file.type)) {              // line 93 — client-supplied!
```

MIME type validation relies solely on `file.type`, which is the browser-supplied Content-Type — **trivially spoofable**. The unverified `file.type` is then passed directly to GCS at line 118 as `contentType`.

An attacker can upload an SVG with embedded JavaScript (or a polyglot file) by setting `Content-Type: image/jpeg`.

**Fix:** Read the first ~16 bytes of the buffer and validate against known magic byte signatures (`FF D8 FF` = JPEG, `89 50 4E 47` = PNG, `25 50 44 46` = PDF). The `file-type` npm package handles this well.

---

### 8.7 Error Tracking Not Wired (ErrorBoundary TODO)

**Severity:** MEDIUM
**File:** `components/errors/ErrorBoundary.tsx:41-45`

```typescript
// TODO: Log to error tracking service (PostHog, Sentry, etc.)
// posthog.capture('error_boundary_caught', {
//   error: error.message,
//   componentStack: errorInfo.componentStack,
// });
```

The `ErrorBoundary` wraps the entire app (`app/layout.tsx:300`) but all caught rendering errors are silently swallowed — no alerts, no visibility in production.

PostHog is already integrated in the layout (`PostHogProvider`), so the instrumentation infrastructure exists. The tracking just needs to be uncommented and wired.

**Fix:** Uncomment the PostHog tracking or integrate Sentry. At minimum, log to `console.error` with structured metadata.

---

### 8.8 GCP Credentials `JSON.parse` Without try-catch

**Severity:** HIGH
**File:** `lib/storage/gcs-client.ts:72`

```typescript
...(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON && {
  credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),  // line 72
}),
```

This `JSON.parse()` runs inside the `GCSStorageClient` constructor with **no try-catch**. The singleton is exported at line 419 (`export const gcsClient = new GCSStorageClient()`), meaning it runs at module initialization time.

If the env var is set but malformed (truncated secret, encoding issue), the constructor throws an uncaught exception that crashes the Next.js server process at startup.

**Fix:** Wrap in try-catch with a clear error message; fall back gracefully or fail with a descriptive startup error.

---

### 8.9 Dockerfile Issues

**Severity:** HIGH
**File:** `Dockerfile`

| Line | Issue |
|---|---|
| 35 | `COPY . .` copies `.env.local` into the image (contains real OpenPanel client ID) |
| 48 | `npm run build` picks up `.env.local`/`.env.production` — bakes `NEXT_PUBLIC_*` values permanently into static JS |
| — | **No `.dockerignore`** exists — `COPY . .` includes `.env.*`, `.git/`, `node_modules/`, `tests/`, `docs/` |
| 82-83 | Healthcheck pings `/` (full React render) instead of `/api/health` (lightweight JSON) |

**Fix:**
- Create `.dockerignore` excluding: `.env.local`, `.env.*.local`, `.git/`, `node_modules/`, `test-results/`, `tests/`, `docs/`
- Change healthcheck to `curl -f http://localhost:3000/api/health`
- Pass `NEXT_PUBLIC_*` values as Docker build args, not baked files

---

### 8.10 Hardcoded Infrastructure Values

**Severity:** MEDIUM

| File | Line | Value |
|---|---|---|
| `lib/storage/gcs-client.ts` | 67 | GCP project ID fallback: `'tesserix-480811'` |
| `lib/storage/gcs-client.ts` | 11-16 | GCS bucket names: `tesserix-devtest-assets`, `tesserix-pilot-assets`, `tesserix-prod-assets` |
| `.env.local` | 2 | Real OpenPanel client ID: `023d1b23-c147-40a2-ba1a-a69d82718d0a` |

**Impact:**
- If `GCP_PROJECT_ID` env var is missing, the app silently connects to the production GCP project
- `.env.local` should never be committed — leaks credentials into Docker images and version control
- Bucket names should come from environment configuration

**Fix:** Remove all fallback values; require env vars explicitly. Add `.env.local` to `.gitignore`.

---

### 8.11 Production Launch Checklist

| Category | Item | Status |
|---|---|---|
| **Security** | Replace `Math.random()` with `crypto.randomUUID()` | ✅ Done |
| **Security** | Add nonce-based CSP (remove `unsafe-inline` for scripts) | ✅ Done |
| **Security** | Add magic byte validation for file uploads | ✅ Done |
| **Security** | Remove query param support from admin auth | ✅ Done |
| **Security** | Use `crypto.timingSafeEqual()` for key comparison | ✅ Done |
| **Security** | Create `.dockerignore` excluding `.env.*`, `.git/`, `tests/` | ✅ Done |
| **Security** | Remove `.env.local` from version control | ❌ |
| **Resilience** | Consolidate rate limiting into shared module with cleanup | ✅ Done |
| **Resilience** | Wrap GCS `JSON.parse` in try-catch | ✅ Done |
| **Resilience** | Add `middleware.ts` (CSP nonce per request) | ✅ Done |
| **Resilience** | Remove hardcoded GCP project ID fallback | ✅ Done |
| **Observability** | Wire ErrorBoundary to PostHog | ✅ Done |
| **Observability** | Add structured logging for security events | ❌ |
| **Deployment** | Fix Dockerfile healthcheck → `/api/health` | ✅ Done |
| **Deployment** | Pass `NEXT_PUBLIC_*` as build args, not env files | ❌ |
| **Currency** | Establish single currency default strategy (USD) | ✅ Done |
| **UX** | Fix `completedSteps` / `totalSteps` / shared form | ✅ Done |

---

## 9. Recommendations Priority

### P0 — Must Fix Before Production (Security & Broken Functionality)

| # | Issue | Section | Effort | Status |
|---|---|---|---|---|
| 1 | Remove `unsafe-inline` from CSP, use nonce-based CSP | 8.4 | Medium | ✅ Done |
| 2 | Add magic byte validation for file uploads | 8.6 | Small | ✅ Done |
| 3 | Create `.dockerignore`, remove `.env.local` from image | 8.9 | Small | ✅ Done |
| 4 | Wrap GCS `JSON.parse` in try-catch (crash on bad env var) | 8.8 | Small | ✅ Done |
| 5 | Call `markStepCompleted()` in each step handler | 1.1 | Small | ✅ Done |
| 6 | Fix `totalSteps: 4` → `7` (match actual step count) | 1.2 | Small | ✅ Done |
| 7 | Separate the shared `<form>` — prevent accidental submission via Enter key | 1.3 | Medium | ✅ Done |
| 8 | Remove hardcoded GCP project ID fallback | 8.10 | Small | ✅ Done |
| 9 | Fix Dockerfile healthcheck → `/api/health` | 8.9 | Small | ✅ Done |

### P1 — Should Fix (Resilience & UX)

| # | Issue | Section | Effort | Status |
|---|---|---|---|---|
| 10 | Consolidate rate limiting into shared module with cleanup | 8.2 | Medium | ✅ Done |
| 11 | Add `middleware.ts` (CSP nonce per request) | 8.3 | Medium | ✅ Done |
| 12 | Replace `Math.random()` with `crypto.randomUUID()` (16 files) | 8.1 | Small | ✅ Done |
| 13 | Remove query param support from admin auth, use timing-safe compare | 8.5 | Small | ✅ Done |
| 14 | Wire ErrorBoundary error tracking to PostHog | 8.7 | Small | ✅ Done |
| 15 | Establish single currency default strategy (USD) | 2 | Medium | ✅ Done |
| 16 | Fix payment-plans DB schema default from INR to no default | 2.1 | Small | ✅ Done |
| 17 | Split "Business & Contact" into 2 visible stepper nodes (7 steps) | 3.1 | Medium | ✅ Done |
| 18 | Persist `legalAccepted` in Zustand store | 1.4 | Small | ✅ Done |
| 19 | Fix explicit API↔form field mapping via `form-mappers.ts` | 1.5 | Medium | ✅ Done |
| 20 | Make stepper steps clickable for completed steps | 3.2 | Medium | ✅ Done |

### P2 — Nice to Have (Code Quality & Polish)

| # | Issue | Section | Effort | Status |
|---|---|---|---|---|
| 21 | Format display values in Launch review (business type labels, country names) | 3.3 | Small | ❌ |
| 22 | Replace mock `validateBusinessName()` and `validateEmail()` with real API calls | 3.4 | Medium | ❌ |
| 23 | Extract step components from monolithic page.tsx (~3900 lines) | 4.1 | Large | ❌ |
| 24 | Fix `formDataForDraft` useMemo (watch() defeats memoization) | 3.5 | Small | ❌ |
| 25 | Deduplicate reset logic (`handleStartFresh` / `handleSessionNotFound`) | 4.3 | Small | ❌ |
| 26 | Fix E2E tests using wrong currencies (Australia test uses INR) | 2.11 | Small | ❌ |
| 27 | Remove INR-specific formatting from landing/pricing pages | 2.5 | Medium | ✅ Done |
| 28 | Pass `NEXT_PUBLIC_*` as Docker build args, not baked env files | 8.9 | Small | ❌ |
