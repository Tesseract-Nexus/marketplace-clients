'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/ProductCard';
import { Product } from '@/types/storefront';
import { useNavPath } from '@/context/TenantContext';
import { cn } from '@/lib/utils';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

interface ProductCarouselProps {
  title?: string;
  subtitle?: string;
  products: Product[];
  showViewAll?: boolean;
}

export function ProductCarousel({
  title = 'Featured Products',
  subtitle,
  products,
  showViewAll = true,
}: ProductCarouselProps) {
  const getNavPath = useNavPath();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = container.firstElementChild?.clientWidth || 280;
    const scrollAmount = direction === 'left' ? -cardWidth * 2 : cardWidth * 2;

    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkScrollability, 300);
  };

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-12 md:py-16">
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
          <div className="flex items-center gap-2 shrink-0">
            {/* Navigation buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className="h-10 w-10 rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className="h-10 w-10 rounded-full"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            {showViewAll && (
              <Button
                variant="tenant-outline"
                size="sm"
                asChild
                className="group"
              >
                <Link href={getNavPath('/products')}>
                  <span className="hidden sm:inline">
                    <TranslatedUIText text="View All" />
                  </span>
                  <span className="sm:hidden">
                    <TranslatedUIText text="All" />
                  </span>
                  <ArrowRight className="ml-1 sm:ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Carousel */}
        <div className="relative -mx-4 sm:-mx-6 md:mx-0">
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollability}
            className={cn(
              "flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory",
              "px-4 sm:px-6 md:px-0",
              "scroll-smooth"
            )}
            style={{
              scrollSnapType: 'x mandatory',
            }}
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className="flex-shrink-0 w-[260px] sm:w-[280px] md:w-[300px] snap-start"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>

          {/* Gradient fades for desktop */}
          <div className="hidden md:block absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="hidden md:block absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}

export default ProductCarousel;
