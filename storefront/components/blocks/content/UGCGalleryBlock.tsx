'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Heart, Instagram, Tag } from 'lucide-react';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { cn } from '@/lib/utils';
import type { UGCGalleryBlockConfig } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

export function UGCGalleryBlock({ config }: BlockComponentProps<UGCGalleryBlockConfig>) {
  const items = config.source.items || [];
  const gridCols = config.columns || { mobile: 2, tablet: 3, desktop: 4 };

  if (items.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 md:py-16">
      <div className="container-tenant">
        {/* Header */}
        {(config.title || config.hashtag) && (
          <div className="text-center mb-8">
            {config.title && (
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                <TranslatedUIText text={config.title} />
              </h2>
            )}
            {config.hashtag && (
              <p className="text-tenant-primary font-medium">#{config.hashtag}</p>
            )}
            {config.subtitle && (
              <p className="text-muted-foreground mt-2">
                <TranslatedUIText text={config.subtitle} />
              </p>
            )}
          </div>
        )}

        {/* Gallery */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
          }}
          className={cn(
            'grid gap-3 sm:gap-4',
            config.layout === 'masonry' ? 'columns-2 sm:columns-3 lg:columns-4 space-y-4' : '',
            config.layout !== 'masonry' && [
              `grid-cols-${gridCols.mobile}`,
              `sm:grid-cols-${gridCols.tablet}`,
              `lg:grid-cols-${gridCols.desktop}`
            ].join(' ')
          )}
        >
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 },
              }}
              className={cn(
                'group relative overflow-hidden rounded-xl cursor-pointer',
                config.layout !== 'masonry' && 'aspect-square'
              )}
            >
              {item.media?.url && (
                <Image
                  src={item.media.url}
                  alt={item.caption || `UGC image ${index + 1}`}
                  fill={config.layout !== 'masonry'}
                  width={config.layout === 'masonry' ? 400 : undefined}
                  height={config.layout === 'masonry' ? 400 : undefined}
                  className={cn(
                    'object-cover group-hover:scale-105 transition-transform duration-500',
                    config.layout === 'masonry' && 'w-full h-auto'
                  )}
                />
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-white">
                {config.showAuthor && item.author && (
                  <div className="flex items-center gap-2 mb-2">
                    {item.author.platform === 'instagram' && <Instagram className="w-4 h-4" />}
                    <span className="font-medium text-sm">@{item.author.handle || item.author.name}</span>
                  </div>
                )}
                {config.showLikes && item.likes !== undefined && (
                  <div className="flex items-center gap-1 text-sm">
                    <Heart className="w-4 h-4 fill-current" />
                    <span>{item.likes}</span>
                  </div>
                )}
                {config.showProductTags && item.taggedProducts && item.taggedProducts.length > 0 && (
                  <div className="flex items-center gap-1 text-sm mt-2">
                    <Tag className="w-4 h-4" />
                    <span>{item.taggedProducts.length} products</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Submit CTA */}
        {config.submitCta?.enabled && (
          <div className="text-center mt-8">
            <a
              href={config.submitCta.url}
              className="inline-flex items-center gap-2 px-6 py-3 bg-tenant-primary text-white rounded-full font-medium hover:bg-tenant-primary/90 transition-colors"
            >
              <Instagram className="w-5 h-5" />
              <TranslatedUIText text={config.submitCta.text} />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

export default UGCGalleryBlock;
