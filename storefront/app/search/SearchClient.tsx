'use client';

import { useState, useTransition, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTenant, useNavPath } from '@/context/TenantContext';
import { useCartStore } from '@/store/cart';
import { Product } from '@/types/storefront';
import { getProductShippingData } from '@/lib/utils/product-shipping';
import { TranslatedProductName, TranslatedUIText } from '@/components/translation/TranslatedText';
import { SearchFilters, type SearchFiltersState } from '@/components/search/SearchFilters';
import { SearchSuggestions } from '@/components/search/SearchSuggestions';
import { useAnalytics } from '@/lib/analytics/openpanel';

interface SearchClientProps {
  initialResults: Product[];
  initialQuery: string;
}

const DEFAULT_FILTERS: SearchFiltersState = {
  priceRange: [0, 1000],
  inStockOnly: false,
  onSaleOnly: false,
  categories: [],
};

export function SearchClient({ initialResults, initialQuery }: SearchClientProps) {
  const router = useRouter();
  const { settings } = useTenant();
  const getNavPath = useNavPath();
  const addToCart = useCartStore((state) => state.addItem);

  const analytics = useAnalytics();
  const [sortBy, setSortBy] = useState('relevance');
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<SearchFiltersState>(DEFAULT_FILTERS);

  // Track search performed
  useEffect(() => {
    if (initialQuery) {
      analytics.searchPerformed({ query: initialQuery, resultCount: initialResults.length });
    }
  }, [initialQuery, initialResults.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Extract unique categories from results
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    initialResults.forEach((product) => {
      (product.categories || []).forEach((cat) => {
        if (typeof cat === 'string') categories.add(cat);
      });
    });
    return Array.from(categories).sort();
  }, [initialResults]);

  // Calculate price range from results
  const priceRange = useMemo(() => {
    if (initialResults.length === 0) return { min: 0, max: 1000 };
    const prices = initialResults.map((p) => parseFloat(p.price) || 0);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [initialResults]);

  // Apply filters to results
  const filteredResults = useMemo(() => {
    return initialResults.filter((product) => {
      const price = parseFloat(product.price) || 0;

      // Price filter
      if (price < filters.priceRange[0] || price > filters.priceRange[1]) {
        return false;
      }

      // In stock filter
      if (filters.inStockOnly && product.inventoryStatus !== 'IN_STOCK') {
        return false;
      }

      // On sale filter
      if (filters.onSaleOnly) {
        const comparePrice = product.comparePrice ? parseFloat(product.comparePrice) : null;
        if (!comparePrice || comparePrice <= price) {
          return false;
        }
      }

      // Category filter
      if (filters.categories.length > 0) {
        const productCategories = (product.categories || []).map((c) =>
          typeof c === 'string' ? c : ''
        );
        if (!filters.categories.some((cat) => productCategories.includes(cat))) {
          return false;
        }
      }

      return true;
    });
  }, [initialResults, filters]);

  // Sort filtered results
  const searchResults = useMemo(() => {
    const sorted = [...filteredResults];
    switch (sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price-desc':
        sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      // relevance - keep original order
    }
    return sorted;
  }, [filteredResults, sortBy]);

  const handleSearch = (searchQuery: string) => {
    startTransition(() => {
      router.push(`?q=${encodeURIComponent(searchQuery)}`);
    });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container-tenant">
        {/* Search Input with Suggestions */}
        <div className="max-w-2xl mx-auto mb-8">
          <SearchSuggestions
            initialQuery={initialQuery}
            onSearch={handleSearch}
            autoFocus={!initialQuery}
          />
        </div>

        {initialQuery && (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold">
                  {isPending ? <TranslatedUIText text="Searching..." /> : (
                    <><TranslatedUIText text="Results for" /> &quot;{initialQuery}&quot;</>
                  )}
                </h1>
                {!isPending && (
                  <p className="text-muted-foreground">
                    {searchResults.length} <TranslatedUIText text={searchResults.length === 1 ? 'product found' : 'products found'} />
                    {filteredResults.length !== initialResults.length && (
                      <span className="text-xs ml-1">
                        (<TranslatedUIText text="filtered from" /> {initialResults.length})
                      </span>
                    )}
                  </p>
                )}
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance"><TranslatedUIText text="Relevance" /></SelectItem>
                  <SelectItem value="newest"><TranslatedUIText text="Newest" /></SelectItem>
                  <SelectItem value="price-asc"><TranslatedUIText text="Price: Low to High" /></SelectItem>
                  <SelectItem value="price-desc"><TranslatedUIText text="Price: High to Low" /></SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Filters */}
            <div className="mb-6">
              <SearchFilters
                filters={filters}
                onFiltersChange={setFilters}
                availableCategories={availableCategories}
                priceMin={priceRange.min}
                priceMax={priceRange.max}
                resultCount={filteredResults.length}
              />
            </div>
          </>
        )}

        {initialQuery && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-6">
            <AnimatePresence>
              {searchResults.map((product, index) => {
                const price = parseFloat(product.price);
                const comparePrice = product.comparePrice ? parseFloat(product.comparePrice) : null;
                const hasDiscount = comparePrice && comparePrice > price;
                const images = (product.images || []).map((img) =>
                  typeof img === 'string' ? img : img.url
                );

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-card rounded-xl border overflow-hidden"
                  >
                    <Link href={getNavPath(`/products/${product.id}`)}>
                      <div className="relative aspect-square bg-muted overflow-hidden">
                        <Image
                          src={images[0] || '/placeholder.svg'}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        {hasDiscount && (
                          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                            <TranslatedUIText text="Sale" />
                          </Badge>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link
                        href={getNavPath(`/products/${product.id}`)}
                        className="font-medium line-clamp-2 hover:text-tenant-primary transition-colors"
                      >
                        <TranslatedProductName name={product.name} />
                      </Link>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="font-bold">${price.toFixed(2)}</span>
                        {hasDiscount && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${comparePrice?.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <Button
                        className="w-full mt-3 btn-tenant-primary"
                        size="sm"
                        onClick={() => {
                          const shippingData = getProductShippingData(product);
                          addToCart({
                            productId: product.id,
                            name: product.name,
                            price,
                            quantity: 1,
                            image: images[0],
                            ...shippingData,
                          });
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        <TranslatedUIText text="Add to Cart" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {initialQuery && searchResults.length === 0 && !isPending && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2"><TranslatedUIText text="No results found" /></h2>
            <p className="text-muted-foreground mb-6">
              <TranslatedUIText text="We couldn't find any products matching" /> &quot;{initialQuery}&quot;.
            </p>
            <Button asChild className="btn-tenant-primary">
              <Link href={getNavPath('/products')}><TranslatedUIText text="Browse All Products" /></Link>
            </Button>
          </div>
        )}

        {!initialQuery && (
          <div className="text-center py-16">
            <div
              className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: `${settings.primaryColor}15` }}
            >
              <Search className="h-12 w-12 text-tenant-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Start your search</h2>
            <p className="text-muted-foreground">
              Type a product name or keyword to find what you're looking for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
