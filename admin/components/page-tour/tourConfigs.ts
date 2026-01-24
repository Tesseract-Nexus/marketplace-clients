/**
 * Page Tour Configurations
 * Comprehensive tour steps for each major page/section
 */

import { PageTourConfig } from './types';

// Dashboard/Home Tour
export const dashboardTour: PageTourConfig = {
  pageId: 'dashboard',
  pagePath: /^\/$/,
  title: 'Welcome to Your Dashboard',
  description: 'Get an overview of your store performance',
  steps: [
    {
      id: 'sidebar-logo',
      target: '[data-tour="sidebar-logo"]',
      title: 'Home Button',
      description: 'Click here anytime to return to your dashboard.',
      position: 'right',
      tip: 'Quick access to your store overview',
    },
    {
      id: 'sidebar-search',
      target: '[data-tour="sidebar-search"]',
      title: 'Menu Search',
      description: 'Quickly find any menu item by typing here.',
      position: 'right',
      tip: 'Type to filter menu options',
    },
    {
      id: 'analytics-section',
      target: '[data-tour="sidebar-analytics"]',
      title: 'Analytics',
      description: 'View detailed reports on sales, customers, and inventory.',
      position: 'right',
    },
    {
      id: 'catalog-section',
      target: '[data-tour="sidebar-catalog"]',
      title: 'Catalog Management',
      description: 'Manage your Products, Categories, and Inventory here.',
      position: 'right',
    },
    {
      id: 'orders-section',
      target: '[data-tour="sidebar-orders"]',
      title: 'Orders',
      description: 'View and manage customer orders, returns, and abandoned carts.',
      position: 'right',
    },
    {
      id: 'customers-section',
      target: '[data-tour="sidebar-customers"]',
      title: 'Customers',
      description: 'Manage your customer base and customer segments.',
      position: 'right',
    },
    {
      id: 'team-section',
      target: '[data-tour="sidebar-team"]',
      title: 'Team',
      description: 'Invite staff members and manage roles & permissions.',
      position: 'right',
    },
    {
      id: 'settings-section',
      target: '[data-tour="sidebar-settings"]',
      title: 'Settings',
      description: 'Configure your store settings, payments, shipping, and more.',
      position: 'right',
    },
    {
      id: 'command-palette',
      target: '[data-tour="command-palette"]',
      title: 'Quick Search',
      description: 'Search for anything - products, orders, customers, or settings.',
      position: 'bottom',
      tip: 'Press Cmd+K (Mac) or Ctrl+K (Windows)',
    },
    {
      id: 'notifications',
      target: '[data-tour="notifications"]',
      title: 'Notifications',
      description: 'Stay updated with order alerts, low stock warnings, and more.',
      position: 'bottom',
    },
    {
      id: 'business-switcher',
      target: '[data-tour="business-switcher"]',
      title: 'Switch Business',
      description: 'If you manage multiple stores, switch between them here.',
      position: 'top',
    },
  ],
};

// Categories Page Tour
export const categoriesTour: PageTourConfig = {
  pageId: 'categories',
  pagePath: /^\/categories/,
  title: 'Categories Management',
  description: 'Organize your products with categories',
  steps: [
    {
      id: 'add-category-btn',
      target: '[data-tour="add-category"], button:has-text("Add Category")',
      title: 'Add Category',
      description: 'Click here to create a new category for your products.',
      position: 'bottom-left',
    },
    {
      id: 'bulk-import-btn',
      target: '[data-tour="bulk-import"], button:has-text("Bulk Import")',
      title: 'Bulk Import',
      description: 'Import multiple categories at once using a CSV file.',
      position: 'bottom',
      tip: 'Great for migrating from another platform',
    },
    {
      id: 'refresh-btn',
      target: '[data-tour="refresh-categories"]',
      title: 'Refresh Data',
      description: 'Click to refresh the category list.',
      position: 'bottom',
    },
    {
      id: 'search-categories',
      target: '[data-tour="search-categories"], input[placeholder*="Search"]',
      title: 'Search Categories',
      description: 'Quickly find categories by name.',
      position: 'bottom',
    },
    {
      id: 'filters',
      target: '[data-tour="category-filters"], button:has-text("Filters")',
      title: 'Filters',
      description: 'Filter categories by status, date, and more.',
      position: 'bottom-left',
    },
    {
      id: 'category-hierarchy',
      target: '[data-tour="category-hierarchy"]',
      title: 'Category Hierarchy',
      description: 'View and organize your categories in a tree structure. Drag to reorder.',
      position: 'top',
      tip: 'Create subcategories for better organization',
    },
  ],
};

