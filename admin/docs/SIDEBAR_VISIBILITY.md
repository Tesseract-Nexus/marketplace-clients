# Sidebar Visibility Configuration

This document explains how to configure which sidebar menu items are visible in the admin panel. This feature allows you to show/hide sidebar items per environment without code changes.

## Overview

The admin panel sidebar can be configured via environment variables to show or hide specific menu items. This is useful for:

- **Gradual feature rollout**: Hide features that are not ready for production
- **Environment-specific configuration**: Show all features in dev, but only released features in production
- **A/B testing**: Enable features for specific deployments

## Configuration

### Environment Variables

Each sidebar item can be controlled via a `NEXT_PUBLIC_SIDEBAR_*` environment variable:

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `NEXT_PUBLIC_SIDEBAR_DASHBOARD` | `true` | Main dashboard overview |
| `NEXT_PUBLIC_SIDEBAR_ANALYTICS` | `true` | Analytics section (Overview, Sales, Customers, Inventory) |
| `NEXT_PUBLIC_SIDEBAR_CATALOG` | `true` | Catalog section (Products, Categories, Inventory) |
| `NEXT_PUBLIC_SIDEBAR_ORDERS` | `true` | Orders section (All Orders, Returns, Abandoned Carts) |
| `NEXT_PUBLIC_SIDEBAR_CUSTOMERS` | `true` | Customers section (All Customers, Segments, Reviews) |
| `NEXT_PUBLIC_SIDEBAR_MARKETING` | `true` | Marketing section (Campaigns, Coupons, Gift Cards, Loyalty) |
| `NEXT_PUBLIC_SIDEBAR_AD_MANAGER` | `false` | Ad Manager section (Campaigns, Creatives, Approvals) |
| `NEXT_PUBLIC_SIDEBAR_VENDORS` | `true` | Vendors management (Marketplace tenants only) |
| `NEXT_PUBLIC_SIDEBAR_TEAM` | `true` | Team section (Staff, Departments, Roles, Tickets) |
| `NEXT_PUBLIC_SIDEBAR_STOREFRONTS` | `true` | Storefronts management |
| `NEXT_PUBLIC_SIDEBAR_FEATURE_FLAGS` | `false` | Feature Flags management (GrowthBook) |
| `NEXT_PUBLIC_SIDEBAR_INTEGRATIONS` | `true` | Integrations section (Apps, Webhooks, API Keys) |
| `NEXT_PUBLIC_SIDEBAR_SETTINGS` | `true` | Settings section (General, Shipping, Payments, etc.) |

### Values

- `"true"` - Show the sidebar item
- `"false"` - Hide the sidebar item

### Default Hidden Items

The following items are **hidden by default** and must be explicitly enabled:

1. **Ad Manager** (`NEXT_PUBLIC_SIDEBAR_AD_MANAGER`) - Advertising campaign management
2. **Feature Flags** (`NEXT_PUBLIC_SIDEBAR_FEATURE_FLAGS`) - GrowthBook feature flag management

## Helm Chart Configuration

### Development (values.yaml)

```yaml
env:
  # Sidebar Visibility Configuration
  NEXT_PUBLIC_SIDEBAR_DASHBOARD: "true"
  NEXT_PUBLIC_SIDEBAR_ANALYTICS: "true"
  NEXT_PUBLIC_SIDEBAR_CATALOG: "true"
  NEXT_PUBLIC_SIDEBAR_ORDERS: "true"
  NEXT_PUBLIC_SIDEBAR_CUSTOMERS: "true"
  NEXT_PUBLIC_SIDEBAR_MARKETING: "true"
  NEXT_PUBLIC_SIDEBAR_AD_MANAGER: "false"      # Hidden until ready
  NEXT_PUBLIC_SIDEBAR_VENDORS: "true"
  NEXT_PUBLIC_SIDEBAR_TEAM: "true"
  NEXT_PUBLIC_SIDEBAR_STOREFRONTS: "true"
  NEXT_PUBLIC_SIDEBAR_FEATURE_FLAGS: "false"   # Hidden until ready
  NEXT_PUBLIC_SIDEBAR_INTEGRATIONS: "true"
  NEXT_PUBLIC_SIDEBAR_SETTINGS: "true"
```

