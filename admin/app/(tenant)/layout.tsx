"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  BarChart3,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  User,
  Megaphone,
  LogOut,
  Store,
  UserCog,
  Building2,
  Globe,
  Plug2,
  Flag,
  QrCode,
  ClipboardCheck,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { RefreshSelector } from "@/components/RefreshSelector";
import { AdminCurrencySelector } from "@/components/AdminCurrencySelector";
import { AdminLanguageSelector } from "@/components/AdminLanguageSelector";
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { TenantSwitcher } from "@/components/TenantSwitcher";
import { StorefrontSwitcher } from "@/components/StorefrontSwitcher";
import { TenantProvider, useTenant } from "@/contexts/TenantContext";
import { TenantApiProvider } from "@/contexts/TenantApiProvider";
import { StorefrontProvider } from "@/contexts/StorefrontContext";
import { RefreshProvider } from "@/contexts/RefreshContext";
import { AdminCurrencyProvider } from "@/contexts/AdminCurrencyContext";
import { AdminLanguageProvider } from "@/contexts/AdminLanguageContext";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { DialogProvider } from "@/contexts/DialogContext";
import { PermissionProvider, usePermissions } from "@/contexts/PermissionContext";
import { CommandPalette } from "@/components/CommandPalette";
import { SidebarMenuSearch } from "@/components/SidebarMenuSearch";
import { AdminUIText } from "@/components/translation/AdminTranslatedText";
import { useAuth } from "@/lib/auth";

// Role hierarchy: higher number = more permissions
// Must match backend (staff-service migrations) priority levels
// Includes both frontend names (owner, admin) and backend names (store_owner, store_admin)
const ROLE_LEVELS: Record<string, number> = {
  // Frontend/display names
  owner: 100,           // Full unrestricted access
  admin: 90,            // Full admin access (except finance)
  manager: 70,          // Store operations manager
  specialist: 60,       // Inventory/Order/Marketing Manager
  support: 50,          // Customer support
  member: 30,           // Basic member access
  viewer: 10,           // Read-only access
  // Backend/Keycloak role names (from staff-service)
  store_owner: 100,     // Maps to owner
  store_admin: 90,      // Maps to admin
  store_manager: 70,    // Maps to manager
  inventory_manager: 60,
  order_manager: 60,
  marketing_manager: 60,
  customer_support: 50,
  platform_admin: 100,  // Platform-wide admin
};

// Get role level for comparison
const getRoleLevel = (role: string | undefined): number => {
  if (!role) return 0;
  return ROLE_LEVELS[role.toLowerCase()] || 0;
};

// Navigation item type with optional minRole
interface NavItem {
  key?: string; // Unique key for sidebar visibility configuration
  name: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  minRole?: string; // Minimum role required to see this item
  businessModel?: 'ONLINE_STORE' | 'MARKETPLACE'; // Only show for specific business model
  hidden?: boolean; // Hide this item from the sidebar (for unreleased features)
  children?: NavItem[];
}

// =============================================================================
// SIDEBAR VISIBILITY CONFIGURATION
// Configure which sidebar items are visible via environment variables
// Set NEXT_PUBLIC_SIDEBAR_<KEY>=false to hide an item
// Default: all items visible except adManager and featureFlags
// =============================================================================
const SIDEBAR_VISIBILITY: Record<string, boolean> = {
  dashboard: process.env.NEXT_PUBLIC_SIDEBAR_DASHBOARD !== 'false',
  analytics: process.env.NEXT_PUBLIC_SIDEBAR_ANALYTICS !== 'false',
  catalog: process.env.NEXT_PUBLIC_SIDEBAR_CATALOG !== 'false',
  orders: process.env.NEXT_PUBLIC_SIDEBAR_ORDERS !== 'false',
  customers: process.env.NEXT_PUBLIC_SIDEBAR_CUSTOMERS !== 'false',
  marketing: process.env.NEXT_PUBLIC_SIDEBAR_MARKETING === 'true', // Default: hidden (not prod ready, enable in v2)
  adManager: process.env.NEXT_PUBLIC_SIDEBAR_AD_MANAGER === 'true', // Default: hidden
  vendors: process.env.NEXT_PUBLIC_SIDEBAR_VENDORS !== 'false',
  team: process.env.NEXT_PUBLIC_SIDEBAR_TEAM !== 'false',
  storefronts: process.env.NEXT_PUBLIC_SIDEBAR_STOREFRONTS !== 'false',
  featureFlags: process.env.NEXT_PUBLIC_SIDEBAR_FEATURE_FLAGS === 'true', // Default: hidden
  integrations: process.env.NEXT_PUBLIC_SIDEBAR_INTEGRATIONS === 'true', // Default: hidden (not prod ready, enable in v2)
  settings: process.env.NEXT_PUBLIC_SIDEBAR_SETTINGS !== 'false',
  settingsMarketing: process.env.NEXT_PUBLIC_SIDEBAR_SETTINGS_MARKETING === 'true', // Default: hidden (not prod ready, enable in v2)
};

