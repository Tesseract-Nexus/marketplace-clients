'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Heart, ShoppingCart, Eye, Star, Plus, Check, Loader2, Ban, ChevronLeft, ChevronRight, ListPlus, Bookmark, FolderHeart, User, Expand } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useTiltValues } from '@/hooks/useTilt';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Product } from '@/types/storefront';
import { useTenant, useProductConfig, useNavPath, useMobileConfig } from '@/context/TenantContext';
import { useCartStore } from '@/store/cart';
import { useListsStore, List } from '@/store/lists';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import { getProductShippingData } from '@/lib/utils/product-shipping';
import { TranslatedProductName, TranslatedText } from '@/components/translation';
import { PriceDisplay, PriceWithDiscount } from '@/components/currency/PriceDisplay';
import dynamic from 'next/dynamic';

// Lazy load modals to reduce initial bundle size
const ImageLightbox = dynamic(() => import('@/components/ui/ImageLightbox').then(mod => mod.ImageLightbox), {
  ssr: false,
});
const QuickViewModal = dynamic(() => import('./QuickViewModal').then(mod => mod.QuickViewModal), {
  ssr: false,
});

// Low-quality image placeholder for blur effect
const BLUR_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBQQEBQoHBwYIDAoMCwsLCgwMDQ4OCwwNDQ4QDw8RDwwQEBEREQ0NDg8QEBEQEP/2wBDAQMEBAUEBQkFBQkRDA0MERAREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREP/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAkH/8QAIhAAAgEEAQUBAAAAAAAAAAAAAQIDAAQFERIGByExQVH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAf/EABgRAAMBAQAAAAAAAAAAAAAAAAACAwEh/9oADAMBAAIRAxEAPwCwu5nUGZwtpBHh8PKJ5pC3NmQAKAOo8+Ttv7pSlKFYiLP/2Q==';

// Professional placeholder SVG for failed images - improved design with gradient
const FALLBACK_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23f5f5f5'/%3E%3Cstop offset='100%25' style='stop-color:%23e5e5e5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23grad)' width='400' height='400'/%3E%3Cg fill='%23d4d4d4'%3E%3Crect x='150' y='140' width='100' height='80' rx='8'/%3E%3Ccircle cx='200' cy='155' r='15'/%3E%3Cpath d='M150 200 l30 -25 l25 15 l20 -10 l25 20 h-100z'/%3E%3C/g%3E%3Ctext x='200' y='260' font-family='system-ui, sans-serif' font-size='14' fill='%23a3a3a3' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";

export interface ProductCardProps {
  product: Product;
  className?: string;
  // Optional overrides from block config
  showQuickAdd?: boolean;
  showWishlist?: boolean;
  showRating?: boolean;
  showBadges?: boolean;
  // Performance optimizations
  priority?: boolean; // For above-the-fold images
  loading?: 'lazy' | 'eager';
}

