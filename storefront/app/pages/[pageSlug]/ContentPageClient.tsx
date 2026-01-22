'use client';

import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ContentPage } from '@/types/storefront';
import { FileText, Scale, HelpCircle, Building2, Mail, Calendar, ArrowLeft, Clock } from 'lucide-react';
import { createSanitizedHtml } from '@/lib/utils/sanitize';
import { ContactPageLayout } from './ContactPageLayout';
import { AboutPageLayout } from './AboutPageLayout';
import { FAQPageLayout } from './FAQPageLayout';

interface ContentPageClientProps {
  page: ContentPage;
}

// Get icon based on page type or slug
function getPageIcon(page: ContentPage) {
  const slug = page.slug.toLowerCase();
  if (slug.includes('privacy') || slug.includes('terms') || slug.includes('policy')) {
    return Scale;
  }
  if (slug.includes('faq') || slug.includes('help')) {
    return HelpCircle;
  }
  if (slug.includes('about') || slug.includes('company')) {
    return Building2;
  }
  if (slug.includes('contact')) {
    return Mail;
  }
  if (page.type === 'POLICY') {
    return Scale;
  }
  if (page.type === 'FAQ') {
    return HelpCircle;
  }
  return FileText;
}

// Format date safely
function formatDate(dateString: string | undefined): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Calculate reading time
function calculateReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, ''); // Strip HTML tags
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200)); // 200 words per minute
}

// Check if page should use a specialized layout
function getPageLayout(page: ContentPage): 'contact' | 'about' | 'faq' | 'default' {
  const slug = page.slug.toLowerCase();
  if (slug.includes('contact')) {
    return 'contact';
  }
  if (slug.includes('about') || slug.includes('company') || slug.includes('story')) {
    return 'about';
  }
  if (slug.includes('faq') || slug.includes('help') || page.type === 'FAQ') {
    return 'faq';
  }
  return 'default';
}

export function ContentPageClient({ page }: ContentPageClientProps) {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: page.title },
  ];

  const Icon = getPageIcon(page);
  const formattedDate = formatDate(page.updatedAt);
  const readingTime = calculateReadingTime(page.content);
  const isPolicyPage = page.type === 'POLICY' || page.slug.includes('policy') || page.slug.includes('terms') || page.slug.includes('privacy');
  const pageLayout = getPageLayout(page);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      {/* Hero Section - Clean Editorial Style */}
      <header className="relative bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-4xl mx-auto px-6 py-8 md:py-12 lg:py-16">
          {/* Breadcrumb */}
          <Breadcrumb items={breadcrumbItems} />

          {/* Page Header */}
          <div className="mt-8 md:mt-12">
            {/* Icon Badge */}
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 mb-6">
              <Icon className="w-6 h-6 text-tenant-primary" />
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-50" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
              {page.title}
            </h1>

            {/* Excerpt/Description */}
            {page.excerpt && (
              <p className="mt-6 text-lg md:text-xl text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
                {page.excerpt}
              </p>
            )}

            {/* Meta Info - Only show for default layout */}
            {pageLayout === 'default' && (
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-stone-500 dark:text-stone-500">
                {formattedDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Updated {formattedDate}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {readingTime} min read
                </span>
                {page.type && page.type !== 'CUSTOM' && page.type !== 'STATIC' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-tenant-primary/10 text-tenant-primary text-xs font-medium">
                    {page.type}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Use specialized layout based on page type */}
      {pageLayout === 'contact' ? (
        <ContactPageLayout page={page} />
      ) : pageLayout === 'about' ? (
        <AboutPageLayout page={page} />
      ) : pageLayout === 'faq' ? (
        <FAQPageLayout page={page} />
      ) : (
        <main className="max-w-4xl mx-auto px-6 py-12 md:py-16 lg:py-20">
          {/* Content Card for Policy Pages */}
          {isPolicyPage ? (
            <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 shadow-sm p-8 md:p-12">
              <article
                className="prose-editorial"
                dangerouslySetInnerHTML={createSanitizedHtml(page.content)}
              />
            </div>
          ) : (
            <article
              className="prose-editorial"
              dangerouslySetInnerHTML={createSanitizedHtml(page.content)}
            />
          )}
        </main>
      )}

      {/* Footer Section */}
      <footer className="max-w-4xl mx-auto px-6 pb-16">
        <div className="pt-8 border-t border-stone-200 dark:border-stone-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Back Link */}
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-tenant-primary hover:opacity-80 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </a>

            {/* Last Updated */}
            {formattedDate && (
              <p className="text-sm text-stone-500 dark:text-stone-500">
                Last updated: {formattedDate}
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
