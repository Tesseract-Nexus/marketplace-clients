'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import { cn } from '@/lib/utils';
import type { TestimonialsBlockConfig, Testimonial } from '@/types/blocks';
import type { BlockComponentProps } from '../BlockRenderer';

export function TestimonialsBlock({ config }: BlockComponentProps<TestimonialsBlockConfig>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const testimonials = config.source.testimonials || [];
  const gridCols = config.columns || { mobile: 1, tablet: 2, desktop: 3 };
  const isCarousel = config.layout === 'carousel';

  const checkScroll = () => {
    if (!scrollRef.current || !isCarousel) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    if (isCarousel) checkScroll();
  }, [testimonials, isCarousel]);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
  };

  if (testimonials.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-muted/30">
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

        {/* Testimonials */}
        {isCarousel ? (
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
              {testimonials.map((testimonial, index) => (
                <TestimonialCard
                  key={testimonial.id}
                  testimonial={testimonial}
                  index={index}
                  config={config}
                  className="flex-none w-80 sm:w-96 snap-start"
                />
              ))}
            </div>
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
              'grid gap-6',
              `grid-cols-${gridCols.mobile}`,
              `sm:grid-cols-${gridCols.tablet}`,
              `lg:grid-cols-${gridCols.desktop}`
            )}
          >
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.id}
                testimonial={testimonial}
                index={index}
                config={config}
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  index: number;
  config: TestimonialsBlockConfig;
  className?: string;
}

function TestimonialCard({ testimonial, index, config, className }: TestimonialCardProps) {
  const isQuoteStyle = config.cardStyle === 'quote';

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={className}
    >
      <div className={cn(
        'bg-background rounded-xl p-6 h-full flex flex-col',
        isQuoteStyle ? 'border-l-4 border-tenant-primary' : 'border'
      )}>
        {/* Quote icon for quote style */}
        {isQuoteStyle && (
          <Quote className="w-8 h-8 text-tenant-primary/30 mb-4" />
        )}

        {/* Rating */}
        {config.showRating && testimonial.rating && (
          <div className="flex gap-0.5 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'w-4 h-4',
                  i < testimonial.rating!
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-200'
                )}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <p className="text-foreground flex-1 mb-4">
          "{testimonial.content}"
        </p>

        {/* Author */}
        <div className="flex items-center gap-3 pt-4 border-t">
          {config.showAvatar && testimonial.author.avatar && (
            <Image
              src={testimonial.author.avatar}
              alt={testimonial.author.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{testimonial.author.name}</span>
              {config.showVerifiedBadge && testimonial.verified && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
            {testimonial.author.title && (
              <span className="text-xs text-muted-foreground">
                {testimonial.author.title}
                {testimonial.author.company && ` at ${testimonial.author.company}`}
              </span>
            )}
          </div>
          {config.showDate && testimonial.date && (
            <span className="text-xs text-muted-foreground">
              {new Date(testimonial.date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default TestimonialsBlock;
