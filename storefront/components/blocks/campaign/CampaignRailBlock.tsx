'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Zap, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavPath } from '@/context/TenantContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { useCountdown } from '@/hooks/useCountdown';
import { cn } from '@/lib/utils';
import type { CampaignRailBlockConfig, DealItem, CategoryGridItem } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

export function CampaignRailBlock({ config }: BlockComponentProps<CampaignRailBlockConfig>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const getNavPath = useNavPath();

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
  }, []);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -280, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 280, behavior: 'smooth' });
  };

  // Apply custom theme colors
  const themeStyles: React.CSSProperties = {
    '--campaign-primary': config.theme?.primaryColor || 'var(--tenant-primary)',
    '--campaign-secondary': config.theme?.secondaryColor || 'var(--tenant-secondary)',
    '--campaign-bg': config.theme?.backgroundColor || 'transparent',
    '--campaign-text': config.theme?.textColor || 'white',
    '--campaign-accent': config.theme?.accentColor || 'var(--tenant-accent)',
  } as React.CSSProperties;

  return (
    <section
      className="py-6 sm:py-8 md:py-12"
      style={{
        ...themeStyles,
        background: `linear-gradient(135deg, var(--campaign-primary), var(--campaign-secondary))`,
      }}
    >
      <div className="container-tenant">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Campaign Logo */}
            {config.logo?.url && (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                <Image
                  src={config.logo.url}
                  alt={config.campaignName}
                  fill
                  className="object-contain"
                />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold" style={{ color: 'var(--campaign-text)' }}>
                  <TranslatedUIText text={config.title} />
                </h2>
              </div>
              {config.subtitle && (
                <p style={{ color: 'var(--campaign-text)', opacity: 0.8 }}>
                  <TranslatedUIText text={config.subtitle} />
                </p>
              )}
            </div>
          </div>

          {/* Countdown */}
          {config.countdown?.enabled && (
            <CampaignCountdown config={config.countdown} />
          )}
        </div>

        {/* Items Carousel */}
        {config.layout === 'carousel' && (
          <div className="relative">
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={cn(
                'absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all',
                canScrollLeft ? 'opacity-100 hover:scale-110' : 'opacity-0'
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={cn(
                'absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center transition-all',
                canScrollRight ? 'opacity-100 hover:scale-110' : 'opacity-0'
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
            >
              {config.source.items.map((item, index) => (
                <CampaignItem
                  key={index}
                  item={item}
                  index={index}
                  sourceType={config.source.type}
                  getNavPath={getNavPath}
                />
              ))}
            </div>
          </div>
        )}

        {/* Grid Layout */}
        {config.layout === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {config.source.items.map((item, index) => (
              <CampaignItem
                key={index}
                item={item}
                index={index}
                sourceType={config.source.type}
                getNavPath={getNavPath}
              />
            ))}
          </div>
        )}

        {/* Stacked Layout */}
        {config.layout === 'stacked' && (
          <div className="space-y-4">
            {config.source.items.map((item, index) => (
              <CampaignItem
                key={index}
                item={item}
                index={index}
                sourceType={config.source.type}
                getNavPath={getNavPath}
                stacked
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CampaignCountdown({ config }: { config: NonNullable<CampaignRailBlockConfig['countdown']> }) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(config.endDate);

  if (isExpired) {
    return config.expiredMessage ? (
      <span style={{ color: 'var(--campaign-text)', opacity: 0.8 }}>{config.expiredMessage}</span>
    ) : null;
  }

  return (
    <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-lg px-4 py-2">
      <Timer className="w-5 h-5" style={{ color: 'var(--campaign-text)' }} />
      <span style={{ color: 'var(--campaign-text)', opacity: 0.8 }} className="text-sm hidden sm:inline">
        Ends in
      </span>
      <div className="flex gap-1 font-mono font-bold" style={{ color: 'var(--campaign-text)' }}>
        {config.showDays !== false && days > 0 && (
          <>
            <span className="bg-white/20 px-2 py-1 rounded">{String(days).padStart(2, '0')}</span>
            <span className="self-center opacity-60">:</span>
          </>
        )}
        <span className="bg-white/20 px-2 py-1 rounded">{String(hours).padStart(2, '0')}</span>
        <span className="self-center opacity-60">:</span>
        <span className="bg-white/20 px-2 py-1 rounded">{String(minutes).padStart(2, '0')}</span>
        <span className="self-center opacity-60">:</span>
        <span className="bg-white/20 px-2 py-1 rounded">{String(seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
}

interface CampaignItemProps {
  item: DealItem | CategoryGridItem | { productId: string };
  index: number;
  sourceType: 'deals' | 'products' | 'categories' | 'mixed';
  getNavPath: (path: string) => string;
  stacked?: boolean;
}

function CampaignItem({ item, index, sourceType, getNavPath, stacked }: CampaignItemProps) {
  // Handle different item types
  if ('url' in item && 'salePrice' in item) {
    // DealItem
    const deal = item as DealItem;
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          'bg-white rounded-xl overflow-hidden shadow-lg',
          stacked ? 'flex items-center' : 'flex-none w-48 sm:w-56 snap-start'
        )}
      >
        <Link href={getNavPath(deal.url)} className={cn('block', stacked && 'flex items-center w-full')}>
          <div className={cn('relative', stacked ? 'w-24 h-24' : 'aspect-square')}>
            {deal.image?.url && (
              <Image
                src={deal.image.url}
                alt={deal.image.alt || deal.title}
                fill
                className="object-cover"
              />
            )}
            {deal.discountPercent && deal.discountPercent > 0 && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                {deal.discountPercent}% OFF
              </div>
            )}
          </div>
          <div className={cn('p-3', stacked && 'flex-1')}>
            <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">{deal.title}</h3>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">${deal.salePrice.toFixed(2)}</span>
              {deal.originalPrice && deal.originalPrice > deal.salePrice && (
                <span className="text-sm text-gray-400 line-through">
                  ${deal.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  if ('categoryId' in item) {
    // CategoryGridItem
    const category = item as CategoryGridItem;
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          'bg-white rounded-xl overflow-hidden shadow-lg',
          stacked ? 'flex items-center' : 'flex-none w-32 sm:w-40 snap-start'
        )}
      >
        <Link
          href={getNavPath(category.url || `/products?category=${category.categoryId}`)}
          className="block text-center p-4"
        >
          {category.image?.url && (
            <div className="relative w-16 h-16 mx-auto mb-2">
              <Image
                src={category.image.url}
                alt={category.title || ''}
                fill
                className="object-cover rounded-full"
              />
            </div>
          )}
          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{category.title}</h3>
          {category.badge && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
              {category.badge}
            </span>
          )}
        </Link>
      </motion.div>
    );
  }

  // Product placeholder
  return (
    <div className="bg-white/50 rounded-xl p-4 flex-none w-48 snap-start">
      <p className="text-sm text-gray-500">Product loading...</p>
    </div>
  );
}

export default CampaignRailBlock;