// Helper to check if a sidebar item should be hidden
const isSidebarItemHidden = (key?: string): boolean => {
  if (!key) return false;
  return SIDEBAR_VISIBILITY[key] === false;
};

// Navigation - paths are now root-relative (tenant is in subdomain)
// minRole: minimum role level required to see this menu item
// Roles: owner > admin > manager > member > viewer
// key: used for sidebar visibility configuration via env vars
const navigation: NavItem[] = [
  { key: "dashboard", name: "Dashboard", href: "/", icon: LayoutDashboard, hidden: false }, // All roles
  {
    key: "analytics",
    name: "Analytics",
    icon: BarChart3,
    hidden: false,
    children: [
      { name: "Overview", href: "/analytics" },
      { name: "Sales", href: "/analytics/sales" },
      { name: "Customers", href: "/analytics/customers" },
      { name: "Inventory", href: "/analytics/inventory" },
    ],
  }, // All roles (read-only for viewer)
  {
    key: "catalog",
    name: "Catalog",
    icon: Package,
    hidden: false,
    children: [
      { name: "Products", href: "/products" },
      { name: "Categories", href: "/categories" },
      { name: "Inventory", href: "/inventory" },
    ],
  }, // All roles (read-only for viewer)
  {
    key: "orders",
    name: "Orders",
    icon: ShoppingCart,
    hidden: false,
    children: [
      { name: "All Orders", href: "/orders" },
      { name: "Returns & Refunds", href: "/returns", minRole: "member" },
      { name: "Abandoned Carts", href: "/abandoned-carts" },
    ],
  }, // All roles (read-only for viewer)
  {
    key: "customers",
    name: "Customers",
    icon: Users,
    hidden: false,
    children: [
      { name: "All Customers", href: "/customers" },
      { name: "Segments", href: "/customer-segments", minRole: "manager" },
      { name: "Reviews", href: "/reviews" },
    ],
  }, // All roles (read-only for viewer)
  {
    key: "marketing",
    name: "Marketing",
    icon: Megaphone,
    minRole: "manager", // Manager+ can manage marketing
    hidden: true, // Default: hidden (not prod ready, enable in v2)
    children: [
      { name: "Campaigns", href: "/campaigns" },
      { name: "Coupons", href: "/coupons" },
      { name: "Gift Cards", href: "/gift-cards" },
      { name: "Loyalty Program", href: "/loyalty" },
    ],
  },
  {
    key: "adManager",
    name: "Ad Manager",
    icon: QrCode,
    minRole: "manager", // Manager+ can manage ads
    hidden: true, // Default: hidden until feature is ready for release
    children: [
      { name: "Dashboard", href: "/ad-manager" },
      { name: "Campaigns", href: "/ad-manager/campaigns" },
      { name: "Creatives", href: "/ad-manager/creatives" },
      { name: "Approvals", href: "/ad-manager/approvals" },
      { name: "Storefronts", href: "/ad-manager/storefronts" },
      { name: "Analytics", href: "/ad-manager/analytics" },
      { name: "Settings", href: "/ad-manager/settings", minRole: "admin" },
    ],
  },
  {
    key: "vendors",
    name: "Vendors",
    icon: Building2,
    href: "/vendors",
    minRole: "manager", // Manager+ for vendor management
    businessModel: "MARKETPLACE", // Only show for marketplace tenants (multi-vendor)
    hidden: false,
  },
  {
    key: "team",
    name: "Team",
    icon: UserCog,
    minRole: "admin", // Admin+ for team management
    hidden: false,
    children: [
      { name: "Staff", href: "/staff" },
      { name: "Departments", href: "/staff/departments" },
      { name: "Teams", href: "/staff/teams" },
      { name: "Roles", href: "/staff/roles" },
      { name: "Delegations", href: "/staff/delegations" },
      { name: "Tickets", href: "/tickets", minRole: "member" }, // Tickets visible to member+
      { name: "Approvals", href: "/approvals", minRole: "manager" }, // Approvals for manager+
    ],
  },
  {
    key: "storefronts",
    name: "Storefronts",
    icon: Globe,
    href: "/storefronts",
    minRole: "admin", // Admin+ for storefront management
    hidden: false,
  },
  {
    key: "featureFlags",
    name: "Feature Flags",
    icon: Flag,
    href: "/feature-flags",
    minRole: "admin", // Admin+ for feature flags
    hidden: true, // Default: hidden until feature is ready for release
  },
  {
    key: "integrations",
    name: "Integrations",
    icon: Plug2,
    minRole: "admin", // Admin+ for integrations
    hidden: true, // Default: hidden (not prod ready, enable in v2)
    children: [
      { name: "Overview", href: "/integrations" },
      { name: "Marketplace Connectors", href: "/integrations/marketplaces" },
      { name: "Data Import", href: "/integrations/import" },
      { name: "Apps & Plugins", href: "/integrations/apps" },
      { name: "Webhooks", href: "/integrations/webhooks" },
      { name: "API Keys", href: "/integrations/api-keys" },
      { name: "Enterprise SSO", href: "/integrations/enterprise-sso", minRole: "owner" },
    ],
  },
  {
    key: "settings",
    name: "Settings",
    icon: Settings,
    minRole: "admin", // Admin+ for settings
    hidden: false,
    children: [
      { name: "General", href: "/settings/general" },
      { name: "Storefront Theme", href: "/settings/storefront-theme" },
      { name: "Shipping", href: "/settings/shipping-carriers" },
      { name: "Payments", href: "/settings/payments" },
      { name: "Taxes", href: "/settings/taxes" },
      { key: "settingsMarketing", name: "Marketing", href: "/settings/marketing", hidden: true }, // Hidden (not prod ready, enable in v2)
      { name: "QR Codes", href: "/settings/qr-codes" },
      { name: "Approval Workflows", href: "/settings/approval-workflows", minRole: "owner" },
      { name: "Audit Logs", href: "/settings/audit-logs" },
      { name: "Account", href: "/settings/account" },
    ],
  },
];

