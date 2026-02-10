'use client';

import { useOpenPanel } from '@openpanel/nextjs';
import { useCallback, useMemo } from 'react';

/**
 * Typed analytics hook for the Tenant Onboarding app.
 * Mirrors the existing PostHog event names so both systems track the same funnel.
 */
export function useAnalytics() {
  const op = useOpenPanel();

  const track = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      op.track(event, { app: 'tenant-onboarding', ...properties });
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
