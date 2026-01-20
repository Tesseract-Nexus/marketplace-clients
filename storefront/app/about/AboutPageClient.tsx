'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, Target, Award, Heart, Sparkles, ArrowRight, Building2, CheckCircle2, Quote, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { useTenant, useNavPath } from '@/context/TenantContext';
import { ContentPage } from '@/types/storefront';

interface AboutPageClientProps {
  page: ContentPage | null;
  tenantName: string;
}

// Default values for fallback
const defaultValues = [
  {
    icon: Heart,
    title: 'Customer First',
    description: 'We put our customers at the heart of everything we do, ensuring exceptional experiences.',
  },
  {
    icon: Award,
    title: 'Quality Assurance',
    description: 'Every product meets our rigorous quality standards before reaching your hands.',
  },
  {
    icon: Target,
    title: 'Innovation',
    description: 'We continuously evolve to bring you the latest trends and cutting-edge products.',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Building lasting relationships with our customers and supporting local communities.',
  },
];

const defaultStats = [
  { value: '10K+', label: 'Happy Customers' },
  { value: '500+', label: 'Products' },
  { value: '50+', label: 'Brands' },
  { value: '99%', label: 'Satisfaction Rate' },
];

// Parse content sections from HTML
function parseContentSections(content: string) {
  const sections: { title: string; content: string }[] = [];
  const parts = content.split(/<h[23][^>]*>/i);

  parts.forEach((part, index) => {
    if (index === 0 && part.trim()) {
      sections.push({ title: '', content: part });
    } else if (part.trim()) {
      const titleMatch = part.match(/^([^<]+)<\/h[23]>/i);
      if (titleMatch) {
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

function getValueIcon(text: string) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('quality')) return Sparkles;
  if (lowerText.includes('customer')) return Heart;
  if (lowerText.includes('shipping') || lowerText.includes('fast')) return Target;
  if (lowerText.includes('return')) return CheckCircle2;
  return CheckCircle2;
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
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function AboutPageClient({ page, tenantName }: AboutPageClientProps) {
  const { tenant } = useTenant();
  const getNavPath = useNavPath();
  const displayName = tenant?.name || tenantName;

  // If we have page content from database, render dynamic content
  if (page && page.content) {
    const sections = parseContentSections(page.content);
    const allListItems = extractListItems(page.content);
    const formattedDate = formatDate(page.updatedAt);
    const readingTime = calculateReadingTime(page.content);

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
    const introSection = sections.find(s => !s.title);
    const introText = introSection?.content.replace(/<[^>]+>/g, '').trim() || page.excerpt || '';

    const breadcrumbItems = [
      { label: 'Home', href: '/' },
      { label: page.title || 'About Us' },
    ];

    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
        {/* Hero Section */}
        <header className="relative bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800">
          <div className="max-w-4xl mx-auto px-6 py-8 md:py-12 lg:py-16">
            <Breadcrumb items={breadcrumbItems} />

            <div className="mt-8 md:mt-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 mb-6">
                <Building2 className="w-6 h-6 text-tenant-primary" />
              </div>

              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-50" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
                {page.title || 'About Us'}
              </h1>

              {page.excerpt && (
                <p className="mt-6 text-lg md:text-xl text-stone-600 dark:text-stone-400 leading-relaxed max-w-2xl">
                  {page.excerpt}
                </p>
              )}

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
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="py-12 md:py-16 lg:py-20">
          {/* Intro Section */}
          {introText && (
            <section className="max-w-4xl mx-auto px-6 mb-16 md:mb-20">
              <p className="text-xl md:text-2xl text-stone-600 dark:text-stone-400 leading-relaxed text-center">
                {introText}
              </p>
            </section>
          )}

          {/* Story & Mission Grid */}
          {(storySection || missionSection) && (
            <section className="max-w-6xl mx-auto px-6 mb-16 md:mb-20">
              <div className="grid md:grid-cols-2 gap-8">
                {storySection && (
                  <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-tenant-primary" />
                      </div>
                      <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-50" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
                        {storySection.title}
                      </h2>
                    </div>
                    <div
                      className="text-stone-600 dark:text-stone-400 leading-relaxed prose-editorial-sm"
                      dangerouslySetInnerHTML={{ __html: storySection.content }}
                    />
                  </div>
                )}

                {missionSection && (
                  <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 md:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-tenant-primary/10 flex items-center justify-center">
                        <Target className="w-5 h-5 text-tenant-primary" />
                      </div>
                      <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-50" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
                        {missionSection.title}
                      </h2>
                    </div>
                    <div
                      className="text-stone-600 dark:text-stone-400 leading-relaxed prose-editorial-sm"
                      dangerouslySetInnerHTML={{ __html: missionSection.content }}
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Values Section */}
          {(valuesSection || allListItems.length > 0) && (
            <section className="bg-stone-100 dark:bg-stone-900/50 py-16 md:py-20 mb-16 md:mb-20">
              <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-10">
                  <h2 className="text-2xl md:text-3xl font-semibold text-stone-900 dark:text-stone-50 mb-3" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
                    {valuesSection?.title || 'What Sets Us Apart'}
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {allListItems.slice(0, 8).map((item, index) => {
                    const colonIndex = item.indexOf(':');
                    const label = colonIndex > 0 ? item.slice(0, colonIndex).trim() : item;
                    const description = colonIndex > 0 ? item.slice(colonIndex + 1).trim() : '';
                    const Icon = getValueIcon(label);

                    return (
                      <div
                        key={index}
                        className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6 text-center hover:border-tenant-primary/50 hover:shadow-md transition-all group"
                      >
                        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-tenant-primary/10 flex items-center justify-center group-hover:bg-tenant-primary/20 transition-colors">
                          <Icon className="w-6 h-6 text-tenant-primary" />
                        </div>
                        <h3 className="font-semibold text-stone-900 dark:text-stone-100 mb-2">
                          {label}
                        </h3>
                        {description && (
                          <p className="text-sm text-stone-600 dark:text-stone-400">
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

          {/* Community Section */}
          {communitySection && (
            <section className="max-w-4xl mx-auto px-6 mb-16 md:mb-20">
              <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-8 md:p-10 text-center shadow-sm">
                <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-tenant-primary/10 flex items-center justify-center">
                  <Heart className="w-7 h-7 text-tenant-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-50 mb-3" style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}>
                  {communitySection.title}
                </h2>
                <div
                  className="text-stone-600 dark:text-stone-400 leading-relaxed mb-6 max-w-xl mx-auto"
                  dangerouslySetInnerHTML={{ __html: communitySection.content }}
                />
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href={getNavPath('/products')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-tenant-primary text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Shop Now
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href={getNavPath('/contact')}
                    className="inline-flex items-center gap-2 px-6 py-3 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-medium rounded-lg hover:border-tenant-primary hover:text-tenant-primary transition-colors"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Stats Section */}
          <section className="max-w-4xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {defaultStats.map((stat, index) => (
                <div key={index} className="text-center p-6 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                  <div className="text-2xl md:text-3xl font-bold text-tenant-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-stone-600 dark:text-stone-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  // Fallback: Render default static content if no database content
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--tenant-primary)]/10 via-background to-[var(--tenant-secondary)]/10" />
        <div
          className="absolute top-20 right-20 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--tenant-primary)' }}
        />
        <div
          className="absolute bottom-20 left-20 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--tenant-secondary)' }}
        />

        <div className="container-tenant relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tenant-primary/10 text-tenant-primary mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Our Story</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              About{' '}
              <span className="gradient-text">{displayName}</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              We are passionate about bringing you the best products with exceptional service.
              Our journey started with a simple mission: to make quality accessible to everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y bg-muted/30">
        <div className="container-tenant">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {defaultStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container-tenant">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Our Mission
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                We believe everyone deserves access to high-quality products at fair prices.
                Our team works tirelessly to curate the best selection, ensuring every item
                meets our strict quality standards.
              </p>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                From sourcing to delivery, we maintain complete transparency and put
                sustainability at the forefront of our operations. We are not just a store;
                we are a community of like-minded individuals who care about quality,
                value, and the environment.
              </p>
              <Button asChild className="btn-tenant-primary">
                <Link href={getNavPath('/products')}>
                  Explore Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--tenant-primary)]/20 to-[var(--tenant-secondary)]/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-tenant-primary/20 flex items-center justify-center">
                    <Target className="h-12 w-12 text-tenant-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Quality First</h3>
                  <p className="text-muted-foreground">
                    Every product is carefully selected and quality-checked
                  </p>
                </div>
              </div>
              <div
                className="absolute -bottom-4 -right-4 w-32 h-32 rounded-2xl opacity-50"
                style={{ background: 'var(--tenant-gradient)' }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="container-tenant">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              These core values guide everything we do and shape how we serve our customers
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {defaultValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 border hover:shadow-md transition-shadow"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--tenant-primary)', opacity: 0.1 }}
                >
                  <value.icon className="h-7 w-7 text-tenant-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container-tenant">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden p-12 md:p-16 text-center"
            style={{ background: 'var(--tenant-gradient)' }}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Start Shopping?
              </h2>
              <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of happy customers and discover why they love shopping with us
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="secondary">
                  <Link href={getNavPath('/products')}>
                    Shop Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Link href={getNavPath('/contact')}>Contact Us</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