// Filter navigation based on user role, business model, and sidebar visibility config
const filterNavByRole = (
  items: NavItem[],
  userRole: string | undefined,
  tenantBusinessModel?: 'ONLINE_STORE' | 'MARKETPLACE'
): NavItem[] => {
  const userLevel = getRoleLevel(userRole);

  return items
    .filter((item) => {
      // Check sidebar visibility configuration (from env vars)
      // This takes precedence over the static hidden property
      if (item.key && SIDEBAR_VISIBILITY[item.key] === false) return false;

      // Check if item is hidden (static default for unreleased features)
      // Only applies if not overridden by env var
      if (item.hidden && (!item.key || SIDEBAR_VISIBILITY[item.key] !== true)) return false;

      // Check role requirement
      const requiredLevel = getRoleLevel(item.minRole);
      if (userLevel < requiredLevel) return false;

      // Check business model requirement
      // If item has a businessModel filter, only show if tenant matches
      if (item.businessModel && tenantBusinessModel !== item.businessModel) {
        return false;
      }

      return true;
    })
    .map((item) => {
      if (item.children) {
        const filteredChildren = filterNavByRole(item.children, userRole, tenantBusinessModel);
        // Only include parent if it has visible children
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }
      return item;
    })
    .filter((item): item is NavItem => item !== null);
};

