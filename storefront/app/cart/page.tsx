'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ShoppingCart, Sparkles, Truck, AlertTriangle, TrendingUp, TrendingDown, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useNavPath } from '@/context/TenantContext';
import { useCartStore } from '@/store/cart';
import { CouponInput } from '@/components/checkout/CouponInput';
import { usePriceFormatting } from '@/context/CurrencyContext';
import { useCartValidation, getStatusBadgeInfo, formatPriceChange } from '@/hooks/useCartValidation';
import type { CartItemStatus } from '@/types/storefront';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

// Status badge component with improved messages
function ItemStatusBadge({ status, availableStock, statusMessage }: { status?: CartItemStatus; availableStock?: number; statusMessage?: string }) {
  const badgeInfo = getStatusBadgeInfo(status);
  if (!badgeInfo) return null;

  const variantMap: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
    destructive: 'destructive',
    warning: 'secondary',
    secondary: 'secondary',
    default: 'default',
    outline: 'outline',
  };

  // Improved user-friendly messages
  const getDisplayMessage = () => {
    if (statusMessage) {
      // Transform backend messages to user-friendly versions
      if (statusMessage.includes('not found') || statusMessage.includes('removed')) {
        return 'This item is no longer available';
      }
      return statusMessage;
    }
    return badgeInfo.label;
  };

  return (
    <Badge variant={variantMap[badgeInfo.variant] || 'default'} className="gap-1">
      {status === 'OUT_OF_STOCK' && <XCircle className="h-3 w-3" />}
      {status === 'UNAVAILABLE' && <AlertCircle className="h-3 w-3" />}
      {status === 'LOW_STOCK' && <AlertTriangle className="h-3 w-3" />}
      {status === 'PRICE_CHANGED' && <TrendingUp className="h-3 w-3" />}
      {badgeInfo.label}
      {status === 'LOW_STOCK' && availableStock !== undefined && ` (${availableStock} left)`}
    </Badge>
  );
}

