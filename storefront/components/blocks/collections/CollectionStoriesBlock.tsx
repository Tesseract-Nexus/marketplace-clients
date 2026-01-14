'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavPath } from '@/context/TenantContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { cn } from '@/lib/utils';
import type { CollectionStoriesBlockConfig, CollectionStory } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

// =============================================================================
// COLLECTION STORIES BLOCK (Myntra-style editorial)
// =============================================================================

export function CollectionStoriesBlock({ config }: BlockComponentProps<CollectionStoriesBlockConfig>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const getNavPath = useNavPath();

  const isCarousel = config.layout === 'carousel';

  // Check scroll for carousel
  const checkScroll = () => {
    if (!scrollRef.current || !isCarousel) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    if (isCarousel) checkScroll();
  }, [isCarousel]);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  // Grid columns
  const gridCols = config.columns || { mobile: 1, tablet: 2, desktop: 3 };

  return (
    <section className="py-8 sm:py-12 md:py-16">
      <div className="container-tenant">
        {/* Header */}
        {(config.title || config.subtitle) && (
          <div className="text-center mb-8 sm:mb-12">
            {config.title && (
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3"
              >
                <TranslatedUIText text={config.title} />
              </motion.h2>
            )}
            {config.subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground max-w-2xl mx-auto"
              >
                <TranslatedUIText text={config.subtitle} />
              </motion.p>
            )}
          </div>
        )}

        {/* Stories */}
        {config.layout === 'featured' ? (
          /* Featured layout: 1 large + 2 small */
          <FeaturedLayout stories={config.stories} config={config} getNavPath={getNavPath} />
        ) : isCarousel ? (
          /* Carousel Layout */
          <div className="relative">
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={cn(
                'absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background shadow-lg border flex items-center justify-center transition-all',
                canScrollLeft ? 'opacity-100 hover:scale-110' : 'opacity-0'
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={cn(
                'absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background shadow-lg border flex items-center justify-center transition-all',
                canScrollRight ? 'opacity-100 hover:scale-110' : 'opacity-0'
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div
              ref={scrollRef}
              onScroll={checkScroll}
              className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
            >
              {config.stories.map((story, index) => (
                <StoryCard
                  key={story.id}
                  story={story}
                  index={index}
                  config={config}
                  getNavPath={getNavPath}
                  className="flex-none w-72 sm:w-80 md:w-96 snap-start"
                />
              ))}
            </div>
          </div>
        ) : config.layout === 'masonry' ? (
          /* Masonry Layout */
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6">
            {config.stories.map((story, index) => (
              <StoryCard
                key={story.id}
                story={story}
                index={index}
                config={config}
                getNavPath={getNavPath}
                className="mb-4 md:mb-6 break-inside-avoid"
              />
            ))}
          </div>
        ) : (
          /* Grid Layout */
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
            className={cn(
              'grid gap-4 md:gap-6',
              `grid-cols-${gridCols.mobile}`,
              `sm:grid-cols-${gridCols.tablet}`,
              `lg:grid-cols-${gridCols.desktop}`
            )}
          >
            {config.stories.map((story, index) => (
              <StoryCard
                key={story.id}
                story={story}
                index={index}
                config={config}
                getNavPath={getNavPath}
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

// =============================================================================
// FEATURED LAYOUT
// =============================================================================

function FeaturedLayout({
  stories,
  config,
  getNavPath,
}: {
  stories: CollectionStory[];
  config: CollectionStoriesBlockConfig;
  getNavPath: (path: string) => string;
}) {
  const [featured, ...rest] = stories;
  const secondary = rest.slice(0, 2);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* Featured Story */}
      {featured && (
        <StoryCard
          story={featured}
          index={0}
          config={config}
          getNavPath={getNavPath}
          featured
          className="lg:row-span-2"
        />
      )}

      {/* Secondary Stories */}
      {secondary.map((story, index) => (
        <StoryCard
          key={story.id}
          story={story}
          index={index + 1}
          config={config}
          getNavPath={getNavPath}
        />
      ))}
    </div>
  );
}

// =============================================================================
// STORY CARD
// =============================================================================

interface StoryCardProps {
  story: CollectionStory;
  index: number;
  config: CollectionStoriesBlockConfig;
  getNavPath: (path: string) => string;
  featured?: boolean;
  className?: string;
}

function StoryCard({
  story,
  index,
  config,
  getNavPath,
  featured = false,
  className,
}: StoryCardProps) {
  const aspectClass = getAspectClass(story.style || config.aspectRatio);
  const overlayClass = getOverlayClass(story.overlay);
  const hoverClass = getHoverClass(config.hoverEffect);

  const href = story.cta?.href || (story.collectionId ? `/collections/${story.collectionId}` : '#');

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
      }}
      className={className}
    >
      <Link
        href={getNavPath(href)}
        className={cn(
          'group block relative overflow-hidden rounded-xl sm:rounded-2xl',
          aspectClass,
          hoverClass
        )}
      >
        {/* Background Image */}
        {story.media?.url && (
          <Image
            src={story.media.mobileUrl || story.media.url}
            alt={story.media.alt || story.title}
            fill
            className={cn(
              'object-cover transition-transform duration-700',
              config.hoverEffect === 'zoom' && 'group-hover:scale-110'
            )}
          />
        )}

        {/* Overlay */}
        <div className={cn('absolute inset-0', overlayClass)} />

        {/* Content */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8',
            config.cardStyle === 'hidden' && 'opacity-0 group-hover:opacity-100 transition-opacity'
          )}
        >
          {/* Tag */}
          {story.tag && (
            <span className="inline-flex self-start px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium mb-3">
              {story.tag}
            </span>
          )}

          {/* Title */}
          <h3
            className={cn(
              'font-bold text-white mb-2 leading-tight group-hover:translate-x-1 transition-transform',
              featured ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl'
            )}
          >
            <TranslatedUIText text={story.title} />
          </h3>

          {/* Subtitle */}
          {story.subtitle && config.cardStyle !== 'hidden' && (
            <p className={cn(
              'text-white/80 mb-3 line-clamp-2',
              featured ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
            )}>
              <TranslatedUIText text={story.subtitle} />
            </p>
          )}

          {/* Description */}
          {story.description && featured && (
            <p className="text-white/70 text-sm mb-4 line-clamp-3 hidden md:block">
              <TranslatedUIText text={story.description} />
            </p>
          )}

          {/* CTA */}
          {story.cta && (
            <div className="flex items-center gap-2 text-white group-hover:gap-3 transition-all">
              <span className="font-medium text-sm sm:text-base">
                <TranslatedUIText text={story.cta.label} />
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </div>

        {/* Hover overlay effect */}
        {config.hoverEffect === 'overlay' && (
          <div className="absolute inset-0 bg-tenant-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </Link>
    </motion.div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function getAspectClass(style?: string): string {
  switch (style) {
    case 'portrait':
    case '3:4':
      return 'aspect-[3/4]';
    case 'landscape':
    case '16:9':
      return 'aspect-video';
    case 'square':
    case '1:1':
      return 'aspect-square';
    case '4:3':
      return 'aspect-[4/3]';
    default:
      return 'aspect-[4/3]';
  }
}

function getOverlayClass(overlay?: string): string {
  switch (overlay) {
    case 'light':
      return 'bg-gradient-to-t from-black/40 via-transparent to-transparent';
    case 'dark':
      return 'bg-gradient-to-t from-black/80 via-black/40 to-black/20';
    case 'gradient':
      return 'bg-gradient-to-t from-black/70 via-black/30 to-transparent';
    case 'none':
      return '';
    default:
      return 'bg-gradient-to-t from-black/60 via-black/20 to-transparent';
  }
}

function getHoverClass(effect?: string): string {
  switch (effect) {
    case 'lift':
      return 'hover:-translate-y-1 hover:shadow-xl transition-all duration-300';
    case 'zoom':
      return 'transition-shadow hover:shadow-xl';
    case 'overlay':
      return 'transition-shadow hover:shadow-xl';
    case 'none':
      return '';
    default:
      return 'hover:shadow-lg transition-shadow';
  }
}

export default CollectionStoriesBlock;
