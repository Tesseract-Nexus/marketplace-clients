'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import {
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  Star,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  Facebook,
  Instagram,
  MessageCircle,
  Link2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useTenant, useProductConfig, useNavPath, useMobileConfig } from '@/context/TenantContext';
import { useCartStore } from '@/store/cart';
import { useListsStore } from '@/store/lists';
import { useAuthStore } from '@/store/auth';
import { Product } from '@/types/storefront';
import { cn } from '@/lib/utils';
import { getProductShippingData } from '@/lib/utils/product-shipping';
import { ProductReviews } from '@/components/product/ProductReviews';
import { ProductPromotion } from '@/components/marketing/ProductPromotion';
import {
  TranslatedProductName,
  TranslatedProductDescription,
  TranslatedText,
  TranslatedUIText,
} from '@/components/translation';
import { PriceDisplay, PriceWithDiscount } from '@/components/currency/PriceDisplay';
import { usePriceFormatting } from '@/context/CurrencyContext';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { tenant } = useTenant();
  const productConfig = useProductConfig();
  const mobileConfig = useMobileConfig();
  const getNavPath = useNavPath();
  const { formatDisplayPrice } = usePriceFormatting();
  const addToCart = useCartStore((state) => state.addItem);
  const { lists, fetchLists, addToDefaultList, removeProductFromList, isInAnyList, getListsContainingProduct } = useListsStore();
  const { customer, accessToken, isAuthenticated } = useAuthStore();

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const addToCartRef = useRef<HTMLDivElement>(null);

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  // Track scroll to show/hide sticky bar on mobile
  useEffect(() => {
    if (!isTouchDevice) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          // Show sticky bar when the main Add to Cart button is NOT visible
          setShowStickyBar(!entry.isIntersecting);
        }
      },
      { threshold: 0.1 }
    );

    if (addToCartRef.current) {
      observer.observe(addToCartRef.current);
    }

    return () => observer.disconnect();
  }, [isTouchDevice]);

  // Fetch lists when authenticated
  useEffect(() => {
    if (isAuthenticated && tenant && customer && lists.length === 0) {
      fetchLists(tenant.id, tenant.storefrontId, customer.id, accessToken || '');
    }
  }, [isAuthenticated, tenant, lists.length, customer?.id, accessToken, fetchLists]);

  // Get images, prioritizing primary images first
  const images = useMemo(() => {
    const imgs = product.images || [];
    // Sort: primary images first, then by position
    const sorted = [...imgs].sort((a, b) => {
      const aIsPrimary = typeof a !== 'string' && a?.isPrimary ? 1 : 0;
      const bIsPrimary = typeof b !== 'string' && b?.isPrimary ? 1 : 0;
      if (bIsPrimary !== aIsPrimary) return bIsPrimary - aIsPrimary;
      const aPos = typeof a !== 'string' ? (a?.position ?? 999) : 999;
      const bPos = typeof b !== 'string' ? (b?.position ?? 999) : 999;
      return aPos - bPos;
    });
    return sorted.map((img) => typeof img === 'string' ? img : img.url);
  }, [product.images]);

  // Swipe handling for mobile image gallery
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && selectedImage < images.length - 1) {
      setSelectedImage(prev => prev + 1);
    } else if (info.offset.x > threshold && selectedImage > 0) {
      setSelectedImage(prev => prev - 1);
    }
  }, [selectedImage, images.length]);

  const price = parseFloat(product.price);
  const comparePrice = product.comparePrice ? parseFloat(product.comparePrice) : null;
  const hasDiscount = comparePrice && comparePrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  const isWishlisted = isInAnyList(product.id);

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const shippingData = getProductShippingData(product);

    addToCart({
      productId: product.id,
      name: product.name,
      price,
      quantity,
      image: images[0],
      ...shippingData,
    });

    setIsAddingToCart(false);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated || !customer || !tenant) {
      window.location.href = getNavPath('/auth/login');
      return;
    }

    if (isInAnyList(product.id)) {
      // Remove from whichever list(s) contain it
      const containingLists = getListsContainingProduct(product.id);
      for (const list of containingLists) {
        await removeProductFromList(tenant.id, tenant.storefrontId, customer.id, accessToken || '', list.id, product.id);
      }
    } else {
      await addToDefaultList(tenant.id, tenant.storefrontId, customer.id, accessToken || '', {
        id: product.id,
        name: product.name,
        image: images[0],
        price,
      });
    }
  };

  // Social sharing handlers
  const getProductUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  }, []);

  const shareToFacebook = useCallback(() => {
    const url = getProductUrl();
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      '_blank',
      'width=600,height=400'
    );
  }, [getProductUrl]);

  const shareToWhatsApp = useCallback(() => {
    const url = getProductUrl();
    const text = `Check out ${product.name}!`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
      '_blank'
    );
  }, [getProductUrl, product.name]);

  const shareToX = useCallback(() => {
    const url = getProductUrl();
    const text = `Check out ${product.name}!`;
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      '_blank',
      'width=600,height=400'
    );
  }, [getProductUrl, product.name]);

  const shareToInstagram = useCallback(() => {
    // Instagram doesn't have a direct share URL, copy link and guide user
    copyLink();
  }, []);

  const copyLink = useCallback(async () => {
    const url = getProductUrl();
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }, [getProductUrl]);

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const openLightbox = useCallback(() => {
    setIsLightboxOpen(true);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="container-tenant py-4">
        <nav className="text-sm text-muted-foreground">
          <Link href={getNavPath('/')} className="hover:text-foreground">
            <TranslatedUIText text="Home" />
          </Link>
          <span className="mx-2">/</span>
          <Link href={getNavPath('/products')} className="hover:text-foreground">
            <TranslatedUIText text="Products" />
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">
            <TranslatedProductName name={product.name} />
          </span>
        </nav>
      </div>

      {/* Product Section */}
      <div className="container-tenant pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <div className="space-y-4">
            <div
              className="relative aspect-square rounded-xl overflow-hidden bg-muted cursor-zoom-in group"
              onClick={openLightbox}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openLightbox()}
              aria-label="Click to view full size image"
            >
              {/* Swipeable image gallery on mobile */}
              {isTouchDevice && images.length > 1 ? (
                <motion.div
                  className="absolute inset-0"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedImage}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={images[selectedImage] || '/placeholder.svg'}
                        alt={product.name}
                        fill
                        className="object-cover pointer-events-none group-hover:scale-105 transition-transform duration-300"
                        priority
                        draggable={false}
                      />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={images[selectedImage] || '/placeholder.svg'}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      priority
                    />
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Navigation arrows - larger on mobile */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className={cn(
                      "absolute left-2 md:left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg z-10",
                      isTouchDevice && "h-10 w-10"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      prevImage();
                    }}
                  >
                    <ChevronLeft className={cn("h-5 w-5", isTouchDevice && "h-6 w-6")} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className={cn(
                      "absolute right-2 md:right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg z-10",
                      isTouchDevice && "h-10 w-10"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      nextImage();
                    }}
                  >
                    <ChevronRight className={cn("h-5 w-5", isTouchDevice && "h-6 w-6")} />
                  </Button>
                </>
              )}

              {hasDiscount && (
                <Badge className="absolute top-4 left-4 bg-[var(--badge-sale-bg)] text-[var(--badge-sale-text)] z-10">
                  -{discountPercent}% OFF
                </Badge>
              )}

              {/* Image indicator dots for mobile */}
              {isTouchDevice && images.length > 1 && (
                <div
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 rounded-full px-2 py-1 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(idx);
                      }}
                      className={cn(
                        'w-1.5 h-1.5 rounded-full transition-all',
                        idx === selectedImage
                          ? 'bg-white w-3'
                          : 'bg-white/60'
                      )}
                      aria-label={`View image ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail strip - scrollable on mobile */}
            {images.length > 1 && (
              <div className={cn(
                "flex gap-2 md:gap-3 overflow-x-auto pb-2 scroll-smooth",
                isTouchDevice && "snap-x snap-mandatory -mx-4 px-4"
              )}>
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      'relative shrink-0 rounded-lg overflow-hidden border-2 transition-all snap-start',
                      isTouchDevice ? 'w-16 h-16' : 'w-20 h-20',
                      selectedImage === index
                        ? 'border-tenant-primary'
                        : 'border-transparent hover:border-muted-foreground/30'
                    )}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {product.brand && (
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                <TranslatedText text={product.brand} context="brand name" />
              </p>
            )}

            <h1 className="text-3xl md:text-4xl font-bold">
              <TranslatedProductName name={product.name} />
            </h1>

            {productConfig.showRatings && (
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-5 w-5',
                        i < Math.round(product.averageRating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
                {product.averageRating ? (
                  <span className="text-sm text-muted-foreground">
                    {product.averageRating} ({product.reviewCount} <TranslatedUIText text="reviews" />)
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No reviews yet
                  </span>
                )}
              </div>
            )}

            <div className="flex items-baseline gap-3 flex-wrap">
              {hasDiscount && comparePrice ? (
                <>
                  <PriceWithDiscount
                    originalAmount={comparePrice}
                    saleAmount={price}
                    size="lg"
                    showPercentage={false}
                  />
                  <Badge variant="secondary" className="text-[var(--color-success)]">
                    Save {formatDisplayPrice(comparePrice - price)}
                  </Badge>
                </>
              ) : (
                <PriceDisplay amount={price} size="xl" />
              )}
            </div>

            {productConfig.showStockStatus && (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    product.inventoryStatus === 'IN_STOCK'
                      ? 'bg-[var(--color-success)]'
                      : product.inventoryStatus === 'LOW_STOCK'
                      ? 'bg-[var(--color-warning)]'
                      : 'bg-[var(--color-error)]'
                  )}
                />
                <span className="text-sm">
                  <TranslatedUIText text={product.inventoryStatus === 'IN_STOCK'
                    ? 'In Stock'
                    : product.inventoryStatus === 'LOW_STOCK'
                    ? 'Low Stock'
                    : 'Out of Stock'} />
                </span>
              </div>
            )}

            <Separator />

            {/* Actions section - ref for sticky bar visibility tracking */}
            <div ref={addToCartRef} className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium"><TranslatedUIText text="Quantity" />:</span>
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("rounded-r-none", isTouchDevice && "h-11 w-11")}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className={cn("w-12 text-center font-medium", isTouchDevice && "w-14 text-lg")}>{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("rounded-l-none", isTouchDevice && "h-11 w-11")}
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant={addedToCart ? "secondary" : "tenant-glow"}
                  size="xl"
                  className={cn("flex-1", addedToCart && "bg-[var(--color-success)] hover:opacity-90 text-[var(--color-success-foreground)]")}
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || product.inventoryStatus === 'OUT_OF_STOCK'}
                >
                  {isAddingToCart ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <TranslatedUIText text="Adding..." />
                    </div>
                  ) : addedToCart ? (
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5" />
                      <TranslatedUIText text="Added!" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      <TranslatedUIText text="Add to Cart" />
                    </div>
                  )}
                </Button>

                <Button
                  variant="tenant-outline"
                  size="xl"
                  className={cn(
                    isTouchDevice && "h-12 w-12",
                    isWishlisted && 'text-[var(--wishlist-active)] border-[var(--wishlist-active)]'
                  )}
                  onClick={handleToggleWishlist}
                >
                  <Heart className={cn('h-5 w-5', isWishlisted && 'fill-current')} />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="tenant-outline" size="xl" className={cn(isTouchDevice && "h-12 w-12")}>
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={shareToFacebook} className="cursor-pointer">
                      <Facebook className="h-4 w-4 mr-2 text-[#1877F2]" />
                      <span>Facebook</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={shareToInstagram} className="cursor-pointer">
                      <Instagram className="h-4 w-4 mr-2 text-[#E4405F]" />
                      <span>Instagram</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={shareToWhatsApp} className="cursor-pointer">
                      <MessageCircle className="h-4 w-4 mr-2 text-[#25D366]" />
                      <span>WhatsApp</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={shareToX} className="cursor-pointer">
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span>X (Twitter)</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={copyLink} className="cursor-pointer">
                      {linkCopied ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2 text-[var(--color-success)]" />
                          <span className="text-[var(--color-success)]">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="h-4 w-4 mr-2" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <Separator />

            {/* Product Promotions */}
            <ProductPromotion
              productId={product.id}
              productPrice={price}
              className="my-4"
            />

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <Truck className="h-6 w-6 mx-auto mb-2 text-tenant-primary" />
                <p className="text-xs font-medium"><TranslatedUIText text="Free Shipping" /></p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <Shield className="h-6 w-6 mx-auto mb-2 text-tenant-primary" />
                <p className="text-xs font-medium"><TranslatedUIText text="2 Year Warranty" /></p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <RotateCcw className="h-6 w-6 mx-auto mb-2 text-tenant-primary" />
                <p className="text-xs font-medium"><TranslatedUIText text="30 Day Returns" /></p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-tenant-primary data-[state=active]:bg-transparent"
              >
                <TranslatedUIText text="Description" />
              </TabsTrigger>
              <TabsTrigger
                value="specifications"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-tenant-primary data-[state=active]:bg-transparent"
              >
                <TranslatedUIText text="Specifications" />
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-tenant-primary data-[state=active]:bg-transparent"
              >
                <TranslatedUIText text="Reviews" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-6">
              <div className="prose prose-gray max-w-none">
                <TranslatedProductDescription
                  description={product.description || ''}
                  className="whitespace-pre-line"
                />
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="mt-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex justify-between py-3 border-b">
                  <span className="text-muted-foreground"><TranslatedUIText text="SKU" /></span>
                  <span className="font-medium">{product.sku}</span>
                </div>
                {product.brand && (
                  <div className="flex justify-between py-3 border-b">
                    <span className="text-muted-foreground"><TranslatedUIText text="Brand" /></span>
                    <span className="font-medium">
                      <TranslatedText text={product.brand} context="brand name" />
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-3 border-b">
                  <span className="text-muted-foreground"><TranslatedUIText text="Availability" /></span>
                  <span className="font-medium">
                    <TranslatedUIText text={product.inventoryStatus === 'IN_STOCK' ? 'In Stock' : 'Out of Stock'} />
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <ProductReviews productId={product.id} productName={product.name} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Enhanced Sticky Add to Cart (Mobile) - Shows when main button not visible and setting enabled */}
      <AnimatePresence>
        {isTouchDevice && showStickyBar && mobileConfig?.stickyAddToCart !== false && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 right-0 z-40 md:hidden"
            style={{ bottom: 'calc(var(--mobile-nav-height, 64px))' }}
          >
            <div className="bg-background/95 backdrop-blur-lg border-t shadow-lg">
              <div className="container-tenant py-3">
                <div className="flex items-center gap-3">
                  {/* Product thumbnail */}
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
                    <Image
                      src={images[0] || '/placeholder.svg'}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Price and name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      <TranslatedProductName name={product.name} />
                    </p>
                    <div className="flex items-center gap-2">
                      {hasDiscount && comparePrice ? (
                        <PriceWithDiscount
                          originalAmount={comparePrice}
                          saleAmount={price}
                          size="sm"
                          showPercentage={false}
                        />
                      ) : (
                        <PriceDisplay amount={price} size="md" className="font-bold" />
                      )}
                      {quantity > 1 && (
                        <span className="text-xs text-muted-foreground">x{quantity}</span>
                      )}
                    </div>
                  </div>

                  {/* Quick quantity controls */}
                  <div className="flex items-center border rounded-lg shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-r-none"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-l-none"
                      onClick={() => setQuantity((q) => q + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Add to Cart button */}
                  <Button
                    variant={addedToCart ? "secondary" : "tenant-primary"}
                    size="lg"
                    className={cn(
                      "h-11 px-4 shrink-0",
                      addedToCart && "bg-[var(--color-success)] hover:opacity-90 text-[var(--color-success-foreground)]"
                    )}
                    onClick={handleAddToCart}
                    disabled={isAddingToCart || product.inventoryStatus === 'OUT_OF_STOCK'}
                  >
                    {isAddingToCart ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : addedToCart ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5 mr-1.5" />
                        <span className="hidden xs:inline"><TranslatedUIText text="Add" /></span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom padding to account for sticky bar and mobile nav */}
      {isTouchDevice && <div className="h-24 md:hidden" />}

      {/* Image Lightbox */}
      <ImageLightbox
        images={images.map((url, idx) => ({
          url,
          alt: `${product.name} - Image ${idx + 1}`,
        }))}
        initialIndex={selectedImage}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
}