// Skeleton loader for cart items
function CartItemSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-card rounded-xl border animate-pulse">
      <div className="flex items-start pt-1">
        <div className="h-4 w-4 bg-muted rounded" />
      </div>
      <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-muted shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between gap-2">
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-4 bg-muted rounded w-1/3" />
          </div>
          <div className="h-6 w-20 bg-muted rounded shrink-0" />
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="h-9 w-28 bg-muted rounded-lg" />
          <div className="h-8 w-20 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const getNavPath = useNavPath();
  const { formatDisplayPrice } = usePriceFormatting();
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    getSelectedItems,
    getSelectedCount,
    getSelectedTotal,
    areAllSelected,
    appliedCoupon,
    setAppliedCoupon,
    clearAppliedCoupon,
  } = useCartStore();

  const {
    isValidating,
    hasIssues,
    hasUnavailableItems,
    hasPriceChanges,
    unavailableCount,
    outOfStockCount,
    priceChangedCount,
    lastValidatedAt,
    validate,
    removeUnavailable,
    acceptPriceChanges,
  } = useCartValidation({ autoValidate: true });

  const selectedItems = getSelectedItems();
  const selectedCount = getSelectedCount();
  const selectedSubtotal = getSelectedTotal();
  const allSelected = areAllSelected();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = appliedCoupon?.discountAmount || 0;
  const tax = (selectedSubtotal - discount) * 0.08;
  // Total excludes shipping - calculated at checkout with real carrier rates
  const total = selectedSubtotal + tax - discount;
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--tenant-primary)]/5 via-background to-[var(--tenant-secondary)]/5" />
          <div
            className="absolute top-0 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-20"
            style={{ background: 'var(--tenant-primary)' }}
          />

          <div className="container-tenant relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl mx-auto"
            >
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[var(--tenant-primary)]/10 flex items-center justify-center">
                <ShoppingBag className="h-12 w-12 text-tenant-primary" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4"><TranslatedUIText text="Your Cart is Empty" /></h1>
              <p className="text-muted-foreground mb-8 text-lg">
                <TranslatedUIText text="Looks like you haven't added anything to your cart yet. Start shopping to fill it up!" />
              </p>
              <Button asChild variant="tenant-gradient" size="xl">
                <Link href={getNavPath('/products')}>
                  <Sparkles className="mr-2 h-5 w-5" />
                  <TranslatedUIText text="Discover Products" />
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-10 md:py-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--tenant-primary)]/5 via-background to-[var(--tenant-secondary)]/5" />
        <div
          className="absolute top-0 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-15"
          style={{ background: 'var(--tenant-primary)' }}
        />

        <div className="container-tenant relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tenant-primary/10 text-tenant-primary mb-4">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm font-medium">{itemCount} <TranslatedUIText text="Items" /></span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold"><TranslatedUIText text="Shopping Cart" /></h1>
          </motion.div>
        </div>
      </section>

      {/* Cart Content */}
      <section className="py-8 md:py-12">
        <div className="container-tenant">
          {/* Cart Issues Banner */}
          {hasIssues && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 space-y-3"
            >
              {(hasUnavailableItems || outOfStockCount > 0) && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle><TranslatedUIText text="Some items need attention" /></AlertTitle>
                  <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span>
                      {unavailableCount > 0 && (
                        <span>{unavailableCount} {unavailableCount === 1 ? 'item is' : 'items are'} no longer available</span>
                      )}
                      {unavailableCount > 0 && outOfStockCount > 0 && ', '}
                      {outOfStockCount > 0 && (
                        <span>{outOfStockCount} {outOfStockCount === 1 ? 'item is' : 'items are'} out of stock</span>
                      )}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeUnavailable}
                      disabled={isValidating}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      <TranslatedUIText text="Remove unavailable" />
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              {hasPriceChanges && priceChangedCount > 0 && (
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertTitle><TranslatedUIText text="Prices have changed" /></AlertTitle>
                  <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <span>
                      {priceChangedCount} <TranslatedUIText text="item(s) have different prices than when you added them" />
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={acceptPriceChanges}
                      disabled={isValidating}
                    >
                      <TranslatedUIText text="Accept new prices" />
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Select All Header */}
              <div className="flex items-center justify-between p-4 bg-card rounded-xl border">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        selectAllItems();
                      } else {
                        deselectAllItems();
                      }
                    }}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    <TranslatedUIText text="Select All" />
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground">
                    {selectedCount > 0 ? (
                      <span className="text-tenant-primary font-medium">
                        {selectedCount} <TranslatedUIText text="of" /> {itemCount} <TranslatedUIText text="items selected" />
                      </span>
                    ) : (
                      <span><TranslatedUIText text="No items selected" /></span>
                    )}
                  </div>
                  {isValidating && (
                    <span className="text-xs text-muted-foreground animate-pulse">
                      <TranslatedUIText text="Checking availability..." />
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={validate}
                    disabled={isValidating}
                    className="text-muted-foreground hover:text-tenant-primary"
                    title="Check item availability and prices"
                  >
                    <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
                    <span className="sr-only"><TranslatedUIText text="Refresh cart" /></span>
                  </Button>
                </div>
              </div>

              {/* Show skeleton during initial validation (no lastValidatedAt means first load) */}
              {isValidating && !lastValidatedAt && (
                <div className="space-y-4">
                  {items.map((_, index) => (
                    <CartItemSkeleton key={index} />
                  ))}
                </div>
              )}

              {/* Only show items when not doing initial validation */}
              {!(isValidating && !lastValidatedAt) && (
              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-xl border hover:shadow-md transition-all ${
                      item.status === 'UNAVAILABLE' || item.status === 'OUT_OF_STOCK'
                        ? 'border-red-200 bg-red-50/30 dark:bg-red-950/10'
                        : item.status === 'PRICE_CHANGED'
                        ? 'border-yellow-200 bg-yellow-50/30 dark:bg-yellow-950/10'
                        : item.selected !== false
                        ? 'border-tenant-primary/30'
                        : 'opacity-60'
                    }`}
                  >
                    {/* Top Row: Checkbox + Image + Basic Info */}
                    <div className="flex gap-3">
                      {/* Selection Checkbox */}
                      <div className="flex items-start pt-1">
                        <Checkbox
                          id={`item-${item.id}`}
                          checked={item.selected !== false}
                          onCheckedChange={() => toggleItemSelection(item.id)}
                          className="h-5 w-5"
                        />
                      </div>

                      <Link href={getNavPath(`/products/${item.productId}`)} className="shrink-0">
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-lg sm:rounded-xl overflow-hidden bg-muted">
                          <Image
                            src={item.image || '/placeholder.svg'}
                            alt={item.name}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-2">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={getNavPath(`/products/${item.productId}`)}
                              className="font-semibold text-sm sm:text-base hover:text-tenant-primary transition-colors line-clamp-2"
                            >
                              {item.name}
                            </Link>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-1">
                              {item.variant && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.variant.name}
                                </Badge>
                              )}
                              <ItemStatusBadge status={item.status} availableStock={item.availableStock} statusMessage={item.statusMessage} />
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                              {item.priceChange ? (
                                <span className="flex items-center gap-1">
                                  <span className="line-through text-muted-foreground/60">
                                    {formatDisplayPrice(item.priceChange.oldPrice)}
                                  </span>
                                  <span className={item.priceChange.isIncrease ? 'text-red-500' : 'text-green-500'}>
                                    {formatDisplayPrice(item.priceChange.newPrice)}
                                  </span>
                                  {item.priceChange.isIncrease ? (
                                    <TrendingUp className="h-3 w-3 text-red-500" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 text-green-500" />
                                  )}
                                </span>
                              ) : (
                                <span>{formatDisplayPrice(item.price)} <TranslatedUIText text="each" /></span>
                              )}
                            </div>
                          </div>
                          {/* Price - visible on desktop, hidden on mobile */}
                          <p className={`hidden sm:block font-bold text-lg shrink-0 ${
                            item.status === 'UNAVAILABLE' || item.status === 'OUT_OF_STOCK'
                              ? 'text-muted-foreground line-through'
                              : 'text-tenant-primary'
                          }`}>
                            {formatDisplayPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Quantity + Remove + Price (mobile) */}
                    <div className="flex items-center justify-between gap-2 pl-8 sm:pl-0 sm:ml-[calc(theme(spacing.5)+theme(spacing.3)+theme(spacing.24))] md:ml-[calc(theme(spacing.5)+theme(spacing.3)+theme(spacing.28))]">
                      <div className="flex items-center border rounded-lg bg-muted/50">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 sm:h-9 sm:w-9 rounded-r-none hover:bg-tenant-primary/10"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-10 sm:w-12 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 sm:h-9 sm:w-9 rounded-l-none hover:bg-tenant-primary/10"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {/* Mobile price + Remove button */}
                      <div className="flex items-center gap-2 sm:gap-4">
                        <p className={`sm:hidden font-bold ${
                          item.status === 'UNAVAILABLE' || item.status === 'OUT_OF_STOCK'
                            ? 'text-muted-foreground line-through'
                            : 'text-tenant-primary'
                        }`}>
                          {formatDisplayPrice(item.price * item.quantity)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-red-500 hover:bg-red-50 h-9 px-2 sm:px-3"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline"><TranslatedUIText text="Remove" /></span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4"
              >
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-red-500"
                  onClick={clearCart}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  <TranslatedUIText text="Clear Cart" />
                </Button>
                <Button variant="outline" asChild>
                  <Link href={getNavPath('/products')}>
                    <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                    <TranslatedUIText text="Continue Shopping" />
                  </Link>
                </Button>
              </motion.div>
            </div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1"
            >
              <div className="bg-card rounded-2xl border p-6 sticky top-24 shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-1 h-6 bg-tenant-primary rounded-full" />
                  <TranslatedUIText text="Order Summary" />
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      <TranslatedUIText text="Selected" /> ({selectedCount} <TranslatedUIText text="of" /> {itemCount} <TranslatedUIText text="items" />)
                    </span>
                    <span className="font-medium">{formatDisplayPrice(selectedSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      <TranslatedUIText text="Shipping" />
                    </span>
                    <span className="text-muted-foreground text-xs">
                      <TranslatedUIText text="Calculated at checkout" />
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground"><TranslatedUIText text="Estimated Tax" /></span>
                    <span>{formatDisplayPrice(tax)}</span>
                  </div>
                </div>


                <Separator className="my-5" />

                {/* Discount row */}
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <TranslatedUIText text="Discount" /> ({appliedCoupon.coupon.code})
                    </span>
                    <span className="font-medium">-{formatDisplayPrice(discount)}</span>
                  </div>
                )}

                <Separator className="my-4" />

                <div className="flex justify-between font-bold text-xl mb-6">
                  <span><TranslatedUIText text="Total" /></span>
                  <span className="text-tenant-primary">{formatDisplayPrice(total)}</span>
                </div>

                <div className="mb-6">
                  <CouponInput
                    orderValue={selectedSubtotal}
                    appliedCoupon={appliedCoupon}
                    onApply={setAppliedCoupon}
                    onRemove={clearAppliedCoupon}
                    disabled={selectedCount === 0}
                  />
                </div>

                {selectedCount > 0 ? (
                  <Button
                    variant="tenant-glow"
                    size="xl"
                    className="w-full"
                    asChild
                  >
                    <Link href={getNavPath('/checkout')}>
                      <TranslatedUIText text="Checkout" /> ({selectedCount} {selectedCount === 1 ? <TranslatedUIText text="item" /> : <TranslatedUIText text="items" />})
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="tenant-glow"
                    size="xl"
                    className="w-full"
                    disabled
                  >
                    <TranslatedUIText text="Select items to checkout" />
                  </Button>
                )}

                <div className="mt-6 text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    <TranslatedUIText text="Secure checkout powered by Stripe" />
                  </p>
                  <div className="flex justify-center gap-2">
                    <div className="w-8 h-5 bg-muted rounded" />
                    <div className="w-8 h-5 bg-muted rounded" />
                    <div className="w-8 h-5 bg-muted rounded" />
                    <div className="w-8 h-5 bg-muted rounded" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
