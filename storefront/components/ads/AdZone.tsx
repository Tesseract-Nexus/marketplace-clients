'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AdContent, AdZoneType, AdPlacement, AdContext } from '@/types/ads';

// =============================================================================
// AD ZONE COMPONENT
// =============================================================================

interface AdZoneProps {
  placement: AdPlacement;
  context?: Partial<AdContext>;
  className?: string;
  onImpression?: (ad: AdContent) => void;
  onClick?: (ad: AdContent) => void;
}

export function AdZone({
  placement,
  context = {},
  className,
  onImpression,
  onClick,
}: AdZoneProps) {
  const [ads, setAds] = useState<AdContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const impressionTracked = useRef<Set<string>>(new Set());

  // Fetch ads for this placement
  useEffect(() => {
    async function fetchAds() {
      try {
        // In production, this would fetch from ad server
        // For now, use mock data
        const mockAds = getMockAds(placement);
        setAds(mockAds);
      } catch (error) {
        console.error('Failed to fetch ads:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAds();
  }, [placement, context]);

  // Track viewability
  useEffect(() => {
    if (!containerRef.current || ads.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Track impressions for visible ads
            ads.forEach((ad) => {
              if (!impressionTracked.current.has(ad.id)) {
                impressionTracked.current.add(ad.id);
                onImpression?.(ad);
                trackImpression(ad);
              }
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [ads, onImpression]);

  if (isLoading || ads.length === 0) return null;

  return (
    <div ref={containerRef} className={cn('ad-zone', className)}>
      {ads.map((ad) => (
        <AdRenderer
          key={ad.id}
          ad={ad}
          isVisible={isVisible}
          onClick={() => {
            onClick?.(ad);
            trackClick(ad);
          }}
        />
      ))}
    </div>
  );
}

// =============================================================================
// AD RENDERER
// =============================================================================

interface AdRendererProps {
  ad: AdContent;
  isVisible: boolean;
  onClick: () => void;
}

function AdRenderer({ ad, isVisible, onClick }: AdRendererProps) {
  switch (ad.type) {
    case 'promo-ribbon':
      return <PromoRibbonAd ad={ad} onClick={onClick} />;
    case 'right-rail':
    case 'story-card':
      return <SidebarAd ad={ad} onClick={onClick} />;
    case 'featured-partner':
      return <FeaturedPartnerAd ad={ad} onClick={onClick} />;
    case 'mega-menu-card':
      return <MegaMenuAd ad={ad} onClick={onClick} />;
    case 'in-feed':
      return <InFeedAd ad={ad} onClick={onClick} />;
    case 'banner-strip':
      return <BannerStripAd ad={ad} onClick={onClick} />;
    case 'interstitial':
      return <InterstitialAd ad={ad} onClick={onClick} />;
    default:
      return null;
  }
}

// =============================================================================
// PROMO RIBBON AD
// =============================================================================

function PromoRibbonAd({ ad, onClick }: { ad: AdContent; onClick: () => void }) {
  return (
    <Link
      href={ad.creative.cta.href}
      onClick={onClick}
      className={cn(
        'block py-2 px-4 text-center transition-colors',
        'hover:opacity-90'
      )}
      style={{
        backgroundColor: ad.creative.backgroundColor || 'var(--tenant-primary)',
        color: ad.creative.textColor || 'white',
      }}
    >
      <div className="container-tenant flex items-center justify-center gap-3 text-sm">
        <span className="text-xs opacity-75">
          {ad.creative.sponsoredLabel || 'Sponsored'}
        </span>
        <span className="font-medium">{ad.creative.headline}</span>
        {ad.creative.badge && (
          <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
            {ad.creative.badge}
          </span>
        )}
        <span className="underline">{ad.creative.cta.text}</span>
      </div>
    </Link>
  );
}

// =============================================================================
// SIDEBAR / RIGHT-RAIL AD
// =============================================================================

function SidebarAd({ ad, onClick }: { ad: AdContent; onClick: () => void }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Sponsored Label */}
      <div className="px-4 py-2 border-b bg-muted/50 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {ad.creative.sponsoredLabel || 'Sponsored'}
        </span>
        {ad.creative.logo && (
          <Image
            src={ad.creative.logo}
            alt={ad.creative.brandName}
            width={60}
            height={20}
            className="object-contain"
          />
        )}
      </div>

      {/* Creative */}
      <Link href={ad.creative.cta.href} onClick={onClick} className="block">
        {ad.creative.image && (
          <div className="relative aspect-[4/3]">
            <Image
              src={ad.creative.image}
              alt={ad.creative.headline}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="p-4 space-y-3">
          <div>
            <p className="font-semibold line-clamp-2">{ad.creative.headline}</p>
            {ad.creative.subheadline && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {ad.creative.subheadline}
              </p>
            )}
          </div>

          {/* Product Grid */}
          {ad.creative.products && ad.creative.products.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {ad.creative.products.slice(0, 4).map((product) => (
                <div key={product.id} className="text-center">
                  <div className="relative aspect-square bg-muted rounded-lg overflow-hidden mb-1">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <p className="text-xs font-medium truncate">${product.price}</p>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
          >
            {ad.creative.cta.text}
            <ExternalLink className="w-3 h-3 ml-1.5" />
          </Button>
        </div>
      </Link>
    </div>
  );
}

// =============================================================================
// FEATURED PARTNER (MOBILE COLLAPSIBLE)
// =============================================================================

function FeaturedPartnerAd({ ad, onClick }: { ad: AdContent; onClick: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {ad.creative.logo && (
            <Image
              src={ad.creative.logo}
              alt={ad.creative.brandName}
              width={40}
              height={40}
              className="rounded-lg object-contain"
            />
          )}
          <div className="text-left">
            <p className="text-xs text-muted-foreground">
              {ad.creative.sponsoredLabel || 'Featured Partner'}
            </p>
            <p className="font-medium">{ad.creative.brandName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {ad.creative.badge && (
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
              {ad.creative.badge}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t"
          >
            <Link
              href={ad.creative.cta.href}
              onClick={onClick}
              className="block p-4 space-y-4"
            >
              {ad.creative.image && (
                <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
                  <Image
                    src={ad.creative.image}
                    alt={ad.creative.headline}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div>
                <p className="font-semibold">{ad.creative.headline}</p>
                {ad.creative.subheadline && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {ad.creative.subheadline}
                  </p>
                )}
              </div>

              {/* Product Strip */}
              {ad.creative.products && ad.creative.products.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {ad.creative.products.map((product) => (
                    <div
                      key={product.id}
                      className="flex-shrink-0 w-20 text-center"
                    >
                      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden mb-1">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="text-xs font-medium">${product.price}</p>
                    </div>
                  ))}
                </div>
              )}

              <Button className="w-full">
                {ad.creative.cta.text}
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// MEGA MENU AD
// =============================================================================

function MegaMenuAd({ ad, onClick }: { ad: AdContent; onClick: () => void }) {
  return (
    <Link
      href={ad.creative.cta.href}
      onClick={onClick}
      className="block p-4 rounded-lg bg-gradient-to-br from-muted/50 to-muted hover:from-muted hover:to-muted/80 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {ad.creative.sponsoredLabel || 'Sponsored'}
        </span>
      </div>

      {ad.creative.image && (
        <div className="relative aspect-[3/2] rounded-lg overflow-hidden mb-3">
          <Image
            src={ad.creative.image}
            alt={ad.creative.headline}
            fill
            className="object-cover"
          />
        </div>
      )}

      <p className="font-medium text-sm line-clamp-2">{ad.creative.headline}</p>
      <p className="text-xs text-primary mt-2 flex items-center gap-1">
        {ad.creative.cta.text}
        <ExternalLink className="w-3 h-3" />
      </p>
    </Link>
  );
}

// =============================================================================
// IN-FEED NATIVE AD
// =============================================================================

function InFeedAd({ ad, onClick }: { ad: AdContent; onClick: () => void }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Looks like a product card */}
      <Link href={ad.creative.cta.href} onClick={onClick} className="block">
        <div className="relative aspect-[3/4]">
          {ad.creative.image && (
            <Image
              src={ad.creative.image}
              alt={ad.creative.headline}
              fill
              className="object-cover"
            />
          )}
          {/* Sponsored indicator */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded">
            {ad.creative.sponsoredLabel || 'Sponsored'}
          </div>
          {ad.creative.badge && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
              {ad.creative.badge}
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            {ad.creative.logo && (
              <Image
                src={ad.creative.logo}
                alt={ad.creative.brandName}
                width={16}
                height={16}
                className="rounded"
              />
            )}
            <span className="text-xs text-muted-foreground">
              {ad.creative.brandName}
            </span>
          </div>
          <p className="font-medium line-clamp-2">{ad.creative.headline}</p>
          <p className="text-sm text-primary">{ad.creative.cta.text} →</p>
        </div>
      </Link>
    </div>
  );
}

// =============================================================================
// BANNER STRIP AD
// =============================================================================

function BannerStripAd({ ad, onClick }: { ad: AdContent; onClick: () => void }) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div
      className="relative py-3 px-4"
      style={{
        backgroundColor: ad.creative.backgroundColor || 'var(--tenant-primary)',
        color: ad.creative.textColor || 'white',
      }}
    >
      <Link
        href={ad.creative.cta.href}
        onClick={onClick}
        className="container-tenant flex items-center justify-center gap-4 text-center"
      >
        {ad.creative.logo && (
          <Image
            src={ad.creative.logo}
            alt={ad.creative.brandName}
            width={80}
            height={30}
            className="object-contain"
          />
        )}
        <div className="flex items-center gap-3">
          <span className="text-xs opacity-75">
            {ad.creative.sponsoredLabel || 'Sponsored'}
          </span>
          <span className="font-medium">{ad.creative.headline}</span>
          {ad.creative.badge && (
            <span className="px-2 py-0.5 bg-white/20 rounded text-xs">
              {ad.creative.badge}
            </span>
          )}
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="ml-auto"
        >
          {ad.creative.cta.text}
        </Button>
      </Link>

      {/* Dismiss button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          setIsDismissed(true);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-60 hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// =============================================================================
// INTERSTITIAL AD
// =============================================================================

function InterstitialAd({ ad, onClick }: { ad: AdContent; onClick: () => void }) {
  return (
    <div className="py-8 my-8 border-y bg-muted/30">
      <div className="container-tenant">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {ad.creative.sponsoredLabel || 'Sponsored Collection'}
          </span>
          {ad.creative.logo && (
            <Image
              src={ad.creative.logo}
              alt={ad.creative.brandName}
              width={60}
              height={20}
              className="object-contain"
            />
          )}
        </div>

        <Link href={ad.creative.cta.href} onClick={onClick} className="block">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {ad.creative.image && (
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                <Image
                  src={ad.creative.image}
                  alt={ad.creative.headline}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold">{ad.creative.headline}</h3>
                {ad.creative.subheadline && (
                  <p className="text-muted-foreground mt-2">
                    {ad.creative.subheadline}
                  </p>
                )}
              </div>

              {/* Featured Products */}
              {ad.creative.products && ad.creative.products.length > 0 && (
                <div className="flex gap-3">
                  {ad.creative.products.slice(0, 3).map((product) => (
                    <div key={product.id} className="text-center">
                      <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden mb-1">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="text-xs font-medium">${product.price}</p>
                    </div>
                  ))}
                </div>
              )}

              <Button size="lg">
                {ad.creative.cta.text}
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

// =============================================================================
// TRACKING UTILITIES
// =============================================================================

function trackImpression(ad: AdContent) {
  // Fire impression pixel
  if (ad.tracking.impressionUrl) {
    fetch(ad.tracking.impressionUrl, { method: 'GET', mode: 'no-cors' });
  }

  // Analytics event
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'ad_impression', {
      ad_id: ad.id,
      placement: ad.placement,
      brand: ad.creative.brandName,
    });
  }
}

function trackClick(ad: AdContent) {
  // Fire click pixel
  if (ad.tracking.clickUrl) {
    fetch(ad.tracking.clickUrl, { method: 'GET', mode: 'no-cors' });
  }

  // Analytics event
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'ad_click', {
      ad_id: ad.id,
      placement: ad.placement,
      brand: ad.creative.brandName,
      destination: ad.creative.cta.href,
    });
  }
}

// =============================================================================
// MOCK DATA (Replace with real ad server)
// =============================================================================

function getMockAds(placement: AdPlacement): AdContent[] {
  // Return empty for now - in production, this would fetch from ad server
  // Uncomment below to test with mock data
  return [];

  /*
  const mockAd: AdContent = {
    id: `ad-${placement}-1`,
    type: getAdTypeForPlacement(placement),
    placement,
    creative: {
      headline: 'Discover Premium Brands',
      subheadline: 'Up to 50% off on selected items',
      image: 'https://picsum.photos/800/600',
      logo: 'https://picsum.photos/100/40',
      cta: {
        text: 'Shop Partner Brand',
        href: '/partner-brand',
        style: 'primary',
      },
      brandName: 'Partner Brand',
      badge: 'New Collection',
      products: [
        { id: '1', name: 'Product 1', image: 'https://picsum.photos/200', price: 49.99, url: '/products/1' },
        { id: '2', name: 'Product 2', image: 'https://picsum.photos/201', price: 59.99, url: '/products/2' },
        { id: '3', name: 'Product 3', image: 'https://picsum.photos/202', price: 39.99, url: '/products/3' },
      ],
    },
    targeting: {},
    tracking: {},
    priority: 1,
    status: 'active',
  };

  return [mockAd];
  */
}

function getAdTypeForPlacement(placement: AdPlacement): AdZoneType {
  const mapping: Partial<Record<AdPlacement, AdZoneType>> = {
    'homepage-hero-below': 'promo-ribbon',
    'homepage-products-between': 'interstitial',
    'plp-sidebar': 'right-rail',
    'pdp-sidebar': 'story-card',
    'mega-menu': 'mega-menu-card',
    'plp-after-row-3': 'in-feed',
  };
  return mapping[placement] || 'promo-ribbon';
}

export default AdZone;
