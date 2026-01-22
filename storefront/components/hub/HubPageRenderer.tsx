'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Clock,
  Calendar,
  Share2,
  Bookmark,
  ChevronRight,
  Play,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lightbulb,
  Quote,
  ExternalLink,
  Twitter,
  Linkedin,
  Facebook,
  Link as LinkIcon,
  User,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createSanitizedHtml } from '@/lib/utils/sanitize';
import type {
  HubPage,
  HubSection,
  Author,
  TOCItem,
  FAQItem,
  TextContent,
  ComparisonTableContent,
  ProductPicksContent,
  HowToStepsContent,
  VideoContent,
  ImageGalleryContent,
  ExpertTipContent,
  CalloutContent,
  ProsConsContent,
  ChecklistContent,
  CTAContent,
} from '@/types/hub-pages';

// =============================================================================
// HUB PAGE RENDERER
// =============================================================================

interface HubPageRendererProps {
  page: HubPage;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

export function HubPageRenderer({
  page,
  onBookmark,
  isBookmarked = false,
}: HubPageRendererProps) {
  const [activeSection, setActiveSection] = useState<string>('');

  return (
    <article className="hub-page">
      {/* Hero Section */}
      <HubHero page={page} />

      {/* Content Layout */}
      <div className="container-tenant py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Sidebar - TOC */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              <TableOfContents
                items={page.tableOfContents}
                activeSection={activeSection}
                onSectionClick={setActiveSection}
              />
              <AuthorCard author={page.author} compact />
              {page.reviewedBy && (
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">Reviewed by</p>
                  <p>{page.reviewedBy.name}</p>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-6 space-y-8">
            {/* Article Meta */}
            <ArticleMeta
              page={page}
              onBookmark={onBookmark}
              isBookmarked={isBookmarked}
            />

            {/* Sections */}
            {page.sections.map((section) => (
              <SectionRenderer
                key={section.id}
                section={section}
                onVisible={() => setActiveSection(section.id)}
              />
            ))}

            {/* FAQ Section */}
            {page.faq.length > 0 && (
              <FAQSection items={page.faq} />
            )}

            {/* Author Bio (full) */}
            <AuthorCard author={page.author} />
          </main>

          {/* Right Sidebar - Related */}
          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-6">
              {/* Related Products */}
              {page.relatedProducts.length > 0 && (
                <RelatedProductsCard products={page.relatedProducts} />
              )}

              {/* Related Guides */}
              {page.relatedGuides.length > 0 && (
                <RelatedGuidesCard guides={page.relatedGuides} />
              )}
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}

// =============================================================================
// HERO SECTION
// =============================================================================

function HubHero({ page }: { page: HubPage }) {
  return (
    <header className="relative bg-gradient-to-b from-muted/50 to-background">
      <div className="container-tenant py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Content */}
          <div className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/guides" className="hover:text-foreground">
                Guides
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link href={`/guides/${page.category}`} className="hover:text-foreground capitalize">
                {page.category}
              </Link>
            </nav>

            {/* Type Badge */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full capitalize">
              {page.type.replace('-', ' ')}
            </span>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              {page.title}
            </h1>

            {page.subtitle && (
              <p className="text-lg lg:text-xl text-muted-foreground">
                {page.subtitle}
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{page.readingTime} min read</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Updated {formatDate(page.updatedAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>By {page.author.name}</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {page.tags.slice(0, 5).map((tag) => (
                <Link
                  key={tag}
                  href={`/guides/tag/${tag}`}
                  className="px-3 py-1 bg-muted hover:bg-muted/80 rounded-full text-sm transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Featured Image/Video */}
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
            {page.heroVideo ? (
              <VideoPlayer video={page.heroVideo} />
            ) : (
              <Image
                src={page.featuredImage.url}
                alt={page.featuredImage.alt}
                fill
                className="object-cover"
                priority
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// =============================================================================
// TABLE OF CONTENTS
// =============================================================================

interface TableOfContentsProps {
  items: TOCItem[];
  activeSection: string;
  onSectionClick: (id: string) => void;
}

function TableOfContents({ items, activeSection, onSectionClick }: TableOfContentsProps) {
  return (
    <nav className="space-y-3">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
        Contents
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.anchor}`}
              onClick={() => onSectionClick(item.id)}
              className={cn(
                'block text-sm transition-colors',
                item.level > 1 && 'pl-4',
                activeSection === item.id
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {item.title}
            </a>
            {item.children && item.children.length > 0 && (
              <ul className="mt-1 space-y-1">
                {item.children.map((child) => (
                  <li key={child.id}>
                    <a
                      href={`#${child.anchor}`}
                      onClick={() => onSectionClick(child.id)}
                      className={cn(
                        'block text-sm pl-4 transition-colors',
                        activeSection === child.id
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {child.title}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

// =============================================================================
// ARTICLE META
// =============================================================================

interface ArticleMetaProps {
  page: HubPage;
  onBookmark?: () => void;
  isBookmarked: boolean;
}

function ArticleMeta({ page, onBookmark, isBookmarked }: ArticleMetaProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = async (platform: string) => {
    const text = `${page.title} - ${page.description}`;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
        break;
      case 'copy':
        await navigator.clipboard.writeText(shareUrl);
        break;
    }
    setShowShareMenu(false);
  };

  return (
    <div className="flex items-center justify-between py-4 border-y">
      <div className="flex items-center gap-4">
        <Image
          src={page.author.avatar}
          alt={page.author.name}
          width={48}
          height={48}
          className="rounded-full"
        />
        <div>
          <p className="font-medium">{page.author.name}</p>
          <p className="text-sm text-muted-foreground">{page.author.title}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShareMenu(!showShareMenu)}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          {showShareMenu && (
            <div className="absolute right-0 top-full mt-2 bg-background border rounded-lg shadow-lg p-2 z-50">
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted rounded"
              >
                <Twitter className="w-4 h-4" /> Twitter
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted rounded"
              >
                <Linkedin className="w-4 h-4" /> LinkedIn
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted rounded"
              >
                <Facebook className="w-4 h-4" /> Facebook
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted rounded"
              >
                <LinkIcon className="w-4 h-4" /> Copy Link
              </button>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBookmark}
          className={isBookmarked ? 'text-primary' : ''}
        >
          <Bookmark className={cn('w-4 h-4 mr-2', isBookmarked && 'fill-current')} />
          Save
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// SECTION RENDERER
// =============================================================================

interface SectionRendererProps {
  section: HubSection;
  onVisible: () => void;
}

function SectionRenderer({ section, onVisible }: SectionRendererProps) {
  return (
    <motion.section
      id={section.anchor}
      className="scroll-mt-24"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      onViewportEnter={onVisible}
    >
      {section.title && (
        <h2 className="text-2xl font-bold mb-6">{section.title}</h2>
      )}
      <ContentRenderer content={section.content} />
    </motion.section>
  );
}

// =============================================================================
// CONTENT RENDERERS
// =============================================================================

function ContentRenderer({ content }: { content: HubSection['content'] }) {
  switch (content.type) {
    case 'text':
      return <TextRenderer content={content as TextContent} />;
    case 'comparison-table':
      return <ComparisonTableRenderer content={content as ComparisonTableContent} />;
    case 'product-picks':
      return <ProductPicksRenderer content={content as ProductPicksContent} />;
    case 'how-to-steps':
      return <HowToStepsRenderer content={content as HowToStepsContent} />;
    case 'video':
      return <VideoRenderer content={content as VideoContent} />;
    case 'image-gallery':
      return <ImageGalleryRenderer content={content as ImageGalleryContent} />;
    case 'expert-tip':
      return <ExpertTipRenderer content={content as ExpertTipContent} />;
    case 'callout':
      return <CalloutRenderer content={content as CalloutContent} />;
    case 'pros-cons':
      return <ProsConsRenderer content={content as ProsConsContent} />;
    case 'checklist':
      return <ChecklistRenderer content={content as ChecklistContent} />;
    case 'cta':
      return <CTARenderer content={content as CTAContent} />;
    default:
      return null;
  }
}

function TextRenderer({ content }: { content: TextContent }) {
  return (
    <div
      className="prose prose-lg max-w-none"
      dangerouslySetInnerHTML={createSanitizedHtml(content.html)}
    />
  );
}

function ComparisonTableRenderer({ content }: { content: ComparisonTableContent }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-4 bg-muted font-semibold">Feature</th>
            {content.columns.map((col) => (
              <th key={col.productId} className="p-4 bg-muted text-center">
                <div className="space-y-2">
                  <Image
                    src={col.image}
                    alt={col.name}
                    width={80}
                    height={80}
                    className="mx-auto rounded"
                  />
                  <p className="font-semibold">{col.name}</p>
                  <p className="text-primary font-bold">${col.price}</p>
                  {col.badge && (
                    <span className="inline-block px-2 py-1 bg-primary text-primary-foreground text-xs rounded">
                      {col.badge}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {content.rows.map((row, i) => (
            <tr key={row.feature} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
              <td className="p-4 font-medium">{row.feature}</td>
              {row.values.map((val, j) => (
                <td
                  key={j}
                  className={cn(
                    'p-4 text-center',
                    row.highlight === j && 'bg-primary/10 font-semibold'
                  )}
                >
                  {typeof val === 'boolean' ? (
                    val ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  ) : (
                    val
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductPicksRenderer({ content }: { content: ProductPicksContent }) {
  return (
    <div className="space-y-4">
      {content.title && <h3 className="text-xl font-semibold">{content.title}</h3>}
      {content.description && (
        <p className="text-muted-foreground">{content.description}</p>
      )}
      <div className={cn(
        'grid gap-4',
        content.layout === 'grid' && 'grid-cols-1 sm:grid-cols-2',
        content.layout === 'list' && 'grid-cols-1'
      )}>
        {content.picks.map((pick) => (
          <div
            key={pick.productId}
            className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
          >
            {pick.rank && (
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                {pick.rank}
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium">{pick.reason}</p>
              {pick.badge && (
                <span className="inline-block mt-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                  {pick.badge}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowToStepsRenderer({ content }: { content: HowToStepsContent }) {
  return (
    <div className="space-y-6">
      {(content.estimatedTime || content.difficulty) && (
        <div className="flex gap-4 text-sm">
          {content.estimatedTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> {content.estimatedTime}
            </span>
          )}
          {content.difficulty && (
            <span className="flex items-center gap-1 capitalize">
              Difficulty: {content.difficulty}
            </span>
          )}
        </div>
      )}
      <ol className="space-y-8">
        {content.steps.map((step) => (
          <li key={step.number} className="flex gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
              {step.number}
            </div>
            <div className="flex-1 space-y-3">
              <h4 className="text-lg font-semibold">{step.title}</h4>
              <p className="text-muted-foreground">{step.description}</p>
              {step.image && (
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={step.image.url}
                    alt={step.image.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              {step.tip && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                  <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p>{step.tip}</p>
                </div>
              )}
              {step.warning && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p>{step.warning}</p>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function VideoRenderer({ content }: { content: VideoContent }) {
  return (
    <div className="space-y-4">
      <VideoPlayer video={content.video} />
      {content.caption && (
        <p className="text-sm text-muted-foreground text-center">{content.caption}</p>
      )}
      {content.timestamps && content.timestamps.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {content.timestamps.map((ts) => (
            <button
              key={ts.time}
              className="px-3 py-1 bg-muted hover:bg-muted/80 rounded text-sm"
            >
              {formatTime(ts.time)} - {ts.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ImageGalleryRenderer({ content }: { content: ImageGalleryContent }) {
  return (
    <div className="space-y-4">
      <div className={cn(
        'grid gap-4',
        content.layout === 'grid' && 'grid-cols-2 md:grid-cols-3',
        content.layout === 'masonry' && 'columns-2 md:columns-3'
      )}>
        {content.images.map((img, i) => (
          <div
            key={i}
            className={cn(
              'relative overflow-hidden rounded-lg',
              content.layout === 'masonry' ? 'break-inside-avoid mb-4' : 'aspect-square'
            )}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill={content.layout !== 'masonry'}
              width={content.layout === 'masonry' ? 400 : undefined}
              height={content.layout === 'masonry' ? 300 : undefined}
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {content.caption && (
        <p className="text-sm text-muted-foreground text-center">{content.caption}</p>
      )}
    </div>
  );
}

function ExpertTipRenderer({ content }: { content: ExpertTipContent }) {
  return (
    <div className="flex gap-4 p-6 bg-primary/5 border-l-4 border-primary rounded-r-lg">
      <Image
        src={content.expert.avatar}
        alt={content.expert.name}
        width={56}
        height={56}
        className="rounded-full flex-shrink-0"
      />
      <div>
        <p className="italic text-lg mb-3">"{content.tip}"</p>
        <p className="font-medium">{content.expert.name}</p>
        <p className="text-sm text-muted-foreground">{content.expert.title}</p>
      </div>
    </div>
  );
}

function CalloutRenderer({ content }: { content: CalloutContent }) {
  const icons = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle2,
    tip: Lightbulb,
    quote: Quote,
  };
  const colors = {
    info: 'bg-blue-50 dark:bg-blue-950 border-blue-500',
    warning: 'bg-amber-50 dark:bg-amber-950 border-amber-500',
    success: 'bg-green-50 dark:bg-green-950 border-green-500',
    tip: 'bg-purple-50 dark:bg-purple-950 border-purple-500',
    quote: 'bg-muted border-muted-foreground',
  };
  const Icon = icons[content.variant];

  return (
    <div className={cn('p-6 rounded-lg border-l-4', colors[content.variant])}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          {content.title && <p className="font-semibold mb-2">{content.title}</p>}
          <p>{content.text}</p>
          {content.attribution && (
            <p className="mt-2 text-sm text-muted-foreground">— {content.attribution}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProsConsRenderer({ content }: { content: ProsConsContent }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-6 bg-green-50 dark:bg-green-950 rounded-lg">
        <h4 className="font-semibold text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Pros
        </h4>
        <ul className="space-y-2">
          {content.pros.map((pro, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-1" />
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-6 bg-red-50 dark:bg-red-950 rounded-lg">
        <h4 className="font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Cons
        </h4>
        <ul className="space-y-2">
          {content.cons.map((con, i) => (
            <li key={i} className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-1" />
              <span>{con}</span>
            </li>
          ))}
        </ul>
      </div>
      {content.verdict && (
        <div className="md:col-span-2 p-4 bg-muted rounded-lg">
          <p className="font-medium">Verdict: {content.verdict}</p>
        </div>
      )}
    </div>
  );
}

function ChecklistRenderer({ content }: { content: ChecklistContent }) {
  return (
    <div className="space-y-4">
      {content.title && <h4 className="font-semibold">{content.title}</h4>}
      <ul className="space-y-2">
        {content.items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <input
              type="checkbox"
              defaultChecked={item.checked}
              className="mt-1 w-4 h-4 rounded border-2"
            />
            <span className={cn(item.important && 'font-medium')}>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CTARenderer({ content }: { content: CTAContent }) {
  if (content.variant === 'banner') {
    return (
      <div className="relative p-8 rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        {content.image && (
          <Image
            src={content.image}
            alt=""
            fill
            className="object-cover opacity-20"
          />
        )}
        <div className="relative z-10 text-center space-y-4">
          <h3 className="text-2xl font-bold">{content.title}</h3>
          {content.description && <p className="opacity-90">{content.description}</p>}
          <Button asChild variant="secondary" size="lg">
            <Link href={content.buttonUrl}>
              {content.buttonText}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border rounded-lg text-center space-y-4">
      <h3 className="text-xl font-bold">{content.title}</h3>
      {content.description && <p className="text-muted-foreground">{content.description}</p>}
      <Button asChild variant={content.variant === 'primary' ? 'default' : 'outline'}>
        <Link href={content.buttonUrl}>{content.buttonText}</Link>
      </Button>
    </div>
  );
}

// =============================================================================
// FAQ SECTION
// =============================================================================

function FAQSection({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={item.id} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex items-center justify-between w-full p-4 text-left font-medium hover:bg-muted/50"
            >
              {item.question}
              <ChevronRight
                className={cn(
                  'w-5 h-5 transition-transform',
                  openIndex === i && 'rotate-90'
                )}
              />
            </button>
            {openIndex === i && (
              <div className="p-4 pt-0 text-muted-foreground">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// =============================================================================
// AUTHOR CARD
// =============================================================================

function AuthorCard({ author, compact = false }: { author: Author; compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
        <Image
          src={author.avatar}
          alt={author.name}
          width={40}
          height={40}
          className="rounded-full"
        />
        <div>
          <p className="font-medium text-sm">{author.name}</p>
          <p className="text-xs text-muted-foreground">{author.title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-muted/30 rounded-2xl space-y-4">
      <div className="flex items-center gap-4">
        <Image
          src={author.avatar}
          alt={author.name}
          width={80}
          height={80}
          className="rounded-full"
        />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">{author.name}</h3>
            {author.verified && (
              <Award className="w-5 h-5 text-primary" />
            )}
          </div>
          <p className="text-muted-foreground">{author.title}</p>
        </div>
      </div>
      <p>{author.bio}</p>
      {author.credentials && author.credentials.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {author.credentials.map((cred) => (
            <span key={cred} className="px-2 py-1 bg-muted text-sm rounded">
              {cred}
            </span>
          ))}
        </div>
      )}
      {author.socialLinks && (
        <div className="flex gap-3">
          {author.socialLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              {link.platform === 'twitter' && <Twitter className="w-5 h-5" />}
              {link.platform === 'linkedin' && <Linkedin className="w-5 h-5" />}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// RELATED CONTENT CARDS
// =============================================================================

function RelatedProductsCard({ products }: { products: { productId: string }[] }) {
  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="font-semibold">Featured Products</h3>
      <div className="space-y-3">
        {products.slice(0, 4).map((p) => (
          <Link
            key={p.productId}
            href={`/products/${p.productId}`}
            className="flex items-center gap-3 p-2 rounded hover:bg-muted"
          >
            <div className="w-12 h-12 bg-muted rounded" />
            <span className="text-sm">Product {p.productId}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function RelatedGuidesCard({ guides }: { guides: { slug: string; title: string; thumbnail: string; readingTime: number }[] }) {
  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="font-semibold">Related Guides</h3>
      <div className="space-y-3">
        {guides.slice(0, 3).map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="block p-2 rounded hover:bg-muted"
          >
            <p className="text-sm font-medium line-clamp-2">{guide.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {guide.readingTime} min read
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// VIDEO PLAYER
// =============================================================================

function VideoPlayer({ video }: { video: { provider: string; embedUrl?: string; thumbnail: string; title: string } }) {
  const [playing, setPlaying] = useState(false);

  if (!playing) {
    return (
      <div
        className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group"
        onClick={() => setPlaying(true)}
      >
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-8 h-8 text-black ml-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden">
      <iframe
        src={video.embedUrl}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
}

// =============================================================================
// UTILITIES
// =============================================================================

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default HubPageRenderer;