// Sidebar User Profile Component
function SidebarUserProfile({ onLogout }: { onLogout: () => void }) {
  const { user, isLoading } = useUser();

  const displayName = user?.displayName || user?.firstName || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="p-4 border-t" style={{ borderColor: 'var(--color-sidebar-text, #475569)' + '60' }}>
      <Link href="/profile" prefetch={false} className="block relative group mb-2">
        <div className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer border"
          style={{
            backgroundColor: 'var(--color-sidebar-bg, #334155)' + 'cc',
            borderColor: 'var(--color-sidebar-text, #475569)' + '60',
          }}>
          <div className="relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-primary/30"
            style={{
              background: `linear-gradient(to bottom right, var(--color-primary, #3b82f6), var(--color-secondary, #8b5cf6), var(--color-accent, #a855f7))`,
            }}>
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-white font-semibold text-sm">{initial}</span>
            )}
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full"
              style={{ borderWidth: '2px', borderColor: 'var(--color-sidebar-bg, #1e293b)' }}></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-sidebar-active-text, #ffffff)' }}>
              {isLoading ? <AdminUIText text="Loading..." /> : displayName}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--color-sidebar-text, #cbd5e1)' }}>
              {isLoading ? '' : email}
            </p>
          </div>
          <User className="w-4 h-4 transition-colors" style={{ color: 'var(--color-sidebar-text, #64748b)' }} />
        </div>
      </Link>
      {/* Logout Button */}
      <Button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 bg-red-600 hover:bg-red-500 text-white font-medium shadow-lg hover:shadow-xl border-0"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-medium"><AdminUIText text="Sign Out" /></span>
      </Button>
    </div>
  );
}

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { currentTenant } = useTenant();
  const { maxPriorityLevel, isLoading: permissionsLoading } = usePermissions();
  const { logout } = useAuth();

  // Filter navigation based on user's role in the current tenant
  // Priority: 1) RBAC maxPriorityLevel, 2) tenant-specific role, 3) user's default role
  // This ensures proper access control even if permissions are still loading
  const effectiveRole = currentTenant?.role || user?.role;

  // If we have permissions loaded, use the priority level to determine role equivalent
  // Otherwise fall back to role-based filtering
  // Memoize role calculation to prevent unnecessary recalculations
  const roleFromPriority = useMemo(() => {
    if (maxPriorityLevel >= 100) return 'owner';
    if (maxPriorityLevel >= 90) return 'admin';
    if (maxPriorityLevel >= 70) return 'manager';
    if (maxPriorityLevel >= 60) return 'specialist';
    if (maxPriorityLevel >= 50) return 'support';
    if (maxPriorityLevel >= 30) return 'member';
    if (maxPriorityLevel > 0) return 'viewer';
    return null;
  }, [maxPriorityLevel]);

  const roleForFiltering = roleFromPriority || effectiveRole;

  // Memoize filtered navigation to prevent recalculation on every render
  // Also filters based on tenant's business model (ONLINE_STORE vs MARKETPLACE)
  const filteredNavigation = useMemo(
    () => filterNavByRole(navigation, roleForFiltering, currentTenant?.businessModel),
    [roleForFiltering, currentTenant?.businessModel]
  );

  // Handle logout via BFF
  const handleLogout = () => {
    // BFF handles session cleanup - no need to clear localStorage
    // Redirect to BFF logout endpoint (handles Keycloak logout)
    logout({ returnTo: '/login' });
  };

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  // Find parent items that should be expanded based on active pathname
  const findExpandedParents = (items: NavItem[], currentPath: string, parentKey = ''): string[] => {
    const expandedParents: string[] = [];
    for (const item of items) {
      const itemKey = parentKey ? `${parentKey}-${item.name}` : item.name;
      if (item.children) {
        // Check if any child matches the current path
        const hasActiveChild = item.children.some((child) => {
          if (child.href && (currentPath === child.href || currentPath.startsWith(child.href + '/'))) {
            return true;
          }
          // Recursively check nested children
          if (child.children) {
            return findExpandedParents([child], currentPath, itemKey).length > 0;
          }
          return false;
        });
        if (hasActiveChild) {
          expandedParents.push(itemKey);
          // Also check for nested parents
          expandedParents.push(...findExpandedParents(item.children, currentPath, itemKey));
        }
      }
    }
    return expandedParents;
  };

  // Auto-expand parent items when pathname changes
  useEffect(() => {
    if (pathname && filteredNavigation.length > 0) {
      const parentsToExpand = findExpandedParents(filteredNavigation, pathname);
      if (parentsToExpand.length > 0) {
        setExpandedItems((prev) => {
          const newExpanded = [...new Set([...prev, ...parentsToExpand])];
          return newExpanded;
        });
      }
    }
  }, [pathname, filteredNavigation]);

  // Navigation click handler - use Next.js router for SPA navigation
  // This prevents full page reloads when clicking sidebar items
  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Don't interfere with modifier keys (allow open in new tab, etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    e.preventDefault();
    // Close mobile sidebar after navigation
    setIsOpen(false);
    // Use Next.js router for client-side navigation (no full page reload)
    router.push(href);
  }, [router, setIsOpen]);

  // Memoize all hrefs for navigation matching
  const allHrefs = useMemo(() => {
    const getAllHrefs = (items: NavItem[]): string[] => {
      const hrefs: string[] = [];
      for (const item of items) {
        if (item.href) hrefs.push(item.href);
        if (item.children) {
          hrefs.push(...getAllHrefs(item.children));
        }
      }
      return hrefs;
    };
    return getAllHrefs(filteredNavigation);
  }, [filteredNavigation]);

  // Memoize isActive function to prevent recreation on every render
  const isActive = useCallback((href?: string) => {
    if (!href) return false;
    if (pathname === href) return true;
    if (href === '/') return pathname === '/';

    // Check if pathname starts with this href
    if (pathname.startsWith(href + "/")) {
      // Only highlight if no other nav item is a better (longer) match
      const hasBetterMatch = allHrefs.some(otherHref =>
        otherHref !== href &&
        otherHref.startsWith(href + "/") &&
        (pathname === otherHref || pathname.startsWith(otherHref + "/"))
      );
      return !hasBetterMatch;
    }
    return false;
  }, [pathname, allHrefs]);

  // Recursive component to render navigation items
  const renderNavItem = (item: NavItem, parentKey = '') => {
    const itemKey = parentKey ? `${parentKey}-${item.name}` : item.name;

    if (item.children) {
      return (
        <div key={itemKey}>
          <button
            type="button"
            onClick={() => toggleExpanded(itemKey)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group hover:bg-slate-700/50"
            )}
            style={{
              backgroundColor: expandedItems.includes(itemKey) ? 'var(--color-sidebar-bg, #334155)' + 'cc' : 'transparent',
              color: expandedItems.includes(itemKey) ? 'var(--color-sidebar-active-text, #60a5fa)' : 'var(--color-sidebar-text, #cbd5e1)',
            }}
          >
            <div className="flex items-center gap-3">
              {item.icon && (
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  expandedItems.includes(itemKey) ? "text-blue-400" : "text-slate-400 group-hover:text-blue-400"
                )} />
              )}
              {!item.icon && (
                <div className="w-1.5 h-1.5 rounded-full transition-colors"
                  style={{
                    backgroundColor: expandedItems.includes(itemKey)
                      ? 'var(--color-sidebar-active-text, #60a5fa)'
                      : 'var(--color-sidebar-text, #475569)',
                  }}></div>
              )}
              <AdminUIText text={item.name} />
            </div>
            {expandedItems.includes(itemKey) ? (
              <ChevronDown className="w-4 h-4 text-blue-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
            )}
          </button>
          {expandedItems.includes(itemKey) && (
            <div className="mt-1 ml-4 space-y-1 pl-6 border-l-2 animate-in slide-in-from-top-2 duration-200"
              style={{ borderColor: 'var(--color-sidebar-text, #475569)' + '80' }}>
              {item.children.map((child) => renderNavItem(child, itemKey))}
            </div>
          )}
        </div>
      );
    }

    // Leaf item with href - use Next.js Link for proper SPA navigation
    // onClick handler ensures navigation works even when Link's default behavior fails
    // prefetch={false} prevents prefetch issues with Next.js App Router
    return (
      <Link
        key={itemKey}
        href={item.href || '/'}
        prefetch={false}
        onClick={(e) => handleNavClick(e, item.href || '/')}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden cursor-pointer"
        )}
        style={{
          background: isActive(item.href)
            ? `linear-gradient(to right, var(--color-primary, #3b82f6), var(--color-secondary, #8b5cf6), var(--color-accent, #a855f7))`
            : 'transparent',
          color: isActive(item.href) ? '#ffffff' : 'var(--color-sidebar-text, #cbd5e1)',
        }}
      >
        {isActive(item.href) && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-violet-400/20 to-purple-400/20 animate-pulse pointer-events-none"></div>
        )}
        {item.icon ? (
          <item.icon className={cn(
            "w-5 h-5 relative z-10 transition-colors",
            isActive(item.href) ? "text-white" : "text-slate-400 group-hover:text-blue-400"
          )} />
        ) : (
          <div className="w-1.5 h-1.5 rounded-full transition-colors relative z-10"
            style={{
              backgroundColor: isActive(item.href)
                ? '#ffffff'
                : 'var(--color-sidebar-text, #475569)',
            }}></div>
        )}
        <span className="relative z-10"><AdminUIText text={item.name} /></span>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile overlay - z-[105] to be above header z-[100] */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[105] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - z-[110] to be above header z-[100] and overlay z-[105] */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-[110] h-screen w-72 border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: 'var(--color-sidebar-bg, linear-gradient(to bottom, #1e293b, #0f172a, #1e293b))',
          borderColor: 'var(--color-sidebar-text, #475569)' + '50',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header - Business Switcher */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <TenantSwitcher variant="sidebar" className="flex-1" />
            <Button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5 text-slate-400" />
            </Button>
          </div>

          {/* Menu Search */}
          <SidebarMenuSearch navigation={filteredNavigation} />

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {filteredNavigation.map((item) => renderNavItem(item))}
          </nav>

          {/* User Profile & Logout */}
          <SidebarUserProfile onLogout={handleLogout} />
        </div>
      </aside>
    </>
  );
}

