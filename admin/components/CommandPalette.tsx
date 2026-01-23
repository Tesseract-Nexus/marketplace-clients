'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Search,
  Package,
  Users,
  ShoppingCart,
  FolderTree,
  Loader2,
  Command,
  LayoutDashboard,
  BarChart3,
  Megaphone,
  Building2,
  UserCog,
  Globe,
  Plug2,
  Settings,
  ArrowRight,
  FileText,
  Sparkles,
  Clock,
  Star,
  X,
  History,
  Trash2,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

// ========================================
// Types
// ========================================

interface SearchResultItem {
  id: string;
  type: 'product' | 'customer' | 'order' | 'category' | 'page' | 'setting' | 'action' | 'recent';
  title: string;
  subtitle?: string;
  href: string;
  icon: React.ElementType;
  keywords?: string[];
}

interface RecentSearch {
  query: string;
  timestamp: number;
  resultCount?: number;
}

// ========================================
// Search History Utils
// ========================================

const SEARCH_HISTORY_KEY = 'tesserix_admin_search_history';
const MAX_HISTORY_ITEMS = 10;

function getSearchHistory(): RecentSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSearchHistory(history: RecentSearch[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
  } catch {
    // Ignore storage errors
  }
}

function addToSearchHistory(query: string, resultCount?: number): void {
  if (!query || query.length < 2) return;
  const history = getSearchHistory();
  // Remove existing entry for this query
  const filtered = history.filter(h => h.query.toLowerCase() !== query.toLowerCase());
  // Add new entry at the beginning
  const newHistory: RecentSearch[] = [
    { query, timestamp: Date.now(), resultCount },
    ...filtered,
  ].slice(0, MAX_HISTORY_ITEMS);
  saveSearchHistory(newHistory);
}

function clearSearchHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // Ignore
  }
}

// ========================================
// Navigation Data for Static Search
// ========================================

