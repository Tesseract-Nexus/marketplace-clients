"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
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
  Sliders,
  HelpCircle,
  Star,
  Wand2,
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
import { StorefrontProvider, useStorefront } from "@/contexts/StorefrontContext";
import { RefreshProvider } from "@/contexts/RefreshContext";
import { AdminCurrencyProvider } from "@/contexts/AdminCurrencyContext";
import { AdminLanguageProvider } from "@/contexts/AdminLanguageContext";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { DialogProvider } from "@/contexts/DialogContext";
import { PermissionProvider, usePermissions } from "@/contexts/PermissionContext";
import { CommandPalette } from "@/components/CommandPalette";
import { SetupWizardProvider, SetupWizard, useSetupWizard } from "@/components/setup-wizard";
import { PageTourProvider, PageTour } from "@/components/page-tour";
import { SidebarMenuSearch } from "@/components/SidebarMenuSearch";
import { AdminUIText } from "@/components/translation/AdminTranslatedText";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/contexts/ThemeContext";
import { settingsService } from "@/lib/services/settingsService";

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
  // dashboard removed - logo/brand serves as home link
  analytics: process.env.NEXT_PUBLIC_SIDEBAR_ANALYTICS !== 'false',
  catalog: process.env.NEXT_PUBLIC_SIDEBAR_CATALOG !== 'false',
  orders: process.env.NEXT_PUBLIC_SIDEBAR_ORDERS !== 'false',
  customers: process.env.NEXT_PUBLIC_SIDEBAR_CUSTOMERS !== 'false',
  marketing: process.env.NEXT_PUBLIC_SIDEBAR_MARKETING !== 'false', // Default: visible
  adManager: process.env.NEXT_PUBLIC_SIDEBAR_AD_MANAGER === 'true', // Default: hidden
  vendors: process.env.NEXT_PUBLIC_SIDEBAR_VENDORS !== 'false',
  team: process.env.NEXT_PUBLIC_SIDEBAR_TEAM !== 'false',
  storefronts: process.env.NEXT_PUBLIC_SIDEBAR_STOREFRONTS === 'true', // Default: hidden (managed via Settings > General)
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
  // Dashboard removed - logo/brand in sidebar header serves as home link (industry standard UX)
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
      { name: "Segments", href: "/customer-segments", minRole: "manager", hidden: true }, // Disabled for now - enable in future
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
      { name: "Organization", href: "/staff/organization" },
      { name: "Roles & Permissions", href: "/staff/roles" },
      { name: "Delegations", href: "/staff/delegations", hidden: true }, // Disabled for now - enable in future
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
      { name: "Store Settings", href: "/settings/general" },
      { name: "Shipping", href: "/settings/shipping-carriers" },
      { name: "Payments", href: "/settings/payments" },
      { name: "Audit Logs", href: "/settings/audit-logs" },
      { name: "QR Codes", href: "/settings/qr-codes" },
    ],
  },
  {
    key: "support",
    name: "Support",
    icon: HelpCircle,
    href: "/support",
    hidden: false,
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
  const { currentStorefront, themeLogoUrl, themeFaviconUrl } = useStorefront();
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
      const isExpanded = expandedItems.includes(itemKey);
      const menuId = `sidebar-menu-${itemKey.replace(/\s+/g, '-').toLowerCase()}`;
      // Generate data-tour attribute for sidebar items
      const tourId = item.key ? `sidebar-${item.key}` : undefined;
      return (
        <div key={itemKey} data-tour={tourId}>
          <button
            type="button"
            onClick={() => toggleExpanded(itemKey)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && isExpanded) {
                e.preventDefault();
                const firstChild = document.querySelector(`#${menuId} a, #${menuId} button`) as HTMLElement;
                firstChild?.focus();
              }
            }}
            aria-expanded={isExpanded}
            aria-controls={menuId}
            className={cn(
              "w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isExpanded
                ? "bg-sidebar-accent text-sidebar-active-text"
                : "text-sidebar-text hover:bg-sidebar-accent hover:text-sidebar-active-text"
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon && (
                <span className={cn(
                  "w-5 h-5 transition-colors flex items-center justify-center",
                  isExpanded ? "text-sidebar-primary" : "text-sidebar-text group-hover:text-sidebar-active-text"
                )}>
                  <item.icon className="w-5 h-5" aria-hidden="true" />
                </span>
              )}
              {!item.icon && (
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  isExpanded ? "bg-sidebar-primary" : "bg-sidebar-text/60 group-hover:bg-sidebar-active-text"
                )} aria-hidden="true" />
              )}
              <AdminUIText text={item.name} />
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform duration-200",
              isExpanded ? "text-sidebar-primary rotate-0" : "text-sidebar-text -rotate-90"
            )} aria-hidden="true" />
          </button>
          {isExpanded && (
            <div
              id={menuId}
              role="region"
              aria-label={`${item.name} submenu`}
              className="mt-1.5 ml-4 space-y-0.5 pl-5 border-l-2 border-sidebar-border/60 animate-in slide-in-from-top-2 duration-200 bg-sidebar-accent/30 rounded-r-lg py-1.5"
            >
              {item.children.map((child) => renderNavItem(child, itemKey))}
            </div>
          )}
        </div>
      );
    }

    // Leaf item with href - use Next.js Link for proper SPA navigation
    // onClick handler ensures navigation works even when Link's default behavior fails
    // prefetch={false} prevents prefetch issues with Next.js App Router
    const active = isActive(item.href);
    return (
      <Link
        key={itemKey}
        href={item.href || '/'}
        prefetch={false}
        onClick={(e) => handleNavClick(e, item.href || '/')}
        aria-current={active ? 'page' : undefined}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          active
            ? "bg-sidebar-primary/20 text-sidebar-active-text border-l-3 border-sidebar-primary"
            : "text-sidebar-text hover:bg-sidebar-accent hover:text-sidebar-active-text"
        )}
      >
        {item.icon ? (
          <span className={cn(
            "w-5 h-5 relative z-10 transition-colors flex items-center justify-center",
            active ? "text-sidebar-primary" : "text-sidebar-text group-hover:text-sidebar-active-text"
          )}>
            <item.icon className="w-5 h-5" aria-hidden="true" />
          </span>
        ) : (
          <div className={cn(
            "w-1.5 h-1.5 rounded-full transition-colors relative z-10",
            active ? "bg-sidebar-primary" : "bg-sidebar-text/60 group-hover:bg-sidebar-active-text"
          )} aria-hidden="true" />
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
        data-tour="sidebar"
        className={cn(
          "fixed top-0 left-0 z-[110] h-screen w-72 border-r border-sidebar-border/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl bg-sidebar",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header - Logo & Name (clickable to dashboard) */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <Link
              href="/"
              prefetch={false}
              onClick={(e) => handleNavClick(e, '/')}
              aria-label="Go to dashboard"
              data-tour="sidebar-logo"
              className="flex items-center gap-3 rounded-lg transition-all duration-200 hover:opacity-80"
            >
              {(currentTenant?.logoUrl || currentStorefront?.logoUrl || themeLogoUrl) ? (
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-sidebar-accent border border-sidebar-border shadow-sm flex items-center justify-center flex-shrink-0">
                  <img
                    src={currentTenant?.logoUrl || currentStorefront?.logoUrl || themeLogoUrl}
                    alt={currentTenant?.name || 'Store'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: currentTenant?.primaryColor || '#6366f1' }}
                >
                  {currentTenant?.name?.charAt(0).toUpperCase() || 'T'}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-sidebar-active-text truncate max-w-[160px]">
                  {currentTenant?.name || 'Admin Portal'}
                </span>
                <span className="text-xs text-sidebar-text-muted">Admin Panel</span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-sidebar-accent lg:hidden"
            >
              <X className="w-5 h-5 text-sidebar-text" />
            </Button>
          </div>

          {/* Menu Search */}
          <div data-tour="sidebar-search">
            <SidebarMenuSearch navigation={filteredNavigation} />
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 sidebar-scrollbar">
            {filteredNavigation.map((item) => renderNavItem(item))}
          </nav>

          {/* Bottom: Tenant Switcher + Sign Out */}
          <div className="p-3 border-t border-sidebar-border" data-tour="business-switcher">
            <div className="flex items-center gap-2">
              <TenantSwitcher variant="compact" className="flex-1 min-w-0" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-9 w-9 p-0 rounded-lg text-sidebar-text hover:text-error hover:bg-error/10 flex-shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Branding Footer */}
          <div className="px-4 py-3 border-t border-sidebar-border/50">
            <div className="text-center">
              <p className="text-xs text-sidebar-text-muted">Powered by Tesserix</p>
              <p className="text-[10px] text-sidebar-text-muted/60">v1.0.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user } = useUser();
  const { logout } = useAuth();
  const { openWizard, resetWizard } = useSetupWizard();

  const displayName = user?.displayName || user?.firstName || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';

  // Handle logout via BFF
  const handleLogout = () => {
    // BFF handles session cleanup - no need to clear localStorage
    logout({ returnTo: '/login' });
  };

  // Handle opening setup wizard
  const handleOpenWizard = () => {
    setShowUserMenu(false);
    resetWizard();
    openWizard();
  };

  return (
    <header className="sticky top-0 z-[100] backdrop-blur-xl safe-top bg-background/95 border-b border-border shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1),inset_0_-1px_0_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 gap-2 sm:gap-4">
        {/* Left Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2.5 sm:p-2 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg min-h-[44px] min-w-[44px] flex items-center justify-center bg-primary hover:bg-primary/90"
          >
            <Menu className="w-5 h-5 text-primary-foreground" />
          </Button>

        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Storefront Switcher (Brand within current business) */}
          <StorefrontSwitcher />

          {/* Global Search - Command Palette */}
          <div data-tour="command-palette">
            <CommandPalette />
          </div>

          {/* Refresh Selector - Quick access to manual refresh and auto-refresh settings */}
          <div className="hidden md:block">
            <RefreshSelector />
          </div>

          {/* Notifications */}
          <div data-tour="notifications">
            <NotificationBell />
          </div>

          {/* User Avatar with Dropdown */}
          <div className="relative">
            <Button
              onClick={() => setShowUserMenu(!showUserMenu)}
              variant="ghost"
              className="relative h-9 w-9 rounded-full hover:bg-muted transition-all duration-200 p-0 flex items-center justify-center">
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
                <User className="w-4 h-4" />
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success border-2 border-background rounded-full"></div>
            </Button>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-lg border border-border z-[9999] animate-in fade-in slide-in-from-top-2 duration-200">
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
                    <Link
                      href="/settings/account"
                      prefetch={false}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <UserCog className="w-4 h-4" />
                      <AdminUIText text="Account" />
                    </Link>
                    <Link
                      href="/settings/testimonial"
                      prefetch={false}
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    >
                      <Star className="w-4 h-4" />
                      <AdminUIText text="Your Testimonial" />
                    </Link>
                    <button
                      onClick={handleOpenWizard}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/10 transition-colors w-full"
                    >
                      <Wand2 className="w-4 h-4" />
                      <AdminUIText text="Setup Wizard" />
                    </button>
                  </div>
                  {/* Preferences Section */}
                  <div className="border-t border-border py-2 px-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Sliders className="w-3 h-3" />
                      <AdminUIText text="Preferences" />
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground"><AdminUIText text="Currency" /></span>
                        <AdminCurrencySelector compact />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground"><AdminUIText text="Language" /></span>
                        <AdminLanguageSelector compact />
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-border py-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error-muted transition-colors w-full"
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
  const { currentTenant } = useTenant();
  const { currentStorefront, themeLogoUrl, themeFaviconUrl } = useStorefront();
  const { branding, updateBranding } = useTheme();

  // DEV MODE: Skip all tenant checks
  const devBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';
  const [isChecking, setIsChecking] = useState(!devBypass);
  const [hasAccess, setHasAccess] = useState(devBypass);

  // Track if we've already completed the check to prevent re-runs
  const hasCheckedRef = useRef(devBypass);

  // Track if we've already loaded branding settings from the API
  const brandingLoadedRef = useRef(false);

  // Extract stable values from user to avoid re-running effect on every auth state change
  const userTenantSlug = user?.tenantSlug;

  // Load admin branding settings from settings service when tenant is available
  // This ensures the branding (including favicon) is loaded from the authoritative source
  useEffect(() => {
    if (!currentTenant?.id || brandingLoadedRef.current) return;

    async function loadBrandingSettings() {
      try {
        const data = await settingsService.getSettingsByContext({
          applicationId: 'admin-portal',
          scope: 'global',
          tenantId: currentTenant!.id,
        });

        if (data?.branding) {
          const faviconUrl = data.branding.general?.faviconUrl;
          const logoUrl = data.branding.general?.logoUrl;

          // Merge with defaults to ensure all required properties exist
          const loadedBranding = {
            general: { ...branding.general, ...data.branding.general },
            colors: { ...branding.colors, ...data.branding.colors },
            appearance: { ...branding.appearance, ...data.branding.appearance },
            advanced: { ...branding.advanced, ...data.branding.advanced },
          };
          updateBranding(loadedBranding);
          brandingLoadedRef.current = true;

          // Directly set favicon here to ensure it's set after API completes
          const effectiveFavicon = faviconUrl?.trim() || logoUrl?.trim();
          if (effectiveFavicon) {
            let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = effectiveFavicon;
          }
        }
      } catch (error) {
        // Silently fail - fallback sources will be used
        console.debug('[TenantLayout] Failed to load admin branding settings:', error);
      }
    }

    loadBrandingSettings();
  }, [currentTenant?.id]);

  // Dynamic favicon update based on multiple sources
  // Priority: 1) Admin branding faviconUrl, 2) Storefront theme faviconUrl, 3) Admin branding logoUrl, 4) Storefront logoUrl, 5) Tenant logoUrl, 6) Theme logoUrl
  useEffect(() => {
    const faviconUrl =
      branding?.general?.faviconUrl?.trim() ||
      themeFaviconUrl ||  // Use storefront theme favicon as high-priority fallback
      branding?.general?.logoUrl?.trim() ||
      currentStorefront?.logoUrl ||
      currentTenant?.logoUrl ||
      themeLogoUrl;

    if (faviconUrl) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [branding?.general?.faviconUrl, branding?.general?.logoUrl, themeFaviconUrl, currentTenant?.logoUrl, currentStorefront?.logoUrl, themeLogoUrl]);

  useEffect(() => {
    // DEV MODE: Skip tenant check entirely
    if (devBypass) {
      console.log('[TenantLayoutInner] 🔓 DEV AUTH BYPASS - skipping tenant check');
      return;
    }

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

      // Also check the is-custom-domain cookie
      const customDomainCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('is-custom-domain='));
      const isOnCustomDomain = customDomainCookie
        ? customDomainCookie.split('=')[1] === 'true'
        : false;

      // For custom domains: if the tenant-slug cookie is missing but we know we're
      // on a custom domain, the middleware should have set it. This can happen if
      // cookies are blocked by browser extensions or there's a race condition.
      // In this case, allow access and let the middleware/API handle tenant resolution
      // via headers rather than redirecting to an incorrect domain.
      if (!tenantSlug && isOnCustomDomain) {
        console.log('[TenantLayoutInner] Custom domain detected without tenant-slug cookie, allowing access');
        hasCheckedRef.current = true;
        setHasAccess(true);
        setIsChecking(false);
        return;
      }

      // Detect custom domain from hostname as fallback
      const hostname = window.location.hostname;
      const isCustomDomainHost =
        !hostname.endsWith('.tesserix.app') &&
        hostname !== 'tesserix.app' &&
        !hostname.endsWith('.localhost') &&
        hostname !== 'localhost';

      if (!tenantSlug && isCustomDomainHost) {
        // On a custom domain but no tenant cookie - allow access rather than
        // redirecting to an incorrect domain (localhost). The middleware and
        // Istio headers provide tenant context server-side.
        console.log('[TenantLayoutInner] Custom domain host detected without tenant cookie, allowing access');
        hasCheckedRef.current = true;
        setHasAccess(true);
        setIsChecking(false);
        return;
      }

      // If no tenant in subdomain (root domain), redirect to get tenant
      if (!tenantSlug) {
        // Use tenant from BFF session if available
        if (userTenantSlug) {
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
  }, [router, userTenantSlug, hasAccess, devBypass]);

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
      {/* Skip to main content link for keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col lg:ml-72 min-w-0">
        <Header setSidebarOpen={setSidebarOpen} />
        <main id="main-content" className="flex-1 overflow-auto relative z-0" tabIndex={-1}>
          <div className="w-full px-4 sm:px-6 py-4 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// =============================================================================
// DEV AUTH BYPASS
// Set NEXT_PUBLIC_DEV_AUTH_BYPASS=true in .env.local to bypass authentication
// This allows local development without running the auth service
// Login page remains accessible for testing at /login
// =============================================================================
const DEV_AUTH_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

// Mock user for dev auth bypass mode
const DEV_MOCK_USER = {
  id: 'dev-user-001',
  email: 'dev@tesserix.local',
  firstName: 'Dev',
  lastName: 'User',
  displayName: 'Dev User',
  roles: ['owner', 'admin'],
  tenantSlug: 'dev-tenant',
  tenantId: 'dev-tenant-001',
};

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

// Check if user has any admin portal role
// SECURITY: Block users without valid admin roles to prevent customer access
function hasAdminPortalRole(roles: string[] | undefined): boolean {
  // If roles are empty/undefined, deny access (defense in depth)
  // Backend will also enforce via validateStaffAdminAccess
  if (!roles || roles.length === 0) return false;

  // Check if user has any admin portal role
  return roles.some(role => ADMIN_PORTAL_ALLOWED_ROLES.includes(role.toLowerCase()));
}

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  // DEV MODE: Bypass all auth checks when DEV_AUTH_BYPASS is enabled
  // This allows running the admin portal locally without auth services
  // Login page at /login is still accessible for testing
  const effectiveIsAuthenticated = DEV_AUTH_BYPASS ? true : isAuthenticated;
  const effectiveAuthLoading = DEV_AUTH_BYPASS ? false : authLoading;
  const effectiveUser = DEV_AUTH_BYPASS ? DEV_MOCK_USER : user;

  // Check if user is authorized for admin portal (must have admin/staff role)
  const isAuthorizedForAdminPortal = effectiveIsAuthenticated && hasAdminPortalRole(effectiveUser?.roles);

  // Note: Auth is now handled via BFF session transfer
  // The /auth/accept-transfer endpoint creates a session from the transfer code
  // No more URL params with tokens - this is more secure

  // Log dev mode status on mount
  useEffect(() => {
    if (DEV_AUTH_BYPASS) {
      console.log('[TenantLayout] 🔓 DEV AUTH BYPASS ENABLED - Authentication disabled for local development');
      console.log('[TenantLayout] Mock user:', DEV_MOCK_USER.email, 'roles:', DEV_MOCK_USER.roles);
      console.log('[TenantLayout] Login page still accessible at /login for testing');
    }
  }, []);

  // Redirect to login if not authenticated (after auth check completes)
  // Skip this check in dev bypass mode
  useEffect(() => {
    if (!DEV_AUTH_BYPASS && !effectiveAuthLoading && !effectiveIsAuthenticated) {
      window.location.href = '/login';
    }
  }, [effectiveAuthLoading, effectiveIsAuthenticated]);

  // Redirect to login page with error if authenticated but not authorized for admin portal
  // This blocks customers from accessing admin portal even if they're logged in
  // Skip this check in dev bypass mode
  useEffect(() => {
    if (!DEV_AUTH_BYPASS && !effectiveAuthLoading && effectiveIsAuthenticated && !isAuthorizedForAdminPortal) {
      console.warn('[TenantLayout] User authenticated but not authorized for admin portal:', effectiveUser?.email, 'roles:', effectiveUser?.roles);
      window.location.href = '/login?error=unauthorized&logout=true';
    }
  }, [effectiveAuthLoading, effectiveIsAuthenticated, isAuthorizedForAdminPortal, effectiveUser?.email, effectiveUser?.roles]);

  // Show loading while checking authentication (skip in dev bypass mode)
  if (effectiveAuthLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show redirecting message if not authenticated (skip in dev bypass mode)
  if (!effectiveIsAuthenticated) {
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
                      <SetupWizardProvider>
                        <PageTourProvider>
                          <TenantLayoutInner sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
                            {children}
                          </TenantLayoutInner>
                          <SetupWizard />
                          <PageTour />
                        </PageTourProvider>
                      </SetupWizardProvider>
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