function Header({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user } = useUser();
  const { logout } = useAuth();

  const displayName = user?.displayName || user?.firstName || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';

  // Handle logout via BFF
  const handleLogout = () => {
    // BFF handles session cleanup - no need to clear localStorage
    logout({ returnTo: '/login' });
  };

  return (
    <header className="sticky top-0 z-[100] backdrop-blur-xl border-b shadow-sm safe-top"
      style={{
        backgroundColor: 'var(--color-header-bg, #ffffff)' + 'f2',
        borderColor: 'var(--color-sidebar-text, #e5e7eb)' + '80',
      }}>
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 gap-2 sm:gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2.5 sm:p-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            style={{
              background: `linear-gradient(to bottom right, var(--color-primary, #3b82f6), var(--color-secondary, #8b5cf6))`,
            }}
          >
            <Menu className="w-5 h-5 text-white" />
          </Button>

        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Storefront Switcher (Brand within current business) */}
          <StorefrontSwitcher />

          {/* Global Search - Command Palette */}
          <CommandPalette />

          {/* Refresh Selector with Auto-refresh Options */}
          <div className="hidden md:block">
            <RefreshSelector />
          </div>

          {/* Admin Currency Selector - View financials in preferred currency */}
          <div className="hidden md:block">
            <AdminCurrencySelector />
          </div>

          {/* Admin Language Selector - View admin panel in preferred language */}
          <div className="hidden md:block">
            <AdminLanguageSelector />
          </div>

          {/* Notifications */}
          <NotificationBell />

          {/* User Avatar with Dropdown */}
          <div className="relative">
            <Button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="relative p-0.5 rounded-lg shadow-md hover:scale-105 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
              style={{
                background: `linear-gradient(to bottom right, var(--color-primary, #3b82f6), var(--color-secondary, #8b5cf6))`,
              }}>
              <div className="w-8 h-8 sm:w-8 sm:h-8 rounded-md flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-header-bg, #ffffff)' }}>
                <User className="w-4 h-4" style={{ color: 'var(--color-primary, #2563eb)' }} />
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 rounded-full"
                style={{ borderColor: 'var(--color-header-bg, #ffffff)' }}></div>
            </Button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-lg border border-border z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-foreground">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      prefetch={false}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <AdminUIText text="Profile" />
                    </Link>
                    <Link
                      href="/settings"
                      prefetch={false}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <AdminUIText text="Settings" />
                    </Link>
                  </div>
                  <div className="border-t border-border py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      <AdminUIText text="Sign Out" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// Inner component that handles tenant redirect logic
// Auth is already validated in TenantLayout parent component
function TenantLayoutInner({
  children,
  sidebarOpen,
  setSidebarOpen,
}: {
  children: React.ReactNode;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Track if we've already completed the check to prevent re-runs
  const hasCheckedRef = useRef(false);

  // Extract stable values from user to avoid re-running effect on every auth state change
  const userTenantSlug = user?.tenantSlug;

  useEffect(() => {
    // Skip if we've already completed the check successfully
    if (hasCheckedRef.current && hasAccess) {
      return;
    }

    async function checkTenantAccess() {
      // Get tenant from cookie (set by middleware)
      const tenantCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('tenant-slug='));
      const tenantSlug = tenantCookie ? decodeURIComponent(tenantCookie.split('=')[1]) : null;

      // If no tenant in subdomain (root domain), redirect to get tenant
      if (!tenantSlug) {
        // Use tenant from BFF session if available
        if (userTenantSlug) {
          const hostname = window.location.hostname;
          const port = window.location.port;
          const protocol = window.location.protocol;

          let targetUrl = '';
          if (hostname.endsWith('tesserix.app')) {
            targetUrl = `${protocol}//${userTenantSlug}-admin.tesserix.app${window.location.pathname}`;
          } else {
            const portPart = port ? `:${port}` : '';
            targetUrl = `${protocol}//${userTenantSlug}.localhost${portPart}${window.location.pathname}`;
          }
          window.location.href = targetUrl;
          return;
        }

        // No tenants found - redirect to welcome
        router.replace('/welcome');
        return;
      }

      // Have tenant - allow access
      hasCheckedRef.current = true;
      setHasAccess(true);
      setIsChecking(false);
    }

    checkTenantAccess();
  }, [router, userTenantSlug, hasAccess]);

  // Show loading while checking access
  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-header-bg, #f8fafc)' }}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col lg:ml-72 min-w-0">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 relative z-0">
          {children}
        </main>
      </div>
    </div>
  );
}

