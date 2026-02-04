'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Package,
  FolderTree,
  ShoppingBag,
  CreditCard,
  Loader2,
  ArrowRight,
  TrendingUp,
  Clock,
  History,
  Trash2,
  Command,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTenant, useNavPath, useFormatPrice } from '@/context/TenantContext';
import { useAuthStore } from '@/store/auth';
import {
  searchProducts,
  searchCategories,
  searchCustomerOrders,
  searchCustomerPayments,
  ProductSearchResult,
  CategorySearchResult,
  OrderSearchResult,
  PaymentSearchResult,
} from '@/lib/api/search';
import {
  ProductSearchCard,
  CategorySearchCard,
  OrderSearchCard,
  PaymentSearchCard,
  SearchEmptyState,
  SearchResultsSkeleton,
} from '@/components/search';
import { cn } from '@/lib/utils';
import { useSearchShortcut, useKeyboardShortcutSymbol } from '@/hooks/useSearchShortcut';

// ========================================
// Types
// ========================================

type SearchTab = 'all' | 'products' | 'categories' | 'orders' | 'payments';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RecentSearch {
  query: string;
  timestamp: number;
}

// ========================================
// Search History Utils
// ========================================

const MAX_HISTORY_ITEMS = 8;

function getSearchHistoryKey(tenantId: string): string {
  return `mark8ly_global_search_${tenantId}`;
}

function getSearchHistory(tenantId: string): RecentSearch[] {
  if (typeof window === 'undefined' || !tenantId) return [];
  try {
    const stored = localStorage.getItem(getSearchHistoryKey(tenantId));
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveSearchHistory(tenantId: string, history: RecentSearch[]): void {
  if (typeof window === 'undefined' || !tenantId) return;
  try {
    localStorage.setItem(
      getSearchHistoryKey(tenantId),
      JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS))
    );
  } catch {
    // Ignore storage errors
  }
}

function addToSearchHistory(tenantId: string, query: string): void {
  if (!query || query.length < 2 || !tenantId) return;
  const history = getSearchHistory(tenantId);
  const filtered = history.filter((h) => h.query.toLowerCase() !== query.toLowerCase());
  const newHistory: RecentSearch[] = [
    { query, timestamp: Date.now() },
    ...filtered,
  ].slice(0, MAX_HISTORY_ITEMS);
  saveSearchHistory(tenantId, newHistory);
}

function clearSearchHistory(tenantId: string): void {
  if (typeof window === 'undefined' || !tenantId) return;
  try {
    localStorage.removeItem(getSearchHistoryKey(tenantId));
  } catch {
    // Ignore
  }
}

// ========================================
// Popular Searches
// ========================================

const POPULAR_SEARCHES = ['New arrivals', 'Sale', 'Best sellers', 'Trending'];

// ========================================
// Tab Configuration
// ========================================

const TABS: { id: SearchTab; label: string; icon: typeof Package; requiresAuth?: boolean }[] = [
  { id: 'all', label: 'All', icon: Search },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'orders', label: 'My Orders', icon: ShoppingBag, requiresAuth: true },
  { id: 'payments', label: 'Payments', icon: CreditCard, requiresAuth: true },
];

