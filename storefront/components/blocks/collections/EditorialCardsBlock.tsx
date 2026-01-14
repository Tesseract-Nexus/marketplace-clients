'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, User } from 'lucide-react';
import { useNavPath } from '@/context/TenantContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { cn } from '@/lib/utils';
import type { EditorialCardsBlockConfig, EditorialCard } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

export function EditorialCardsBlock({ config }: BlockComponentProps<EditorialCardsBlockConfig>) {
  const getNavPath = useNavPath();
  const cards = config.source.cards || [];
  const gridCols = config.columns || { mobile: 1, tablet: 2, desktop: 3 };

  if (cards.length === 0) return null;

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
                className="text-muted-foreground"
              >
                <TranslatedUIText text={config.subtitle} />
              </motion.p>
            )}
          </div>
        )}

        {/* Cards Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
          }}
          className={cn(
            'grid gap-6',
            `grid-cols-${gridCols.mobile}`,
            `sm:grid-cols-${gridCols.tablet}`,
            `lg:grid-cols-${gridCols.desktop}`
          )}
        >
          {cards.map((card, index) => (
            <EditorialCardItem
              key={card.id}
              card={card}
              index={index}
              config={config}
              getNavPath={getNavPath}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

interface EditorialCardItemProps {
  card: EditorialCard;
  index: number;
  config: EditorialCardsBlockConfig;
  getNavPath: (path: string) => string;
}

function EditorialCardItem({ card, index, config, getNavPath }: EditorialCardItemProps) {
  const aspectRatio = config.imageAspectRatio === '16:9' ? 'aspect-video' :
    config.imageAspectRatio === '1:1' ? 'aspect-square' : 'aspect-[4/3]';

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className="group"
    >
      <Link href={getNavPath(card.url)} className="block">
        {/* Image */}
        <div className={cn('relative overflow-hidden rounded-xl mb-4', aspectRatio)}>
          {card.media?.url && (
            <Image
              src={card.media.url}
              alt={card.media.alt || card.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
          {card.category && config.showCategory && (
            <span className="absolute top-3 left-3 px-3 py-1 bg-tenant-primary text-white text-xs font-medium rounded-full">
              {card.category}
            </span>
          )}
        </div>

        {/* Content */}
        <div>
          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
            {config.showAuthor && card.author && (
              <div className="flex items-center gap-1.5">
                {card.author.avatar ? (
                  <Image
                    src={card.author.avatar}
                    alt={card.author.name}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span>{card.author.name}</span>
              </div>
            )}
            {config.showReadTime && card.readTime && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{card.readTime} min read</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold mb-2 group-hover:text-tenant-primary transition-colors line-clamp-2">
            {card.title}
          </h3>

          {/* Excerpt */}
          {config.showExcerpt && card.excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
              {card.excerpt}
            </p>
          )}

          {/* Read more */}
          <span className="inline-flex items-center gap-1 text-sm font-medium text-tenant-primary group-hover:gap-2 transition-all">
            Read More
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

export default EditorialCardsBlock;
