'use client';

import Link from 'next/link';
import { ContentPage } from '@/types/storefront';
import { Target, Heart, Sparkles, Users, CheckCircle2, ArrowRight, Quote } from 'lucide-react';
import { createSanitizedHtml } from '@/lib/utils/sanitize';

interface AboutPageLayoutProps {
  page: ContentPage;
}

// Parse content sections from HTML
function parseContentSections(content: string) {
  const sections: { title: string; content: string }[] = [];

  // Split by h2 or h3 tags
  const parts = content.split(/<h[23][^>]*>/i);

  parts.forEach((part, index) => {
    if (index === 0 && part.trim()) {
      // Intro content before first heading
      sections.push({ title: '', content: part });
    } else if (part.trim()) {
      // Extract title from closing tag
      const titleMatch = part.match(/^([^<]+)<\/h[23]>/i);
      if (titleMatch?.[1]) {
        const title = titleMatch[1].trim();
        const restContent = part.replace(/^[^<]+<\/h[23]>/i, '').trim();
        sections.push({ title, content: restContent });
      }
    }
  });

  return sections;
}

// Extract list items from content
function extractListItems(content: string): string[] {
  const items: string[] = [];
  const listMatch = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
  if (listMatch) {
    listMatch.forEach(item => {
      const text = item.replace(/<[^>]+>/g, '').trim();
      if (text) items.push(text);
    });
  }
  return items;
}

// Value card icons mapping
const valueIcons: Record<string, typeof Target> = {
  quality: Sparkles,
  customer: Heart,
  shipping: Target,
  returns: CheckCircle2,
  default: CheckCircle2,
};

function getValueIcon(text: string) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('quality')) return Sparkles;
  if (lowerText.includes('customer')) return Heart;
  if (lowerText.includes('shipping') || lowerText.includes('fast')) return Target;
  if (lowerText.includes('return')) return CheckCircle2;
  return CheckCircle2;
}

export function AboutPageLayout({ page }: AboutPageLayoutProps) {
  const sections = parseContentSections(page.content);
  const allListItems = extractListItems(page.content);

  // Find specific sections
  const storySection = sections.find(s => s.title.toLowerCase().includes('story'));
  const missionSection = sections.find(s => s.title.toLowerCase().includes('mission'));
  const valuesSection = sections.find(s =>
    s.title.toLowerCase().includes('value') ||
    s.title.toLowerCase().includes('apart') ||
    s.title.toLowerCase().includes('why')
  );
  const communitySection = sections.find(s =>
    s.title.toLowerCase().includes('community') ||
    s.title.toLowerCase().includes('join')
  );

  // Get intro text (first section without title or first paragraph)
  const introSection = sections.find(s => !s.title);
  const introText = introSection?.content.replace(/<[^>]+>/g, '').trim() || page.excerpt || '';

  return (
    <div className="py-12 md:py-16 lg:py-20">
      {/* Intro Section */}
      {introText && (
        <section className="container-tenant mb-16 md:mb-20">
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed text-center max-w-4xl mx-auto">
            {introText}
          </p>
        </section>
      )}

      {/* Story & Mission Grid */}
      {(storySection || missionSection) && (
        <section className="container-tenant mb-16 md:mb-20">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Our Story */}
            {storySection && (
              <div className="bg-background rounded-xl border border-[var(--border-default)] p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-tenant-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)] font-heading">
                    {storySection.title}
                  </h2>
                </div>
                <div
                  className="text-muted-foreground leading-relaxed prose-editorial-sm"
                  dangerouslySetInnerHTML={createSanitizedHtml(storySection.content)}
                />
              </div>
            )}

            {/* Our Mission */}
            {missionSection && (
              <div className="bg-background rounded-xl border border-[var(--border-default)] p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-tenant-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)] font-heading">
                    {missionSection.title}
                  </h2>
                </div>
                <div
                  className="text-muted-foreground leading-relaxed prose-editorial-sm"
                  dangerouslySetInnerHTML={createSanitizedHtml(missionSection.content)}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Values Section */}
      {(valuesSection || allListItems.length > 0) && (
        <section className="bg-[var(--surface-muted)] py-16 md:py-20 mb-16 md:mb-20">
          <div className="container-tenant">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)] mb-3 font-heading">
                {valuesSection?.title || 'What Sets Us Apart'}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                We&apos;re committed to delivering excellence in everything we do.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {allListItems.slice(0, 8).map((item, index) => {
                // Split "Label: Description" format
                const colonIndex = item.indexOf(':');
                const label = colonIndex > 0 ? item.slice(0, colonIndex).trim() : item;
                const description = colonIndex > 0 ? item.slice(colonIndex + 1).trim() : '';
                const Icon = getValueIcon(label);

                return (
                  <div
                    key={index}
                    className="bg-background rounded-xl border border-[var(--border-default)] p-6 text-center hover:border-tenant-primary/50 hover:shadow-md transition-all group"
                  >
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-tenant-primary/10 flex items-center justify-center group-hover:bg-tenant-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-tenant-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {label}
                    </h3>
                    {description && (
                      <p className="text-sm text-muted-foreground">
                        {description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Quote/Testimonial Section */}
      <section className="container-tenant mb-16 md:mb-20">
        <div className="relative bg-tenant-primary/5 rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
          <Quote className="absolute top-6 left-6 w-8 h-8 text-tenant-primary/30" />
          <blockquote className="text-center">
            <p className="text-xl md:text-2xl text-[var(--text-secondary)] italic leading-relaxed mb-4 font-heading">
              &ldquo;Our goal is to make every customer feel valued and every purchase feel special.&rdquo;
            </p>
            <footer className="text-muted-foreground">
              — The Team
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Join Community Section */}
      {communitySection && (
        <section className="container-tenant mb-16 md:mb-20">
          <div className="bg-background rounded-xl border border-[var(--border-default)] p-8 md:p-10 text-center shadow-sm max-w-4xl mx-auto">
            <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-tenant-primary/10 flex items-center justify-center">
              <Heart className="w-7 h-7 text-tenant-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3 font-heading">
              {communitySection.title}
            </h2>
            <div
              className="text-muted-foreground leading-relaxed mb-6 max-w-xl mx-auto"
              dangerouslySetInnerHTML={createSanitizedHtml(communitySection.content)}
            />
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-tenant-primary text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pages/contact"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--border-default)] text-foreground font-medium rounded-lg hover:border-tenant-primary hover:text-tenant-primary transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section - Now dynamically hidden if no meaningful stats */}
      <section className="container-tenant">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { value: '10K+', label: 'Happy Customers' },
            { value: '5K+', label: 'Products' },
            { value: '99%', label: 'Satisfaction' },
            { value: '24/7', label: 'Support' },
          ].map((stat, index) => (
            <div key={index} className="text-center p-6 rounded-xl bg-background border border-[var(--border-default)]">
              <div className="text-2xl md:text-3xl font-bold text-tenant-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
