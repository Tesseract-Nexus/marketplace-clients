# Tenant Onboarding API Routes (BFF Pattern)

This directory contains Next.js API routes that act as a **Backend-for-Frontend (BFF)** layer between the onboarding frontend and Go microservices.

## Architecture

```
Frontend (Browser)
    ↓
Next.js API Routes (/api/*)
    ↓
Go Microservices (tenant-service, location-service)
```

## Benefits

✅ **Security**: Backend URLs never exposed to client
✅ **Centralized Auth**: Add JWT validation in one place
✅ **Rate Limiting**: Protect backend services
✅ **Request Aggregation**: Combine multiple backend calls
✅ **Caching**: Server-side response caching
✅ **Flexibility**: Easy to switch/version backends

## API Routes

### Onboarding Routes (`/api/onboarding/*`)

Proxy to **tenant-service** (port 8086):

```
POST   /api/onboarding                        → Start onboarding session
GET    /api/onboarding/[sessionId]            → Get session details
PUT    /api/onboarding/[sessionId]/business   → Update business info
PUT    /api/onboarding/[sessionId]/contact    → Update contact details
PUT    /api/onboarding/[sessionId]/address    → Update business address
POST   /api/onboarding/[sessionId]/complete   → Complete onboarding
POST   /api/onboarding/validate/[type]        → Validate business/email/subdomain/domain
POST   /api/onboarding/[sessionId]/verify-email  → Verify email
POST   /api/onboarding/[sessionId]/verify-phone  → Verify phone
```

### Location Routes (`/api/location/*`)

Proxy to **location-service** (port 8087):

```
GET /api/location/detect                      → Auto-detect location
GET /api/location/countries                   → List countries
GET /api/location/countries/[id]              → Get country
GET /api/location/countries/[id]/states       → Get states for country
GET /api/location/states                      → List all states
GET /api/location/currencies                  → List currencies
GET /api/location/timezones                   → List timezones
```

## Configuration

Backend service URLs are configured via **server-side** environment variables:

```bash
# .env.local (server-side only)
TENANT_SERVICE_URL=http://localhost:8086
LOCATION_SERVICE_URL=http://localhost:8087
```

⚠️ **Important**: Do NOT use `NEXT_PUBLIC_` prefix - these should never be exposed to the client.

## Middleware Features

All routes include:

- ✅ **Rate Limiting**: 100 requests/minute per IP
- ✅ **Request Logging**: Development mode logging
- ✅ **Error Handling**: Standardized error responses
- ✅ **Request ID Tracking**: X-Request-ID header
- ✅ **Auth Ready**: Placeholder for JWT validation

## Usage in Frontend

```typescript
import { onboardingApi } from '@/lib/api/onboarding';
import { locationApi } from '@/lib/api/location';

// All calls go through Next.js API routes
const session = await onboardingApi.startOnboarding('ecommerce');
const countries = await locationApi.getCountries();
```

## Development

Start the onboarding app with backend services:

```bash
make start-onboarding
```

This will:
1. Start PostgreSQL + Redis
2. Start tenant-service (8086)
3. Start location-service (8087)
4. Start onboarding app (3003)

## Adding New Routes

1. Create route file in appropriate directory
2. Import proxy helpers from `../lib/api-handler`
3. Add validation and rate limiting
4. Proxy to backend service

Example:

```typescript
import { NextRequest } from 'next/server';
import { proxyGet, validateRequest, SERVICES } from '../../lib/api-handler';

export async function GET(request: NextRequest) {
  const validationError = validateRequest(request, { rateLimit: true });
  if (validationError) return validationError;

  return proxyGet(SERVICES.TENANT, '/api/endpoint', request);
}
```

## Security Notes

- ✅ Backend URLs hidden from client
- ✅ CORS not needed (same origin)
- ✅ Rate limiting protects backend
- 🚧 Add JWT auth middleware as needed
- 🚧 Add request signing for backend calls
- 🚧 Add API key validation for sensitive endpoints