// Products Page Tour
export const productsTour: PageTourConfig = {
  pageId: 'products',
  pagePath: /^\/products/,
  title: 'Products Management',
  description: 'Manage your product catalog',
  steps: [
    {
      id: 'add-product-btn',
      target: '[data-tour="add-product"], button:has-text("Add Product")',
      title: 'Add Product',
      description: 'Create a new product with images, pricing, and variants.',
      position: 'bottom-left',
    },
    {
      id: 'bulk-import-products',
      target: '[data-tour="bulk-import-products"], button:has-text("Import")',
      title: 'Import Products',
      description: 'Import multiple products from a CSV file.',
      position: 'bottom',
      tip: 'Download the template for the correct format',
    },
    {
      id: 'search-products',
      target: '[data-tour="search-products"], input[placeholder*="Search"]',
      title: 'Search Products',
      description: 'Find products by name, SKU, or description.',
      position: 'bottom',
      tip: 'Press / to focus search',
    },
    {
      id: 'product-filters',
      target: '[data-tour="product-filters"], button:has-text("Filters")',
      title: 'Filter Products',
      description: 'Filter by category, status, stock level, and more.',
      position: 'bottom-left',
    },
    {
      id: 'bulk-actions',
      target: '[data-tour="bulk-actions"]',
      title: 'Bulk Actions',
      description: 'Select multiple products to update, delete, or export.',
      position: 'bottom',
    },
    {
      id: 'product-list',
      target: '[data-tour="product-list"]',
      title: 'Product List',
      description: 'Click any product to view details and edit. Use checkboxes for bulk actions.',
      position: 'top',
    },
  ],
};

// Staff/Team Page Tour
export const staffTour: PageTourConfig = {
  pageId: 'staff',
  pagePath: /^\/staff/,
  title: 'Team Management',
  description: 'Manage your team members and permissions',
  steps: [
    {
      id: 'add-staff-btn',
      target: '[data-tour="add-staff"], button:has-text("Add Staff")',
      title: 'Add Staff Member',
      description: 'Invite a new team member by email.',
      position: 'bottom-left',
    },
    {
      id: 'staff-roles',
      target: '[data-tour="staff-roles"]',
      title: 'Available Roles',
      description: 'Admin, Manager, Support, and Viewer roles with different permissions.',
      position: 'bottom',
      tip: 'Admins have full access, Viewers are read-only',
    },
    {
      id: 'staff-list',
      target: '[data-tour="staff-list"]',
      title: 'Team Members',
      description: 'View all team members, their roles, and status.',
      position: 'top',
    },
    {
      id: 'departments-link',
      target: '[data-tour="departments"], a:has-text("Departments")',
      title: 'Departments',
      description: 'Organize staff into departments for better management.',
      position: 'right',
    },
    {
      id: 'roles-link',
      target: '[data-tour="roles"], a:has-text("Roles")',
      title: 'Roles & Permissions',
      description: 'Create custom roles with specific permissions.',
      position: 'right',
    },
  ],
};

