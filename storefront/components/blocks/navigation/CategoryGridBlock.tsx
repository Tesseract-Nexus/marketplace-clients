'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavPath } from '@/context/TenantContext';
import { TranslatedUIText, TranslatedCategoryName } from '@/components/translation/TranslatedText';
import { cn } from '@/lib/utils';
import type { CategoryGridBlockConfig, CategoryGridItem } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';
import type { Category } from '@/types/storefront';

// =============================================================================
// CATEGORY GRID BLOCK
// =============================================================================

export function CategoryGridBlock({ config }: BlockComponentProps<CategoryGridBlockConfig>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<(Category & Partial<CategoryGridItem>)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const getNavPath = useNavPath();

  const isCarousel = config.layout === 'carousel';

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      setIsLoading(true);
      try {
        if (config.source.type === 'manual' && config.source.categories) {
          // Use manually configured categories
          // In real implementation, you'd fetch full category data by ID
          setCategories(config.source.categories as any);
        } else {
          // Fetch from API
          const params = new URLSearchParams();
          if (config.source.parentCategoryId) {
            params.set('parent', config.source.parentCategoryId);
          }
          if (config.source.level !== undefined) {
            params.set('level', String(config.source.level));
          }
          if (config.source.limit) {
            params.set('limit', String(config.source.limit));
          }

          const response = await fetch(`/api/categories?${params.toString()}`);
          if (response.ok) {
            const data = await response.json();
            setCategories(data.categories || data.data || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, [config.source]);

  // Scroll handlers for carousel
  const checkScroll = () => {
    if (!scrollRef.current || !isCarousel) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    if (isCarousel) checkScroll();
  }, [categories, isCarousel]);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -240, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 240, behavior: 'smooth' });
  };

  // Grid columns
  const gridCols = config.columns || { mobile: 2, tablet: 3, desktop: 6 };

  if (isLoading) {
    return <CategoryGridSkeleton config={config} />;
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-muted/30">
      <div className="container-tenant">
        {/* Header */}
        {(config.title || config.badge) && (
          <div className="text-center mb-8 sm:mb-10">
            {config.badge && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tenant-primary/10 text-tenant-primary mb-4"
              >
                {config.badge.icon ? (
                  <span>{config.badge.icon}</span>
                ) : (
                  <Grid3X3 className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">{config.badge.text}</span>
              </motion.div>
            )}
            {config.title && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold"
              >
                <TranslatedUIText text={config.title} />
              </motion.h2>
            )}
            {config.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground mt-2 max-w-2xl mx-auto"
              >
                <TranslatedUIText text={config.subtitle} />
              </motion.p>
            )}
          </div>
        )}

        {/* Categories */}
        {isCarousel ? (
          /* Carousel Layout */
          <div className="relative">
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

            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
            >
              {categories.map((category, index) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  index={index}
                  config={config}
                  getNavPath={getNavPath}
                  className="flex-none w-32 sm:w-36 snap-start"
                />
              ))}
            </div>
          </div>
        ) : config.layout === 'list' ? (
          /* List Layout */
          <div className="space-y-3">
            {categories.map((category, index) => (
              <CategoryListItem
                key={category.id}
                category={category}
                index={index}
                config={config}
                getNavPath={getNavPath}
              />
            ))}
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
            className={cn(
              'grid gap-3 sm:gap-4 md:gap-6',
              `grid-cols-${gridCols.mobile}`,
              `sm:grid-cols-${gridCols.tablet}`,
              `lg:grid-cols-${gridCols.desktop}`
            )}
          >
            {categories.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                index={index}
                config={config}
                getNavPath={getNavPath}
              />
            ))}
          </motion.div>
        )}

        {/* View All */}
        {config.viewAllUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Button variant="tenant-outline" asChild className="group">
              <Link href={getNavPath(config.viewAllUrl)}>
                <TranslatedUIText text={config.viewAllText || 'View All Categories'} />
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}

// =============================================================================
// CATEGORY CARD
// =============================================================================

interface CategoryCardProps {
  category: Category & Partial<CategoryGridItem>;
  index: number;
  config: CategoryGridBlockConfig;
  getNavPath: (path: string) => string;
  className?: string;
}