const NAVIGATION_ITEMS: SearchResultItem[] = [
  // Dashboard
  { id: 'nav-dashboard', type: 'page', title: 'Dashboard', subtitle: 'Overview and analytics', href: '/', icon: LayoutDashboard, keywords: ['home', 'main', 'overview'] },

  // Analytics
  { id: 'nav-analytics', type: 'page', title: 'Analytics Overview', subtitle: 'Performance metrics', href: '/analytics', icon: BarChart3, keywords: ['stats', 'metrics', 'reports'] },
  { id: 'nav-analytics-sales', type: 'page', title: 'Sales Analytics', subtitle: 'Revenue and sales data', href: '/analytics/sales', icon: BarChart3, keywords: ['revenue', 'income'] },
  { id: 'nav-analytics-customers', type: 'page', title: 'Customer Analytics', subtitle: 'Customer insights', href: '/analytics/customers', icon: BarChart3, keywords: ['users', 'buyers'] },
  { id: 'nav-analytics-inventory', type: 'page', title: 'Inventory Analytics', subtitle: 'Stock levels and trends', href: '/analytics/inventory', icon: BarChart3, keywords: ['stock', 'warehouse'] },

  // Catalog
  { id: 'nav-products', type: 'page', title: 'Products', subtitle: 'Manage your product catalog', href: '/products', icon: Package, keywords: ['items', 'goods', 'merchandise'] },
  { id: 'nav-categories', type: 'page', title: 'Categories', subtitle: 'Organize products', href: '/categories', icon: FolderTree, keywords: ['groups', 'collections'] },
  { id: 'nav-inventory', type: 'page', title: 'Inventory', subtitle: 'Stock management', href: '/inventory', icon: Package, keywords: ['stock', 'warehouse', 'quantity'] },

  // Orders
  { id: 'nav-orders', type: 'page', title: 'All Orders', subtitle: 'View and manage orders', href: '/orders', icon: ShoppingCart, keywords: ['purchases', 'transactions'] },
  { id: 'nav-returns', type: 'page', title: 'Returns & Refunds', subtitle: 'Process returns', href: '/returns', icon: ShoppingCart, keywords: ['refund', 'exchange'] },
  { id: 'nav-abandoned', type: 'page', title: 'Abandoned Carts', subtitle: 'Recover lost sales', href: '/abandoned-carts', icon: ShoppingCart, keywords: ['cart', 'recovery'] },

  // Customers
  { id: 'nav-customers', type: 'page', title: 'All Customers', subtitle: 'Customer management', href: '/customers', icon: Users, keywords: ['users', 'buyers', 'clients'] },
  { id: 'nav-segments', type: 'page', title: 'Customer Segments', subtitle: 'Group customers', href: '/customer-segments', icon: Users, keywords: ['groups', 'targeting'] },
  { id: 'nav-reviews', type: 'page', title: 'Reviews', subtitle: 'Customer feedback', href: '/reviews', icon: Star, keywords: ['ratings', 'feedback'] },

  // Marketing
  { id: 'nav-campaigns', type: 'page', title: 'Campaigns', subtitle: 'Marketing campaigns', href: '/campaigns', icon: Megaphone, keywords: ['ads', 'promotions'] },
  { id: 'nav-coupons', type: 'page', title: 'Coupons', subtitle: 'Discount codes', href: '/coupons', icon: Megaphone, keywords: ['discounts', 'promo'] },
  { id: 'nav-giftcards', type: 'page', title: 'Gift Cards', subtitle: 'Gift card management', href: '/gift-cards', icon: Megaphone, keywords: ['vouchers'] },
  { id: 'nav-loyalty', type: 'page', title: 'Loyalty Program', subtitle: 'Rewards program', href: '/loyalty', icon: Megaphone, keywords: ['rewards', 'points'] },

  // Team
  { id: 'nav-staff', type: 'page', title: 'Staff', subtitle: 'Team members', href: '/staff', icon: UserCog, keywords: ['employees', 'team'] },
  { id: 'nav-departments', type: 'page', title: 'Departments', subtitle: 'Organize team', href: '/staff/departments', icon: UserCog, keywords: ['teams', 'groups'] },
  { id: 'nav-roles', type: 'page', title: 'Roles', subtitle: 'Permission management', href: '/staff/roles', icon: UserCog, keywords: ['permissions', 'access'] },
  { id: 'nav-tickets', type: 'page', title: 'Tickets', subtitle: 'Support tickets', href: '/tickets', icon: FileText, keywords: ['support', 'help'] },

  // Other
  { id: 'nav-vendors', type: 'page', title: 'Vendors', subtitle: 'Supplier management', href: '/vendors', icon: Building2, keywords: ['suppliers', 'partners'] },
  { id: 'nav-storefronts', type: 'page', title: 'Storefronts', subtitle: 'Manage stores', href: '/storefronts', icon: Globe, keywords: ['stores', 'shops', 'websites'] },
  // Hidden until feature is ready for release:
  // { id: 'nav-feature-flags', type: 'page', title: 'Feature Flags', subtitle: 'Toggle features and A/B tests', href: '/feature-flags', icon: Flag, keywords: ['toggle', 'experiment', 'growthbook', 'ab test', 'flags'] },

  // Integrations
  { id: 'nav-integrations', type: 'page', title: 'Integrations', subtitle: 'Connect services', href: '/integrations', icon: Plug2, keywords: ['apps', 'connections'] },
  { id: 'nav-webhooks', type: 'page', title: 'Webhooks', subtitle: 'Event notifications', href: '/integrations/webhooks', icon: Plug2, keywords: ['events', 'hooks'] },
  { id: 'nav-apikeys', type: 'page', title: 'API Keys', subtitle: 'API access management', href: '/integrations/api-keys', icon: Plug2, keywords: ['keys', 'tokens'] },
];

