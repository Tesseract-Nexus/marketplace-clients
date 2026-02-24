'use client';

import { OpenPanelComponent, useOpenPanel } from '@openpanel/nextjs';
import { useCallback, useMemo } from 'react';

const OPENPANEL_ENABLED =
  process.env.NEXT_PUBLIC_OPENPANEL_ENABLED === 'true' &&
  !!process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID;

/**
 * OpenPanel analytics provider for tenant-onboarding.
 * Renders the OpenPanel tracking script when enabled via env vars.
 * Place as a sibling in <body>, does not wrap children.
 */
export function OpenPanelProvider() {
  if (!OPENPANEL_ENABLED) return null;

  return (
    <OpenPanelComponent
      clientId={process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID!}
      apiUrl={process.env.NEXT_PUBLIC_OPENPANEL_API_URL}
      trackScreenViews={true}
      trackAttributes={true}
      trackOutgoingLinks={false}
    />
  );
}

/**
 * Typed analytics hook for the Tenant Onboarding app.
 * Mirrors the existing PostHog event names so both systems track the same funnel.
 */
export function useAnalytics() {
  const op = useOpenPanel();

  const track = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      try {
        op.track(event, { app: 'tenant-onboarding', ...properties });
      } catch {
        // Silently ignore — analytics failures must never break the UI
      }
    },
    [op],
  );

  return useMemo(
    () => ({
      track,

      // ── Onboarding funnel ───────────────────────────────
      onboardingStarted: (p?: Record<string, unknown>) =>
        track('onboarding_started', p),

      businessInfoCompleted: (p: { businessType?: string; industry?: string; hasWebsite?: boolean }) =>
        track('business_info_completed', p),

      contactInfoCompleted: (p: { jobTitle?: string; hasPhone?: boolean }) =>
        track('contact_info_completed', p),

      addressCompleted: (p: { country?: string; state?: string }) =>
        track('address_completed', p),

      storeSetupCompleted: (p: {
        subdomain?: string;
        currency?: string;
        timezone?: string;
        businessModel?: string;
      }) => track('store_setup_completed', p),

      documentsUploaded: (p: { documentCount: number; documentTypes?: string[] }) =>
        track('documents_uploaded', p),

      legalAccepted: () => track('legal_accepted'),

      // ── Verification events ─────────────────────────────
      verificationCodeSent: (p: { email?: string; trigger?: string; method?: string }) =>
        track('verification_code_sent', p),

      verificationSucceeded: (p: { email?: string; method?: string }) =>
        track('verification_succeeded', p),

      verificationFailed: (p: { error: string; email?: string; method?: string }) =>
        track('verification_failed', p),

      verificationCodeExpired: (p?: Record<string, unknown>) =>
        track('verification_code_expired', p),

      verificationRateLimitHit: (p: { email?: string }) =>
        track('verification_rate_limit_hit', p),

      // ── Completion events ───────────────────────────────
      onboardingCompleted: (p: { sessionId?: string; tenantId?: string; tenantSlug?: string }) =>
        track('onboarding_completed', p),

      onboardingFailed: (p: { error: string }) =>
        track('onboarding_failed', p),

      onboardingAbandoned: (p: { step: string }) =>
        track('onboarding_abandoned', p),

      redirectedToAdmin: (p?: Record<string, unknown>) =>
        track('redirected_to_admin', p),
    }),
    [track],
  );
}
