'use client';

import { useOpenPanel } from '@openpanel/nextjs';
import { useCallback, useMemo } from 'react';

/**
 * Typed analytics hook for the Storefront app.
 * Wraps OpenPanel's useOpenPanel() with e-commerce event helpers.
 */
export function useAnalytics() {
  const op = useOpenPanel();

  const track = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      try {
        op.track(event, { app: 'storefront', ...properties });
      } catch {
        // Silently ignore — analytics failures must never break the UI
      }
    },
    [op],
  );

  return useMemo(
    () => ({
      track,

      // ── Product discovery ───────────────────────────────
      productViewed: (p: {
        productId: string;
        name: string;
        category?: string;
        price: number;
        currency?: string;
      }) => track('product_viewed', p),

      productListViewed: (p: { category?: string; query?: string; resultCount: number }) =>
        track('product_list_viewed', p),

      searchPerformed: (p: { query: string; resultCount: number; filters?: Record<string, unknown> }) =>
        track('search_performed', p),

      // ── Cart events ─────────────────────────────────────
      productAddedToCart: (p: {
        productId: string;
        name: string;
        price: number;
        quantity: number;
        variantId?: string;
        currency?: string;
      }) => track('product_added_to_cart', p),

      productRemovedFromCart: (p: {
        productId: string;
        name: string;
        price: number;
        quantity: number;
      }) => track('product_removed_from_cart', p),

      cartQuantityUpdated: (p: {
        productId: string;
        from: number;
        to: number;
      }) => track('cart_quantity_updated', p),

      cartViewed: (p: { itemCount: number; total: number }) =>
        track('cart_viewed', p),

      // ── Checkout funnel ─────────────────────────────────
      checkoutStarted: (p: { itemCount: number; total: number; currency?: string }) =>
        track('checkout_started', p),

      checkoutStepCompleted: (p: { step: string; stepIndex: number }) =>
        track('checkout_step_completed', p),

      shippingMethodSelected: (p: { method: string; cost: number }) =>
        track('shipping_method_selected', p),

      paymentMethodSelected: (p: { method: string }) =>
        track('payment_method_selected', p),

      purchaseCompleted: (p: {
        orderId: string;
        total: number;
        itemCount: number;
        currency?: string;
        couponCode?: string;
        shippingCost?: number;
      }) => track('purchase_completed', p),

      // ── Coupon / gift card events ───────────────────────
      couponApplied: (p: { code: string; discountAmount: number }) =>
        track('coupon_applied', p),

      couponRemoved: (p: { code: string }) =>
        track('coupon_removed', p),

      giftCardApplied: (p: { amountUsed: number }) =>
        track('gift_card_applied', p),

      // ── Wishlist events ─────────────────────────────────
      addedToWishlist: (p: { productId: string; name: string }) =>
        track('added_to_wishlist', p),

      removedFromWishlist: (p: { productId: string }) =>
        track('removed_from_wishlist', p),

      // ── Auth events ─────────────────────────────────────
      loginCompleted: () => track('login_completed'),
      signupCompleted: () => track('signup_completed'),
      logoutCompleted: () => track('logout_completed'),

      // ── Engagement events ───────────────────────────────
      productShared: (p: { productId: string; channel: string }) =>
        track('product_shared', p),

      reviewSubmitted: (p: { productId: string; rating: number }) =>
        track('review_submitted', p),

      newsletterSubscribed: (p: { source?: string }) =>
        track('newsletter_subscribed', p),

      promotionClicked: (p: { promotionId: string; name?: string }) =>
        track('promotion_clicked', p),
    }),
    [track],
  );
}
