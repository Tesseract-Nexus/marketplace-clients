'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TranslatedUIText } from '@/components/translation/TranslatedText';

interface BannerSectionProps {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  backgroundColor?: string;
  textColor?: string;
  alignment?: 'left' | 'center' | 'right';
  fullWidth?: boolean;
}

export function BannerSection({
  title,
  subtitle,
  imageUrl,
  ctaText,
  ctaLink,
  backgroundColor = 'var(--color-primary)',
  textColor = '#ffffff',
  alignment = 'center',
  fullWidth = false,
}: BannerSectionProps) {
  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }[alignment];

  return (
    <section
      className={cn(
        'relative py-12 md:py-16 lg:py-20 overflow-hidden',
        !fullWidth && 'container-tenant my-8'
      )}
      style={{
        backgroundColor: imageUrl ? undefined : backgroundColor,
        color: textColor,
      }}
    >
      {/* Background Image */}
      {imageUrl && (
        <>
          <Image
            src={imageUrl}
            alt={title || 'Banner'}
            fill
            className="object-cover"
            priority
          />
          <div
            className="absolute inset-0 bg-black/40"
            style={{ backgroundColor: `${backgroundColor}80` }}
          />
        </>
      )}

      {/* Content */}
      <div
        className={cn(
          'relative z-10 flex flex-col gap-4',
          fullWidth ? 'container-tenant' : '',
          alignmentClasses
        )}
      >
        {title && (
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold max-w-2xl">
            <TranslatedUIText text={title} />
          </h2>
        )}
        {subtitle && (
          <p className="text-base md:text-lg opacity-90 max-w-xl">
            <TranslatedUIText text={subtitle} />
          </p>
        )}
        {ctaText && ctaLink && (
          <Button
            size="lg"
            variant="tenant-secondary"
            asChild
            className="mt-2 group"
          >
            <Link href={ctaLink}>
              <TranslatedUIText text={ctaText} />
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}