### Production (values-prod.yaml)

Production uses the same configuration but should keep unreleased features hidden:

```yaml
env:
  # Keep unreleased features hidden in production
  NEXT_PUBLIC_SIDEBAR_AD_MANAGER: "false"
  NEXT_PUBLIC_SIDEBAR_FEATURE_FLAGS: "false"
```

## Local Development

For local development, add these variables to your `.env.local` file:

```bash
# Enable all features for local development
NEXT_PUBLIC_SIDEBAR_AD_MANAGER=true
NEXT_PUBLIC_SIDEBAR_FEATURE_FLAGS=true
```

## How It Works

### Priority Order

The sidebar visibility is determined by the following priority (highest to lowest):

1. **Environment variable** (`NEXT_PUBLIC_SIDEBAR_*`) - Takes precedence if set
2. **Static `hidden` property** - Fallback default in code
3. **Role-based filtering** - User must have required role (e.g., `minRole: "admin"`)
4. **Business model filtering** - Some items only show for specific tenant types

### Code Implementation

The sidebar configuration is located in `app/(tenant)/layout.tsx`:

```typescript
// Sidebar visibility configuration reads from environment variables
const SIDEBAR_VISIBILITY: Record<string, boolean> = {
  dashboard: process.env.NEXT_PUBLIC_SIDEBAR_DASHBOARD !== 'false',
  analytics: process.env.NEXT_PUBLIC_SIDEBAR_ANALYTICS !== 'false',
  // ... etc
  adManager: process.env.NEXT_PUBLIC_SIDEBAR_AD_MANAGER === 'true', // Default: hidden
  featureFlags: process.env.NEXT_PUBLIC_SIDEBAR_FEATURE_FLAGS === 'true', // Default: hidden
};
```

## Enabling a Feature

To enable a hidden feature (e.g., Feature Flags):

### 1. Update Helm Values

```yaml
# In values.yaml or values-prod.yaml
env:
  NEXT_PUBLIC_SIDEBAR_FEATURE_FLAGS: "true"
```

### 2. Deploy Changes

```bash
# Sync ArgoCD application
argocd app sync admin

# Or trigger a Helm upgrade
helm upgrade admin ./charts/apps/admin -f values.yaml
```

### 3. Verify

The sidebar item will appear for users with the appropriate role permissions.

## Role Requirements

Even if a sidebar item is visible, users must have the required role to see it:

| Sidebar Item | Minimum Role |
|-------------|--------------|
| Dashboard | All roles |
| Analytics | All roles (read-only for viewer) |
| Catalog | All roles (read-only for viewer) |
| Orders | All roles (read-only for viewer) |
| Customers | All roles (read-only for viewer) |
| Marketing | Manager |
| Ad Manager | Manager |
| Vendors | Manager (Marketplace only) |
| Team | Admin |
| Storefronts | Admin |
| Feature Flags | Admin |
| Integrations | Admin |
| Settings | Admin |

## Troubleshooting

### Sidebar item not showing

1. Check the environment variable is set correctly
2. Verify the user has the required role
3. For Vendors, ensure the tenant is a Marketplace (not Online Store)
4. Check browser console for any errors

### Changes not taking effect

1. Environment variables with `NEXT_PUBLIC_` prefix are baked into the build
2. You need to rebuild and redeploy the admin app for changes to take effect
3. Clear browser cache if using service workers

## Related Files

- `app/(tenant)/layout.tsx` - Sidebar navigation and visibility logic
- `components/CommandPalette.tsx` - Global search (respects visibility)
- `.env.example` - Environment variable documentation
- `charts/apps/admin/values.yaml` - Helm chart configuration
- `charts/apps/admin/values-prod.yaml` - Production overrides

## Related Issues

- [GitHub Issue #7](https://github.com/Tesseract-Nexus/marketplace-clients/issues/7) - Configurable sidebar menu visibility
