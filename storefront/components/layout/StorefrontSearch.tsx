'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Package,
  FolderTree,
  Loader2,
  ArrowRight,
  TrendingUp,
  Clock,
  Tag,
  History,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTenant, useNavPath, useFormatPrice } from '@/context/TenantContext';
import { searchProducts, searchCategories, ProductSearchResult, CategorySearchResult } from '@/lib/api/search';
import { cn } from '@/lib/utils';

// ========================================
// Types
// ========================================

interface SearchResultItem {
  id: string;
  type: 'product' | 'category';
  title: string;
  subtitle?: string;
  href: string;
  imageUrl?: string;
  price?: number;
  salePrice?: number;
  inStock?: boolean;
}

interface StorefrontSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RecentSearch {
  query: string;
  timestamp: number;
  resultCount?: number;
}

// ========================================
// Search History Utils (Tenant-specific)
// ========================================

const MAX_HISTORY_ITEMS = 8;

function getSearchHistoryKey(tenantId: string): string {
  return `tesserix_storefront_search_${tenantId}`;
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
    localStorage.setItem(getSearchHistoryKey(tenantId), JSON.stringify(history.slice(0, MAX_HISTORY_ITEMS)));
  } catch {
    // Ignore storage errors
  }
}

function addToSearchHistory(tenantId: string, query: string, resultCount?: number): void {
  if (!query || query.length < 2 || !tenantId) return;
  const history = getSearchHistory(tenantId);
  const filtered = history.filter(h => h.query.toLowerCase() !== query.toLowerCase());
  const newHistory: RecentSearch[] = [
    { query, timestamp: Date.now(), resultCount },
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
// Popular Searches (Could be fetched from analytics)
// ========================================

const POPULAR_SEARCHES = [
  'New arrivals',
  'Sale',
  'Best sellers',
  'Gift ideas',
];

// ========================================
// Component
// ========================================

export function StorefrontSearch({ isOpen, onClose }: StorefrontSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductSearchResult[]>([]);
  const [categories, setCategories] = useState<CategorySearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { tenant } = useTenant();
  const getNavPath = useNavPath();
  const formatPrice = useFormatPrice();

  // Load search history when opened
  useEffect(() => {
    if (isOpen && tenant?.id) {
      setRecentSearches(getSearchHistory(tenant.id));
    }
  }, [isOpen, tenant?.id]);

  // Search function with debounce
  useEffect(() => {
    if (!query || query.length < 2 || !tenant?.id || !tenant?.storefrontId) {
      setProducts([]);
      setCategories([]);
      setSearchError(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const [productsResult, categoriesResult] = await Promise.all([
          searchProducts(tenant.id, tenant.storefrontId, query, { per_page: 6 }),
          searchCategories(tenant.id, tenant.storefrontId, query, { per_page: 3 }),
        ]);
        setProducts(productsResult.hits || []);
        setCategories(categoriesResult.hits || []);
      } catch (error) {
        console.error('Search error:', error);
        setSearchError('Search temporarily unavailable');
        setProducts([]);
        setCategories([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, tenant?.id, tenant?.storefrontId]);

  // Transform results for navigation
  const allResults: SearchResultItem[] = useMemo(() => {
    const items: SearchResultItem[] = [];

    categories.forEach(cat => {
      items.push({
        id: cat.id,
        type: 'category',
        title: cat.name,
        subtitle: cat.description || `${cat.product_count || 0} products`,
        href: getNavPath(`/category/${cat.slug}`),
      });
    });

    products.forEach(prod => {
      items.push({
        id: prod.id,
        type: 'product',
        title: prod.name,
        subtitle: prod.brand,
        href: getNavPath(`/product/${prod.id}`),
        imageUrl: prod.image_url,
        price: prod.price,
        salePrice: prod.sale_price,
        inStock: prod.in_stock,
      });
    });

    return items;
  }, [products, categories, getNavPath]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setProducts([]);
      setCategories([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Calculate total result count for history
  const totalResultCount = products.length + categories.length;

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allResults[selectedIndex]) {
          // Save to history before navigating
          if (query.length >= 2 && tenant?.id) {
            addToSearchHistory(tenant.id, query, totalResultCount);
          }
          router.push(allResults[selectedIndex].href);
          onClose();
        } else if (query.length >= 2) {
          // Save to history before navigating
          if (tenant?.id) {
            addToSearchHistory(tenant.id, query, totalResultCount);
          }
          router.push(getNavPath(`/search?q=${encodeURIComponent(query)}`));
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [allResults, selectedIndex, query, router, onClose, getNavPath, tenant?.id, totalResultCount]
  );

  // Scroll selected into view
  useEffect(() => {
    if (resultsRef.current) {
      const el = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handlePopularSearch = (term: string) => {
    setQuery(term);
  };

  const handleRecentSearch = (term: string) => {
    setQuery(term);
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tenant?.id) {
      clearSearchHistory(tenant.id);
      setRecentSearches([]);
    }
  };

  const handleViewAll = () => {
    if (query) {
      // Save to history
      if (tenant?.id) {
        addToSearchHistory(tenant.id, query, totalResultCount);
      }
      router.push(getNavPath(`/search?q=${encodeURIComponent(query)}`));
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Search Container */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-3xl mx-auto mt-16 sm:mt-24"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mx-4">
            {/* Search Input */}
            <div className="flex items-center px-4 border-b border-gray-100">
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search products, categories..."
                className="flex-1 h-14 px-4 text-base bg-transparent border-0 outline-none placeholder:text-gray-400"
                maxLength={100}
              />
              {isSearching && (
                <Loader2 className="w-5 h-5 text-tenant-primary animate-spin shrink-0 mr-2" />
              )}
              {query && !isSearching && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1.5 mr-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Error Message */}
            {searchError && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {/* Results */}
            <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto">
              {query.length === 0 ? (
                // Empty state - show recent searches, popular searches, and quick links
                <div className="p-4">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <>
                      <div className="flex items-center justify-between mb-2">
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
                      <div className="flex flex-wrap gap-2 mb-4">
                        {recentSearches.slice(0, 5).map((recent, idx) => (
                          <button
                            key={`recent-${idx}`}
                            onClick={() => handleRecentSearch(recent.query)}
                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors flex items-center gap-1.5"
                          >
                            <Clock className="w-3 h-3 text-gray-400" />
                            {recent.query}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Popular Searches */}
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Popular Searches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_SEARCHES.map(term => (
                      <button
                        key={term}
                        onClick={() => handlePopularSearch(term)}
                        className="px-3 py-1.5 text-sm bg-tenant-primary/10 hover:bg-tenant-primary/20 text-tenant-primary rounded-full transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-6 flex items-center gap-2">
                    <ArrowRight className="w-3.5 h-3.5" />
                    Quick Links
                  </p>
                  <div className="space-y-1">
                    <Link
                      href={getNavPath('/products')}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Package className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">All Products</p>
                        <p className="text-xs text-gray-500">Browse our catalog</p>
                      </div>
                    </Link>
                    <Link
                      href={getNavPath('/categories')}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
                        <FolderTree className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Categories</p>
                        <p className="text-xs text-gray-500">Shop by category</p>
                      </div>
                    </Link>
                  </div>
                </div>
              ) : query.length < 2 ? (
                <div className="p-8 text-center">
                  <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm text-gray-500">Type at least 2 characters</p>
                </div>
              ) : allResults.length === 0 && !isSearching ? (
                <div className="p-8 text-center">
                  <Search className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">No results for "{query}"</p>
                  <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
                </div>
              ) : (
                <div className="py-2">
                  {/* Categories */}
                  {categories.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 px-4">
                        Categories
                      </p>
                      {categories.map((cat, idx) => {
                        const resultIndex = idx;
                        const isSelected = resultIndex === selectedIndex;
                        return (
                          <Link
                            key={cat.id}
                            href={getNavPath(`/category/${cat.slug}`)}
                            data-index={resultIndex}
                            onClick={onClose}
                            className={cn(
                              'flex items-center gap-3 px-4 py-2.5 transition-colors',
                              isSelected ? 'bg-tenant-primary/5' : 'hover:bg-gray-50'
                            )}
                          >
                            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                              <FolderTree className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{cat.name}</p>
                              <p className="text-xs text-gray-500 truncate">{cat.product_count || 0} products</p>
                            </div>
                            {isSelected && <ArrowRight className="w-4 h-4 text-tenant-primary shrink-0" />}
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Products */}
                  {products.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 px-4">
                        Products
                      </p>
                      {products.map((prod, idx) => {
                        const resultIndex = categories.length + idx;
                        const isSelected = resultIndex === selectedIndex;
                        return (
                          <Link
                            key={prod.id}
                            href={getNavPath(`/product/${prod.id}`)}
                            data-index={resultIndex}
                            onClick={onClose}
                            className={cn(
                              'flex items-center gap-3 px-4 py-2.5 transition-colors',
                              isSelected ? 'bg-tenant-primary/5' : 'hover:bg-gray-50'
                            )}
                          >
                            {prod.image_url ? (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                                <Image
                                  src={prod.image_url}
                                  alt={prod.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{prod.name}</p>
                              <div className="flex items-center gap-2">
                                {prod.brand && (
                                  <span className="text-xs text-gray-500">{prod.brand}</span>
                                )}
                                {prod.price !== undefined && prod.price > 0 && (
                                  <span className="text-xs font-semibold text-tenant-primary">
                                    {formatPrice(prod.sale_price || prod.price)}
                                  </span>
                                )}
                                {!prod.in_stock && (
                                  <span className="text-xs text-red-500">Out of stock</span>
                                )}
                              </div>
                            </div>
                            {isSelected && <ArrowRight className="w-4 h-4 text-tenant-primary shrink-0" />}
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* View All Button */}
                  {(products.length > 0 || categories.length > 0) && (
                    <div className="p-4 pt-2">
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
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 text-xs text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">↑↓</kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">↵</kbd>
                  <span>Select</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono shadow-sm">Esc</kbd>
                  <span>Close</span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
