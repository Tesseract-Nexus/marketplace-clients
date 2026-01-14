'use client';

import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ContentPage } from '@/types/storefront';
import { FileText, Scale, HelpCircle, Info, Building2, Mail } from 'lucide-react';

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

export function ContentPageClient({ page }: ContentPageClientProps) {
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: page.title },
  ];

  const Icon = getPageIcon(page);
  const formattedDate = formatDate(page.updatedAt);
  const isPolicyPage = page.type === 'POLICY' || page.slug.includes('policy') || page.slug.includes('terms') || page.slug.includes('privacy');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-tenant-primary/5 via-tenant-secondary/5 to-background border-b">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container-tenant relative py-8 md:py-12">
          <Breadcrumb items={breadcrumbItems} />

          <div className="mt-8 max-w-4xl">
            <div className="flex items-start gap-4">
              <div className="hidden md:flex shrink-0 w-14 h-14 rounded-2xl bg-tenant-primary/10 items-center justify-center">
                <Icon className="w-7 h-7 text-tenant-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  {page.type && page.type !== 'CUSTOM' && page.type !== 'STATIC' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-tenant-primary/10 text-tenant-primary text-xs font-medium">
                      {page.type}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                  {page.title}
                </h1>
                {page.excerpt && (
                  <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">
                    {page.excerpt}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="container-tenant py-10 md:py-14">
        <div className="max-w-4xl mx-auto">
          {/* Content Card */}
          <div className={`rounded-2xl ${isPolicyPage ? 'bg-card border shadow-sm p-8 md:p-10' : ''}`}>
            <article
              className="prose prose-lg max-w-none
                prose-headings:font-bold prose-headings:text-foreground prose-headings:tracking-tight
                prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/50
                prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-tenant-primary
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-a:text-tenant-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground prose-strong:font-semibold
                prose-ul:my-4 prose-ul:space-y-1
                prose-li:text-muted-foreground prose-li:marker:text-tenant-primary
                prose-img:rounded-xl prose-img:shadow-lg
                dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>

          {/* Page Footer */}
          {formattedDate && (
            <div className="mt-10 pt-6 border-t border-border/40">
              <p className="text-sm text-muted-foreground">
                Last updated: {formattedDate}
              </p>
            </div>
          )}

          {/* Back to Home Link */}
          <div className="mt-8">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-tenant-primary hover:underline"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
