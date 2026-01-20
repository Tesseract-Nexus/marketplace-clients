/**
 * Tenant Types for Multi-Tenant Architecture
 *
 * These types define the structure for tenant-related data
 * throughout the onboarding and admin applications.
 */

/**
 * Response from account setup after onboarding completion
 */
export interface AccountSetupResponse {
  tenant_id: string;
  tenant_slug: string;
  user_id: string;
  email: string;
  business_name: string;
  admin_url: string;
  token?: string;
  message: string;
}

/**
 * Summary of a tenant for display in switcher or lists
 */
export interface TenantSummary {
  tenant_id: string;
  slug: string;
  name: string;
  display_name: string;
  logo_url?: string;
  role: TenantRole;
  is_default: boolean;
  is_owner: boolean;
  status: TenantStatus;
  primary_color?: string;
  secondary_color?: string;
  last_accessed_at?: string;
}

/**
 * Full tenant context for authenticated access
 */
export interface TenantContext {
  user_id: string;
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;
  role: TenantRole;
  is_owner: boolean;
  is_default: boolean;
}

/**
 * Tenant roles for membership
 */
export type TenantRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer';

/**
 * Tenant status
 */
export type TenantStatus = 'active' | 'inactive' | 'suspended' | 'pending';

/**
 * Store setup configuration from onboarding
 */
export interface StoreSetupConfig {
  subdomain: string;
  currency: string;
  timezone: string;
  language: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
}

/**
 * Tenant creation result after successful onboarding
 */
export interface TenantCreationResult {
  success: boolean;
  tenant: {
    id: string;
    slug: string;
    name: string;
    display_name: string;
    subdomain: string;
    status: TenantStatus;
    admin_url: string;
    storefront_url: string;
  };
  user: {
    id: string;
    email: string;
    role: TenantRole;
  };
  message: string;
}

/**
 * Helper to generate URLs for a tenant
 * Uses subdomain-based URL pattern: {slug}-admin.tesserix.app
 */
export const getTenantUrls = (slug: string) => {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tesserix.app';

  return {
    // Subdomain-based admin URL: {slug}-admin.tesserix.app
    adminUrl: `https://${slug}-admin.${baseDomain}`,
    // Storefront URL: {slug}.tesserix.app
    storefrontUrl: `https://${slug}.${baseDomain}`,
    // Dashboard URL
    dashboardUrl: `https://${slug}-admin.${baseDomain}/dashboard`,
  };
};

/**
 * Role display names and colors for UI
 */
export const roleConfig: Record<TenantRole, { label: string; color: string; bgColor: string }> = {
  owner: { label: 'Owner', color: 'text-terracotta-700', bgColor: 'bg-terracotta-100' },
  admin: { label: 'Admin', color: 'text-terracotta-700', bgColor: 'bg-terracotta-100' },
  manager: { label: 'Manager', color: 'text-sage-700', bgColor: 'bg-sage-100' },
  member: { label: 'Member', color: 'text-foreground', bgColor: 'bg-warm-100' },
  viewer: { label: 'Viewer', color: 'text-foreground-tertiary', bgColor: 'bg-warm-50' },
};

/**
 * Status display configuration
 */
export const statusConfig: Record<TenantStatus, { label: string; color: string; bgColor: string }> = {
  active: { label: 'Active', color: 'text-sage-700', bgColor: 'bg-sage-100' },
  inactive: { label: 'Inactive', color: 'text-foreground-tertiary', bgColor: 'bg-warm-100' },
  suspended: { label: 'Suspended', color: 'text-terracotta-700', bgColor: 'bg-terracotta-100' },
  pending: { label: 'Pending', color: 'text-warm-700', bgColor: 'bg-warm-100' },
};
