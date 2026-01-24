/**
 * Centralized Routes Configuration
 *
 * All admin portal routes should be defined here to ensure consistency
 * across the application. When route paths change, only this file needs
 * to be updated.
 */

/**
 * Main navigation routes for the admin portal
 */
export const ROUTES = {
  // Dashboard
  dashboard: '/',

  // Catalog
  categories: '/categories',
  products: '/products',

  // Orders & Sales
  orders: '/orders',
  returns: '/returns',
  abandonedCarts: '/abandoned-carts',

  // Customers
  customers: '/customers',
  customerSegments: '/customer-segments',

  // Team & Staff
  staff: '/staff',
  staffDepartments: '/staff/departments',
  staffTeams: '/staff/teams',
  staffRoles: '/staff/roles',
  staffOrganization: '/staff/organization',

  // Marketing
  coupons: '/coupons',
  campaigns: '/campaigns',
  giftCards: '/gift-cards',
  loyalty: '/loyalty',

  // Inventory
  inventory: '/inventory',

  // Analytics
  analytics: '/analytics',

  // Settings
  settings: '/settings',
  settingsGeneral: '/settings/general',
  settingsAccount: '/settings/account',
  settingsPayments: '/settings/payments',
  settingsShipping: '/settings/shipping-carriers',
  settingsTaxes: '/settings/taxes',
  settingsDomains: '/settings/domains',
  settingsRoles: '/settings/roles',
  settingsTestimonial: '/settings/testimonial',

  // Storefronts
  storefronts: '/storefronts',

  // Support & Help
  support: '/support',

  // User
  profile: '/profile',

  // Vendors
  vendors: '/vendors',

  // Reviews
  reviews: '/reviews',

  // Feature Flags
  featureFlags: '/feature-flags',

  // Approvals
  approvals: '/approvals',

  // Audit
  auditLogs: '/audit-logs',

  // Integrations
  integrations: '/integrations',

  // Ad Manager
  adManager: '/ad-manager',
} as const;

/**
 * Route type for type safety
 */
export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];

/**
 * Helper function to get a route path
 */
export function getRoute(key: RouteKey): string {
  return ROUTES[key];
}

/**
 * Setup Wizard specific destinations
 * Maps wizard step IDs to their corresponding routes
 */
export const WIZARD_ROUTES = {
  category: ROUTES.categories,
  product: ROUTES.products,
  staff: ROUTES.staff,
  settings: ROUTES.settingsGeneral,
} as const;

/**
 * Completion step destinations shown as "next steps"
 */
export const WIZARD_NEXT_STEPS = [
  { label: 'Set up payment methods', href: ROUTES.settingsPayments },
  { label: 'Configure shipping options', href: ROUTES.settingsShipping },
  { label: 'Customize your storefront', href: ROUTES.storefronts },
  { label: 'View analytics dashboard', href: ROUTES.analytics },
] as const;

/**
 * Completion summary items with their routes
 */
export const WIZARD_COMPLETION_ITEMS = [
  { stepId: 'category', label: 'Categories', href: ROUTES.categories },
  { stepId: 'product', label: 'Products', href: ROUTES.products },
  { stepId: 'staff', label: 'Team Members', href: ROUTES.staff },
  { stepId: 'settings', label: 'Store Settings', href: ROUTES.settingsGeneral },
] as const;
