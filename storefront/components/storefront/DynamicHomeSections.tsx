'use client';

import { useMemo } from 'react';
import { useTenant } from '@/context/TenantContext';
import { FeaturedProducts } from './FeaturedProducts';
import { ProductCarousel } from './ProductCarousel';
import { CategoryShowcase } from './CategoryShowcase';
import { NewsletterSection } from './NewsletterSection';
import { BannerSection } from './BannerSection';
import { TestimonialsSection } from './TestimonialsSection';
import { CustomHtmlSection } from './CustomHtmlSection';
import type { Product, Category, StorefrontSection, HomepageLayout } from '@/types/storefront';

interface DynamicHomeSectionsProps {
  products?: Product[];
  categories?: Category[];
  isLoading?: boolean;
  layoutVariant?: HomepageLayout;
}

/**
 * Renders homepage sections dynamically based on homepageConfig.sections array.
 * Sections are sorted by position and only enabled sections are rendered.
 * Layout variant affects how sections are rendered (e.g., carousel vs grid for products).
 */
export function DynamicHomeSections({
  products = [],
  categories = [],
  isLoading = false,
  layoutVariant,
}: DynamicHomeSectionsProps) {
  const { settings } = useTenant();
  const homepageConfig = settings.homepageConfig;
  // Use prop layoutVariant or fall back to settings
  const layout = layoutVariant || settings.layoutConfig?.homepageLayout || 'hero-grid';

  // Get enabled sections sorted by position
  const enabledSections = useMemo(() => {
    const sections = homepageConfig?.sections || [];
    return sections
      .filter((section) => section.enabled)
      .sort((a, b) => a.position - b.position);
  }, [homepageConfig?.sections]);

  // If no sections configured, return null
  if (enabledSections.length === 0) {
    return null;
  }

  return (
    <>
      {enabledSections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          products={products}
          categories={categories}
          isLoading={isLoading}
          homepageConfig={homepageConfig}
          layoutVariant={layout}
        />
      ))}
    </>
  );
}

interface SectionRendererProps {
  section: StorefrontSection;
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  homepageConfig: any;
  layoutVariant: HomepageLayout;
}

function SectionRenderer({
  section,
  products,
  categories,
  isLoading,
  homepageConfig,
  layoutVariant,
}: SectionRendererProps) {
  const config = section.config || {};

  switch (section.type) {
    case 'featured_products':
      // Use carousel for 'carousel' layout, grid for others
      if (layoutVariant === 'carousel') {
        return (
          <ProductCarousel
            title={section.title || 'Featured Products'}
            subtitle={section.subtitle}
            products={products}
            showViewAll={(config.showViewAll as boolean) ?? true}
          />
        );
      }
      return (
        <FeaturedProducts
          title={section.title || 'Featured Products'}
          subtitle={section.subtitle}
          products={products}
          isLoading={isLoading}
          showViewAll={(config.showViewAll as boolean) ?? true}
        />
      );

    case 'categories':
      return (
        <CategoryShowcase
          title={section.title || 'Shop by Category'}
          subtitle={section.subtitle}
          categories={categories}
          showViewAll={(config.showViewAll as boolean) ?? true}
        />
      );

    case 'banner':
      return (
        <BannerSection
          title={section.title}
          subtitle={section.subtitle}
          imageUrl={config.imageUrl as string}
          ctaText={config.ctaText as string}
          ctaLink={config.ctaLink as string}
          backgroundColor={config.backgroundColor as string}
          textColor={config.textColor as string}
          alignment={config.alignment as 'left' | 'center' | 'right'}
          fullWidth={(config.fullWidth as boolean) ?? false}
        />
      );

    case 'newsletter':
      return (
        <NewsletterSection
          title={section.title || homepageConfig?.newsletterTitle}
          subtitle={section.subtitle || homepageConfig?.newsletterSubtitle}
        />
      );

    case 'testimonials':
      return (
        <TestimonialsSection
          title={section.title || 'What Our Customers Say'}
          subtitle={section.subtitle}
          testimonials={
            (config.testimonials as any[]) || homepageConfig?.testimonials
          }
        />
      );

    case 'custom_html':
      return (
        <CustomHtmlSection
          title={section.title}
          htmlContent={config.htmlContent as string}
          fullWidth={(config.fullWidth as boolean) ?? false}
        />
      );

    default:
      // Unknown section type - skip silently in production
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Unknown section type: ${section.type}`);
      }
      return null;
  }
}

export default DynamicHomeSections;
