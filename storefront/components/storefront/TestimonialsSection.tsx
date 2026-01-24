'use client';

import Image from 'next/image';
import { Star, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTenant } from '@/context/TenantContext';
import { TranslatedUIText } from '@/components/translation/TranslatedText';
import type { StorefrontTestimonial } from '@/types/storefront';

interface TestimonialsSectionProps {
  title?: string;
  subtitle?: string;
  testimonials?: StorefrontTestimonial[];
}

export function TestimonialsSection({
  title = 'What Our Customers Say',
  subtitle,
  testimonials: propTestimonials,
}: TestimonialsSectionProps) {
  const { settings } = useTenant();

  // Use prop testimonials or fall back to settings testimonials
  const testimonials = propTestimonials || settings.homepageConfig?.testimonials || [];

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-muted/30">
      <div className="container-tenant">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
            <TranslatedUIText text={title} />
          </h2>
          {subtitle && (
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              <TranslatedUIText text={subtitle} />
            </p>
          )}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }: { testimonial: StorefrontTestimonial }) {
  return (
    <div className="relative bg-background rounded-xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
      {/* Quote icon */}
      <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/10" />

      {/* Rating */}
      {testimonial.rating > 0 && (
        <div className="flex gap-0.5 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={cn(
                'h-4 w-4',
                i < testimonial.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-200'
              )}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <blockquote className="text-foreground mb-6 line-clamp-4">
        <TranslatedUIText text={testimonial.content} />
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-3">
        {testimonial.avatarUrl ? (
          <Image
            src={testimonial.avatarUrl}
            alt={testimonial.name}
            width={44}
            height={44}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-semibold text-primary">
              {testimonial.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="font-medium text-foreground">{testimonial.name}</p>
          {testimonial.role && (
            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
          )}
        </div>
      </div>
    </div>
  );
}
