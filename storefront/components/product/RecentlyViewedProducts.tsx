'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Clock, ArrowRight } from 'lucide-react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useNavPath } from '@/context/TenantContext';
import { usePriceFormatting } from '@/context/CurrencyContext';
import { Button } from '@/components/ui/button';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { cn } from '@/lib/utils';

interface RecentlyViewedProductsProps {
  /** Maximum number of products to show */
  maxItems?: number;
  /** Title to display above the products */
  title?: string;
  /** Optional className for styling */
  className?: string;
  /** Show "View All" link */
  showViewAll?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

/**
 * RecentlyViewedProducts Component
 *
 * Displays a grid of recently viewed products from localStorage.
 * Shows nothing if no products have been viewed.
 */
export function RecentlyViewedProducts({
  maxItems = 4,
  title = 'Recently Viewed',
  className,
  showViewAll = false,
  compact = false,
}: RecentlyViewedProductsProps) {
  const { recentlyViewed, isLoaded, hasItems } = useRecentlyViewed();
  const getNavPath = useNavPath();
  const { formatDisplayPrice } = usePriceFormatting();

  // Don't render until loaded or if no items
  if (!isLoaded || !hasItems) {
    return null;
  }

  const displayProducts = recentlyViewed.slice(0, maxItems);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h3 className="font-semibold text-lg">
            <TranslatedUIText text={title} />
          </h3>
        </div>
        {showViewAll && recentlyViewed.length > maxItems && (
          <Link
            href={getNavPath('/products')}
            className="text-sm text-tenant-primary hover:underline flex items-center gap-1"
          >
            <TranslatedUIText text="View All" />
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Products Grid */}
      <div
        className={cn(
          'grid gap-4',
          compact
            ? 'grid-cols-2 sm:grid-cols-4'
            : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
        )}
      >
        {displayProducts.map((product, index) => (
          <motion.div
            key={product.productId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              href={getNavPath(`/products/${product.productId}`)}
              className="group block bg-card rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className={cn(
                'relative bg-muted overflow-hidden',
                compact ? 'aspect-square' : 'aspect-[4/3]'
              )}>
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <span className="text-xs">No image</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className={cn('p-3', compact && 'p-2')}>
                <h4 className={cn(
                  'font-medium text-sm line-clamp-2 group-hover:text-tenant-primary transition-colors',
                  compact && 'text-xs'
                )}>
                  {product.name}
                </h4>
                <p className={cn(
                  'mt-1 font-semibold text-tenant-primary',
                  compact ? 'text-sm' : 'text-base'
                )}>
                  {formatDisplayPrice(product.price)}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Browse Products CTA */}
      {displayProducts.length < 4 && (
        <div className="text-center pt-2">
          <Button asChild variant="outline" size="sm">
            <Link href={getNavPath('/products')}>
              <TranslatedUIText text="Discover More Products" />
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default RecentlyViewedProducts;
