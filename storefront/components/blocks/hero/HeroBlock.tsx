'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Star,
  Users,
  Package,
  Play,
  Pause,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTenant, useNavPath } from '@/context/TenantContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { cn } from '@/lib/utils';
import { useCountdown } from '@/hooks/useCountdown';
import type {
  HeroBlockConfig,
  HeroSlide,
  HeroVariant,
  CTAButton,
  CountdownConfig,
} from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

// =============================================================================
// HERO BLOCK COMPONENT
// =============================================================================

export function HeroBlock({ config }: BlockComponentProps<HeroBlockConfig>) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const getNavPath = useNavPath();

  const slides = config.slides || [];
  const hasMultipleSlides = slides.length > 1;

  // Auto-play handling
  useEffect(() => {
    if (!config.autoplay || !hasMultipleSlides || isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, config.autoplayInterval || 5000);

    return () => clearInterval(interval);
  }, [config.autoplay, config.autoplayInterval, slides.length, hasMultipleSlides, isPaused]);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  if (slides.length === 0) return null;

  // Choose variant renderer
  const VariantRenderer = VARIANT_RENDERERS[config.variant] || EditorialHero;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        minHeight: config.minHeight || '70vh',
        maxHeight: config.maxHeight,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides */}
      <AnimatePresence mode="wait">
        <VariantRenderer
          key={currentSlide}
          slide={slides[currentSlide]!}
          config={config}
          getNavPath={getNavPath}
        />
      </AnimatePresence>

      {/* Navigation Arrows */}
      {hasMultipleSlides && config.showArrows !== false && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {hasMultipleSlides && config.showDots !== false && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index === currentSlide
                  ? 'bg-white w-6'
                  : 'bg-white/50 hover:bg-white/75'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Stats */}
      {config.showStats && config.stats && config.stats.length > 0 && (
        <StatsBar stats={config.stats} />
      )}

      {/* Scroll Indicator */}
      {config.showScrollIndicator && <ScrollIndicator />}

      {/* Decorations */}
      {config.showDecorations && <Decorations config={config.decorations} />}

      {/* Bottom fade - editorial: subtle, no gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-white/80 pointer-events-none" />
    </section>
  );
}

// =============================================================================
// VARIANT RENDERERS
// =============================================================================

interface VariantProps {
  slide: HeroSlide;
  config: HeroBlockConfig;
  getNavPath: (path: string) => string;
}

// Editorial variant - Clean, typography-first design
// Features: Asymmetrical layout, serif headline, generous whitespace, no gradients
function EditorialHero({ slide, config, getNavPath }: VariantProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className="absolute inset-0 flex items-center bg-stone-50"
    >
      {/* Two-column asymmetric layout */}
      <div className="container mx-auto px-6 md:px-12 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 py-16 md:py-24">
        {/* Content Column - Takes 5/12 on desktop */}
        <div className="md:col-span-5 flex flex-col justify-center">
          {/* Badge - Editorial style: simple, uppercase, no gradient */}
          {slide.badge && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-stone-500 border-b-2 border-stone-800 pb-1">
                {slide.badge.text}
              </span>
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className={cn(
              'font-heading text-4xl sm:text-5xl md:text-6xl font-normal leading-tight tracking-tight mb-6',
              slide.textColor === 'dark' ? 'text-[var(--text-primary)]' : 'text-white'
            )}
          >
            <TranslatedUIText text={slide.headline} />
          </motion.h1>

          {slide.subheadline && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className={cn(
                'text-lg leading-relaxed mb-8 max-w-md',
                slide.textColor === 'dark' ? 'text-[var(--text-muted)]' : 'text-white/80'
              )}
            >
              <TranslatedUIText text={slide.subheadline} />
            </motion.p>
          )}

          {/* CTAs - Editorial style: solid buttons, no gradients */}
          {slide.ctas && slide.ctas.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {slide.ctas.map((cta, index) => (
                <CTAButtonRenderer
                  key={cta.id}
                  cta={cta}
                  getNavPath={getNavPath}
                  variant={index === 0 ? 'editorial-primary' : 'editorial-secondary'}
                />
              ))}
            </motion.div>
          )}

          {/* Countdown - Editorial style */}
          {slide.countdown?.enabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mt-10 pt-8 border-t border-stone-200"
            >
              <CountdownTimer config={slide.countdown} variant="editorial" />
            </motion.div>
          )}
        </div>

        {/* Image Column - Takes 7/12 on desktop */}
        <div className="md:col-span-7 relative min-h-[300px] md:min-h-[500px]">
          {slide.media?.url && (
            <motion.div
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="relative w-full h-full rounded-md overflow-hidden"
            >
              <Image
                src={slide.media.url}
                alt={slide.media.alt || ''}
                fill
                priority
                className="object-cover"
                style={{ objectPosition: slide.media.focalPoint ? `${slide.media.focalPoint.x}% ${slide.media.focalPoint.y}%` : 'center' }}
              />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Promotional variant (Flipkart-style)
function PromotionalHero({ slide, config, getNavPath }: VariantProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 flex items-center"
    >
      {/* Background with solid color blocks */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--tenant-primary)] to-[var(--tenant-secondary)]" />

      {/* Geometric shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-white/10 -skew-x-12 translate-x-20" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-black/10 skew-x-6" />
      </div>

      {/* Product image on right */}
      {slide.media?.url && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-4/5 hidden md:block">
          <Image
            src={slide.media.url}
            alt={slide.media.alt || ''}
            fill
            className="object-contain object-right"
          />
        </div>
      )}

      {/* Content */}
      <div className="container-tenant relative z-10 py-8 sm:py-12">
        <div className="max-w-xl">
          {/* Deal badge */}
          {slide.badge && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400 text-yellow-900 rounded font-bold text-sm mb-4"
            >
              <Sparkles className="w-4 h-4" />
              {slide.badge.text}
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 leading-none"
          >
            {slide.headline}
          </motion.h1>

          {slide.subheadline && (
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl text-white/90 mb-6"
            >
              {slide.subheadline}
            </motion.p>
          )}

          {/* Countdown with Flipkart style */}
          {slide.countdown?.enabled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mb-6"
            >
              <CountdownTimer config={slide.countdown} variant="flip" />
            </motion.div>
          )}

          {/* CTAs */}
          {slide.ctas && slide.ctas.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              {slide.ctas.map((cta) => (
                <CTAButtonRenderer key={cta.id} cta={cta} getNavPath={getNavPath} variant="promotional" />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Immersive variant (Decathlon-style)
function ImmersiveHero({ slide, config, getNavPath }: VariantProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0"
    >
      {/* Full-bleed background */}
      <HeroBackground media={slide.media} overlay={false} />

      {/* Subtle gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30" />

      {/* Centered content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        {/* Badge */}
        {slide.badge && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
              {slide.badge.icon && <DynamicIcon name={slide.badge.icon} className="w-4 h-4" />}
              {slide.badge.text}
            </span>
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 max-w-4xl leading-tight"
        >
          {slide.headline}
        </motion.h1>

        {slide.subheadline && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 max-w-2xl"
          >
            {slide.subheadline}
          </motion.p>
        )}

        {/* CTAs - centered and prominent */}
        {slide.ctas && slide.ctas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            {slide.ctas.map((cta) => (
              <CTAButtonRenderer key={cta.id} cta={cta} getNavPath={getNavPath} variant="immersive" />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Split variant
function SplitHero({ slide, config, getNavPath }: VariantProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 flex flex-col md:flex-row"
    >
      {/* Content side */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-background p-8 md:p-12 lg:p-16 order-2 md:order-1">
        <div className="max-w-lg">
          {slide.badge && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-tenant-primary/10 text-tenant-primary rounded-full text-sm font-medium mb-4"
            >
              {slide.badge.text}
            </motion.div>
          )}

          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight"
          >
            {slide.headline}
          </motion.h1>

          {slide.subheadline && (
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground mb-6"
            >
              {slide.subheadline}
            </motion.p>
          )}

          {slide.description && (
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="text-base text-muted-foreground mb-8"
            >
              {slide.description}
            </motion.p>
          )}

          {slide.ctas && slide.ctas.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-3"
            >
              {slide.ctas.map((cta) => (
                <CTAButtonRenderer key={cta.id} cta={cta} getNavPath={getNavPath} />
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Media side */}
      <div className="w-full md:w-1/2 relative min-h-[40vh] md:min-h-full order-1 md:order-2">
        <HeroBackground media={slide.media} />
      </div>
    </motion.div>
  );
}

// Minimal variant
function MinimalHero({ slide, config, getNavPath }: VariantProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 flex items-center justify-center bg-background"
    >
      <div className="container-tenant py-16 md:py-24 text-center">
        {slide.badge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4"
          >
            <span className="text-sm font-medium text-tenant-primary uppercase tracking-wider">
              {slide.badge.text}
            </span>
          </motion.div>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 max-w-4xl mx-auto"
        >
          {slide.headline}
        </motion.h1>

        {slide.subheadline && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            {slide.subheadline}
          </motion.p>
        )}

        {slide.ctas && slide.ctas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            {slide.ctas.map((cta) => (
              <CTAButtonRenderer key={cta.id} cta={cta} getNavPath={getNavPath} />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Parallax variant
function ParallaxHero({ slide, config, getNavPath }: VariantProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="absolute inset-0"
    >
      {/* Parallax background */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 20, ease: 'linear' }}
      >
        <HeroBackground media={slide.media} />
      </motion.div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content with parallax offset */}
      <div className="absolute inset-0 flex items-center">
        <div className="container-tenant py-16">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {slide.badge && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-sm mb-6">
                {slide.badge.text}
              </div>
            )}

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              {slide.headline}
            </h1>

            {slide.subheadline && (
              <p className="text-xl text-white/90 mb-8">
                {slide.subheadline}
              </p>
            )}

            {slide.ctas && slide.ctas.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {slide.ctas.map((cta) => (
                  <CTAButtonRenderer key={cta.id} cta={cta} getNavPath={getNavPath} />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// VARIANT REGISTRY
// =============================================================================

const VARIANT_RENDERERS: Record<HeroVariant, React.ComponentType<VariantProps>> = {
  editorial: EditorialHero,
  promotional: PromotionalHero,
  immersive: ImmersiveHero,
  split: SplitHero,
  minimal: MinimalHero,
  parallax: ParallaxHero,
  carousel: EditorialHero, // Carousel uses editorial as base
  video: EditorialHero, // Video hero handled separately
};

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function HeroBackground({ media, overlay = true }: { media?: HeroSlide['media']; overlay?: boolean }) {
  if (!media) {
    return <div className="absolute inset-0 bg-gradient-to-br from-[var(--tenant-primary)] to-[var(--tenant-secondary)]" />;
  }

  if (media.type === 'video') {
    return (
      <>
        <video
          autoPlay={media.videoOptions?.autoplay ?? true}
          muted={media.videoOptions?.muted ?? true}
          loop={media.videoOptions?.loop ?? true}
          playsInline
          poster={media.videoOptions?.poster}
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={media.url} type="video/mp4" />
        </video>
        {overlay && (
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: media.overlay?.opacity ?? 0.4 }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Image
        src={media.mobileUrl || media.url}
        alt={media.alt || ''}
        fill
        priority
        className="object-cover md:hidden"
        style={{ objectPosition: media.focalPoint ? `${media.focalPoint.x}% ${media.focalPoint.y}%` : 'center' }}
      />
      <Image
        src={media.url}
        alt={media.alt || ''}
        fill
        priority
        className="object-cover hidden md:block"
        style={{ objectPosition: media.focalPoint ? `${media.focalPoint.x}% ${media.focalPoint.y}%` : 'center' }}
      />
      {overlay && media.overlay && (
        <div
          className={cn(
            'absolute inset-0',
            media.overlay.type === 'gradient' && `bg-gradient-${media.overlay.direction || 'to-top'}`
          )}
          style={{
            backgroundColor: media.overlay.type === 'solid' ? media.overlay.color : undefined,
            opacity: media.overlay.opacity ?? 0.4,
          }}
        />
      )}
    </>
  );
}

function CTAButtonRenderer({
  cta,
  getNavPath,
  variant = 'default',
}: {
  cta: CTAButton;
  getNavPath: (path: string) => string;
  variant?: 'default' | 'promotional' | 'immersive' | 'editorial-primary' | 'editorial-secondary';
}) {
  const getButtonVariant = () => {
    // Editorial variants - solid colors, no gradients
    if (variant === 'editorial-primary') {
      return 'default';
    }
    if (variant === 'editorial-secondary') {
      return 'secondary';
    }
    if (variant === 'promotional') {
      return cta.style === 'primary' ? 'default' : 'outline';
    }
    if (variant === 'immersive') {
      return cta.style === 'primary' ? 'tenant-gradient' : 'tenant-glass';
    }

    switch (cta.style) {
      case 'primary':
        return 'tenant-gradient';
      case 'secondary':
        return 'tenant-outline';
      case 'outline':
        return 'outline';
      case 'ghost':
        return 'ghost';
      case 'gradient':
        return 'tenant-gradient';
      case 'glow':
        return 'tenant-glow';
      case 'glass':
        return 'tenant-glass';
      default:
        return 'default';
    }
  };

  const buttonSize = cta.size === 'xl' ? 'xl' : cta.size === 'lg' ? 'lg' : cta.size === 'sm' ? 'sm' : 'default';

  const isEditorial = variant === 'editorial-primary' || variant === 'editorial-secondary';

  return (
    <Button
      asChild
      variant={getButtonVariant() as any}
      size={buttonSize}
      className={cn(
        'group',
        variant === 'promotional' && cta.style === 'primary' && 'bg-white text-gray-900 hover:bg-gray-100',
        // Editorial button styles - uppercase, letter-spacing, rounded corners
        isEditorial && 'uppercase tracking-widest text-xs font-semibold rounded',
        variant === 'editorial-primary' && 'bg-stone-800 text-white hover:bg-stone-900',
        variant === 'editorial-secondary' && 'bg-transparent border border-stone-200 text-stone-900 hover:border-stone-900 hover:bg-stone-50'
      )}
    >
      <Link
        href={getNavPath(cta.href)}
        target={cta.openInNewTab ? '_blank' : undefined}
        rel={cta.openInNewTab ? 'noopener noreferrer' : undefined}
      >
        {cta.icon && cta.iconPosition === 'left' && (
          <DynamicIcon name={cta.icon} className="mr-2 h-4 w-4" />
        )}
        <TranslatedUIText text={cta.label} />
        {cta.icon && cta.iconPosition !== 'left' && (
          <DynamicIcon name={cta.icon} className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        )}
        {!cta.icon && (
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        )}
      </Link>
    </Button>
  );
}

function CountdownTimer({ config, variant = 'default' }: { config: CountdownConfig; variant?: 'default' | 'flip' | 'editorial' }) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(config.endDate);

  if (isExpired) {
    if (config.expiredAction === 'hide') return null;
    if (config.expiredAction === 'show-message' && config.expiredMessage) {
      return <p className={cn(
        variant === 'editorial' ? 'text-stone-500 text-base' : 'text-white/80 text-lg'
      )}>{config.expiredMessage}</p>;
    }
    return null;
  }

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className={cn(
      'flex flex-col items-center',
      variant === 'flip' && 'bg-black/80 rounded px-3 py-2 min-w-[60px]',
      variant === 'editorial' && 'min-w-[60px]'
    )}>
      <span className={cn(
        'font-bold tabular-nums',
        variant === 'flip' && 'text-3xl sm:text-4xl text-white',
        variant === 'editorial' && 'text-3xl sm:text-4xl text-stone-900 font-light',
        variant === 'default' && 'text-2xl sm:text-3xl text-white'
      )}>
        {String(value).padStart(2, '0')}
      </span>
      <span className={cn(
        'uppercase tracking-wider',
        variant === 'flip' && 'text-[10px] text-white/60',
        variant === 'editorial' && 'text-[10px] text-stone-500 tracking-widest',
        variant === 'default' && 'text-xs text-white/70'
      )}>
        {label}
      </span>
    </div>
  );

  return (
    <div className={cn(
      'flex gap-2 sm:gap-3',
      variant === 'flip' && 'bg-black/40 backdrop-blur-sm p-3 rounded-lg inline-flex',
      variant === 'editorial' && 'gap-6'
    )}>
      {config.showDays !== false && <TimeUnit value={days} label="Days" />}
      {variant === 'flip' && <span className="text-white/40 text-2xl self-center">:</span>}
      {config.showHours !== false && <TimeUnit value={hours} label="Hrs" />}
      {variant === 'flip' && <span className="text-white/40 text-2xl self-center">:</span>}
      {config.showMinutes !== false && <TimeUnit value={minutes} label="Min" />}
      {variant === 'flip' && <span className="text-white/40 text-2xl self-center">:</span>}
      {config.showSeconds !== false && <TimeUnit value={seconds} label="Sec" />}
    </div>
  );
}

function StatsBar({ stats }: { stats: NonNullable<HeroBlockConfig['stats']> }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="absolute bottom-20 left-0 right-0 z-10"
    >
      <div className="container-tenant">
        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 py-6 px-4 bg-white/10 backdrop-blur-md rounded-2xl">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-3 text-white">
              <DynamicIcon name={stat.icon} className="w-6 h-6 text-tenant-accent" />
              <div>
                <div className="text-2xl font-bold">
                  {stat.animated ? (
                    <AnimatedCounter value={typeof stat.value === 'number' ? stat.value : parseInt(stat.value)} />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-sm text-white/70">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ScrollIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:block"
    >
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
      </motion.div>
    </motion.div>
  );
}

function Decorations({ config }: { config?: HeroBlockConfig['decorations'] }) {
  if (!config) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {config.blobs && (
        <>
          <motion.div
            className="absolute top-20 right-20 w-72 h-72 rounded-full opacity-20 blur-3xl"
            style={{ background: 'var(--tenant-primary)' }}
            animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-40 right-40 w-48 h-48 rounded-full opacity-15 blur-2xl"
            style={{ background: 'var(--tenant-secondary)' }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
          />
        </>
      )}
      {config.aurora && (
        <div className="absolute inset-0 aurora-bg opacity-30" />
      )}
    </div>
  );
}

// Dynamic icon component
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  // Map common icon names to Lucide components
  const icons: Record<string, React.ComponentType<any>> = {
    sparkles: Sparkles,
    star: Star,
    users: Users,
    package: Package,
    play: Play,
    pause: Pause,
    'arrow-right': ArrowRight,
  };

  const Icon = icons[name.toLowerCase()] || Sparkles;
  return <Icon className={className} />;
}

function getBadgeStyles(style?: string): string {
  switch (style) {
    case 'primary':
      return 'bg-tenant-primary/20 text-tenant-primary';
    case 'secondary':
      return 'bg-tenant-secondary/20 text-tenant-secondary';
    case 'accent':
      return 'bg-tenant-accent/20 text-tenant-accent';
    case 'warning':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'success':
      return 'bg-green-500/20 text-green-400';
    default:
      return 'glass text-white';
  }
}

export default HeroBlock;