// ========================================
// Component
// ========================================

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [products, setProducts] = useState<ProductSearchResult[]>([]);
  const [categories, setCategories] = useState<CategorySearchResult[]>([]);
  const [orders, setOrders] = useState<OrderSearchResult[]>([]);
  const [payments, setPayments] = useState<PaymentSearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { tenant } = useTenant();
  const { customer, isAuthenticated } = useAuthStore();
  const getNavPath = useNavPath();
  const formatPrice = useFormatPrice();
  const shortcutSymbol = useKeyboardShortcutSymbol();

  // Filter tabs based on authentication
  const visibleTabs = useMemo(
    () => TABS.filter((tab) => !tab.requiresAuth || isAuthenticated),
    [isAuthenticated]
  );

  // Load search history when opened
  useEffect(() => {
    if (isOpen && tenant?.id) {
      setRecentSearches(getSearchHistory(tenant.id));
    }
  }, [isOpen, tenant?.id]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveTab('all');
      setSelectedIndex(0);
      setProducts([]);
      setCategories([]);
      setOrders([]);
      setPayments([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Search function with debounce
  useEffect(() => {
    if (!query || query.length < 2 || !tenant?.id || !tenant?.storefrontId) {
      setProducts([]);
      setCategories([]);
      setOrders([]);
      setPayments([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchPromises: Promise<any>[] = [];

        // Products search (for 'all' or 'products' tab)
        // Falls back to internal search API if Typesense returns no results
        if (activeTab === 'all' || activeTab === 'products') {
          searchPromises.push(
            searchProducts(tenant.id, tenant.storefrontId, query, { per_page: 6 })
              .then(async (r) => {
                const hits = r.hits || [];
                // If Typesense returns no results, try fallback to internal search API
                if (hits.length === 0) {
                  try {
                    // Use internal API route which properly authenticates with products-service
                    const fallbackResponse = await fetch('/api/search', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-Tenant-ID': tenant.id,
                        'X-Storefront-ID': tenant.storefrontId,
                      },
                      body: JSON.stringify({ query, limit: 6 }),
                    });
                    const fallbackData = await fallbackResponse.json();
                    if (fallbackData.success && fallbackData.data) {
                      // Transform fallback results to match ProductSearchResult format
                      const transformed: ProductSearchResult[] = fallbackData.data.map((p: any) => ({
                        id: p.id,
                        tenant_id: p.tenantId,
                        name: p.name,
                        description: p.description,
                        sku: p.sku,
                        brand: p.brand,
                        price: parseFloat(p.price) || 0,
                        sale_price: p.comparePrice ? parseFloat(p.comparePrice) : undefined,
                        currency: p.currency || 'USD',
                        category: p.categories || [],
                        tags: p.tags || [],
                        in_stock: p.status === 'ACTIVE',
                        image_url: p.images?.[0]?.url,
                        created_at: new Date(p.createdAt).getTime() / 1000,
                        updated_at: new Date(p.updatedAt).getTime() / 1000,
                      }));
                      return { type: 'products', data: transformed };
                    }
                    return { type: 'products', data: [] };
                  } catch {
                    return { type: 'products', data: [] };
                  }
                }
                return { type: 'products', data: hits };
              })
              .catch(() => ({ type: 'products', data: [] }))
          );
        }

        // Categories search (for 'all' or 'categories' tab)
        if (activeTab === 'all' || activeTab === 'categories') {
          searchPromises.push(
            searchCategories(tenant.id, tenant.storefrontId, query, { per_page: 3 })
              .then((r) => ({ type: 'categories', data: r.hits || [] }))
              .catch(() => ({ type: 'categories', data: [] }))
          );
        }

        // Orders search (for 'all' or 'orders' tab, only if authenticated)
        if ((activeTab === 'all' || activeTab === 'orders') && isAuthenticated && customer?.email) {
          searchPromises.push(
            searchCustomerOrders(tenant.id, tenant.storefrontId, customer.email, query, 5)
              .then((data) => ({ type: 'orders', data }))
              .catch(() => ({ type: 'orders', data: [] }))
          );
        }

        // Payments search (for 'all' or 'payments' tab, only if authenticated)
        if ((activeTab === 'all' || activeTab === 'payments') && isAuthenticated && customer?.email) {
          searchPromises.push(
            searchCustomerPayments(tenant.id, tenant.storefrontId, customer.email, query, 5)
              .then((data) => ({ type: 'payments', data }))
              .catch(() => ({ type: 'payments', data: [] }))
          );
        }

        const results = await Promise.all(searchPromises);

        results.forEach((result) => {
          switch (result.type) {
            case 'products':
              setProducts(result.data);
              break;
            case 'categories':
              setCategories(result.data);
              break;
            case 'orders':
              setOrders(result.data);
              break;
            case 'payments':
              setPayments(result.data);
              break;
          }
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, activeTab, tenant?.id, tenant?.storefrontId, isAuthenticated, customer?.email]);

  // Build flat list of all results for keyboard navigation
  const allResults = useMemo(() => {
    const items: { id: string; href: string; type: string }[] = [];

    if (activeTab === 'all' || activeTab === 'categories') {
      categories.forEach((cat) => {
        items.push({ id: cat.id, href: getNavPath(`/category/${cat.slug}`), type: 'category' });
      });
    }

    if (activeTab === 'all' || activeTab === 'products') {
      products.forEach((prod) => {
        items.push({ id: prod.id, href: getNavPath(`/product/${prod.id}`), type: 'product' });
      });
    }

    if (activeTab === 'all' || activeTab === 'orders') {
      orders.forEach((order) => {
        items.push({ id: order.id, href: getNavPath(`/account/orders/${order.id}`), type: 'order' });
      });
    }

    if (activeTab === 'all' || activeTab === 'payments') {
      payments.forEach((payment) => {
        items.push({ id: payment.id, href: getNavPath(`/account/orders/${payment.orderId}`), type: 'payment' });
      });
    }

    return items;
  }, [products, categories, orders, payments, activeTab, getNavPath]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allResults[selectedIndex]) {
          if (query.length >= 2 && tenant?.id) {
            addToSearchHistory(tenant.id, query);
          }
          router.push(allResults[selectedIndex].href);
          onClose();
        } else if (query.length >= 2) {
          if (tenant?.id) {
            addToSearchHistory(tenant.id, query);
          }
          router.push(getNavPath(`/search?q=${encodeURIComponent(query)}`));
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        const currentIndex = visibleTabs.findIndex((t) => t.id === activeTab);
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + visibleTabs.length) % visibleTabs.length
          : (currentIndex + 1) % visibleTabs.length;
        setActiveTab(visibleTabs[nextIndex]?.id ?? 'all');
        setSelectedIndex(0);
      }
    },
    [allResults, selectedIndex, query, router, onClose, getNavPath, tenant?.id, activeTab, visibleTabs]
  );

  // Scroll selected into view
  useEffect(() => {
    if (resultsRef.current && allResults[selectedIndex]) {
      const el = resultsRef.current.querySelector(`[data-id="${allResults[selectedIndex].id}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, allResults]);

  const handleResultClick = useCallback(() => {
    if (query.length >= 2 && tenant?.id) {
      addToSearchHistory(tenant.id, query);
    }
    onClose();
  }, [query, tenant?.id, onClose]);

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tenant?.id) {
      clearSearchHistory(tenant.id);
      setRecentSearches([]);
    }
  };

  const handleViewAll = () => {
    if (query && tenant?.id) {
      addToSearchHistory(tenant.id, query);
      router.push(getNavPath(`/search?q=${encodeURIComponent(query)}`));
      onClose();
    }
  };

  const hasResults = products.length > 0 || categories.length > 0 || orders.length > 0 || payments.length > 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[var(--z-modal)]"
        onClick={onClose}
      >
        {/* Backdrop with blur */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Search Container */}
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl mx-auto mt-[10vh] sm:mt-[15vh]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden mx-4 ring-1 ring-black/5">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products, categories, orders..."
                className="flex-1 h-14 text-base text-gray-900 bg-transparent border-0 outline-none placeholder:text-gray-400"
                maxLength={100}
              />
              {isSearching && (
                <Loader2 className="w-5 h-5 text-[var(--tenant-primary)] animate-spin shrink-0" />
              )}
              {query && !isSearching && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-500 font-medium">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 overflow-x-auto scrollbar-hide">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSelectedIndex(0);
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                      isActive
                        ? 'bg-[var(--tenant-primary)] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Results */}
            <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto">
              {query.length === 0 ? (
                // Initial state - show recent searches and popular
                <div className="p-4">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                          <History className="w-3.5 h-3.5" />
                          Recent Searches
                        </p>
                        <button
                          onClick={handleClearHistory}
                          className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.slice(0, 5).map((recent, idx) => (
                          <button
                            key={`recent-${idx}`}
                            onClick={() => setQuery(recent.query)}
                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors flex items-center gap-1.5"
                          >
                            <Clock className="w-3 h-3 text-gray-400" />
                            {recent.query}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Popular Searches */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Popular Searches
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_SEARCHES.map((term) => (
                        <button
                          key={term}
                          onClick={() => setQuery(term)}
                          className="px-3 py-1.5 text-sm bg-[var(--tenant-primary)]/10 hover:bg-[var(--tenant-primary)]/20 text-[var(--tenant-primary)] rounded-full transition-colors font-medium"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ArrowRight className="w-3.5 h-3.5" />
                      Quick Links
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          router.push(getNavPath('/products'));
                          onClose();
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-100 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">All Products</p>
                          <p className="text-xs text-gray-500">Browse catalog</p>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          router.push(getNavPath('/categories'));
                          onClose();
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-100 transition-all group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
                          <FolderTree className="w-5 h-5 text-white" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">Categories</p>
                          <p className="text-xs text-gray-500">Shop by category</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ) : query.length < 2 ? (
                <SearchEmptyState type="min-chars" />
              ) : isSearching ? (
                <SearchResultsSkeleton count={4} />
              ) : !hasResults ? (
                <SearchEmptyState type="no-results" query={query} />
              ) : (
                <div className="py-2">
                  {/* Categories Results */}
                  {(activeTab === 'all' || activeTab === 'categories') && categories.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 flex items-center gap-2">
                        <FolderTree className="w-3.5 h-3.5" />
                        Categories ({categories.length})
                      </p>
                      {categories.map((cat, idx) => (
                        <CategorySearchCard
                          key={cat.id}
                          id={cat.id}
                          name={cat.name}
                          slug={cat.slug}
                          description={cat.description}
                          productCount={cat.product_count}
                          href={getNavPath(`/category/${cat.slug}`)}
                          isSelected={allResults[selectedIndex]?.id === cat.id}
                          onClick={handleResultClick}
                        />
                      ))}
                    </div>
                  )}

                  {/* Products Results */}
                  {(activeTab === 'all' || activeTab === 'products') && products.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 flex items-center gap-2">
                        <Package className="w-3.5 h-3.5" />
                        Products ({products.length})
                      </p>
                      {products.map((prod) => (
                        <ProductSearchCard
                          key={prod.id}
                          id={prod.id}
                          name={prod.name}
                          brand={prod.brand}
                          price={prod.price}
                          salePrice={prod.sale_price}
                          imageUrl={prod.image_url}
                          inStock={prod.in_stock}
                          href={getNavPath(`/product/${prod.id}`)}
                          isSelected={allResults[selectedIndex]?.id === prod.id}
                          formatPrice={formatPrice}
                          onClick={handleResultClick}
                        />
                      ))}
                    </div>
                  )}

                  {/* Orders Results */}
                  {(activeTab === 'all' || activeTab === 'orders') && orders.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 flex items-center gap-2">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        My Orders ({orders.length})
                      </p>
                      {orders.map((order) => (
                        <OrderSearchCard
                          key={order.id}
                          id={order.id}
                          orderNumber={order.orderNumber}
                          status={order.status}
                          paymentStatus={order.paymentStatus}
                          totalAmount={order.totalAmount}
                          currency={order.currency}
                          createdAt={order.createdAt}
                          itemCount={order.itemCount}
                          itemsSummary={order.itemsSummary}
                          href={getNavPath(`/account/orders/${order.id}`)}
                          isSelected={allResults[selectedIndex]?.id === order.id}
                          formatPrice={formatPrice}
                          onClick={handleResultClick}
                        />
                      ))}
                    </div>
                  )}

                  {/* Payments Results */}
                  {(activeTab === 'all' || activeTab === 'payments') && payments.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5" />
                        Payments ({payments.length})
                      </p>
                      {payments.map((payment) => (
                        <PaymentSearchCard
                          key={payment.id}
                          id={payment.id}
                          orderId={payment.orderId}
                          orderNumber={payment.orderNumber}
                          transactionId={payment.transactionId}
                          status={payment.status}
                          amount={payment.amount}
                          currency={payment.currency}
                          paymentMethod={payment.paymentMethod}
                          createdAt={payment.createdAt}
                          href={getNavPath(`/account/orders/${payment.orderId}`)}
                          isSelected={allResults[selectedIndex]?.id === payment.id}
                          formatPrice={formatPrice}
                          onClick={handleResultClick}
                        />
                      ))}
                    </div>
                  )}

                  {/* View All Button */}
                  {hasResults && (
                    <div className="px-4 pb-2">
                      <Button
                        onClick={handleViewAll}
                        variant="outline"
                        className="w-full"
                      >
                        View all results for "{query}"
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50/80 text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">
                    ↑↓
                  </kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">
                    ↵
                  </kbd>
                  <span>Select</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">
                    Tab
                  </kbd>
                  <span>Switch tabs</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">
                    Esc
                  </kbd>
                  <span>Close</span>
                </span>
              </div>
              <span className="text-gray-400">Powered by Typesense</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
