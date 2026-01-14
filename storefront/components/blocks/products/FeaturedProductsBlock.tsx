'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNavPath } from '@/context/TenantContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { cn } from '@/lib/utils';
import type { FeaturedProductsBlockConfig } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';
import type { Product } from '@/types/storefront';

// =============================================================================
// FEATURED PRODUCTS BLOCK
// =============================================================================

export function FeaturedProductsBlock({ config }: BlockComponentProps<FeaturedProductsBlockConfig>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const getNavPath = useNavPath();

  const isCarousel = config.variant === 'carousel';

  // Fetch products based on source
  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      try {
        // Build query based on source type
        const params = new URLSearchParams();
        if (config.source.limit) params.set('limit', String(config.source.limit));

        let endpoint = '/api/products';

        switch (config.source.type) {
          case 'category':
            if (config.source.categoryId) {
              params.set('category', config.source.categoryId);
            }
            break;
          case 'collection':
            if (config.source.collectionId) {
              endpoint = `/api/collections/${config.source.collectionId}/products`;
            }
            break;
          case 'tag':
            if (config.source.tag) {
              params.set('tag', config.source.tag);
            }
            break;
          case 'bestsellers':
            params.set('sort', 'bestselling');
            break;
          case 'new-arrivals':
            params.set('sort', 'newest');
            break;
          case 'trending':
            params.set('sort', 'trending');
            break;
          case 'manual':
            if (config.source.productIds && config.source.productIds.length > 0) {
              params.set('ids', config.source.productIds.join(','));
            }
            break;
        }

        const response = await fetch(`${endpoint}?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products || data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [config.source]);

  // Check scroll position for carousel
  const checkScroll = () => {
    if (!scrollRef.current || !isCarousel) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
  }, [products, isCarousel]);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  // Grid columns
  const gridCols = config.columns || { mobile: 2, tablet: 3, desktop: 4 };
  const gridClassName = cn(
    'grid gap-4 md:gap-6',
    `grid-cols-${gridCols.mobile}`,
    `md:grid-cols-${gridCols.tablet}`,
    `lg:grid-cols-${gridCols.desktop}`
  );

  return (
    <section className="py-8 sm:py-12 md:py-16">
      <div className="container-tenant">
        {/* Header */}
        {(config.title || config.subtitle) && (
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              {config.title && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-2 mb-2"
                >
                  <Sparkles className="w-5 h-5 text-tenant-primary" />
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    <TranslatedUIText text={config.title} />
                  </h2>
                </motion.div>
              )}
              {config.subtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-muted-foreground"
                >
                  <TranslatedUIText text={config.subtitle} />
                </motion.p>
              )}
            </div>

            {config.showViewAll && config.viewAllUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <Button variant="tenant-outline" asChild className="group">
                  <Link href={getNavPath(config.viewAllUrl)}>
                    <TranslatedUIText text={config.viewAllText || 'View All'} />
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>
            )}
          </div>
        )}

        {/* Products */}
        {isLoading ? (
          <div className={gridClassName}>
            {[...Array(config.source.limit || 4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            variant="products"
            action={{
              label: 'Browse All Products',
              href: getNavPath('/products'),
            }}
          />
        ) : isCarousel ? (
          /* Carousel Layout */
          <div className="relative">
            {/* Navigation */}
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={cn(
                'absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background shadow-lg border flex items-center justify-center transition-all',
                canScrollLeft ? 'opacity-100 hover:scale-110' : 'opacity-0'
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={cn(
                'absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background shadow-lg border flex items-center justify-center transition-all',
                canScrollRight ? 'opacity-100 hover:scale-110' : 'opacity-0'
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Carousel */}
            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
            >
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-none w-64 sm:w-72 snap-start"
                >
                  <ProductCard
                    product={product}
                    showQuickAdd={config.showQuickAdd}
                    showWishlist={config.showWishlist}
                    showRating={config.showRating}
                    showBadges={config.showBadges}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          /* Grid Layout */
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
            }}
            className={gridClassName}
          >
            {products.map((product) => (
              <motion.div
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <ProductCard
                  product={product}
                  showQuickAdd={config.showQuickAdd}
                  showWishlist={config.showWishlist}
                  showRating={config.showRating}
                  showBadges={config.showBadges}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default FeaturedProductsBlock;
