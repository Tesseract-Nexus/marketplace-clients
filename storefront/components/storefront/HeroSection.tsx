'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Star, Users, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTenant, useHomepageConfig, useNavPath } from '@/context/TenantContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { type StoreStats, getEmptyStats, getDisplayStats } from '@/lib/api/stats';
import { cn } from '@/lib/utils';
import type { HomepageLayout } from '@/types/storefront';

interface HeroSectionProps {
  variant?: HomepageLayout;
}

export function HeroSection({ variant }: HeroSectionProps) {
  const { tenant, settings } = useTenant();
  const homepageConfig = useHomepageConfig();
  // Use prop variant or fall back to settings
  const layoutVariant = variant || settings.layoutConfig?.homepageLayout || 'hero-grid';
  const getNavPath = useNavPath();
  const [stats, setStats] = useState<StoreStats>(getEmptyStats());
  const [statsLoaded, setStatsLoaded] = useState(false);

  // Fetch real store statistics from database
  useEffect(() => {
    async function fetchStats() {
      if (!tenant?.id || !tenant?.storefrontId) return;

      try {
        const response = await fetch('/api/stats', {
          headers: {
            'X-Tenant-ID': tenant.id,
            'X-Storefront-ID': tenant.storefrontId,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data.data || getEmptyStats());
        }
      } catch (error) {
        console.error('Failed to fetch store stats:', error);
      } finally {
        setStatsLoaded(true);
      }
    }

    fetchStats();
  }, [tenant?.id, tenant?.storefrontId]);

  // Get display stats (real data or placeholders)
  const displayStats = getDisplayStats(stats);

  if (!homepageConfig.heroEnabled) {
    return null;
  }

  const hasMedia = homepageConfig.heroImage || homepageConfig.heroVideo;

  // Get height classes based on layout variant
  const heightClasses = {
    'hero-grid': 'min-h-[60vh] sm:min-h-[70vh] md:min-h-[85vh]',
    'carousel': 'min-h-[60vh] sm:min-h-[70vh] md:min-h-[85vh]',
    'minimal': 'min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh]',
    'magazine': 'min-h-[50vh] sm:min-h-[55vh] md:min-h-[65vh]',
  }[layoutVariant];

  const showStats = layoutVariant !== 'minimal';
  const showScrollIndicator = layoutVariant === 'hero-grid' || layoutVariant === 'carousel';

  return (
    <section className={cn(
      "relative flex items-center overflow-hidden",
      heightClasses
    )}>
      {/* Background */}
      <div className="absolute inset-0">
        {/* Determine background type - use heroBackgroundType if set, otherwise infer from media */}
        {(() => {
          const bgType = homepageConfig.heroBackgroundType ||
            (homepageConfig.heroVideo ? 'video' : homepageConfig.heroImage ? 'image' : 'animated');

          switch (bgType) {
            case 'video':
              return homepageConfig.heroVideo ? (
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src={homepageConfig.heroVideo} type="video/mp4" />
                </video>
              ) : <div className="w-full h-full bg-tenant-gradient" />;

            case 'image':
              return homepageConfig.heroImage ? (
                <Image
                  src={homepageConfig.heroImage}
                  alt="Hero background"
                  fill
                  priority
                  className="object-cover"
                />
              ) : <div className="w-full h-full bg-tenant-gradient" />;

            case 'static':
              // Static gradient - no animation
              return <div className="w-full h-full bg-tenant-gradient" />;

            case 'color':
              // Solid primary color
              return <div className="w-full h-full" style={{ background: 'var(--tenant-primary)' }} />;

            case 'animated':
            default:
              // Animated gradient background
              return <div className="w-full h-full animated-gradient-bg" />;
          }
        })()}

        {/* Aurora Effect Overlay - only for animated or static gradient */}
        {(!hasMedia && (homepageConfig.heroBackgroundType === 'animated' || !homepageConfig.heroBackgroundType)) && (
          <div className="absolute inset-0 aurora-bg" />
        )}

        {/* Particles Effect - only for animated gradient */}
        {(!hasMedia && (homepageConfig.heroBackgroundType === 'animated' || !homepageConfig.heroBackgroundType)) && (
          <div className="absolute inset-0 particles-bg opacity-40" />
        )}

        {/* Overlay for media backgrounds */}
        {(homepageConfig.heroBackgroundType === 'image' || homepageConfig.heroBackgroundType === 'video') && (
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: homepageConfig.heroOverlayOpacity || 0.4 }}
          />
        )}

        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

        {/* Decorative floating blobs with glow - smaller on mobile */}
        {/* Only show when animations are enabled (default true) */}
        {homepageConfig.heroAnimationsEnabled !== false && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none hidden sm:block">
            <motion.div
              className="absolute top-10 right-10 md:top-20 md:right-20 w-40 h-40 md:w-72 md:h-72 blob opacity-30 blur-xl"
              style={{ background: 'var(--tenant-primary)' }}
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 30, 0],
                y: [0, -20, 0],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-20 right-20 md:bottom-40 md:right-40 w-28 h-28 md:w-48 md:h-48 blob opacity-25 blur-lg glow-pulse"
              style={{ background: 'var(--tenant-secondary)' }}
              animate={{
                scale: [1, 1.3, 1],
                x: [0, -20, 0],
                y: [0, 30, 0],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />
            <motion.div
              className="absolute top-1/2 right-1/4 w-20 h-20 md:w-32 md:h-32 blob opacity-20 blur-md"
              style={{ background: 'var(--tenant-accent)' }}
              animate={{
                scale: [1, 1.4, 1],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
            {/* Additional floating element for depth - hidden on mobile for performance */}
            <motion.div
              className="absolute top-1/3 left-1/4 w-40 h-40 md:w-64 md:h-64 blob opacity-15 blur-2xl hidden md:block"
              style={{ background: 'var(--tenant-gradient)' }}
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 10, 0],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="container-tenant relative z-10 py-12 sm:py-16 md:py-20">
        <div
          className="max-w-2xl"
          style={homepageConfig.heroTextColor ? { '--hero-text-color': homepageConfig.heroTextColor } as React.CSSProperties : undefined}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full glass mb-4 sm:mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-tenant-accent" />
            <TranslatedUIText
              text="New Collection Available"
              className="text-xs sm:text-sm font-medium"
              style={homepageConfig.heroTextColor ? { color: homepageConfig.heroTextColor } : undefined}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={cn(
              "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight",
              !homepageConfig.heroTextColor && "text-on-gradient"
            )}
            style={homepageConfig.heroTextColor ? { color: homepageConfig.heroTextColor } : undefined}
          >
            <TranslatedUIText text={homepageConfig.heroTitle || 'Discover Your Style'} />
          </motion.h1>

          {homepageConfig.heroSubtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={cn(
                "text-base sm:text-lg md:text-xl mb-6 sm:mb-8 leading-relaxed max-w-xl",
                !homepageConfig.heroTextColor && "text-on-gradient/90"
              )}
              style={homepageConfig.heroTextColor ? { color: homepageConfig.heroTextColor, opacity: 0.9 } : undefined}
            >
              <TranslatedUIText text={homepageConfig.heroSubtitle} />
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4"
          >
            <Button
              asChild
              variant="tenant-gradient"
              size="xl"
              className="group"
            >
              <Link href={getNavPath(homepageConfig.heroCtaLink || '/products')}>
                <span className="relative z-10 flex items-center">
                  <TranslatedUIText text={homepageConfig.heroCtaText || 'Shop Now'} />
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </Button>

            <Button
              variant="tenant-glass"
              size="xl"
              asChild
            >
              <Link href={getNavPath('/categories')}>
                <TranslatedUIText text="Browse Categories" />
              </Link>
            </Button>
          </motion.div>

          {/* Stats with animated counters - show based on layout variant */}
          {showStats && (
            !statsLoaded ? (
              /* Loading skeleton while fetching stats */
              <div className="grid grid-cols-3 gap-4 sm:flex sm:flex-wrap sm:gap-6 md:gap-10 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-current/20 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10" />
                    <div className="text-center sm:text-left">
                      <div className="h-6 sm:h-8 w-12 sm:w-16 bg-white/10 rounded mb-1 mx-auto sm:mx-0" />
                      <div className="h-3 sm:h-4 w-16 sm:w-20 bg-white/10 rounded mx-auto sm:mx-0" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-3 gap-4 sm:flex sm:flex-wrap sm:gap-6 md:gap-10 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-current/20"
            >
              {/* Happy Customers */}
              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full glass flex items-center justify-center">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-tenant-accent" />
                </div>
                <div className="text-center sm:text-left">
                  <div
                    className={cn("text-xl sm:text-2xl md:text-3xl font-bold", !homepageConfig.heroTextColor && "text-on-gradient")}
                    style={homepageConfig.heroTextColor ? { color: homepageConfig.heroTextColor } : undefined}
                  >
                    <AnimatedCounter value={displayStats.customerCount} suffix="+" duration={2000} />
                  </div>
                  <div
                    className={cn("text-[10px] sm:text-xs md:text-sm", !homepageConfig.heroTextColor && "text-on-gradient/70")}
                    style={homepageConfig.heroTextColor ? { color: homepageConfig.heroTextColor, opacity: 0.7 } : undefined}
                  >
                    <TranslatedUIText text="Customers" />
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full glass flex items-center justify-center">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-tenant-accent" />
                </div>
                <div className="text-center sm:text-left">
                  <div
                    className={cn("text-xl sm:text-2xl md:text-3xl font-bold", !homepageConfig.heroTextColor && "text-on-gradient")}
                    style={homepageConfig.heroTextColor ? { color: homepageConfig.heroTextColor } : undefined}
                  >
                    <AnimatedCounter value={displayStats.productCount} suffix="+" duration={1800} />
                  </div>
                  <div
                    className={cn("text-[10px] sm:text-xs md:text-sm", !homepageConfig.heroTextColor && "text-on-gradient/70")}
                    style={homepageConfig.heroTextColor ? { color: homepageConfig.heroTextColor, opacity: 0.7 } : undefined}
                  >
                    <TranslatedUIText text="Products" />
                  </div>
                </div>
              </div>

              {/* Average Rating */}
              <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full glass flex items-center justify-center">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-tenant-accent fill-tenant-accent" />
                </div>
                <div className="text-center sm:text-left">
                  <div
                    className={cn("text-xl sm:text-2xl md:text-3xl font-bold", !homepageConfig.heroTextColor && "text-on-gradient")}
                    style={homepageConfig.heroTextColor ? { color: homepageConfig.heroTextColor } : undefined}
                  >
                    <AnimatedCounter value={displayStats.averageRating * 10} decimals={1} duration={1500} />
                  </div>
                  <div
                    className={cn("text-[10px] sm:text-xs md:text-sm", !homepageConfig.heroTextColor && "text-on-gradient/70")}
                    style={homepageConfig.heroTextColor ? { color: homepageConfig.heroTextColor, opacity: 0.7 } : undefined}
                  >
                    <TranslatedUIText text="Rating" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      {/* Scroll indicator - only for hero-grid and carousel layouts */}
      {showScrollIndicator && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden md:block"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-6 h-10 border-2 rounded-full flex items-start justify-center p-2"
            style={{ borderColor: 'var(--tenant-gradient-text)', opacity: 0.5 }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--tenant-gradient-text)' }} />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
