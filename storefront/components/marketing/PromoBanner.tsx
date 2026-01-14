'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { X, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTenant, useMarketingConfig } from '@/context/TenantContext';
import {
  getActivePromotions,
  trackPromotionImpression,
  trackPromotionClick,
  isPromotionDismissed,
  dismissPromotion,
  type Promotion,
} from '@/lib/api/promotions';
import { cn } from '@/lib/utils';

interface PromoBannerProps {
  position?: 'TOP' | 'BOTTOM' | 'HERO';
  className?: string;
}

export function PromoBanner({ position = 'TOP', className }: PromoBannerProps) {
  const { tenant } = useTenant();
  const marketingConfig = useMarketingConfig();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  // Don't render if promo banners are disabled
  if (!marketingConfig.enablePromoBanners) {
    return null;
  }

  // Fetch promotions
  useEffect(() => {
    if (tenant) {
      getActivePromotions(tenant.id, tenant.storefrontId, { position })
        .then((promos) => {
          // Filter out dismissed promotions
          const visiblePromos = promos.filter((p) => !isPromotionDismissed(p.id));
          setPromotions(visiblePromos);

          // Track impressions
          visiblePromos.forEach((p) => {
            trackPromotionImpression(tenant.id, tenant.storefrontId, p.id);
          });
        })
        .catch(console.error);
    }
  }, [tenant, position]);

  const currentPromotion = promotions[currentIndex];

  // Countdown timer
  useEffect(() => {
    if (!currentPromotion?.countdown?.enabled || !currentPromotion.countdown.endDate) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const endDate = new Date(currentPromotion.countdown!.endDate).getTime();
      const now = new Date().getTime();
      const difference = endDate - now;

      if (difference <= 0) {
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      if (!remaining) {
        clearInterval(timer);
        // Remove expired promotion
        setPromotions((prev) => prev.filter((p) => p.id !== currentPromotion.id));
      }
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentPromotion]);

  // Rotate promotions
  useEffect(() => {
    if (promotions.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 8000); // Rotate every 8 seconds

    return () => clearInterval(interval);
  }, [promotions.length]);

  const handleDismiss = () => {
    if (currentPromotion) {
      dismissPromotion(currentPromotion.id);
      const remaining = promotions.filter((p) => p.id !== currentPromotion.id);
      setPromotions(remaining);
      if (remaining.length === 0) {
        setIsVisible(false);
      } else {
        setCurrentIndex(0);
      }
    }
  };

  const handleClick = () => {
    if (tenant && currentPromotion) {
      trackPromotionClick(tenant.id, tenant.storefrontId, currentPromotion.id);
    }
  };

  if (!isVisible || promotions.length === 0 || !currentPromotion) {
    return null;
  }

  const bannerStyle = {
    backgroundColor: currentPromotion.backgroundColor || 'var(--tenant-primary)',
    color: currentPromotion.textColor || 'white',
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPromotion.id}
        initial={{ opacity: 0, y: position === 'TOP' ? -10 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: position === 'TOP' ? -10 : 10 }}
        className={cn('relative overflow-hidden', className)}
        style={bannerStyle}
      >
        <div className="container-tenant">
          <div className="flex items-center justify-center gap-4 py-2.5 px-4 min-h-[44px]">
            {/* Icon */}
            <Sparkles className="h-4 w-4 flex-shrink-0 opacity-80" />

            {/* Content */}
            <div className="flex items-center gap-3 text-center text-sm font-medium">
              <span>{currentPromotion.content}</span>

              {/* Countdown Timer */}
              {timeLeft && (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/10">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs font-mono">
                    {timeLeft.days > 0 && `${timeLeft.days}d `}
                    {String(timeLeft.hours).padStart(2, '0')}:
                    {String(timeLeft.minutes).padStart(2, '0')}:
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              )}

              {/* CTA Link */}
              {currentPromotion.linkUrl && (
                <Link
                  href={currentPromotion.linkUrl}
                  onClick={handleClick}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-xs font-semibold whitespace-nowrap"
                >
                  {currentPromotion.linkText || 'Shop Now'}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {/* Pagination Dots (for multiple promotions) */}
            {promotions.length > 1 && (
              <div className="hidden md:flex items-center gap-1">
                {promotions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full transition-all',
                      idx === currentIndex ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/60'
                    )}
                    aria-label={`Go to promotion ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Dismiss Button */}
            <button
              onClick={handleDismiss}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress bar for rotation */}
        {promotions.length > 1 && (
          <motion.div
            key={`progress-${currentIndex}`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 8, ease: 'linear' }}
            className="absolute bottom-0 left-0 h-0.5 bg-white/30 origin-left w-full"
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Simplified inline promo banner for product pages
export function InlinePromo({ className }: { className?: string }) {
  const { tenant } = useTenant();
  const [promotion, setPromotion] = useState<Promotion | null>(null);

  useEffect(() => {
    if (tenant) {
      getActivePromotions(tenant.id, tenant.storefrontId, { position: 'HERO' })
        .then((promos) => {
          const available = promos.find((p) => !isPromotionDismissed(p.id));
          if (available) {
            setPromotion(available);
            trackPromotionImpression(tenant.id, tenant.storefrontId, available.id);
          }
        })
        .catch(console.error);
    }
  }, [tenant]);

  if (!promotion) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl p-4 bg-gradient-to-r from-tenant-primary/10 to-tenant-secondary/10 border',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-tenant-primary/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-tenant-primary" />
          </div>
          <div>
            <p className="font-semibold">{promotion.name}</p>
            <p className="text-sm text-muted-foreground">{promotion.content}</p>
          </div>
        </div>
        {promotion.linkUrl && (
          <Button
            asChild
            variant="tenant-primary"
            size="sm"
            onClick={() => {
              if (tenant) {
                trackPromotionClick(tenant.id, tenant.storefrontId, promotion.id);
              }
            }}
          >
            <Link href={promotion.linkUrl}>
              {promotion.linkText || 'Shop Now'}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        )}
      </div>
    </motion.div>
  );
}
