'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { useNavPath } from '@/context/TenantContext';
import { cn } from '@/lib/utils';
import type { ContentCardsBlockConfig, ContentCard } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

export function ContentCardsBlock({ config }: BlockComponentProps<ContentCardsBlockConfig>) {
  const getNavPath = useNavPath();
  const gridCols = config.columns || { mobile: 1, tablet: 2, desktop: 3 };

  return (
    <section className="py-8 sm:py-12 md:py-16">
      <div className="container-tenant">
        {/* Header */}
        {(config.title || config.subtitle) && (
          <div className="text-center mb-8 sm:mb-12">
            {config.title && (
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
                <TranslatedUIText text={config.title} />
              </h2>
            )}
            {config.subtitle && (
              <p className="text-muted-foreground max-w-2xl mx-auto">
                <TranslatedUIText text={config.subtitle} />
              </p>
            )}
          </div>
        )}

        {/* Cards */}
        {config.layout === 'carousel' ? (
          <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory">
            {config.cards.map((card, index) => (
              <ContentCardItem
                key={card.id}
                card={card}
                index={index}
                config={config}
                getNavPath={getNavPath}
                className="flex-none w-72 sm:w-80 snap-start"
              />
            ))}
          </div>
        ) : config.layout === 'list' ? (
          <div className="space-y-4">
            {config.cards.map((card, index) => (
              <ContentCardItem
                key={card.id}
                card={card}
                index={index}
                config={config}
                getNavPath={getNavPath}
                listMode
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
            className={cn(
              'grid gap-4 sm:gap-6',
              `grid-cols-${gridCols.mobile}`,
              `sm:grid-cols-${gridCols.tablet}`,
              `lg:grid-cols-${gridCols.desktop}`
            )}
          >
            {config.cards.map((card, index) => (
              <ContentCardItem
                key={card.id}
                card={card}
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

interface ContentCardItemProps {
  card: ContentCard;
  index: number;
  config: ContentCardsBlockConfig;
  getNavPath: (path: string) => string;
  className?: string;
  listMode?: boolean;
}

function ContentCardItem({
  card,
  index,
  config,
  getNavPath,
  className,
  listMode,
}: ContentCardItemProps) {
  const IconComponent = card.icon
    ? (LucideIcons as any)[toPascalCase(card.icon)] || LucideIcons.FileText
    : null;

  const aspectClass =
    config.aspectRatio === '1:1' ? 'aspect-square' :
    config.aspectRatio === '16:9' ? 'aspect-video' :
    'aspect-[4/3]';

  const hoverClass =
    config.hoverEffect === 'lift' ? 'hover:-translate-y-1 hover:shadow-lg transition-all' :
    config.hoverEffect === 'zoom' ? 'hover:shadow-lg' :
    'hover:shadow-md transition-shadow';

  // List mode layout
  if (listMode) {
    return (
      <motion.div
        variants={{
          hidden: { opacity: 0, x: -20 },
          visible: { opacity: 1, x: 0 },
        }}
        className={className}
      >
        <Link
          href={card.url ? getNavPath(card.url) : '#'}
          className={cn(
            'flex items-center gap-4 p-4 rounded-xl bg-background border group',
            card.url && hoverClass
          )}
        >
          {/* Image or Icon */}
          {card.media?.url ? (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={card.media.url}
                alt={card.media.alt || card.title}
                fill
                className="object-cover"
              />
            </div>
          ) : IconComponent ? (
            <div className="w-14 h-14 rounded-lg bg-tenant-primary/10 flex items-center justify-center flex-shrink-0">
              <IconComponent className="w-7 h-7 text-tenant-primary" />
            </div>
          ) : null}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {card.badge && (
              <Badge variant="secondary" className="mb-1">{card.badge}</Badge>
            )}
            <h3 className="font-semibold group-hover:text-tenant-primary transition-colors">
              {card.title}
            </h3>
            {card.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {card.description}
              </p>
            )}
          </div>

          {/* Arrow */}
          {card.url && (
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
          )}
        </Link>
      </motion.div>
    );
  }

  // Card styles
  if (config.cardStyle === 'icon') {
    return (
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        className={className}
      >
        <Link
          href={card.url ? getNavPath(card.url) : '#'}
          className={cn(
            'block p-6 rounded-xl bg-background border text-center group',
            card.url && hoverClass
          )}
        >
          {IconComponent && (
            <div className="w-14 h-14 mx-auto rounded-full bg-tenant-primary/10 flex items-center justify-center mb-4 group-hover:bg-tenant-primary/20 transition-colors">
              <IconComponent className="w-7 h-7 text-tenant-primary" />
            </div>
          )}
          {card.badge && (
            <Badge variant="secondary" className="mb-2">{card.badge}</Badge>
          )}
          <h3 className="font-semibold mb-1 group-hover:text-tenant-primary transition-colors">
            {card.title}
          </h3>
          {card.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {card.description}
            </p>
          )}
        </Link>
      </motion.div>
    );
  }

  // Image card (default)
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={className}
    >
      <Link
        href={card.url ? getNavPath(card.url) : '#'}
        className={cn(
          'block rounded-xl overflow-hidden bg-background border group',
          card.url && hoverClass
        )}
      >
        {/* Image */}
        {card.media?.url && (
          <div className={cn('relative overflow-hidden', aspectClass)}>
            <Image
              src={card.media.url}
              alt={card.media.alt || card.title}
              fill
              className={cn(
                'object-cover transition-transform duration-500',
                config.hoverEffect === 'zoom' && 'group-hover:scale-105'
              )}
            />
            {card.badge && (
              <Badge className="absolute top-3 left-3">{card.badge}</Badge>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold mb-1 group-hover:text-tenant-primary transition-colors line-clamp-2">
            {card.title}
          </h3>
          {card.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {card.description}
            </p>
          )}
          {card.cta && (
            <Button variant="link" className="p-0 h-auto font-medium">
              {card.cta.label}
              <ArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export default ContentCardsBlock;