function CategoryCard({ category, index, config, getNavPath, className }: CategoryCardProps) {
  const aspectClass = getAspectClass(config.aspectRatio);
  const hoverClass = getHoverClass(config.hoverEffect);
  const href = category.url || `/products?category=${category.id}`;

  // Icon-only style
  if (config.cardStyle === 'icon') {
    return (
      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 0.9 },
          visible: { opacity: 1, scale: 1 },
        }}
        className={className}
      >
        <Link
          href={getNavPath(href)}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl bg-background border hover:border-tenant-primary hover:shadow-md transition-all group',
            hoverClass
          )}
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-tenant-primary/10 flex items-center justify-center group-hover:bg-tenant-primary/20 transition-colors">
            {(() => {
              const imgUrl = category.images?.[0]?.url || category.image?.url || (category.imageUrl && category.imageUrl.trim() !== '' ? category.imageUrl : null);
              return imgUrl ? (
                <Image
                  src={imgUrl}
                  alt={category.name}
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              ) : (
                <Grid3X3 className="w-6 h-6 text-tenant-primary" />
              );
            })()}
          </div>
          <span className="text-sm font-medium text-center line-clamp-2">
            <TranslatedCategoryName name={category.title || category.name} />
          </span>
          {config.showProductCount && category.productCount !== undefined && (
            <span className="text-xs text-muted-foreground">
              {category.productCount} products
            </span>
          )}
        </Link>
      </motion.div>
    );
  }

  // Image-based styles
  const imgUrl = category.images?.[0]?.url || category.image?.url || (category.imageUrl && category.imageUrl.trim() !== '' ? category.imageUrl : null);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={className}
    >
      <Link
        href={getNavPath(href)}
        className={cn(
          'group block relative overflow-hidden rounded-xl sm:rounded-2xl',
          aspectClass,
          hoverClass
        )}
      >
        {/* Image Container with Ken Burns effect */}
        <div className="absolute inset-0 overflow-hidden">
          {imgUrl ? (
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1 }}
              animate={{
                scale: [1, 1.08, 1.04, 1.1, 1],
              }}
              transition={{
                duration: 18 + (index % 5) * 2, // Varied timing for visual interest
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <Image
                src={imgUrl}
                alt={category.name}
                fill
                className={cn(
                  'object-cover transition-transform duration-700 ease-out',
                  config.hoverEffect === 'zoom' && 'group-hover:scale-115'
                )}
              />
            </motion.div>
          ) : (
            <motion.div
              className={cn(
                'absolute inset-0 bg-gradient-to-br',
                GRADIENT_CLASSES[index % GRADIENT_CLASSES.length]
              )}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{
                duration: 8,
                ease: "easeInOut",
                repeat: Infinity,
              }}
              style={{ backgroundSize: '200% 200%' }}
            />
          )}
        </div>

        {/* Animated Overlay */}
        {config.cardStyle !== 'image-only' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
            whileHover={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }}
            transition={{ duration: 0.4 }}
          />
        )}

        {/* Shine sweep effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '200%' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>

        {/* Badge */}
        {category.badge && (
          <motion.div
            className="absolute top-2 right-2 px-2 py-1 bg-tenant-primary text-white text-xs font-medium rounded"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
          >
            {category.badge}
          </motion.div>
        )}

        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/40 rounded-full"
              style={{
                left: `${20 + i * 30}%`,
                bottom: '20%',
              }}
              animate={{
                y: [0, -25, -50],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        {/* Content with enhanced animations */}
        {config.cardStyle !== 'image-only' && (
          <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 z-10">
            <motion.h3
              className="text-base sm:text-lg font-bold text-white mb-0.5 line-clamp-2"
              initial={{ x: 0 }}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <TranslatedCategoryName name={category.title || category.name} />
            </motion.h3>
            {config.showProductCount && category.productCount !== undefined && (
              <span className="text-xs sm:text-sm text-white/80">
                {category.productCount} products
              </span>
            )}
            <motion.div
              className="flex items-center gap-1 text-xs sm:text-sm text-white/90 mt-1"
              whileHover={{ gap: '0.5rem' }}
              transition={{ duration: 0.3 }}
            >
              <span className="font-medium">
                <TranslatedUIText text="Shop Now" />
              </span>
              <motion.span
                initial={{ x: 0 }}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </motion.span>
            </motion.div>
          </div>
        )}

        {/* Border glow on hover */}
        <motion.div
          className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none"
          initial={{ boxShadow: 'inset 0 0 0 0 transparent' }}
          whileHover={{
            boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.2), 0 0 25px rgba(var(--tenant-primary-rgb, 139, 92, 246), 0.25)'
          }}
          transition={{ duration: 0.4 }}
        />
      </Link>
    </motion.div>
  );
}

