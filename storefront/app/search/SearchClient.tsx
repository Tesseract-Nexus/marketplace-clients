'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface SearchClientProps {
  initialResults: Product[];
  initialQuery: string;
}

export function SearchClient({ initialResults, initialQuery }: SearchClientProps) {
  const router = useRouter();
  const { settings } = useTenant();
  const getNavPath = useNavPath();
  const addToCart = useCartStore((state) => state.addItem);

  const [query, setQuery] = useState(initialQuery);
  const [sortBy, setSortBy] = useState('relevance');
  const [isPending, startTransition] = useTransition();
  const [recentSearches] = useState(['headphones', 'watch', 'laptop']);

  const searchResults = initialResults;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      startTransition(() => {
        router.push(`?q=${encodeURIComponent(query)}`);
      });
    }
  };

  const handleClear = () => {
    setQuery('');
    startTransition(() => {
      router.push('?');
    });
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container-tenant">
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 pr-12 h-14 text-lg rounded-full border-2 focus:border-tenant-primary"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
                onClick={handleClear}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </form>

          {!initialQuery && recentSearches.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2"><TranslatedUIText text="Recent searches" /></p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search) => (
                  <Button
                    key={search}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      setQuery(search);
                      startTransition(() => {
                        router.push(`?q=${encodeURIComponent(search)}`);
                      });
                    }}
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {initialQuery && (
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                {isPending ? <TranslatedUIText text="Searching..." /> : (
                  <><TranslatedUIText text="Results for" /> &quot;{initialQuery}&quot;</>
                )}
              </h1>
              {!isPending && (
                <p className="text-muted-foreground">
                  {searchResults.length} <TranslatedUIText text={searchResults.length === 1 ? 'product found' : 'products found'} />
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
        )}

        {initialQuery && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
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
