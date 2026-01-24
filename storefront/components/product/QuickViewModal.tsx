'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Minus, Plus, ShoppingCart, Heart, Star, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Product } from '@/types/storefront';
import { useTenant, useNavPath } from '@/context/TenantContext';
import { useCartStore } from '@/store/cart';
import { cn } from '@/lib/utils';
import { getProductShippingData } from '@/lib/utils/product-shipping';
import { TranslatedProductName, TranslatedText } from '@/components/translation';
import { PriceDisplay, PriceWithDiscount } from '@/components/currency/PriceDisplay';

interface QuickViewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { tenant } = useTenant();
  const getNavPath = useNavPath();
  const addToCart = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isOutOfStock = product.inventoryStatus === 'OUT_OF_STOCK';

  // Get all image URLs
  const allImages = useMemo(() => {
    const images = product.images || [];
    const sorted = [...images].sort((a, b) => {
      const aIsPrimary = typeof a !== 'string' && a?.isPrimary ? 1 : 0;
      const bIsPrimary = typeof b !== 'string' && b?.isPrimary ? 1 : 0;
      if (bIsPrimary !== aIsPrimary) return bIsPrimary - aIsPrimary;
      const aPos = typeof a !== 'string' ? (a?.position ?? 999) : 999;
      const bPos = typeof b !== 'string' ? (b?.position ?? 999) : 999;
      return aPos - bPos;
    });
    return sorted.map((img) =>
      typeof img === 'string' ? img : img?.url
    ).filter(Boolean) as string[];
  }, [product.images]);

  const imageCount = allImages.length;
  const currentImage = allImages[currentImageIndex] || '/placeholder.svg';

  const price = parseFloat(product.price);
  const comparePrice = product.comparePrice ? parseFloat(product.comparePrice) : null;
  const hasDiscount = comparePrice && comparePrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice - price) / comparePrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    setIsAddingToCart(true);
    const shippingData = getProductShippingData(product);

    addToCart({
      productId: product.id,
      name: product.name,
      price,
      quantity,
      image: allImages[0] || '/placeholder.svg',
      ...shippingData,
    });

    setTimeout(() => {
      setIsAddingToCart(false);
      onClose();
    }, 500);
  };

  const goToNextImage = () => {
    if (currentImageIndex < imageCount - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const goToPrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Quick View: {product.name}</DialogTitle>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-white/90 p-2 shadow-md hover:bg-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative aspect-square bg-muted">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentImageIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0"
              >
                <Image
                  src={currentImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation arrows */}
            {imageCount > 1 && (
              <>
                {currentImageIndex > 0 && (
                  <button
                    onClick={goToPrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                {currentImageIndex < imageCount - 1 && (
                  <button
                    onClick={goToNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </>
            )}

            {/* Image indicators */}
            {imageCount > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {allImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all',
                      idx === currentImageIndex
                        ? 'bg-white w-6'
                        : 'bg-white/50 hover:bg-white/80'
                    )}
                  />
                ))}
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {hasDiscount && (
                <Badge variant="sale">-{discountPercent}%</Badge>
              )}
              {product.inventoryStatus === 'LOW_STOCK' && (
                <Badge variant="low-stock">Low Stock</Badge>
              )}
              {isOutOfStock && (
                <Badge variant="out-of-stock">Sold Out</Badge>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 md:p-8 flex flex-col">
            {/* Brand */}
            {product.brand && (
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                <TranslatedText text={product.brand} context="brand name" />
              </p>
            )}

            {/* Title */}
            <h2 className="text-xl md:text-2xl font-semibold mb-3">
              <TranslatedProductName name={product.name} />
            </h2>

            {/* Rating */}
            {product.averageRating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-4 w-4',
                        i < Math.round(product.averageRating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-200'
                      )}
                    />
                  ))}
                </div>
                {product.reviewCount && (
                  <span className="text-sm text-muted-foreground">
                    ({product.reviewCount} reviews)
                  </span>
                )}
              </div>
            )}

            {/* Price */}
            <div className="mb-4">
              {hasDiscount && comparePrice ? (
                <PriceWithDiscount
                  originalAmount={comparePrice}
                  saleAmount={price}
                  size="xl"
                />
              ) : (
                <PriceDisplay amount={price} size="xl" />
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-muted-foreground mb-6 line-clamp-4">
                <TranslatedText text={product.description} context="product description" />
              </p>
            )}

            {/* SKU */}
            {product.sku && (
              <p className="text-xs text-muted-foreground mb-4">
                SKU: {product.sku}
              </p>
            )}

            <div className="mt-auto space-y-4">
              {/* Quantity Selector */}
              {!isOutOfStock && (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">Quantity:</span>
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 hover:bg-muted transition-colors"
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 hover:bg-muted transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <Button
                size="lg"
                className="w-full"
                variant={isOutOfStock ? "secondary" : "tenant-primary"}
                onClick={handleAddToCart}
                disabled={isOutOfStock || isAddingToCart}
              >
                {isOutOfStock ? (
                  'Out of Stock'
                ) : isAddingToCart ? (
                  'Added to Cart!'
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </>
                )}
              </Button>

              {/* View Full Details Link */}
              <Link
                href={getNavPath(`/products/${product.id}`)}
                className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={onClose}
              >
                View Full Details
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
