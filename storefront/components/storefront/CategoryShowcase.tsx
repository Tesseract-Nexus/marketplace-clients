'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Category } from '@/types/storefront';
import { useTenant, useNavPath } from '@/context/TenantContext';
import { cn } from '@/lib/utils';
import { TranslatedUIText, TranslatedCategoryName } from '@/components/translation/TranslatedText';

interface CategoryShowcaseProps {
  title?: string;
  subtitle?: string;
  categories: Category[];
  isLoading?: boolean;
}

export function CategoryShowcase({
  title = 'Shop by Category',
  subtitle,
  categories,
  isLoading = false,
}: CategoryShowcaseProps) {
  const getNavPath = useNavPath();

  // Filter to show only parent categories (level 0 or 1)
  const topCategories = categories
    .filter((cat) => cat.level <= 1 && cat.isActive)
    .slice(0, 6);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-muted/30">
      <div className="container-tenant">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-tenant-primary/10 text-tenant-primary mb-3 sm:mb-4"
          >
            <Grid3X3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <TranslatedUIText text="Categories" className="text-xs sm:text-sm font-medium" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold"
          >
            <TranslatedUIText text={title} />
          </motion.h2>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-sm sm:text-base text-muted-foreground mt-2 sm:mt-3 max-w-2xl mx-auto px-4"
            >
              <TranslatedUIText text={subtitle} />
            </motion.p>
          )}
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        ) : topCategories.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
          >
            {topCategories.map((category, index) => (
              <motion.div key={category.id} variants={itemVariants}>
                <CategoryCard category={category} index={index} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <EmptyState
            variant="categories"
            action={{
              label: 'View All Products',
              href: getNavPath('/products'),
            }}
          />
        )}

        {/* View All */}
        {topCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-8 sm:mt-10"
          >
            <Button variant="tenant-outline" size="default" asChild className="hover-lift group">
              <Link href={getNavPath('/categories')}>
                <TranslatedUIText text="Browse All Categories" />
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}

interface CategoryCardProps {
  category: Category;
  index: number;
}

// CSS variable-based gradient backgrounds (no inline settings colors)
const GRADIENT_CLASSES = [
  'from-[var(--tenant-primary)]/20 to-[var(--tenant-primary)]/40',
  'from-[var(--tenant-secondary)]/20 to-[var(--tenant-secondary)]/40',
  'from-[var(--tenant-accent)]/20 to-[var(--tenant-accent)]/40',
  'from-[var(--tenant-primary)]/30 to-[var(--tenant-secondary)]/30',
  'from-[var(--tenant-secondary)]/30 to-[var(--tenant-accent)]/30',
  'from-[var(--tenant-accent)]/30 to-[var(--tenant-primary)]/30',
];

function CategoryCard({ category, index }: CategoryCardProps) {
  const getNavPath = useNavPath();
  const displayImageUrl = category.images?.[0]?.url || (category.imageUrl && category.imageUrl.trim() !== '' ? category.imageUrl : null);

  return (
    <Link
      href={getNavPath(`/products?category=${category.id}`)}
      className="group block relative aspect-[4/3] sm:aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden hover-lift active:scale-[0.98] transition-transform"
    >
      {/* Image Container with Ken Burns effect */}
      <div className="absolute inset-0 overflow-hidden">
        {displayImageUrl ? (
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1 }}
            animate={{
              scale: [1, 1.08, 1.04, 1.1, 1],
            }}
            transition={{
              duration: 20,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <Image
              src={displayImageUrl}
              alt={category.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-115"
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
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
        whileHover={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)' }}
        transition={{ duration: 0.4 }}
      />

      {/* Shine sweep effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
          initial={{ x: '-100%' }}
          whileHover={{ x: '200%' }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </div>

      {/* Decorative corner accent with animation */}
      <motion.div
        className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/15 to-transparent rounded-bl-full hidden sm:block"
        initial={{ opacity: 0, scale: 0.8 }}
        whileHover={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Floating particles effect (subtle) */}
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
              y: [0, -30, -60],
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
      <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 md:p-6 z-10">
        <motion.h3
          className="text-base sm:text-lg md:text-xl font-bold text-white mb-0.5 sm:mb-1 line-clamp-2"
          initial={{ x: 0 }}
          whileHover={{ x: 4 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <TranslatedCategoryName name={category.name} />
        </motion.h3>
        {category.description && (
          <motion.p
            className="text-xs sm:text-sm text-white/80 line-clamp-1 sm:line-clamp-2 hidden sm:block"
            initial={{ opacity: 0.8 }}
            whileHover={{ opacity: 1 }}
          >
            <TranslatedUIText text={category.description} />
          </motion.p>
        )}
        <motion.div
          className="flex items-center gap-1 text-xs sm:text-sm text-white/90 mt-1.5 sm:mt-2"
          whileHover={{ gap: '0.75rem' }}
          transition={{ duration: 0.3 }}
        >
          <span className="font-medium"><TranslatedUIText text="Shop Now" /></span>
          <motion.span
            initial={{ x: 0 }}
            whileHover={{ x: 4 }}
            transition={{ duration: 0.3 }}
          >
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </motion.span>
        </motion.div>
      </div>

      {/* Border glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none"
        initial={{ boxShadow: 'inset 0 0 0 0 transparent' }}
        whileHover={{
          boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.2), 0 0 30px rgba(var(--tenant-primary-rgb, 139, 92, 246), 0.3)'
        }}
        transition={{ duration: 0.4 }}
      />
    </Link>
  );
}
