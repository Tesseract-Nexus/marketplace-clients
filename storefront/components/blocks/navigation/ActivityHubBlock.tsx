'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronRight, ChevronLeft, HelpCircle, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavPath } from '@/context/TenantContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { cn } from '@/lib/utils';
import type { ActivityHubBlockConfig, ActivityItem } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

// =============================================================================
// ACTIVITY HUB BLOCK (Decathlon-style shop by activity)
// =============================================================================

export function ActivityHubBlock({ config }: BlockComponentProps<ActivityHubBlockConfig>) {
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
    scrollRef.current?.scrollBy({ left: -280, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 280, behavior: 'smooth' });
  };

  // Grid columns
  const gridCols = config.columns || { mobile: 2, tablet: 3, desktop: 4 };

  // Get featured activities
  const featuredActivities = config.activities.filter((a) => a.featured);
  const regularActivities = config.activities.filter((a) => !a.featured);

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container-tenant">
        {/* Header */}
        {(config.title || config.subtitle) && (
          <div className="text-center mb-8 sm:mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tenant-primary/10 text-tenant-primary mb-4"
            >
              <Compass className="w-4 h-4" />
              <span className="text-sm font-medium">
                <TranslatedUIText text="Shop by Activity" />
              </span>
            </motion.div>
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

        {/* Featured Activities (if any) */}
        {featuredActivities.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {featuredActivities.map((activity, index) => (
                <FeaturedActivityCard
                  key={activity.id}
                  activity={activity}
                  index={index}
                  config={config}
                  getNavPath={getNavPath}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Activities */}
        {isCarousel ? (
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
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
            >
              {regularActivities.map((activity, index) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  index={index}
                  config={config}
                  getNavPath={getNavPath}
                  className="flex-none w-64 sm:w-72 snap-start"
                />
              ))}
            </div>
          </div>
        ) : config.layout === 'sidebar' ? (
          /* Sidebar Layout */
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div
                className={cn(
                  'grid gap-4',
                  `grid-cols-${gridCols.mobile}`,
                  `sm:grid-cols-${gridCols.tablet}`,
                  `lg:grid-cols-3`
                )}
              >
                {regularActivities.map((activity, index) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    index={index}
                    config={config}
                    getNavPath={getNavPath}
                  />
                ))}
              </div>
            </div>
            <div className="lg:col-span-1">
              {config.showQuiz && config.quizConfig && (
                <QuizCard config={config.quizConfig} getNavPath={getNavPath} />
              )}
            </div>
          </div>
        ) : (
          /* Grid Layout */
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
            }}
            className={cn(
              'grid gap-4 md:gap-6',
              `grid-cols-${gridCols.mobile}`,
              `sm:grid-cols-${gridCols.tablet}`,
              `lg:grid-cols-${gridCols.desktop}`
            )}
          >
            {regularActivities.map((activity, index) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                index={index}
                config={config}
                getNavPath={getNavPath}
              />
            ))}
          </motion.div>
        )}

        {/* Quiz CTA (if not in sidebar) */}
        {config.showQuiz && config.quizConfig && config.layout !== 'sidebar' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8"
          >
            <QuizCard config={config.quizConfig} getNavPath={getNavPath} inline />
          </motion.div>
        )}
      </div>
    </section>
  );
}

// =============================================================================
// FEATURED ACTIVITY CARD
// =============================================================================

interface ActivityCardProps {
  activity: ActivityItem;
  index: number;
  config: ActivityHubBlockConfig;
  getNavPath: (path: string) => string;
  className?: string;
}

