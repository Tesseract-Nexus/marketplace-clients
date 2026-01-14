'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Grid3X3, ArrowRight, Layers } from 'lucide-react';
import { Category } from '@/types/storefront';
import { useNavPath } from '@/context/TenantContext';
import { cn } from '@/lib/utils';
import { TranslatedCategoryName, TranslatedText } from '@/components/translation';

interface CategoriesClientProps {
  categories: Category[];
}

// CSS variable-based gradient backgrounds
const GRADIENT_CLASSES = [
  'from-[var(--tenant-primary)]/20 to-[var(--tenant-primary)]/40',
  'from-[var(--tenant-secondary)]/20 to-[var(--tenant-secondary)]/40',
  'from-[var(--tenant-accent)]/20 to-[var(--tenant-accent)]/40',
  'from-[var(--tenant-primary)]/30 to-[var(--tenant-secondary)]/30',
  'from-[var(--tenant-secondary)]/30 to-[var(--tenant-accent)]/30',
  'from-[var(--tenant-accent)]/30 to-[var(--tenant-primary)]/30',
];

export function CategoriesClient({ categories }: CategoriesClientProps) {
  const getNavPath = useNavPath();

  // Separate parent categories and subcategories
  const parentCategories = categories.filter((cat) => cat.level === 0 || !cat.parentId);
  const getSubcategories = (parentId: string) =>
    categories.filter((cat) => cat.parentId === parentId);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--tenant-primary)]/10 via-background to-[var(--tenant-secondary)]/10" />
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--tenant-primary)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--tenant-secondary)' }}
        />

        <div className="container-tenant relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tenant-primary/10 text-tenant-primary mb-6">
              <Grid3X3 className="w-4 h-4" />
              <span className="text-sm font-medium">Browse Collections</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Shop by Category
            </h1>
            <p className="text-lg text-muted-foreground">
              Explore our curated collections and find exactly what you're looking for
            </p>
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12 md:py-16">
        <div className="container-tenant">
          {parentCategories.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
            >
              {parentCategories.map((category, index) => {
                const subcategories = getSubcategories(category.id);
                return (
                  <motion.div key={category.id} variants={itemVariants}>
                    <CategoryCard
                      category={category}
                      subcategories={subcategories}
                      index={index}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Layers className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No Categories Yet</h2>
              <p className="text-muted-foreground">
                Check back soon for our product categories
              </p>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}

interface CategoryCardProps {
  category: Category;
  subcategories: Category[];
  index: number;
}

function CategoryCard({ category, subcategories, index }: CategoryCardProps) {
  const getNavPath = useNavPath();
  const displayImageUrl = category.images?.[0]?.url || (category.imageUrl && category.imageUrl.trim() !== '' ? category.imageUrl : null);

  return (
    <div className="group">
      {/* Main Category Card */}
      <Link
        href={getNavPath(`/products?category=${category.id}`)}
        className="block relative aspect-[4/3] rounded-2xl overflow-hidden hover-lift mb-4"
      >
        {/* Image Container with Ken Burns effect */}
        <div className="absolute inset-0 overflow-hidden">
          {displayImageUrl ? (
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1 }}
              animate={{
                scale: [1, 1.1, 1.05, 1.12, 1],
              }}
              transition={{
                duration: 25,
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
                duration: 10,
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
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '200%' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </div>

        {/* Decorative corner accent with animation */}
        <motion.div
          className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/15 to-transparent rounded-bl-full"
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Floating particles effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-white/50 rounded-full"
              style={{
                left: `${15 + i * 22}%`,
                bottom: '15%',
              }}
              animate={{
                y: [0, -40, -80],
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2.5,
                delay: i * 0.25,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        {/* Content with enhanced animations */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-white mb-2"
            initial={{ x: 0 }}
            whileHover={{ x: 6 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <TranslatedCategoryName name={category.name} />
          </motion.h2>
          {category.description && (
            <motion.p
              className="text-sm text-white/80 line-clamp-2 mb-3"
              initial={{ opacity: 0.8 }}
              whileHover={{ opacity: 1 }}
            >
              <TranslatedText text={category.description} context="category description" />
            </motion.p>
          )}
          <motion.div
            className="flex items-center gap-2 text-white/90"
            whileHover={{ gap: '1rem' }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-sm font-medium">Explore Collection</span>
            <motion.span
              initial={{ x: 0 }}
              whileHover={{ x: 6 }}
              transition={{ duration: 0.3 }}
            >
              <ArrowRight className="h-4 w-4" />
            </motion.span>
          </motion.div>
        </div>

        {/* Product count badge with subtle animation */}
        {category.children && category.children.length > 0 && (
          <motion.div
            className="absolute top-4 right-4 px-3 py-1 rounded-full glass text-white text-xs font-medium"
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            {category.children.length} subcategories
          </motion.div>
        )}

        {/* Border glow on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          initial={{ boxShadow: 'inset 0 0 0 0 transparent' }}
          whileHover={{
            boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.25), 0 0 40px rgba(var(--tenant-primary-rgb, 139, 92, 246), 0.35)'
          }}
          transition={{ duration: 0.4 }}
        />
      </Link>

      {/* Subcategories with stagger animation */}
      {subcategories.length > 0 && (
        <motion.div
          className="flex flex-wrap gap-2"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
        >
          {subcategories.slice(0, 4).map((sub) => (
            <motion.div
              key={sub.id}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <Link
                href={getNavPath(`/products?category=${sub.id}`)}
                className="px-3 py-1.5 text-sm rounded-full bg-muted hover:bg-tenant-primary hover:text-white transition-all duration-300 hover:scale-105 inline-block"
              >
                <TranslatedCategoryName name={sub.name} />
              </Link>
            </motion.div>
          ))}
          {subcategories.length > 4 && (
            <motion.span
              className="px-3 py-1.5 text-sm rounded-full bg-muted text-muted-foreground"
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              +{subcategories.length - 4} more
            </motion.span>
          )}
        </motion.div>
      )}
    </div>
  );
}
