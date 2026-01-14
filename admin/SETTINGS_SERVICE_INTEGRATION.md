# Settings Service Integration Guide

## Overview

The Settings Service is a comprehensive configuration management service that provides centralized settings for the entire ecommerce platform. It supports 10 major ecommerce categories and includes features like settings inheritance, presets, and audit trails.

## Service Information

- **Port**: 8085
- **Base URL**: `http://localhost:8085/api/v1`
- **Documentation**: `http://localhost:8085/swagger/index.html`
- **Health Check**: `http://localhost:8085/health`

## Integration Status

### ✅ Completed

1. **TypeScript Types** (`lib/types/settings.ts`)
   - Complete type definitions for all settings categories
   - Request/response interfaces
   - Ecommerce settings types (10 categories)

2. **API Routes** (Next.js API Proxy)
   - `POST /api/settings` - Create settings
   - `GET /api/settings` - List settings
   - `GET /api/settings/[id]` - Get by ID
   - `PUT /api/settings/[id]` - Update settings
   - `DELETE /api/settings/[id]` - Delete settings
   - `GET /api/settings/context` - Get by context
   - `GET /api/settings/inherited` - Get with inheritance
   - `GET /api/settings/presets` - List presets

3. **Service Layer** (`lib/services/settingsService.ts`)
   - TypeScript service class for all operations
   - Error handling and type safety
   - Support for all API endpoints

### 📋 Pending

1. **Update Existing Settings Pages**
   - General Settings
   - Payment Gateway Settings
   - Storefront Theme Settings
   - Roles & Permissions Settings

2. **Create New Ecommerce Settings Pages** (10 categories)
   - Store Information
   - Catalog Management
   - Inventory Management
   - Pricing Settings
   - Order Management
   - Shipping Settings
   - Returns Settings
   - Checkout Settings
   - Customer Management
   - Marketplace/Vendor Settings

3. **Update Navigation**
   - Add all new ecommerce settings to sidebar
   - Organize into logical groups

## Settings Service Features

### 1. 🏪 **Store Information**
Complete business profile including:
- Company details, logo, branding
- Contact information (email, phone, addresses)
- Business hours and timezone
- Social media links
- Legal entity information

### 2. 📚 **Catalog Management**
Product and category configuration:
- Category hierarchy (up to 5 levels)
- Product types (physical, digital, subscriptions)
- SKU format and numbering
- Product media (images, videos)
- Reviews, ratings, wishlists
- Advanced search configuration

### 3. 📦 **Inventory Management**
Stock control and tracking:
- Multi-location inventory
- Serial number tracking
- Batch and expiration dates
- Auto-reorder thresholds
- Stock reservations
- Backorder management

### 4. 💰 **Pricing System**
Tax, discounts, and currency:
- Tax-inclusive/exclusive pricing
- Multi-currency support
- Discount and coupon systems
- Tiered and bulk pricing
- Rounding strategies
- Role-based pricing (B2B)

### 5. 📋 **Order Management**
Order processing and limits:
- Order numbering format
- Fraud detection thresholds
- Order limits and quotas
- Gift services (wrap, messages)
- Post-order editing windows
- Auto-fulfillment rules

### 6. 🚚 **Shipping System**
Delivery options and zones:
- Multiple fulfillment methods
- Shipping zones and rates
- Free shipping thresholds
- Real-time carrier integration
- Tracking and confirmation

### 7. ↩️ **Returns System**
Return policies and processing:
- Return period configuration
- Cost allocation rules
- RMA system
- Photo requirements
- Category exclusions
- Automated approval workflows

### 8. 🛒 **Checkout System**
Cart and checkout flow:
- Persistent cart
- Abandoned cart recovery
- Cross-sell/upsell
- Custom checkout fields
- Mobile optimization
- Progress indicators

### 9. 👥 **Customer Management**
Customer lifecycle:
- Registration and social login
- Profile management
- Loyalty programs
- Points and referrals
- Multi-channel communication
- Address book

### 10. 🏪 **Marketplace/Multi-Vendor**
Vendor management:
- Vendor registration/approval
- Commission structures
- Fee management (listing, subscription, transaction)
- Payout scheduling
- Vendor ratings

## Settings Inheritance

The service supports a 4-level inheritance chain:

```
User Settings (highest priority)
    ↓
Application Settings
    ↓
Tenant Settings
    ↓
Global Settings (fallback)
```

Use the `/api/settings/inherited` endpoint to get merged settings with automatic fallback.

## Usage Examples

### Creating Settings

```typescript
import settingsService from '@/lib/services/settingsService';

const settings = await settingsService.createSettings({
  context: {
    tenantId: 'my-tenant',
    applicationId: 'ecommerce-admin',
    scope: 'application',
  },
  ecommerce: {
    store: {
      name: 'My Store',
      contactEmail: 'support@mystore.com',
      address: {
        businessName: 'My Store LLC',
        street1: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        zipCode: '94102',
        country: 'US',
      },
    },
    pricing: {
      display: {
        showPrices: true,
        priceFormat: '${amount}',
      },
      currencies: {
        primary: 'USD',
        supported: ['USD', 'EUR', 'GBP'],
      },
    },
  },
});
```

### Getting Inherited Settings

```typescript
const settings = await settingsService.getInheritedSettings({
  applicationId: 'ecommerce-admin',
  scope: 'application',
});

// Access ecommerce settings
const storeName = settings.ecommerce?.store?.name;
const shippingZones = settings.ecommerce?.shipping?.zones;
```

### Updating Settings

```typescript
await settingsService.updateSettings(settingsId, {
  ecommerce: {
    pricing: {
      tax: {
        enabled: true,
        calculation: 'exclusive',
        defaultRate: 8.25,
      },
    },
  },
});
```

## Environment Variables

Add to `.env.local`:

```env
SETTINGS_SERVICE_URL=http://localhost:8085/api/v1
DEV_TENANT_ID=ecommerce-admin
DEV_USER_ID=admin-user
```

## Architecture

```
┌─────────────────────┐
│   React Components  │
│  (Settings Pages)   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  settingsService.ts │
│  (Service Layer)    │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   Next.js API       │
│   /api/settings/*   │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Settings Service   │
│    (Port 8085)      │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│    PostgreSQL       │
└─────────────────────┘
```

## Next Steps

1. **Start Settings Service**:
   ```bash
   cd domains/ecommerce/services/settings-service
   docker-compose up -d
   ```

2. **Verify Service**:
   ```bash
   curl http://localhost:8085/health
   ```

3. **View Documentation**:
   Open `http://localhost:8085/swagger/index.html`

4. **Update Existing Pages**:
   - Replace mock data with API calls
   - Use `settingsService` methods
   - Handle loading and error states

5. **Create New Settings Pages**:
   - Follow existing patterns (General Settings, etc.)
   - Use the comprehensive ecommerce types
   - Implement proper form validation

## Benefits

### For Developers
- Type-safe configuration
- Centralized settings management
- Hot-reload changes without deployments
- Comprehensive API documentation

### For Business Users
- No-code configuration
- Real-time updates
- Audit trail for all changes
- Presets for common scenarios

### For Operations
- Multi-tenant support
- Settings inheritance
- Version control
- Rollback capabilities

## Support

- **Documentation**: See `/domains/ecommerce/services/settings-service/README.md`
- **API Docs**: `http://localhost:8085/swagger/index.html`
- **Comprehensive Schema**: `/domains/ecommerce/services/settings-service/COMPREHENSIVE_ECOMMERCE_SETTINGS.md`
