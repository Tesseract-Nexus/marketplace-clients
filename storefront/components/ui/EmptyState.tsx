'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, ShoppingBag, Heart, Tag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type EmptyStateVariant = 'products' | 'search' | 'cart' | 'wishlist' | 'categories' | 'default';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
  children?: ReactNode;
}

const variantConfig: Record<EmptyStateVariant, {
  icon: typeof Package;
  defaultTitle: string;
  defaultDescription: string;
  gradient: string;
}> = {
  products: {
    icon: Package,
    defaultTitle: 'No Products Yet',
    defaultDescription: 'Our collection is being curated. Check back soon for amazing products!',
    gradient: 'from-violet-500/20 to-purple-500/20',
  },
  search: {
    icon: Search,
    defaultTitle: 'No Results Found',
    defaultDescription: 'Try adjusting your search or browse our categories.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
  },
  cart: {
    icon: ShoppingBag,
    defaultTitle: 'Your Cart is Empty',
    defaultDescription: 'Looks like you haven\'t added anything to your cart yet.',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  wishlist: {
    icon: Heart,
    defaultTitle: 'No Saved Items',
    defaultDescription: 'Start saving items you love to your wishlist.',
    gradient: 'from-pink-500/20 to-rose-500/20',
  },
  categories: {
    icon: Tag,
    defaultTitle: 'No Categories Yet',
    defaultDescription: 'Categories are being organized. Stay tuned!',
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  default: {
    icon: Sparkles,
    defaultTitle: 'Nothing Here Yet',
    defaultDescription: 'This section is coming soon. Check back later!',
    gradient: 'from-tenant-primary/20 to-tenant-secondary/20',
  },
};

/**
 * EmptyState Component
 *
 * A beautiful, animated empty state component for when there's no content to display.
 * Includes floating decorative elements and smooth animations.
 */
export function EmptyState({
  variant = 'default',
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={cn('relative py-16 px-4', className)}>
      {/* Background gradient blob */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-64 h-64 rounded-full blur-3xl opacity-50',
            'bg-gradient-to-br',
            config.gradient
          )}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md mx-auto">
        {/* Animated Icon Container */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'backOut' }}
          className="relative mb-6"
        >
          {/* Outer ring */}
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
            {/* Inner circle with icon */}
            <motion.div
              className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Icon className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
            </motion.div>
          </div>

          {/* Floating sparkles */}
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{ y: [-2, 2, -2], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-5 h-5 text-tenant-accent" />
          </motion.div>
        </motion.div>

        {/* Text */}
        <motion.h3
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-xl font-semibold mb-2"
        >
          {title || config.defaultTitle}
        </motion.h3>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-muted-foreground mb-6"
        >
          {description || config.defaultDescription}
        </motion.p>

        {/* Action button */}
        {action && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {action.href ? (
              <Button variant="tenant-primary" asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : (
              <Button variant="tenant-primary" onClick={action.onClick}>
                {action.label}
              </Button>
            )}
          </motion.div>
        )}

        {/* Custom children */}
        {children && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-4"
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default EmptyState;
