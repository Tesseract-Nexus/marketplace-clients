'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';

// Initialize PostHog
export function initPostHog() {
  if (typeof window !== 'undefined') {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

    if (apiKey) {
      posthog.init(apiKey, {
        api_host: host,
        capture_pageview: false, // We'll capture manually
        capture_pageleave: true,
        autocapture: false, // Disable auto-capture, we'll track events manually
      });
    }
  }
}

// PostHog Provider Component
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize PostHog on mount
    initPostHog();
  }, []);

  useEffect(() => {
    // Track page views on route change
    if (pathname && typeof window !== 'undefined' && posthog.__loaded) {
      // Use window.location.search instead of useSearchParams to avoid Suspense requirement
      const searchParamsString = window.location.search;
      let url = window.origin + pathname;
      if (searchParamsString) {
        url = url + searchParamsString;
      }
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname]);

  return <>{children}</>;
}

// Analytics tracking utilities
export const analytics = {
  // Track generic events
  track: (event: string, properties?: Record<string, any>) => {
    if (posthog.__loaded) {
      posthog.capture(event, properties);
    }
  },

  // Identify user
  identify: (userId: string, traits?: Record<string, any>) => {
    if (posthog.__loaded) {
      posthog.identify(userId, traits);
    }
  },

  // Reset user (on logout)
  reset: () => {
    if (posthog.__loaded) {
      posthog.reset();
    }
  },

  // Onboarding funnel events
  onboarding: {
    started: (properties?: Record<string, any>) => {
      analytics.track('onboarding_started', properties);
    },

    businessInfoCompleted: (properties?: Record<string, any>) => {
      analytics.track('business_info_completed', properties);
    },

    contactInfoCompleted: (properties?: Record<string, any>) => {
      analytics.track('contact_info_completed', properties);
    },

    addressCompleted: (properties?: Record<string, any>) => {
      analytics.track('address_completed', properties);
    },

    storeSetupCompleted: (properties?: Record<string, any>) => {
      analytics.track('store_setup_completed', properties);
    },

    verificationCodeSent: (properties?: Record<string, any>) => {
      analytics.track('verification_code_sent', properties);
    },

    verificationSucceeded: (properties?: Record<string, any>) => {
      analytics.track('verification_succeeded', properties);
    },

    verificationFailed: (error: string, properties?: Record<string, any>) => {
      analytics.track('verification_failed', { error, ...properties });
    },

    codeExpired: (properties?: Record<string, any>) => {
      analytics.track('verification_code_expired', properties);
    },

    rateLimitHit: (properties?: Record<string, any>) => {
      analytics.track('verification_rate_limit_hit', properties);
    },

    completed: (properties?: Record<string, any>) => {
      analytics.track('onboarding_completed', properties);
    },

    redirectedToAdmin: (properties?: Record<string, any>) => {
      analytics.track('redirected_to_admin', properties);
    },

    abandoned: (step: string, properties?: Record<string, any>) => {
      analytics.track('onboarding_abandoned', { step, ...properties });
    },
  },

  // Error tracking
  error: {
    caught: (error: Error, context?: Record<string, any>) => {
      analytics.track('error_caught', {
        error_message: error.message,
        error_stack: error.stack,
        ...context,
      });
    },

    apiError: (endpoint: string, status: number, message: string) => {
      analytics.track('api_error', {
        endpoint,
        status,
        message,
      });
    },
  },
};