function FeaturedActivityCard({
  activity,
  index,
  config,
  getNavPath,
  className,
}: ActivityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={className}
    >
      <Link
        href={getNavPath(activity.url)}
        className="group block relative aspect-[16/9] rounded-2xl overflow-hidden"
      >
        {/* Background */}
        {activity.image?.url ? (
          <Image
            src={activity.image.url}
            alt={activity.image.alt || activity.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-tenant-primary to-tenant-secondary" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          {activity.icon && (
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
              <span className="text-2xl">{activity.icon}</span>
            </div>
          )}
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
            <TranslatedUIText text={activity.title} />
          </h3>
          {activity.description && (
            <p className="text-white/80 text-sm mb-3 line-clamp-2">
              <TranslatedUIText text={activity.description} />
            </p>
          )}
          {config.showProductCount && activity.productCount !== undefined && (
            <Badge variant="secondary" className="self-start bg-white/20 text-white mb-3">
              {activity.productCount} products
            </Badge>
          )}
          <div className="flex items-center gap-2 text-white group-hover:gap-3 transition-all">
            <span className="font-medium">
              <TranslatedUIText text="Explore" />
            </span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// =============================================================================
// ACTIVITY CARD
// =============================================================================

function ActivityCard({
  activity,
  index,
  config,
  getNavPath,
  className,
}: ActivityCardProps) {
  const [showSubActivities, setShowSubActivities] = useState(false);

  // Icon-focused style
  if (config.cardStyle === 'icon-focused') {
    return (
      <motion.div
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: { opacity: 1, scale: 1 },
        }}
        className={className}
      >
        <Link
          href={getNavPath(activity.url)}
          className="flex flex-col items-center p-4 sm:p-6 rounded-xl bg-background border hover:border-tenant-primary hover:shadow-md transition-all group"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-tenant-primary/10 flex items-center justify-center mb-3 group-hover:bg-tenant-primary/20 transition-colors">
            {activity.icon ? (
              <span className="text-3xl sm:text-4xl">{activity.icon}</span>
            ) : activity.image?.url ? (
              <Image
                src={activity.image.url}
                alt={activity.title}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <Compass className="w-8 h-8 text-tenant-primary" />
            )}
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-center line-clamp-2 mb-1">
            <TranslatedUIText text={activity.title} />
          </h3>
          {config.showProductCount && activity.productCount !== undefined && (
            <span className="text-xs text-muted-foreground">
              {activity.productCount} products
            </span>
          )}
        </Link>
      </motion.div>
    );
  }

  // Minimal style
  if (config.cardStyle === 'minimal') {
    return (
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 10 },
          visible: { opacity: 1, y: 0 },
        }}
        className={className}
      >
        <Link
          href={getNavPath(activity.url)}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
        >
          {activity.icon && (
            <span className="text-xl">{activity.icon}</span>
          )}
          <span className="font-medium flex-1 group-hover:text-tenant-primary transition-colors">
            <TranslatedUIText text={activity.title} />
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>
    );
  }

  // Detailed style (default)
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={className}
    >
      <div
        className="relative rounded-xl overflow-hidden bg-background border hover:border-tenant-primary hover:shadow-md transition-all group"
        onMouseEnter={() => activity.subActivities && setShowSubActivities(true)}
        onMouseLeave={() => setShowSubActivities(false)}
      >
        <Link href={getNavPath(activity.url)}>
          {/* Image */}
          <div className="relative aspect-[4/3] bg-muted">
            {activity.image?.url ? (
              <Image
                src={activity.image.url}
                alt={activity.image.alt || activity.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-tenant-primary/20 to-tenant-secondary/20 flex items-center justify-center">
                {activity.icon ? (
                  <span className="text-4xl">{activity.icon}</span>
                ) : (
                  <Compass className="w-12 h-12 text-tenant-primary/50" />
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-foreground mb-1 group-hover:text-tenant-primary transition-colors">
              <TranslatedUIText text={activity.title} />
            </h3>
            {activity.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                <TranslatedUIText text={activity.description} />
              </p>
            )}
            {config.showProductCount && activity.productCount !== undefined && (
              <span className="text-xs text-muted-foreground">
                {activity.productCount} products
              </span>
            )}
          </div>
        </Link>

        {/* Sub-activities dropdown */}
        {config.showSubActivities && activity.subActivities && activity.subActivities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: showSubActivities ? 1 : 0,
              height: showSubActivities ? 'auto' : 0,
            }}
            className="border-t bg-muted/50 overflow-hidden"
          >
            <div className="p-3 space-y-1">
              {activity.subActivities.slice(0, 4).map((sub) => (
                <Link
                  key={sub.id}
                  href={getNavPath(sub.url)}
                  className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-background text-sm transition-colors"
                >
                  <span>{sub.title}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </Link>
              ))}
              {activity.subActivities.length > 4 && (
                <Link
                  href={getNavPath(activity.url)}
                  className="block text-xs text-tenant-primary font-medium pt-1 text-center"
                >
                  View all {activity.subActivities.length} activities
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// QUIZ CARD
// =============================================================================

interface QuizCardProps {
  config: NonNullable<ActivityHubBlockConfig['quizConfig']>;
  getNavPath: (path: string) => string;
  inline?: boolean;
}

function QuizCard({ config, getNavPath, inline = false }: QuizCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden bg-gradient-to-br from-tenant-primary to-tenant-secondary p-6 text-white',
        inline && 'flex items-center gap-6'
      )}
    >
      <div className={cn('flex-1', !inline && 'mb-4')}>
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold mb-2">
          <TranslatedUIText text={config.title} />
        </h3>
        <p className="text-white/80 text-sm">
          <TranslatedUIText text={config.description} />
        </p>
      </div>
      <Button
        variant="secondary"
        asChild
        className="bg-white text-tenant-primary hover:bg-white/90"
      >
        <Link href={getNavPath(config.url)}>
          <TranslatedUIText text={config.buttonText} />
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

export default ActivityHubBlock;