export function ProductCard({
  product,
  className,
  showQuickAdd,
  showWishlist,
  showRating,
  showBadges,
  priority = false,
  loading = 'lazy',
}: ProductCardProps) {
  const { tenant, settings } = useTenant();
  const baseProductConfig = useProductConfig();
  const mobileConfig = useMobileConfig();
  const hoverEffectsEnabled = settings.spacingStyleConfig?.hoverEffects !== false;

  // Merge block overrides with tenant config
  const productConfig = {
    ...baseProductConfig,
    showWishlist: showWishlist ?? baseProductConfig.showWishlist,
    showRatings: showRating ?? baseProductConfig.showRatings,
    showSaleBadge: showBadges ?? baseProductConfig.showSaleBadge,
    showStockStatus: showBadges ?? baseProductConfig.showStockStatus,
  };
  const getNavPath = useNavPath();
  const addToCart = useCartStore((state) => state.addItem);
  const { lists, fetchLists, addToList, addToDefaultList, removeFromList, createList, isInAnyList, getListsContainingProduct } = useListsStore();
  const { customer, accessToken, isAuthenticated } = useAuthStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddingToList, setIsAddingToList] = useState<string | null>(null);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Detect touch device
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  const isOutOfStock = product.inventoryStatus === 'OUT_OF_STOCK';

  // 3D tilt effect - disabled on touch devices
  const { rotateX, rotateY, shouldAnimate, handlers: tiltHandlers } = useTiltValues({
    maxTilt: 8,
    enabled: !isTouchDevice,
  });

  // Swipe handling for mobile image gallery
  const dragX = useMotionValue(0);

  // Get all image URLs, prioritizing primary images first
  const allImages = useMemo(() => {
    const images = product.images || [];
    // Sort: primary images first, then by position
    const sorted = [...images].sort((a, b) => {
      const aIsPrimary = typeof a !== 'string' && a?.isPrimary ? 1 : 0;
      const bIsPrimary = typeof b !== 'string' && b?.isPrimary ? 1 : 0;
      if (bIsPrimary !== aIsPrimary) return bIsPrimary - aIsPrimary; // Primary first
      // Then sort by position
      const aPos = typeof a !== 'string' ? (a?.position ?? 999) : 999;
      const bPos = typeof b !== 'string' ? (b?.position ?? 999) : 999;
      return aPos - bPos;
    });
    return sorted.map((img) =>
      typeof img === 'string' ? img : img?.url
    ).filter(Boolean) as string[];
  }, [product.images]);
  const imageCount = allImages.length;

  // Auto-cycle images every 4 seconds
  useEffect(() => {
    if (imageCount <= 1) return;
    imageIntervalRef.current = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imageCount);
    }, 4000);
    return () => {
      if (imageIntervalRef.current) clearInterval(imageIntervalRef.current);
    };
  }, [imageCount]);

  const resetAutoTimer = useCallback(() => {
    if (imageIntervalRef.current) clearInterval(imageIntervalRef.current);
    if (imageCount <= 1) return;
    imageIntervalRef.current = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imageCount);
    }, 4000);
  }, [imageCount]);

  // Keep for API compatibility but no longer needed for image cycling
  const startImageCycle = useCallback(() => {}, []);
  const stopImageCycle = useCallback(() => {}, []);

  // Swipe handlers for mobile
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && currentImageIndex < imageCount - 1) {
      setCurrentImageIndex(prev => prev + 1);
    } else if (info.offset.x > threshold && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  }, [currentImageIndex, imageCount]);

  const goToNextImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev + 1) % imageCount);
    resetAutoTimer();
  }, [imageCount, resetAutoTimer]);

  const goToPrevImage = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev - 1 + imageCount) % imageCount);
    resetAutoTimer();
  }, [imageCount, resetAutoTimer]);

  // Open image lightbox
  const openLightbox = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLightboxOpen(true);
  }, []);

  // Open quick view modal
  const openQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsQuickViewOpen(true);
  }, []);

  // Note: auto-cycle useEffect handles its own cleanup

  const price = parseFloat(product.price);
  const comparePrice = product.comparePrice ? parseFloat(product.comparePrice) : null;
  const hasDiscount = comparePrice && comparePrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  const imageUrl = allImages[0] || '/placeholder.svg';
  const currentImage = allImages[currentImageIndex] || imageUrl;

  // Check if product is in any list (for filled heart)
  const isInList = isInAnyList(product.id);
  const listsWithProduct = getListsContainingProduct(product.id);

  // Fetch lists when authenticated
  useEffect(() => {
    if (isAuthenticated && tenant && customer && lists.length === 0) {
      fetchLists(tenant.id, tenant.storefrontId, customer.id, accessToken || '');
    }
  }, [isAuthenticated, tenant, lists.length, customer?.id, accessToken, fetchLists]);

  const aspectRatioClass = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  }[productConfig.imageAspectRatio];

  // Card styles with proper differentiation - improved visual design
  const cardStyleClasses = {
    default: {
      card: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50',
      padding: 'p-4',
    },
    minimal: {
      card: 'bg-white dark:bg-zinc-900 border-none shadow-sm hover:shadow-md',
      padding: 'p-3',
    },
    bordered: {
      card: 'bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 hover:border-[var(--tenant-primary)] hover:shadow-lg',
      padding: 'p-4',
    },
    elevated: {
      card: 'bg-white dark:bg-zinc-900 border-none shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
      padding: 'p-4',
    },
  }[productConfig.cardStyle] || {
    card: 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50',
    padding: 'p-4',
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    // Don't add if out of stock
    if (isOutOfStock) {
      return;
    }

    // Trigger cart animation
    setIsAddingToCart(true);
    setTimeout(() => setIsAddingToCart(false), 500);

    const shippingData = getProductShippingData(product);
    addToCart({
      productId: product.id,
      name: product.name,
      price,
      quantity: 1,
      image: imageUrl,
      ...shippingData,
    });
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
    startImageCycle();
    tiltHandlers.onMouseEnter();
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(false);
    stopImageCycle();
    tiltHandlers.onMouseLeave();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    tiltHandlers.onMouseMove(e);
  };

  const handleAddToList = async (list: List, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!isAuthenticated || !tenant || !customer) {
      // Redirect to login
      window.location.href = getNavPath('/auth/login');
      return;
    }

    setIsAddingToList(list.id);
    setIsHeartAnimating(true);

    try {
      await addToList(tenant.id, tenant.storefrontId, customer.id, accessToken || '', list.id, {
        id: product.id,
        name: product.name,
        image: imageUrl,
        price,
      });
    } catch (error) {
      console.error('Failed to add to list:', error);
    } finally {
      setIsAddingToList(null);
      setTimeout(() => setIsHeartAnimating(false), 300);
      setIsDropdownOpen(false);
    }
  };

  const handleRemoveFromList = async (list: List, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (!isAuthenticated || !tenant || !customer) return;

    const item = list.items?.find((i) => i.productId === product.id);
    if (!item) return;

    setIsAddingToList(list.id);
    try {
      await removeFromList(tenant.id, tenant.storefrontId, customer.id, accessToken || '', list.id, item.id);
    } catch (error) {
      console.error('Failed to remove from list:', error);
    } finally {
      setIsAddingToList(null);
      setIsDropdownOpen(false);
    }
  };

  const handleQuickAddToDefault = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !tenant || !customer) {
      window.location.href = getNavPath('/auth/login');
      return;
    }

    // If product is in default list, remove it; otherwise add it
    const defaultList = lists.find((l) => l.isDefault);
    const isInDefaultList = defaultList?.items?.some((i) => i.productId === product.id);

    setIsHeartAnimating(true);

    try {
      if (isInDefaultList && defaultList) {
        await handleRemoveFromList(defaultList, e);
      } else {
        setIsAddingToList('default');
        await addToDefaultList(tenant.id, tenant.storefrontId, customer.id, accessToken || '', {
          id: product.id,
          name: product.name,
          image: imageUrl,
          price,
        });
        setIsAddingToList(null);
      }
    } catch (error) {
      console.error('Failed to toggle default list:', error);
      setIsAddingToList(null);
    } finally {
      setTimeout(() => setIsHeartAnimating(false), 300);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim() || !tenant || !customer) return;

    setIsCreatingList(true);
    try {
      const newList = await createList(
        tenant.id,
        tenant.storefrontId,
        customer.id,
        accessToken || '',
        newListName.trim()
      );
      // Add product to the new list
      await addToList(tenant.id, tenant.storefrontId, customer.id, accessToken || '', newList.id, {
        id: product.id,
        name: product.name,
        image: imageUrl,
        price,
      });
      setNewListName('');
      setIsCreateListOpen(false);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Failed to create list:', error);
    } finally {
      setIsCreatingList(false);
    }
  };

  const isProductInList = (list: List) => {
    return list.items?.some((i) => i.productId === product.id) ?? false;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: 0,
        rotateX: shouldAnimate && !isTouchDevice ? rotateX : 0,
        rotateY: shouldAnimate && !isTouchDevice ? rotateY : 0,
      }}
      transition={{
        opacity: { duration: 0.3 },
        y: { duration: 0.3 },
        rotateX: { type: 'spring', stiffness: 300, damping: 30 },
        rotateY: { type: 'spring', stiffness: 300, damping: 30 },
      }}
      style={{
        transformStyle: isTouchDevice ? undefined : 'preserve-3d',
        perspective: isTouchDevice ? undefined : 1000,
      }}
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'rounded-xl',
        cardStyleClasses.card,
        className
      )}
      onMouseEnter={!isTouchDevice ? handleMouseEnter : undefined}
      onMouseLeave={!isTouchDevice ? handleMouseLeave : undefined}
      onMouseMove={!isTouchDevice ? handleMouseMove : undefined}
    >
      <Link href={getNavPath(`/products/${product.id}`)}>
        {/* Image Container */}
        <div className={cn(
          'relative overflow-hidden bg-zinc-100 dark:bg-zinc-800',
          aspectRatioClass,
          isOutOfStock && 'opacity-75'
        )}>
          {/* Image Gallery with crossfade */}
          {isTouchDevice && imageCount > 1 ? (
            <motion.div
              className="relative w-full h-full"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              style={{ x: dragX }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={imageError ? FALLBACK_PLACEHOLDER : (allImages[currentImageIndex] || imageUrl)}
                    alt={allImages.length > 1 ? `${product.name} - Image ${currentImageIndex + 1} of ${allImages.length}` : product.name}
                    fill
                    className={cn(
                      "object-cover pointer-events-none",
                      imageError && "object-contain p-8"
                    )}
                    draggable={false}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    loading={loading}
                    priority={priority}
                    onError={() => setImageError(true)}
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : imageCount > 1 ? (
            /* Desktop Image Gallery with crossfade */
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <Image
                  src={imageError ? FALLBACK_PLACEHOLDER : currentImage}
                  alt={imageCount > 1 ? `${product.name} - Image ${currentImageIndex + 1} of ${imageCount}` : product.name}
                  fill
                  className={cn(
                    'object-cover',
                    imageError && 'object-contain p-8'
                  )}
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  loading={loading}
                  priority={priority}
                  onError={() => setImageError(true)}
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            /* Single image */
            <Image
              src={imageError ? FALLBACK_PLACEHOLDER : currentImage}
              alt={product.name}
              fill
              className={cn(
                'object-cover transition-transform duration-300',
                hoverEffectsEnabled && productConfig.hoverEffect === 'zoom' && !isTouchDevice && 'group-hover:scale-[1.02]',
                hoverEffectsEnabled && productConfig.hoverEffect === 'fade' && !isTouchDevice && 'group-hover:opacity-90',
                imageError && 'object-contain p-8'
              )}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              loading={loading}
              priority={priority}
              onError={() => setImageError(true)}
            />
          )}

          {/* Navigation Arrows - smaller on mobile, show on hover for desktop */}
          {imageCount > 1 && (
            <>
              <button
                onClick={goToPrevImage}
                className={cn(
                  "absolute left-1.5 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/90 transition-all touch-manipulation",
                  isTouchDevice
                    ? "w-11 h-11 active:scale-95"
                    : "w-8 h-8 opacity-0 group-hover:opacity-100 hover:bg-black/60"
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className={isTouchDevice ? "h-5 w-5" : "h-4 w-4"} />
              </button>
              <button
                onClick={goToNextImage}
                className={cn(
                  "absolute right-1.5 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/90 transition-all touch-manipulation",
                  isTouchDevice
                    ? "w-11 h-11 active:scale-95"
                    : "w-8 h-8 opacity-0 group-hover:opacity-100 hover:bg-black/60"
                )}
                aria-label="Next image"
              >
                <ChevronRight className={isTouchDevice ? "h-5 w-5" : "h-4 w-4"} />
              </button>
            </>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
              <div className="bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                Out of Stock
              </div>
            </div>
          )}

          {/* Image Counter - positioned above action bar */}
          {imageCount > 1 && (
            <div className={cn(
              "absolute z-30 bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium rounded-full px-1.5 py-0.5 transition-all duration-200",
              // On mobile: always above action bar, centered
              // On desktop: moves up when hovered to avoid overlap
              isTouchDevice
                ? "bottom-[52px] left-1/2 -translate-x-1/2"
                : cn(
                    "left-1/2 -translate-x-1/2",
                    isHovered ? "bottom-[52px]" : "bottom-3"
                  )
            )}>
              {currentImageIndex + 1}/{imageCount}
            </div>
          )}

          {/* Subtle overlay on hover */}
          <div
            className="absolute inset-0 bg-black/[0.03] dark:bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10"
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
            {productConfig.showSaleBadge && hasDiscount && (
              <Badge className="bg-[var(--badge-sale-bg)] text-[var(--badge-sale-text)] text-xs font-semibold px-2 py-0.5 shadow-md">
                -{discountPercent}%
              </Badge>
            )}
            {productConfig.showStockStatus && product.inventoryStatus === 'LOW_STOCK' && (
              <Badge className="bg-[var(--color-warning)] text-[var(--color-warning-foreground)] text-xs font-semibold px-2 py-0.5 shadow-md">
                Low Stock
              </Badge>
            )}
            {productConfig.showStockStatus && product.inventoryStatus === 'OUT_OF_STOCK' && (
              <Badge className="bg-muted-foreground text-background text-xs font-semibold px-2 py-0.5 shadow-lg">
                Sold Out
              </Badge>
            )}
          </div>

          {/* Mobile Wishlist Button - Simple heart icon on top right */}
          {productConfig.showWishlist && isTouchDevice && (
            <button
              type="button"
              className={cn(
                'absolute top-2.5 right-2.5 h-8 w-8 rounded-full transition-all duration-200 z-20',
                'flex items-center justify-center',
                isInList
                  ? 'bg-[var(--wishlist-active)] text-white'
                  : 'bg-background/90 backdrop-blur-sm text-muted-foreground shadow-md border border-border/50'
              )}
              onClick={handleQuickAddToDefault}
              title={isInList ? 'Saved to wishlist' : 'Save to wishlist'}
            >
              <Heart className={cn(
                'h-4 w-4 transition-all',
                isInList && 'fill-current',
                isHeartAnimating && 'animate-heart-pop'
              )} />
            </button>
          )}

          {/* Desktop Lists Dropdown */}
          {productConfig.showWishlist && !isTouchDevice && (
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'absolute top-2.5 right-2.5 h-9 w-9 rounded-full transition-all duration-200 z-20',
                    'flex items-center justify-center',
                    'focus:outline-none focus:ring-2 focus:ring-offset-1',
                    isInList
                      ? 'bg-[var(--wishlist-active)] text-white hover:opacity-90 focus:ring-[var(--wishlist-active)]'
                      : 'bg-background/90 backdrop-blur-sm text-muted-foreground hover:text-[var(--wishlist-active)] shadow-md border border-border/50 focus:ring-[var(--wishlist-active)]'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  title={isInList ? 'Saved to wishlist' : 'Save to wishlist'}
                >
                  <Heart className={cn(
                    'h-5 w-5 transition-all',
                    isInList && 'fill-current',
                    isHeartAnimating && 'animate-heart-pop'
                  )} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2">
                {/* Header */}
                <div className="px-2 py-1.5 mb-1">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <FolderHeart className="h-3.5 w-3.5" />
                    Save to List
                  </p>
                </div>
                {!isAuthenticated ? (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = getNavPath('/auth/login');
                    }}
                    className="flex items-center gap-2 py-2.5 px-2 rounded-md"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Sign in to save items</span>
                  </DropdownMenuItem>
                ) : (
                  <>
                    {lists.map((list) => {
                      const inList = isProductInList(list);
                      return (
                        <DropdownMenuItem
                          key={list.id}
                          onClick={(e) => {
                            e.preventDefault();
                            if (inList) {
                              handleRemoveFromList(list, e);
                            } else {
                              handleAddToList(list, e);
                            }
                          }}
                          disabled={isAddingToList === list.id}
                          className={cn(
                            "flex items-center gap-2 py-2.5 px-2 rounded-md cursor-pointer",
                            inList && "bg-[var(--color-success-light)]"
                          )}
                        >
                          {isAddingToList === list.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : inList ? (
                            <Check className="h-4 w-4 text-[var(--color-success)]" />
                          ) : (
                            <Bookmark className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span className="truncate flex-1">{list.name}</span>
                          {list.isDefault && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                              Default
                            </span>
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsCreateListOpen(true);
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 py-2.5 px-2 rounded-md bg-primary/5 hover:bg-primary/10 text-primary font-medium"
                    >
                      <ListPlus className="h-4 w-4" />
                      <span>Create New List</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Actions - Always visible on mobile, hover on desktop */}
          <motion.div
            initial={false}
            animate={{
              opacity: isTouchDevice ? 1 : (isHovered ? 1 : 0),
              y: isTouchDevice ? 0 : (isHovered ? 0 : 10)
            }}
            className={cn(
              "absolute inset-x-0 bottom-0 bg-background/95 backdrop-blur-sm border-t border-border",
              isTouchDevice ? "px-3 py-2" : "p-3"
            )}
          >
            <div className="flex items-center justify-center gap-2">
              {/* Add to Cart Button */}
              <Button
                size="sm"
                variant={isOutOfStock ? "secondary" : "tenant-primary"}
                className={cn(
                  "flex-1 min-w-0 h-9",
                  isOutOfStock && "cursor-not-allowed opacity-80",
                  isTouchDevice ? "text-sm font-medium" : ""
                )}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {isOutOfStock ? (
                  <>
                    <Ban className="h-4 w-4 mr-1.5 shrink-0" />
                    <span className="truncate">Sold Out</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className={cn(
                      "h-4 w-4 mr-1.5 shrink-0",
                      isAddingToCart && "animate-cart-bounce"
                    )} />
                    <span className="truncate">{isAddingToCart ? 'Added!' : 'Add to Cart'}</span>
                  </>
                )}
              </Button>

              {/* Desktop only: Quick View button */}
              {!isTouchDevice && productConfig.showQuickView && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0 bg-background hover:bg-muted h-9 w-9 p-0"
                  onClick={openQuickView}
                  title="Quick view"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Content */}
        <div className={cn(cardStyleClasses.padding, "bg-white dark:bg-zinc-900")}>
          {/* Category/Brand */}
          {product.brand && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1 font-semibold">
              <TranslatedText text={product.brand} context="brand name" />
            </p>
          )}

          {/* Title - Enhanced visibility */}
          <h3 className="font-semibold text-zinc-900 dark:text-white text-sm md:text-base leading-snug line-clamp-2 group-hover:text-[var(--tenant-primary)] transition-colors duration-200">
            <TranslatedProductName name={product.name} />
          </h3>

          {/* Rating */}
          {productConfig.showRatings && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      'h-3.5 w-3.5 transition-colors',
                      i < Math.round(product.averageRating || 0)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-zinc-200 dark:text-zinc-700'
                    )}
                  />
                ))}
              </div>
              {product.averageRating ? (
                product.reviewCount && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    ({product.reviewCount})
                  </span>
                )
              ) : (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  No reviews yet
                </span>
              )}
            </div>
          )}

          {/* Price - Enhanced styling */}
          <div className="mt-3 flex items-baseline gap-2">
            {hasDiscount && comparePrice ? (
              <>
                <span className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white">
                  <PriceDisplay amount={price} size="lg" />
                </span>
                <span className="text-sm text-zinc-400 line-through">
                  <PriceDisplay amount={comparePrice} size="sm" />
                </span>
              </>
            ) : (
              <span className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white">
                <PriceDisplay amount={price} size="lg" />
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Create List Dialog */}
      <Dialog open={isCreateListOpen} onOpenChange={setIsCreateListOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ListPlus className="h-5 w-5 text-primary" />
              </div>
              Create New List
            </DialogTitle>
            <DialogDescription>
              Create a new list and add this product to it.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <label htmlFor="new-list-name" className="text-sm font-medium flex items-center gap-2">
                <FolderHeart className="h-4 w-4 text-muted-foreground" />
                List Name
              </label>
              <Input
                id="new-list-name"
                placeholder="e.g., Christmas Ideas, Birthday Gifts"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                maxLength={100}
                className="h-11"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newListName.trim()) {
                    handleCreateList();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                You can save items to this list and share it with friends.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCreateListOpen(false)}>
              Cancel
            </Button>
            <Button
              className="btn-tenant-primary gap-2"
              onClick={handleCreateList}
              disabled={!newListName.trim() || isCreatingList}
            >
              {isCreatingList ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create & Add
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <ImageLightbox
        images={allImages.map((url, idx) => ({
          url,
          alt: `${product.name} - Image ${idx + 1}`,
        }))}
        initialIndex={currentImageIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        enablePinchToZoom={mobileConfig?.pinchToZoom !== false}
      />

      {/* Quick View Modal */}
      {productConfig.showQuickView && (
        <QuickViewModal
          product={product}
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
        />
      )}
    </motion.div>
  );
}
