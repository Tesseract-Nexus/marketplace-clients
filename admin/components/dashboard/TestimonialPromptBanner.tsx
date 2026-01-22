'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquareQuote, X, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';

const DISMISSED_KEY = 'testimonial_prompt_dismissed';
const DISMISSED_UNTIL_KEY = 'testimonial_prompt_dismissed_until';

interface TestimonialPromptBannerProps {
  className?: string;
}

export function TestimonialPromptBanner({ className }: TestimonialPromptBannerProps) {
  const { currentTenant } = useTenant();
  const [isVisible, setIsVisible] = useState(false);
  const [hasTestimonial, setHasTestimonial] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if prompt should be shown
  useEffect(() => {
    // Don't show if no tenant context
    if (!currentTenant?.id) {
      setIsLoading(false);
      return;
    }

    // Check if dismissed permanently or temporarily
    const dismissedPermanently = localStorage.getItem(`${DISMISSED_KEY}_${currentTenant.id}`) === 'true';
    const dismissedUntil = localStorage.getItem(`${DISMISSED_UNTIL_KEY}_${currentTenant.id}`);

    if (dismissedPermanently) {
      setIsLoading(false);
      return;
    }

    if (dismissedUntil) {
      const dismissedDate = new Date(dismissedUntil);
      if (dismissedDate > new Date()) {
        setIsLoading(false);
        return;
      }
    }

    // Check tenant age (show after 30 days)
    if (currentTenant.createdAt) {
      const tenantCreatedAt = new Date(currentTenant.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      if (tenantCreatedAt > thirtyDaysAgo) {
        // Tenant is less than 30 days old, don't show prompt yet
        setIsLoading(false);
        return;
      }
    }

    // Check if tenant already has a testimonial
    checkExistingTestimonial();
  }, [currentTenant?.id, currentTenant?.createdAt]);

  const checkExistingTestimonial = async () => {
    if (!currentTenant?.id) return;

    try {
      const response = await fetch('/api/testimonials', {
        headers: {
          'x-jwt-claim-tenant-id': currentTenant.id,
        },
      });

      if (response.ok) {
        const result = await response.json();
        // If tenant already has a testimonial, don't show the prompt
        if (result.data) {
          setHasTestimonial(true);
          setIsVisible(false);
        } else {
          setHasTestimonial(false);
          setIsVisible(true);
        }
      } else {
        // On error, assume no testimonial and show prompt
        setHasTestimonial(false);
        setIsVisible(true);
      }
    } catch (error) {
      // On error, assume no testimonial and show prompt
      setHasTestimonial(false);
      setIsVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = (permanent: boolean) => {
    if (!currentTenant?.id) return;

    if (permanent) {
      localStorage.setItem(`${DISMISSED_KEY}_${currentTenant.id}`, 'true');
    } else {
      // Dismiss for 7 days
      const dismissUntil = new Date();
      dismissUntil.setDate(dismissUntil.getDate() + 7);
      localStorage.setItem(`${DISMISSED_UNTIL_KEY}_${currentTenant.id}`, dismissUntil.toISOString());
    }
    setIsVisible(false);
  };

  // Don't render anything while loading or if not visible
  if (isLoading || !isVisible || hasTestimonial) {
    return null;
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border bg-warning/5 border-warning/30/50",
      className
    )}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-warning/20 rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-destructive/10 rounded-full translate-y-24 -translate-x-24" />

      <div className="relative p-4 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-warning items-center justify-center flex-shrink-0 shadow-lg">
            <MessageSquareQuote className="h-6 w-6 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  Share Your Success Story
                  <span className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-warning" />
                    ))}
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You&apos;ve been using Tesserix for a while now. We&apos;d love to hear about your experience!
                  Your testimonial helps other businesses discover how we can help them grow.
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={() => handleDismiss(false)}
                className="p-1.5 rounded-lg hover:bg-warning-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
                aria-label="Dismiss for now"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <Link href="/settings/testimonial">
                <Button className="gap-2 bg-warning hover:bg-warning/90 text-warning-foreground shadow-lg shadow-warning/25">
                  <MessageSquareQuote className="h-4 w-4" />
                  Write Testimonial
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <button
                onClick={() => handleDismiss(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Don&apos;t show again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