// Settings Page Tour
export const settingsTour: PageTourConfig = {
  pageId: 'settings',
  pagePath: /^\/settings/,
  title: 'Store Settings',
  description: 'Configure your store',
  steps: [
    {
      id: 'general-settings',
      target: '[data-tour="general-settings"], a:has-text("General")',
      title: 'General Settings',
      description: 'Store name, contact info, timezone, and address.',
      position: 'right',
    },
    {
      id: 'payment-settings',
      target: '[data-tour="payment-settings"], a:has-text("Payments")',
      title: 'Payment Settings',
      description: 'Configure payment gateways like Stripe, PayPal.',
      position: 'right',
      tip: 'Set up at least one payment method to accept orders',
    },
    {
      id: 'shipping-settings',
      target: '[data-tour="shipping-settings"], a:has-text("Shipping")',
      title: 'Shipping Settings',
      description: 'Configure shipping zones, rates, and carriers.',
      position: 'right',
    },
    {
      id: 'tax-settings',
      target: '[data-tour="tax-settings"], a:has-text("Taxes")',
      title: 'Tax Settings',
      description: 'Set up tax rates and exemptions.',
      position: 'right',
    },
    {
      id: 'domain-settings',
      target: '[data-tour="domain-settings"], a:has-text("Domains")',
      title: 'Custom Domain',
      description: 'Connect your own domain to your store.',
      position: 'right',
    },
    {
      id: 'storefront-settings',
      target: '[data-tour="storefront-settings"], a:has-text("Storefront")',
      title: 'Storefront Theme',
      description: 'Customize your store appearance and branding.',
      position: 'right',
    },
  ],
};

// Orders Page Tour
export const ordersTour: PageTourConfig = {
  pageId: 'orders',
  pagePath: /^\/orders/,
  title: 'Orders Management',
  description: 'View and manage customer orders',
  steps: [
    {
      id: 'order-filters',
      target: '[data-tour="order-filters"], button:has-text("Filters")',
      title: 'Filter Orders',
      description: 'Filter by status, date, payment status, and more.',
      position: 'bottom',
    },
    {
      id: 'search-orders',
      target: '[data-tour="search-orders"], input[placeholder*="Search"]',
      title: 'Search Orders',
      description: 'Find orders by order number, customer name, or email.',
      position: 'bottom',
    },
    {
      id: 'order-status',
      target: '[data-tour="order-status"]',
      title: 'Order Status',
      description: 'View order status at a glance - pending, processing, shipped, delivered.',
      position: 'bottom',
    },
    {
      id: 'order-details',
      target: '[data-tour="order-list"]',
      title: 'Order Details',
      description: 'Click any order to view full details and update status.',
      position: 'top',
    },
    {
      id: 'export-orders',
      target: '[data-tour="export-orders"], button:has-text("Export")',
      title: 'Export Orders',
      description: 'Download orders as CSV for accounting or analysis.',
      position: 'bottom-left',
    },
  ],
};

// Inventory Page Tour
export const inventoryTour: PageTourConfig = {
  pageId: 'inventory',
  pagePath: /^\/inventory/,
  title: 'Inventory Management',
  description: 'Track and manage your stock levels',
  steps: [
    {
      id: 'stock-overview',
      target: '[data-tour="stock-overview"]',
      title: 'Stock Overview',
      description: 'See stock levels across all products at a glance.',
      position: 'bottom',
    },
    {
      id: 'low-stock-alerts',
      target: '[data-tour="low-stock"]',
      title: 'Low Stock Alerts',
      description: 'Products running low are highlighted for reordering.',
      position: 'bottom',
      tip: 'Set custom low stock thresholds per product',
    },
    {
      id: 'warehouses',
      target: '[data-tour="warehouses"]',
      title: 'Warehouses',
      description: 'Manage multiple warehouse locations.',
      position: 'right',
    },
    {
      id: 'transfers',
      target: '[data-tour="transfers"]',
      title: 'Stock Transfers',
      description: 'Move inventory between warehouses.',
      position: 'right',
    },
    {
      id: 'purchase-orders',
      target: '[data-tour="purchase-orders"]',
      title: 'Purchase Orders',
      description: 'Create and track orders to your suppliers.',
      position: 'right',
    },
  ],
};

// All tour configurations
export const ALL_PAGE_TOURS: PageTourConfig[] = [
  dashboardTour,
  categoriesTour,
  productsTour,
  staffTour,
  settingsTour,
  ordersTour,
  inventoryTour,
];

// Get tour config by page ID
export function getTourConfigById(pageId: string): PageTourConfig | null {
  return ALL_PAGE_TOURS.find(tour => tour.pageId === pageId) || null;
}

// Get tour config by URL path
export function getTourConfigByPath(path: string): PageTourConfig | null {
  return ALL_PAGE_TOURS.find(tour => {
    if (tour.pagePath instanceof RegExp) {
      return tour.pagePath.test(path);
    }
    return tour.pagePath === path;
  }) || null;
}
