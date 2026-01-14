'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWishlistStore } from '@/store/wishlist';
import { useAuthStore } from '@/store/auth';
import { useTenant } from '@/context/TenantContext';
import { Button } from '@/components/ui/button';

// =============================================================================
// WISHLIST BUTTON COMPONENT
// =============================================================================

interface WishlistButtonProps {
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  variant?: 'icon' | 'icon-filled' | 'text' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
  onToggle?: (isInWishlist: boolean) => void;
  onAuthRequired?: () => void;
}

export function WishlistButton({
  productId,
  productName,
  productPrice,
  productImage,
  variant = 'icon',
  size = 'md',
  showTooltip = true,
  className,
  onToggle,
  onAuthRequired,
}: WishlistButtonProps) {
  const { tenant } = useTenant();
  const { customer, accessToken, isAuthenticated } = useAuthStore();
  const {
    isInWishlist,
    addAndSync,
    removeAndSync,
    addItem,
    removeItem,
    isSyncing,
  } = useWishlistStore();

  const [isAnimating, setIsAnimating] = useState(false);
  const isWishlisted = isInWishlist(productId);

  const handleToggle = useCallback(async () => {
    setIsAnimating(true);

    const item = {
      productId,
      name: productName,
      price: productPrice,
      image: productImage,
    };

    if (isAuthenticated && customer && accessToken && tenant) {
      // Sync with backend
      if (isWishlisted) {
        await removeAndSync(tenant.id, tenant.storefrontId, customer.id, accessToken, productId);
      } else {
        await addAndSync(tenant.id, tenant.storefrontId, customer.id, accessToken, item);
      }
    } else {
      // Local only for guests
      if (isWishlisted) {
        removeItem(productId);
      } else {
        addItem(item);
      }

      // Optionally prompt for sign in
      if (!isAuthenticated && onAuthRequired) {
        // Delay to show animation
        setTimeout(() => onAuthRequired(), 500);
      }
    }

    onToggle?.(!isWishlisted);
    setTimeout(() => setIsAnimating(false), 300);
  }, [
    isAuthenticated,
    customer,
    accessToken,
    tenant,
    isWishlisted,
    productId,
    productName,
    productPrice,
    productImage,
    addAndSync,
    removeAndSync,
    addItem,
    removeItem,
    onToggle,
    onAuthRequired,
  ]);

  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (variant === 'text') {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        disabled={isSyncing}
        className={cn('gap-2', className)}
      >
        {isSyncing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Heart
            className={cn(
              'w-4 h-4',
              isWishlisted && 'fill-red-500 text-red-500'
            )}
          />
        )}
        {isWishlisted ? 'Saved' : 'Save'}
      </Button>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleToggle}
        disabled={isSyncing}
        className={cn(
          'p-1 transition-colors',
          isWishlisted ? 'text-red-500' : 'text-muted-foreground hover:text-red-500',
          className
        )}
        title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart
          className={cn(
            iconSizes[size],
            isWishlisted && 'fill-current'
          )}
        />
      </button>
    );
  }

  return (
    <div className="relative group">
      <motion.button
        onClick={handleToggle}
        disabled={isSyncing}
        whileTap={{ scale: 0.9 }}
        className={cn(
          'rounded-full flex items-center justify-center transition-all',
          variant === 'icon-filled'
            ? 'bg-white shadow-md hover:shadow-lg'
            : 'bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm',
          sizeClasses[size],
          className
        )}
        title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <AnimatePresence mode="wait">
          {isSyncing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <Loader2 className={cn(iconSizes[size], 'animate-spin text-muted-foreground')} />
            </motion.div>
          ) : isWishlisted ? (
            <motion.div
              key="wishlisted"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <Heart
                className={cn(iconSizes[size], 'fill-red-500 text-red-500')}
              />
            </motion.div>
          ) : (
            <motion.div
              key="not-wishlisted"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
            >
              <Heart
                className={cn(
                  iconSizes[size],
                  'text-gray-600 group-hover:text-red-500 transition-colors'
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated heart burst */}
        <AnimatePresence>
          {isAnimating && !isWishlisted && (
            <motion.div
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className={cn(iconSizes[size], 'fill-red-500 text-red-500')} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SAVE FOR LATER BUTTON (for cart)
// =============================================================================

interface SaveForLaterProps {
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string;
  onSave?: () => void;
  className?: string;
}

export function SaveForLaterButton({
  productId,
  productName,
  productPrice,
  productImage,
  onSave,
  className,
}: SaveForLaterProps) {
  const { tenant } = useTenant();
  const { customer, accessToken, isAuthenticated } = useAuthStore();
  const { isInWishlist, addAndSync, addItem, isSyncing } = useWishlistStore();

  const isAlreadySaved = isInWishlist(productId);

  const handleSave = async () => {
    if (isAlreadySaved) return;

    const item = {
      productId,
      name: productName,
      price: productPrice,
      image: productImage,
    };

    if (isAuthenticated && customer && accessToken && tenant) {
      await addAndSync(tenant.id, tenant.storefrontId, customer.id, accessToken, item);
    } else {
      addItem(item);
    }

    onSave?.();
  };

  return (
    <button
      onClick={handleSave}
      disabled={isSyncing || isAlreadySaved}
      className={cn(
        'text-sm flex items-center gap-1.5 transition-colors',
        isAlreadySaved
          ? 'text-green-600'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {isAlreadySaved ? (
        <>
          <Check className="w-4 h-4" />
          Saved
        </>
      ) : isSyncing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          <Heart className="w-4 h-4" />
          Save for later
        </>
      )}
    </button>
  );
}

// =============================================================================
// WISHLIST COUNT BADGE
// =============================================================================

interface WishlistCountBadgeProps {
  className?: string;
}

export function WishlistCountBadge({ className }: WishlistCountBadgeProps) {
  const { getItemCount } = useWishlistStore();
  const count = getItemCount();

  if (count === 0) return null;

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        'absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center',
        'bg-red-500 text-white text-xs font-bold rounded-full',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </motion.span>
  );
}

// =============================================================================
// WISHLIST HEADER ICON
// =============================================================================

interface WishlistHeaderIconProps {
  onClick?: () => void;
  className?: string;
}

export function WishlistHeaderIcon({ onClick, className }: WishlistHeaderIconProps) {
  const { getItemCount } = useWishlistStore();
  const count = getItemCount();

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-2 hover:bg-muted rounded-full transition-colors',
        className
      )}
      aria-label={`Wishlist (${count} items)`}
    >
      <Heart className="w-5 h-5" />
      <WishlistCountBadge />
    </button>
  );
}

export default WishlistButton;
