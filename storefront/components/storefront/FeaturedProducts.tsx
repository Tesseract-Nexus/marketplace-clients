'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCardSkeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/product/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Product } from '@/types/storefront';
import { useTenant, useProductConfig, useNavPath } from '@/context/TenantContext';
import { cn } from '@/lib/utils';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

interface FeaturedProductsProps {
  title?: string;
  subtitle?: string;
  products: Product[];
  isLoading?: boolean;
  showViewAll?: boolean;
}

export function FeaturedProducts({
  title = 'Featured Products',
  subtitle,
  products,
  isLoading = false,
  showViewAll = true,
}: FeaturedProductsProps) {
  const productConfig = useProductConfig();
  const getNavPath = useNavPath();

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  }[productConfig.gridColumns];

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20">
      <div className="container-tenant">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
              <TranslatedUIText text={title} />
            </h2>
            {subtitle && (
              <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2 line-clamp-2">
                <TranslatedUIText text={subtitle} />
              </p>
            )}
          </div>
          {showViewAll && (
            <Button
              variant="tenant-outline"
              size="sm"
              asChild
              className="shrink-0 group sm:size-default"
            >
              <Link href={getNavPath('/products')}>
                <span className="hidden sm:inline"><TranslatedUIText text="View All" /></span>
                <span className="sm:hidden"><TranslatedUIText text="All" /></span>
                <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          )}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className={cn('grid gap-3 sm:gap-4 md:gap-6', gridCols)}>
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} className="animate-fade-up" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className={cn('grid gap-3 sm:gap-4 md:gap-6', gridCols)}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            variant="products"
            action={{
              label: 'Browse Categories',
              href: getNavPath('/categories'),
            }}
          />
        )}
      </div>
    </section>
  );
}
