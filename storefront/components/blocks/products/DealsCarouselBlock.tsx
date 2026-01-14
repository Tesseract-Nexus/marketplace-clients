'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Zap,
  Timer,
  Flame,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavPath } from '@/context/TenantContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';
import type { DealsCarouselBlockConfig, DealItem } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

// =============================================================================
// DEALS CAROUSEL BLOCK
// =============================================================================

export function DealsCarouselBlock({ config }: BlockComponentProps<DealsCarouselBlockConfig>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const getNavPath = useNavPath();

  // Get deals from source
  const deals = config.source.deals || [];

  // Check scroll position
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  // Scroll functions
  const scrollLeft = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  // Auto-scroll
  useEffect(() => {
    if (!config.autoScroll) return;

    const interval = setInterval(() => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;

      if (scrollLeft >= scrollWidth - clientWidth - 10) {
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollBy({ left: 280, behavior: 'smooth' });
      }
    }, config.autoScrollInterval || 4000);

    return () => clearInterval(interval);
  }, [config.autoScroll, config.autoScrollInterval]);

  if (deals.length === 0) return null;

  return (
    <section className="py-6 sm:py-8 md:py-12 bg-gradient-to-r from-[var(--tenant-primary)] to-[var(--tenant-secondary)]">
      <div className="container-tenant">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {/* Title with badge */}
            <div className="flex items-center gap-2">
              {config.badge && (
                <Badge
                  variant="destructive"
                  className={cn(
                    'animate-pulse',
                    config.badge.style === 'warning' && 'bg-yellow-500',
                    config.badge.style === 'primary' && 'bg-tenant-primary'
                  )}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  {config.badge.text}
                </Badge>
              )}
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                <TranslatedUIText text={config.title} />
              </h2>
            </div>
          </div>

          {/* Countdown */}
          {config.globalCountdown?.enabled && (
            <GlobalCountdown config={config.globalCountdown} />
          )}
        </div>

        {config.subtitle && (
          <p className="text-white/80 mb-6 max-w-2xl">
            <TranslatedUIText text={config.subtitle} />
          </p>
        )}

        {/* Deals Carousel */}
        <div className="relative">
          {/* Navigation Arrows */}
          {config.showArrows !== false && (
            <>
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className={cn(
                  'absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all',
                  canScrollLeft ? 'opacity-100 hover:scale-110' : 'opacity-0 pointer-events-none'
                )}
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className={cn(
                  'absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all',
                  canScrollRight ? 'opacity-100 hover:scale-110' : 'opacity-0 pointer-events-none'
                )}
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            </>
          )}

          {/* Deals Grid */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
          >
            {deals.map((deal, index) => (
              <DealCard
                key={deal.id}
                deal={deal}
                index={index}
                cardStyle={config.cardStyle}
                showStockProgress={config.showStockProgress}
                showDiscountBadge={config.showDiscountBadge}
                getNavPath={getNavPath}
              />
            ))}
          </div>
        </div>

        {/* View All */}
        {config.viewAllUrl && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              asChild
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <Link href={getNavPath(config.viewAllUrl)}>
                <TranslatedUIText text="View All Deals" />
                <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// =============================================================================
// GLOBAL COUNTDOWN
// =============================================================================

function GlobalCountdown({ config }: { config: DealsCarouselBlockConfig['globalCountdown'] }) {
  if (!config) return null;

  const { days, hours, minutes, seconds, isExpired } = useCountdown(config.endDate);

  if (isExpired) {
    return config.expiredMessage ? (
      <span className="text-white/80">{config.expiredMessage}</span>
    ) : null;
  }

  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
      <Timer className="w-5 h-5 text-white" />
      <span className="text-white/80 text-sm hidden sm:inline">Ends in</span>
      <div className="flex gap-1 text-white font-mono font-bold">
        {config.showDays !== false && days > 0 && (
          <>
            <span className="bg-white/20 px-2 py-1 rounded">{String(days).padStart(2, '0')}</span>
            <span className="self-center text-white/60">:</span>
          </>
        )}
        <span className="bg-white/20 px-2 py-1 rounded">{String(hours).padStart(2, '0')}</span>
        <span className="self-center text-white/60">:</span>
        <span className="bg-white/20 px-2 py-1 rounded">{String(minutes).padStart(2, '0')}</span>
        <span className="self-center text-white/60">:</span>
        <span className="bg-white/20 px-2 py-1 rounded">{String(seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
}

// =============================================================================
// DEAL CARD
// =============================================================================

interface DealCardProps {
  deal: DealItem;
  index: number;
  cardStyle?: 'compact' | 'detailed' | 'minimal';
  showStockProgress?: boolean;
  showDiscountBadge?: boolean;
  getNavPath: (path: string) => string;
}

function DealCard({
  deal,
  index,
  cardStyle = 'detailed',
  showStockProgress = true,
  showDiscountBadge = true,
  getNavPath,
}: DealCardProps) {
  // Calculate stock percentage
  const stockPercentage = deal.stockInfo
    ? Math.round((deal.stockInfo.sold / deal.stockInfo.total) * 100)
    : 0;
  const stockRemaining = deal.stockInfo
    ? deal.stockInfo.total - deal.stockInfo.sold
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'flex-none snap-start',
        cardStyle === 'compact' ? 'w-48' : cardStyle === 'minimal' ? 'w-40' : 'w-56 sm:w-64'
      )}
    >
      <Link
        href={getNavPath(deal.url)}
        className="block bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group"
      >
        {/* Image */}
        <div className="relative aspect-square bg-gray-100">
          {deal.image?.url && (
            <Image
              src={deal.image.url}
              alt={deal.image.alt || deal.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )}

          {/* Discount Badge */}
          {showDiscountBadge && deal.discountPercent && deal.discountPercent > 0 && (
            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              {deal.discountPercent}% OFF
            </div>
          )}

          {/* Deal Badge */}
          {deal.badge && (
            <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <Flame className="w-3 h-3" />
              {deal.badge}
            </div>
          )}

          {/* Individual Countdown */}
          {deal.countdown?.enabled && cardStyle !== 'minimal' && (
            <div className="absolute bottom-2 left-2 right-2">
              <DealCountdown config={deal.countdown} />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <h3 className={cn(
            'font-semibold text-gray-900 mb-1 line-clamp-2',
            cardStyle === 'minimal' ? 'text-sm' : 'text-base'
          )}>
            {deal.title}
          </h3>

          {deal.description && cardStyle === 'detailed' && (
            <p className="text-xs text-gray-500 mb-2 line-clamp-1">
              {deal.description}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mb-2">
            <span className={cn(
              'font-bold text-gray-900',
              cardStyle === 'minimal' ? 'text-base' : 'text-lg'
            )}>
              ${deal.salePrice.toFixed(2)}
            </span>
            {deal.originalPrice && deal.originalPrice > deal.salePrice && (
              <span className="text-sm text-gray-400 line-through">
                ${deal.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock Progress */}
          {showStockProgress && deal.stockInfo?.showProgress && cardStyle !== 'minimal' && (
            <div className="space-y-1">
              <Progress
                value={stockPercentage}
                className="h-2 bg-gray-200"
              />
              <div className="flex items-center justify-between text-xs">
                <span className={cn(
                  'font-medium',
                  stockPercentage >= 80 ? 'text-red-500' : 'text-gray-500'
                )}>
                  {stockPercentage >= 80 ? (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Almost Gone!
                    </span>
                  ) : (
                    `${stockPercentage}% claimed`
                  )}
                </span>
                {stockRemaining !== null && (
                  <span className="text-gray-400">
                    {stockRemaining} left
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

// =============================================================================
// DEAL COUNTDOWN
// =============================================================================

function DealCountdown({ config }: { config: DealItem['countdown'] }) {
  if (!config) return null;

  const { hours, minutes, seconds, isExpired } = useCountdown(config.endDate);

  if (isExpired) return null;

  return (
    <div className="bg-black/80 backdrop-blur-sm rounded px-2 py-1 flex items-center justify-center gap-1 text-white">
      <Timer className="w-3 h-3 text-yellow-400" />
      <span className="text-xs font-mono">
        {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}

export default DealsCarouselBlock;
