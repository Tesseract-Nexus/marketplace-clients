'use client';

import { useState, useCallback } from 'react';
import { ShoppingCart, Check, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useOptimisticCart } from '@/hooks/useOptimisticCart';
import { CartItem } from '@/types/storefront';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/lib/analytics/openpanel';

interface AddToCartButtonProps extends Omit<ButtonProps, 'onClick' | 'variant'> {
  /** Product data to add to cart */
  product: Omit<CartItem, 'id' | 'quantity'>;
  /** Initial quantity to add (default: 1) */
  quantity?: number;
  /** Show quantity selector */
  showQuantitySelector?: boolean;
  /** Variant: default button or icon-only */
  variant?: 'default' | 'icon' | 'mini';
  /** Custom button text */
  buttonText?: string;
  /** Show success animation duration (ms) */
  successDuration?: number;
  /** Callback after adding to cart */
  onAddToCart?: () => void;
  /** Whether to show toast notification */
  showToast?: boolean;
}

/**
 * AddToCartButton Component
 *
 * An optimistic add-to-cart button with:
 * - Immediate visual feedback
 * - Success animation (checkmark)
 * - Optional quantity selector
 * - Multiple variants (default, icon, mini)
 */
export function AddToCartButton({
  product,
  quantity: initialQuantity = 1,
  showQuantitySelector = false,
  variant = 'default',
  buttonText,
  successDuration = 1500,
  onAddToCart,
  showToast = true,
  className,
  disabled,
  ...props
}: AddToCartButtonProps) {
  const { addToCart } = useOptimisticCart();
  const analytics = useAnalytics();
  const [quantity, setQuantity] = useState(initialQuantity);
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddToCart = useCallback(() => {
    if (isAdding || disabled) return;

    setIsAdding(true);

    // Add to cart optimistically
    addToCart(
      {
        ...product,
        quantity,
      },
      {
        showToast,
        onSuccess: () => {
          setShowSuccess(true);
          analytics.productAddedToCart({ productId: product.productId, name: product.name, price: product.price, quantity });
          onAddToCart?.();

          // Reset success state after duration
          setTimeout(() => {
            setShowSuccess(false);
            setIsAdding(false);
          }, successDuration);
        },
        onError: () => {
          setIsAdding(false);
        },
      }
    );
  }, [addToCart, product, quantity, showToast, successDuration, onAddToCart, isAdding, disabled]);

  const incrementQuantity = () => setQuantity((q) => q + 1);
  const decrementQuantity = () => setQuantity((q) => Math.max(1, q - 1));

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <Button
        size="icon"
        className={cn(
          'relative overflow-hidden transition-all',
          showSuccess && 'bg-green-500 hover:bg-green-600',
          className
        )}
        onClick={handleAddToCart}
        disabled={disabled || isAdding}
        aria-label={showSuccess ? 'Added to cart' : 'Add to cart'}
        {...props}
      >
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
            </motion.div>
          ) : (
            <motion.div
              key="cart"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    );
  }

  // Mini variant (compact with quantity)
  if (variant === 'mini') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {showQuantitySelector && (
          <>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={decrementQuantity}
              disabled={quantity <= 1 || isAdding}
              aria-label="Decrease quantity"
            >
              <Minus className="h-3 w-3" aria-hidden="true" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">{quantity}</span>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={incrementQuantity}
              disabled={isAdding}
              aria-label="Increase quantity"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
            </Button>
          </>
        )}
        <Button
          size="sm"
          className={cn(
            'relative overflow-hidden transition-all',
            showSuccess && 'bg-green-500 hover:bg-green-600 text-white'
          )}
          onClick={handleAddToCart}
          disabled={disabled || isAdding}
          {...props}
        >
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.span
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-1"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                <TranslatedUIText text="Added" />
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-1"
              >
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                <TranslatedUIText text="Add" />
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('space-y-2', className)}>
      {showQuantitySelector && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            <TranslatedUIText text="Quantity" />:
          </span>
          <div className="flex items-center border rounded-lg">
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-r-none"
              onClick={decrementQuantity}
              disabled={quantity <= 1 || isAdding}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-l-none"
              onClick={incrementQuantity}
              disabled={isAdding}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      <Button
        className={cn(
          'w-full relative overflow-hidden transition-all btn-tenant-primary',
          showSuccess && 'bg-green-500 hover:bg-green-600'
        )}
        onClick={handleAddToCart}
        disabled={disabled || isAdding}
        {...props}
      >
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.span
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-2"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                <Check className="h-5 w-5" aria-hidden="true" />
              </motion.div>
              <TranslatedUIText text="Added to Cart!" />
            </motion.span>
          ) : (
            <motion.span
              key="add"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              <TranslatedUIText text={buttonText || 'Add to Cart'} />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Ripple effect on success */}
        {showSuccess && (
          <motion.div
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 bg-white rounded-full pointer-events-none"
            style={{ transformOrigin: 'center' }}
          />
        )}
      </Button>
    </div>
  );
}

export default AddToCartButton;
