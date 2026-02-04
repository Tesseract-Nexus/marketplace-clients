# Storefront E2E Tests

End-to-end tests for the Mark8ly Storefront application using Playwright.

## Quick Start

Tests run against the deployed demo-store by default:

```bash
# Run all tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see the browser)
npm run test:e2e:headed
```

## Prerequisites

The storefront is a multi-tenant application. Tests run against the deployed `demo-store.mark8ly.app` environment by default.

To run against a different environment:

```bash
PLAYWRIGHT_BASE_URL=https://your-store.mark8ly.app npm run test:e2e
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PLAYWRIGHT_BASE_URL` | Base URL for tests | `http://localhost:3200` |
| `PLAYWRIGHT_TENANT_SLUG` | Tenant slug to use for testing | `demo-store` |
| `TENANT_ROUTER_SERVICE_URL` | Tenant router service URL | Internal k8s URL |
| `VENDOR_SERVICE_URL` | Vendor service URL | Internal k8s URL |

## Test Structure

```
tests/e2e/
├── cart/
│   └── cart-validation.spec.ts      # Cart validation tests
├── currency/
│   └── currency-conversion.spec.ts  # Currency conversion tests
├── language/
│   └── language-translation.spec.ts # Language translation tests
├── fixtures/
│   └── mocks.ts                     # API mock helpers (for client-side mocking)
└── README.md                        # This file
```

## Available Scripts

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see the browser)
npm run test:e2e:headed

# Run tests with debug mode
npm run test:e2e:debug

# Run only cart tests
npm run test:e2e:cart

# Run only currency tests
npm run test:e2e:currency

# Run only language tests
npm run test:e2e:language
```

## Test Coverage

### Cart Validation Tests
- Display cart page correctly
- Show empty cart message
- Display cart items with product details
- Status badges (unavailable, out of stock, low stock, price changed)
- Issues banner display
- Remove unavailable items button
- Accept price changes button
- Quantity updates
- Subtotal calculation
- Refresh/validate button
- Navigation to checkout

### Currency Conversion Tests
- Currency selector display
- Dropdown open/close behavior
- Supported currencies display
- Currency flags display
- Store currency marking
- Currency switching
- Persistence across navigation
- LocalStorage persistence
- Currency restoration on page load
- Conversion notes display
- Loading states
- Error handling with fallback rates

### Language Translation Tests
- Language selector display in header
- Dropdown open/close behavior
- Translation label display
- Language switching
- LocalStorage persistence
- Flag emoji display
- Translation integration (products, categories, cart, settings pages)

## CI/CD Integration

For CI pipelines, ensure:

1. Tests run against a staging environment with the `PLAYWRIGHT_BASE_URL` set
2. Or run a docker-compose with all required services

Example GitHub Actions workflow:

```yaml
- name: Run E2E Tests
  run: npm run test:e2e
  env:
    PLAYWRIGHT_BASE_URL: ${{ secrets.STAGING_URL }}
    PLAYWRIGHT_TENANT_SLUG: demo-store
```