const SETTINGS_ITEMS: SearchResultItem[] = [
  { id: 'set-general', type: 'setting', title: 'General Settings', subtitle: 'Store information', href: '/settings/general', icon: Settings, keywords: ['store', 'info', 'name'] },
  { id: 'set-shipping', type: 'setting', title: 'Shipping Settings', subtitle: 'Shipping carriers', href: '/settings/shipping-carriers', icon: Settings, keywords: ['delivery', 'carriers'] },
  { id: 'set-payments', type: 'setting', title: 'Payment Settings', subtitle: 'Payment methods', href: '/settings/payments', icon: Settings, keywords: ['stripe', 'paypal', 'gateway'] },
  { id: 'set-taxes', type: 'setting', title: 'Tax Settings', subtitle: 'Tax configuration', href: '/settings/taxes', icon: Settings, keywords: ['vat', 'gst', 'tax'] },
  { id: 'set-marketing', type: 'setting', title: 'Marketing Settings', subtitle: 'Marketing preferences', href: '/settings/marketing', icon: Settings, keywords: ['email', 'sms'] },
  { id: 'set-qr-codes', type: 'setting', title: 'QR Codes', subtitle: 'Generate QR codes for URLs, WiFi, contacts', href: '/settings/qr-codes', icon: QrCode, keywords: ['qr', 'barcode', 'scan', 'wifi', 'vcard', 'url', 'generator'] },
  { id: 'set-users', type: 'setting', title: 'Users & Roles', subtitle: 'Access management', href: '/settings/users', icon: Settings, keywords: ['permissions', 'team'] },
  { id: 'set-audit', type: 'setting', title: 'Audit Logs', subtitle: 'Activity history', href: '/settings/audit-logs', icon: Settings, keywords: ['logs', 'history', 'activity'] },
  { id: 'set-account', type: 'setting', title: 'Account Settings', subtitle: 'Your profile', href: '/settings/account', icon: Settings, keywords: ['profile', 'password'] },
];

const QUICK_ACTIONS: SearchResultItem[] = [
  { id: 'action-new-product', type: 'action', title: 'Create New Product', subtitle: 'Add a product to catalog', href: '/products/new', icon: Sparkles, keywords: ['add', 'new', 'create'] },
  { id: 'action-new-order', type: 'action', title: 'Create New Order', subtitle: 'Manual order creation', href: '/orders/new', icon: Sparkles, keywords: ['add', 'new', 'create'] },
  { id: 'action-new-customer', type: 'action', title: 'Add Customer', subtitle: 'Create customer account', href: '/customers/new', icon: Sparkles, keywords: ['add', 'new', 'create'] },
  { id: 'action-new-coupon', type: 'action', title: 'Create Coupon', subtitle: 'New discount code', href: '/coupons/new', icon: Sparkles, keywords: ['add', 'new', 'create', 'discount'] },
  { id: 'action-generate-qr', type: 'action', title: 'Generate QR Code', subtitle: 'Create QR for URL, WiFi, contact', href: '/settings/qr-codes', icon: QrCode, keywords: ['qr', 'generate', 'create', 'barcode'] },
];

// ========================================
// Icon Mapping
// ========================================

const DATA_ICONS: Record<string, React.ElementType> = {
  product: Package,
  customer: Users,
  order: ShoppingCart,
  category: FolderTree,
};

const TYPE_LABELS: Record<string, string> = {
  product: 'Products',
  customer: 'Customers',
  order: 'Orders',
  category: 'Categories',
  page: 'Pages',
  setting: 'Settings',
  action: 'Quick Actions',
  recent: 'Recent Searches',
};