// Roles that are allowed to access the admin portal
// This must match the backend validation in staff-service
const ADMIN_PORTAL_ALLOWED_ROLES = [
  'owner', 'store_owner',
  'super_admin', 'platform_admin',
  'admin', 'store_admin',
  'manager', 'store_manager',
  'staff', 'employee',
  'inventory_manager', 'order_manager', 'marketing_manager',
  'customer_support',
  'viewer',
];

// Roles that indicate customer-only access (not staff)
const CUSTOMER_ONLY_ROLES = ['customer', 'user', 'guest'];

// Check if user has any admin portal role
// IMPORTANT: If roles are unknown, allow access and let backend enforce RBAC
// Only block if user explicitly has customer-only roles
function hasAdminPortalRole(roles: string[] | undefined): boolean {
  // If roles are unknown/empty, allow access (backend will enforce RBAC)
  // This prevents blocking legitimate users when roles aren't populated from JWT
  if (!roles || roles.length === 0) return true;

  // Check if user has any admin portal role
  const hasAdminRole = roles.some(role => ADMIN_PORTAL_ALLOWED_ROLES.includes(role.toLowerCase()));
  if (hasAdminRole) return true;

  // Only block if user explicitly has ONLY customer roles
  const hasOnlyCustomerRoles = roles.every(role => CUSTOMER_ONLY_ROLES.includes(role.toLowerCase()));
  return !hasOnlyCustomerRoles;
}

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // Check if user is authorized for admin portal (must have admin/staff role)
  const isAuthorizedForAdminPortal = isAuthenticated && hasAdminPortalRole(user?.roles);

  // Note: Auth is now handled via BFF session transfer
  // The /auth/accept-transfer endpoint creates a session from the transfer code
  // No more URL params with tokens - this is more secure

  // Redirect to login if not authenticated (after auth check completes)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [authLoading, isAuthenticated]);

  // Redirect to login page with error if authenticated but not authorized for admin portal
  // This blocks customers from accessing admin portal even if they're logged in
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isAuthorizedForAdminPortal) {
      console.warn('[TenantLayout] User authenticated but not authorized for admin portal:', user?.email, 'roles:', user?.roles);
      window.location.href = '/login?error=unauthorized&logout=true';
    }
  }, [authLoading, isAuthenticated, isAuthorizedForAdminPortal, user?.email, user?.roles]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show redirecting message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Show redirecting message if authenticated but not authorized for admin portal
  if (!isAuthorizedForAdminPortal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <UserProvider>
      <TenantProvider>
        <TenantApiProvider>
          <PermissionProvider>
            <StorefrontProvider>
              <RefreshProvider>
                <AdminCurrencyProvider>
                  <AdminLanguageProvider>
                    <DialogProvider>
                      <TenantLayoutInner sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
                        {children}
                      </TenantLayoutInner>
                    </DialogProvider>
                  </AdminLanguageProvider>
                </AdminCurrencyProvider>
              </RefreshProvider>
            </StorefrontProvider>
          </PermissionProvider>
        </TenantApiProvider>
      </TenantProvider>
    </UserProvider>
  );
}
