'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileQuestion, Search, Home, ShoppingBag, ArrowRight } from 'lucide-react';
import { RecentlyViewedProducts } from '@/components/product/RecentlyViewedProducts';
import { useNavPath } from '@/context/TenantContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const getNavPath = useNavPath();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(getNavPath(`/search?q=${encodeURIComponent(searchQuery.trim())}`));
    }
  };

  // Popular search suggestions
  const popularSearches = ['Shirts', 'Shoes', 'Electronics', 'Home Decor'];

  return (
    <div className="min-h-[80vh] px-4 py-12">
      <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in duration-500">
        {/* Icon */}
        <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
          <FileQuestion className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
        </div>

        {/* Title and Description */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            <TranslatedUIText text="Page Not Found" />
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            <TranslatedUIText text="We couldn't find what you were looking for. Try searching or explore our products." />
          </p>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-24 h-12 text-base"
              aria-label="Search products"
            />
            <Button
              type="submit"
              size="sm"
              className="absolute right-1.5 top-1/2 -translate-y-1/2"
            >
              <TranslatedUIText text="Search" />
            </Button>
          </div>
        </form>

        {/* Popular Searches */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            <TranslatedUIText text="Popular searches:" />
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {popularSearches.map((term) => (
              <Link
                key={term}
                href={getNavPath(`/search?q=${encodeURIComponent(term)}`)}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild size="lg" variant="default">
            <Link href={getNavPath('/')}>
              <Home className="h-4 w-4 mr-2" aria-hidden="true" />
              <TranslatedUIText text="Return Home" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={getNavPath('/products')}>
              <ShoppingBag className="h-4 w-4 mr-2" aria-hidden="true" />
              <TranslatedUIText text="Browse Products" />
              <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Recently Viewed Products */}
      <div className="max-w-4xl mx-auto mt-16">
        <RecentlyViewedProducts
          maxItems={4}
          title="You might be looking for"
          compact
        />
      </div>
    </div>
  );
}