// ========================================
// Component
// ========================================

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load search history on mount
  useEffect(() => {
    setRecentSearches(getSearchHistory());
  }, [open]);

  // Data search from Typesense with error handling
  const {
    products,
    customers,
    orders,
    categories,
    isSearching,
    error: searchApiError,
  } = useGlobalSearch(query, { enabled: open && query.length >= 2, perPage: 5 });

  // Handle search errors
  useEffect(() => {
    if (searchApiError) {
      setSearchError('Search service temporarily unavailable');
    } else {
      setSearchError(null);
    }
  }, [searchApiError]);

  // Filter static items based on query
  const filteredNavItems = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    return NAVIGATION_ITEMS.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.keywords?.some(k => k.includes(q))
    ).slice(0, 5);
  }, [query]);

  const filteredSettings = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    return SETTINGS_ITEMS.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.keywords?.some(k => k.includes(q))
    ).slice(0, 3);
  }, [query]);

  const filteredActions = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase().trim();
    return QUICK_ACTIONS.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.keywords?.some(k => k.includes(q))
    ).slice(0, 3);
  }, [query]);

  // Transform data results
  const dataResults: SearchResultItem[] = useMemo(() => {
    const items: SearchResultItem[] = [];

    products.forEach((hit: any) => {
      items.push({
        id: hit.id,
        type: 'product',
        title: hit.name || 'Unnamed Product',
        subtitle: hit.sku ? `SKU: ${hit.sku}` : hit.brand || '',
        href: `/products/${hit.id}`,
        icon: DATA_ICONS.product,
      });
    });

    customers.forEach((hit: any) => {
      items.push({
        id: hit.id,
        type: 'customer',
        title: hit.name || 'Unknown Customer',
        subtitle: hit.email || '',
        href: `/customers/${hit.id}`,
        icon: DATA_ICONS.customer,
      });
    });

    orders.forEach((hit: any) => {
      items.push({
        id: hit.id,
        type: 'order',
        title: `Order #${hit.order_number || hit.id?.slice(0, 8)}`,
        subtitle: hit.customer_name || '',
        href: `/orders/${hit.id}`,
        icon: DATA_ICONS.order,
      });
    });

    categories.forEach((hit: any) => {
      items.push({
        id: hit.id,
        type: 'category',
        title: hit.name || 'Unnamed Category',
        subtitle: hit.description || '',
        href: `/categories/${hit.id}`,
        icon: DATA_ICONS.category,
      });
    });

    return items;
  }, [products, customers, orders, categories]);

  // Calculate total result count for history
  const totalResultCount = dataResults.length + filteredNavItems.length + filteredSettings.length + filteredActions.length;

  // Combine all results
  const allResults = useMemo(() => {
    if (!query || query.length < 2) {
      // Show recent searches, quick actions, and popular pages when no query
      const recentItems: SearchResultItem[] = recentSearches.slice(0, 3).map((r, i) => ({
        id: `recent-${i}`,
        type: 'recent' as const,
        title: r.query,
        subtitle: r.resultCount !== undefined ? `${r.resultCount} results` : 'Recent search',
        href: '', // Will be handled specially
        icon: History,
      }));

      return [...recentItems, ...QUICK_ACTIONS.slice(0, 3), ...NAVIGATION_ITEMS.slice(0, 4)];
    }
    return [...filteredActions, ...filteredNavItems, ...filteredSettings, ...dataResults];
  }, [query, filteredActions, filteredNavItems, filteredSettings, dataResults, recentSearches]);

  const hasResults = allResults.length > 0;

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setSearchError(null);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [allResults.length]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      );
      selectedElement?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && allResults[selectedIndex]) {
        e.preventDefault();
        handleSelectResult(allResults[selectedIndex]);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    },
    [allResults, selectedIndex]
  );

  // Handle selecting a result
  const handleSelectResult = (result: SearchResultItem) => {
    if (result.type === 'recent') {
      // For recent searches, set the query instead of navigating
      setQuery(result.title);
      return;
    }

    // Save to search history if we have a query
    if (query.length >= 2) {
      addToSearchHistory(query, totalResultCount);
      setRecentSearches(getSearchHistory());
    }

    setOpen(false);
    router.push(result.href);
  };

  // Handle clearing search history
  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearSearchHistory();
    setRecentSearches([]);
  };

  // Group results by type for display
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResultItem[]> = {};
    allResults.forEach(item => {
      const key = item.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [allResults]);

  let globalIndex = -1;

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 px-3 text-sm font-medium rounded-lg border border-border bg-background hover:bg-primary/10 transition-all duration-200 text-muted-foreground hover:text-foreground"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-muted text-muted-foreground rounded">
          <Command className="w-2.5 h-2.5" />K
        </kbd>
      </button>

      {/* Command Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="fixed left-[50%] top-[15%] translate-x-[-50%] translate-y-0 w-[calc(100%-2rem)] max-w-2xl p-0 gap-0 overflow-hidden shadow-2xl border border-border bg-card rounded-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 duration-150"
        >
          <VisuallyHidden>
            <DialogTitle>Search</DialogTitle>
          </VisuallyHidden>

          {/* Search Input */}
          <div className="flex items-center px-4 border-b border-border bg-card rounded-t-2xl">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search products, pages, settings..."
              className="flex-1 h-14 px-4 text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
              maxLength={100}
            />
            {isSearching && (
              <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
            )}
            {query && !isSearching && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Error Message */}
          {searchError && (
            <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Results */}
          <div
            ref={resultsRef}
            className="max-h-[400px] overflow-y-auto py-2"
          >
            {query.length === 0 ? (
              <div className="px-4 py-3">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-2 px-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        Recent Searches
                      </p>
                      <button
                        onClick={handleClearHistory}
                        className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Clear
                      </button>
                    </div>
                    {recentSearches.slice(0, 3).map((recent, idx) => {
                      globalIndex++;
                      const isSelected = globalIndex === selectedIndex;
                      return (
                        <button
                          key={`recent-${idx}`}
                          data-index={globalIndex}
                          onClick={() => setQuery(recent.query)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-150',
                            isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-primary/10 hover:text-primary'
                          )}
                        >
                          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted shrink-0">
                            <History className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{recent.query}</div>
                            {recent.resultCount !== undefined && (
                              <div className="text-xs text-muted-foreground">{recent.resultCount} results</div>
                            )}
                          </div>
                          {isSelected && <ArrowRight className="w-3.5 h-3.5 text-primary" />}
                        </button>
                      );
                    })}
                    <div className="my-3 border-t border-border" />
                  </>
                )}

                {/* Quick Actions */}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                  Quick Actions
                </p>
                {QUICK_ACTIONS.slice(0, 3).map((item) => {
                  globalIndex++;
                  return renderResultItem(item, globalIndex, selectedIndex, handleSelectResult);
                })}

                {/* Go to Pages */}
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4 px-2">
                  Go to
                </p>
                {NAVIGATION_ITEMS.slice(0, 5).map((item) => {
                  globalIndex++;
                  return renderResultItem(item, globalIndex, selectedIndex, handleSelectResult);
                })}
              </div>
            ) : query.length < 2 ? (
              <div className="px-4 py-12 text-center">
                <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Type at least 2 characters to search</p>
              </div>
            ) : !hasResults && !isSearching ? (
              <div className="px-4 py-12 text-center">
                <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-medium">No results found for "{query}"</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try different keywords or check spelling
                </p>
              </div>
            ) : (
              <div className="px-2">
                {Object.entries(groupedResults).map(([type, items]) => (
                  <div key={type} className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-2">
                      {TYPE_LABELS[type] || type}
                    </p>
                    {items.map((result) => {
                      globalIndex++;
                      return renderResultItem(result, globalIndex, selectedIndex, handleSelectResult);
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted rounded-b-2xl">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono shadow-sm">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono shadow-sm">↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono shadow-sm">↵</kbd>
                <span>Open</span>
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[10px] font-mono shadow-sm">Esc</kbd>
                <span>Close</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3" />
              <span>Powered by Typesense</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper function to render result item
function renderResultItem(
  result: SearchResultItem,
  index: number,
  selectedIndex: number,
  onSelect: (result: SearchResultItem) => void
) {
  const isSelected = index === selectedIndex;
  const Icon = result.icon;

  const typeColors: Record<string, string> = {
    product: 'text-primary bg-primary/10',
    customer: 'text-success bg-success-muted',
    order: 'text-warning bg-warning-muted',
    category: 'text-primary bg-primary/10',
    page: 'text-muted-foreground bg-muted',
    setting: 'text-muted-foreground bg-muted',
    action: 'text-primary bg-primary/10',
    recent: 'text-muted-foreground bg-muted',
  };

  return (
    <button
      key={`${result.type}-${result.id}`}
      data-index={index}
      onClick={() => onSelect(result)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-150',
        isSelected
          ? 'bg-primary/10 text-primary shadow-sm'
          : 'hover:bg-primary/10 hover:text-primary'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-lg shrink-0',
          typeColors[result.type] || 'text-muted-foreground bg-muted'
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {result.title}
        </div>
        {result.subtitle && (
          <div className="text-xs text-muted-foreground truncate">
            {result.subtitle}
          </div>
        )}
      </div>
      {isSelected && (
        <div className="flex items-center gap-1 text-xs text-primary">
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      )}
    </button>
  );
}
