'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Tag,
  Bell,
  BellOff,
  Share2,
  Filter,
  ArrowDownCircle,
  Package,
  ChevronDown,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useWishlistStore } from '@/store/wishlist';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useTenant, useNavPath } from '@/context/TenantContext';

// =============================================================================
// TYPES
// =============================================================================

type FilterType = 'all' | 'on-sale' | 'in-stock' | 'low-stock' | 'price-drop';

interface WishlistItemWithDetails {
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  addedAt: string;
  inStock?: boolean;
  stockLevel?: number;
  hasPriceDrop?: boolean;
  priceDropPercent?: number;
}

// =============================================================================
// WISHLIST QUICK FILTERS
// =============================================================================

interface WishlistQuickFiltersProps {
  items: WishlistItemWithDetails[];
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  className?: string;
}

export function WishlistQuickFilters({
  items,
  activeFilter,
  onFilterChange,
  className,
}: WishlistQuickFiltersProps) {
  const counts = useMemo(() => ({
    all: items.length,
    'on-sale': items.filter((i) => i.originalPrice && i.price < i.originalPrice).length,
    'in-stock': items.filter((i) => i.inStock !== false).length,
    'low-stock': items.filter((i) => i.stockLevel && i.stockLevel < 10).length,
    'price-drop': items.filter((i) => i.hasPriceDrop).length,
  }), [items]);

  const filters: { key: FilterType; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All', icon: <Heart className="w-4 h-4" /> },
    { key: 'on-sale', label: 'On Sale', icon: <Tag className="w-4 h-4" /> },
    { key: 'price-drop', label: 'Price Drops', icon: <ArrowDownCircle className="w-4 h-4" /> },
    { key: 'in-stock', label: 'In Stock', icon: <Package className="w-4 h-4" /> },
  ];

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-colors',
            activeFilter === filter.key
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80'
          )}
        >
          {filter.icon}
          <span>{filter.label}</span>
          {counts[filter.key] > 0 && (
            <span className={cn(
              'px-1.5 py-0.5 rounded-full text-xs',
              activeFilter === filter.key
                ? 'bg-white/20'
                : 'bg-background'
            )}>
              {counts[filter.key]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// =============================================================================
// WISHLIST BULK ACTIONS
// =============================================================================

interface WishlistBulkActionsProps {
  selectedIds: string[];
  onAddAllToCart: () => void;
  onRemoveSelected: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  totalItems: number;
  className?: string;
}

export function WishlistBulkActions({
  selectedIds,
  onAddAllToCart,
  onRemoveSelected,
  onClearSelection,
  onSelectAll,
  totalItems,
  className,
}: WishlistBulkActionsProps) {
  const hasSelection = selectedIds.length > 0;
  const allSelected = selectedIds.length === totalItems;

  return (
    <div className={cn(
      'flex items-center justify-between p-4 bg-muted/50 rounded-lg',
      className
    )}>
      <div className="flex items-center gap-4">
        <button
          onClick={allSelected ? onClearSelection : onSelectAll}
          className="flex items-center gap-2 text-sm"
        >
          <div className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
            allSelected
              ? 'bg-primary border-primary'
              : 'border-muted-foreground/50 hover:border-primary'
          )}>
            {allSelected && <Check className="w-3 h-3 text-primary-foreground" />}
          </div>
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>

        {hasSelection && (
          <span className="text-sm text-muted-foreground">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {hasSelection && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddAllToCart}
              className="gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemoveSelected}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// WISHLIST ITEM CARD
// =============================================================================

interface WishlistItemCardProps {
  item: WishlistItemWithDetails;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onRemove: () => void;
  onAddToCart: () => void;
  onNotify: (type: 'price-drop' | 'back-in-stock') => void;
  className?: string;
}

export function WishlistItemCard({
  item,
  isSelected,
  onSelect,
  onRemove,
  onAddToCart,
  onNotify,
  className,
}: WishlistItemCardProps) {
  const getNavPath = useNavPath();
  const [showNotifyMenu, setShowNotifyMenu] = useState(false);
  const isOnSale = item.originalPrice && item.price < item.originalPrice;
  const discountPercent = isOnSale
    ? Math.round(((item.originalPrice! - item.price) / item.originalPrice!) * 100)
    : 0;

  return (
    <div className={cn(
      'group relative p-4 bg-card rounded-xl border transition-all',
      isSelected && 'ring-2 ring-primary',
      className
    )}>
      {/* Selection checkbox */}
      <button
        onClick={() => onSelect(!isSelected)}
        className={cn(
          'absolute top-3 left-3 w-5 h-5 rounded border-2 flex items-center justify-center z-10 transition-all',
          isSelected
            ? 'bg-primary border-primary'
            : 'bg-white border-muted-foreground/30 opacity-0 group-hover:opacity-100'
        )}
      >
        {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
      </button>

      <div className="flex gap-4">
        {/* Image */}
        <Link
          href={getNavPath(`/products/${item.productId}`)}
          className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0"
        >
          {item.image ? (
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
          )}

          {/* Badges */}
          {isOnSale && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
              {discountPercent}% OFF
            </span>
          )}
          {item.hasPriceDrop && (
            <span className="absolute top-2 right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded">
              Price Drop
            </span>
          )}
        </Link>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <Link
            href={getNavPath(`/products/${item.productId}`)}
            className="font-medium line-clamp-2 hover:underline"
          >
            {item.name}
          </Link>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-lg font-bold">
              ${item.price.toFixed(2)}
            </span>
            {isOnSale && (
              <span className="text-sm text-muted-foreground line-through">
                ${item.originalPrice?.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock status */}
          {item.inStock === false ? (
            <p className="text-sm text-red-500 mt-1">Out of Stock</p>
          ) : item.stockLevel && item.stockLevel < 10 ? (
            <p className="text-sm text-amber-600 mt-1">
              Only {item.stockLevel} left
            </p>
          ) : null}

          {/* Added date */}
          <p className="text-xs text-muted-foreground mt-2">
            Added {new Date(item.addedAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t">
        <Button
          size="sm"
          onClick={onAddToCart}
          disabled={item.inStock === false}
          className="flex-1"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>

        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNotifyMenu(!showNotifyMenu)}
          >
            <Bell className="w-4 h-4" />
          </Button>

          <AnimatePresence>
            {showNotifyMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 top-full mt-2 w-48 bg-popover border rounded-lg shadow-lg z-20"
              >
                <button
                  onClick={() => {
                    onNotify('price-drop');
                    setShowNotifyMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  Notify on price drop
                </button>
                {item.inStock === false && (
                  <button
                    onClick={() => {
                      onNotify('back-in-stock');
                      setShowNotifyMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Notify when back
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// WISHLIST EMPTY STATE
// =============================================================================

interface WishlistEmptyStateProps {
  isLoggedIn: boolean;
  onBrowse: () => void;
  onSignIn?: () => void;
  className?: string;
}

export function WishlistEmptyState({
  isLoggedIn,
  onBrowse,
  onSignIn,
  className,
}: WishlistEmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 px-4 text-center',
      className
    )}>
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Heart className="w-10 h-10 text-muted-foreground" />
      </div>

      <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Start adding items you love by clicking the heart icon on products.
        {!isLoggedIn && ' Sign in to sync your favorites across devices.'}
      </p>

      <div className="flex gap-3">
        <Button onClick={onBrowse}>
          Browse Products
        </Button>
        {!isLoggedIn && onSignIn && (
          <Button variant="outline" onClick={onSignIn}>
            Sign In
          </Button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// WISHLIST SHARE MODAL
// =============================================================================

interface WishlistShareProps {
  listId: string;
  listName: string;
  itemCount: number;
  isPublic: boolean;
  onTogglePublic: (isPublic: boolean) => void;
  onClose: () => void;
  className?: string;
}

export function WishlistShare({
  listId,
  listName,
  itemCount,
  isPublic,
  onTogglePublic,
  onClose,
  className,
}: WishlistShareProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/lists/${listId}`
    : '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const text = `Check out my wishlist: ${listName}`;
    let url = '';

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(listName)}&body=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`;
        break;
    }

    if (url) window.open(url, '_blank');
  };

  return (
    <div className={cn('p-6 space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Share Wishlist</h3>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Public toggle */}
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <p className="font-medium">Make list public</p>
          <p className="text-sm text-muted-foreground">
            Anyone with the link can view this list
          </p>
        </div>
        <button
          onClick={() => onTogglePublic(!isPublic)}
          className={cn(
            'w-12 h-6 rounded-full transition-colors relative',
            isPublic ? 'bg-primary' : 'bg-muted-foreground/30'
          )}
        >
          <span
            className={cn(
              'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
              isPublic ? 'translate-x-7' : 'translate-x-1'
            )}
          />
        </button>
      </div>

      {isPublic && (
        <>
          {/* Share URL */}
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-4 py-2 bg-muted rounded-lg text-sm"
            />
            <Button onClick={handleCopy} variant="outline">
              {copied ? <Check className="w-4 h-4" /> : 'Copy'}
            </Button>
          </div>

          {/* Social share buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('twitter')}
              className="flex-1"
            >
              Twitter
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('facebook')}
              className="flex-1"
            >
              Facebook
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('whatsapp')}
              className="flex-1"
            >
              WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleShare('email')}
              className="flex-1"
            >
              Email
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default WishlistQuickFilters;
