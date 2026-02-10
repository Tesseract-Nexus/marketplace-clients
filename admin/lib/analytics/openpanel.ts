'use client';

import { useOpenPanel } from '@openpanel/nextjs';
import { useCallback, useMemo } from 'react';

/**
 * Typed analytics hook for the Admin app.
 * Wraps OpenPanel's useOpenPanel() with app-specific event helpers.
 */
export function useAnalytics() {
  const op = useOpenPanel();

  const track = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      try {
        op.track(event, { app: 'admin', ...properties });
      } catch {
        // Silently ignore — analytics failures must never break the UI
      }
    },
    [op],
  );

  return useMemo(
    () => ({
      track,

      // ── Product events ──────────────────────────────────
      productCreated: (p: { productId: string; name: string; category?: string; price?: number }) =>
        track('product_created', p),
      productUpdated: (p: { productId: string; fields?: string[] }) =>
        track('product_updated', p),
      productDeleted: (p: { productId: string }) =>
        track('product_deleted', p),
      productStatusChanged: (p: { productId: string; from: string; to: string }) =>
        track('product_status_changed', p),
      productBulkImported: (p: { count: number; source?: string }) =>
        track('product_bulk_imported', p),

      // ── Category events ─────────────────────────────────
      categoryCreated: (p: { categoryId: string; name: string; parentId?: string }) =>
        track('category_created', p),
      categoryUpdated: (p: { categoryId: string }) =>
        track('category_updated', p),
      categoryDeleted: (p: { categoryId: string }) =>
        track('category_deleted', p),

      // ── Order events ────────────────────────────────────
      orderStatusChanged: (p: { orderId: string; from: string; to: string }) =>
        track('order_status_changed', p),
      orderViewed: (p: { orderId: string }) =>
        track('order_viewed', p),

      // ── Customer events ─────────────────────────────────
      customerCreated: (p: { customerId: string; source?: string }) =>
        track('customer_created', p),
      customerUpdated: (p: { customerId: string }) =>
        track('customer_updated', p),

      // ── Staff events ────────────────────────────────────
      staffInvited: (p: { role: string }) =>
        track('staff_invited', p),
      staffRoleChanged: (p: { staffId: string; from: string; to: string }) =>
        track('staff_role_changed', p),
      staffRemoved: (p: { staffId: string }) =>
        track('staff_removed', p),

      // ── Coupon events ───────────────────────────────────
      couponCreated: (p: { couponId: string; discountType: string }) =>
        track('coupon_created', p),

      // ── Tenant / storefront events ──────────────────────
      tenantSwitched: (p: { from?: string; to: string }) =>
        track('tenant_switched', p),
      storefrontCreated: (p: { storefrontId: string }) =>
        track('storefront_created', p),

      // ── Setup wizard events ─────────────────────────────
      setupWizardStarted: () => track('setup_wizard_started'),
      setupWizardStepCompleted: (p: { step: string; stepIndex: number }) =>
        track('setup_wizard_step_completed', p),
      setupWizardCompleted: () => track('setup_wizard_completed'),
      setupWizardDismissed: (p: { step: string }) =>
        track('setup_wizard_dismissed', p),

      // ── Search events ───────────────────────────────────
      searchPerformed: (p: { query: string; section: string; resultCount?: number }) =>
        track('search_performed', p),

      // ── Settings events ─────────────────────────────────
      settingsUpdated: (p: { section: string; fields?: string[] }) =>
        track('settings_updated', p),

      // ── Review events ───────────────────────────────────
      reviewModerated: (p: { reviewId: string; action: 'approved' | 'rejected' }) =>
        track('review_moderated', p),

      // ── Integration events ──────────────────────────────
      integrationConnected: (p: { type: string; provider: string }) =>
        track('integration_connected', p),

      // ── Export / import events ──────────────────────────
      dataExported: (p: { type: string; format?: string; count?: number }) =>
        track('data_exported', p),
    }),
    [track],
  );
}