// =============================================================================
// CATEGORY LIST ITEM
// =============================================================================

function CategoryListItem({
  category,
  index,
  config,
  getNavPath,
}: CategoryCardProps) {
  const href = category.url || `/products?category=${category.id}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        href={getNavPath(href)}
        className="flex items-center gap-4 p-4 rounded-xl bg-background border hover:border-tenant-primary hover:shadow-sm transition-all group"
      >
        {/* Image - prefer images array, fallback to imageUrl */}
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {(() => {
            const imgUrl = category.images?.[0]?.url || category.image?.url || (category.imageUrl && category.imageUrl.trim() !== '' ? category.imageUrl : null);
            return imgUrl ? (
              <Image
                src={imgUrl}
                alt={category.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-tenant-primary/10 flex items-center justify-center">
                <Grid3X3 className="w-6 h-6 text-tenant-primary" />
              </div>
            );
          })()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-tenant-primary transition-colors">
            <TranslatedCategoryName name={category.title || category.name} />
          </h3>
          {config.showProductCount && category.productCount !== undefined && (
            <p className="text-sm text-muted-foreground">
              {category.productCount} products
            </p>
          )}
        </div>

        {/* Arrow */}
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-tenant-primary group-hover:translate-x-1 transition-all" />
      </Link>
    </motion.div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

function CategoryGridSkeleton({ config }: { config: CategoryGridBlockConfig }) {
  const cols = config.columns || { mobile: 2, tablet: 3, desktop: 6 };
  const count = config.source.limit || 6;

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-muted/30">
      <div className="container-tenant">
        <div className="text-center mb-8">
          <div className="h-8 w-48 bg-muted rounded mx-auto mb-2 animate-pulse" />
          <div className="h-5 w-72 bg-muted rounded mx-auto animate-pulse" />
        </div>
        <div
          className={cn(
            'grid gap-4',
            `grid-cols-${cols.mobile}`,
            `sm:grid-cols-${cols.tablet}`,
            `lg:grid-cols-${cols.desktop}`
          )}
        >
          {[...Array(count)].map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

const GRADIENT_CLASSES = [
  'from-[var(--tenant-primary)]/20 to-[var(--tenant-primary)]/40',
  'from-[var(--tenant-secondary)]/20 to-[var(--tenant-secondary)]/40',
  'from-[var(--tenant-accent)]/20 to-[var(--tenant-accent)]/40',
  'from-[var(--tenant-primary)]/30 to-[var(--tenant-secondary)]/30',
  'from-[var(--tenant-secondary)]/30 to-[var(--tenant-accent)]/30',
  'from-[var(--tenant-accent)]/30 to-[var(--tenant-primary)]/30',
];

function getAspectClass(aspectRatio?: string): string {
  switch (aspectRatio) {
    case '1:1':
      return 'aspect-square';
    case '16:9':
      return 'aspect-video';
    case '3:4':
      return 'aspect-[3/4]';
    default:
      return 'aspect-[4/3]';
  }
}

function getHoverClass(effect?: string): string {
  switch (effect) {
    case 'lift':
      return 'hover:-translate-y-1 hover:shadow-xl transition-all';
    case 'zoom':
      return 'transition-shadow hover:shadow-lg';
    case 'overlay':
      return 'transition-shadow hover:shadow-lg';
    default:
      return 'hover:shadow-md transition-shadow';
  }
}

export default CategoryGridBlock;
