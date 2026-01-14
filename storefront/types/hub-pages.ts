/**
 * Hub Pages Types
 *
 * Types for authority content hub pages (buying guides, how-to guides, etc.)
 * with structured interlinking, expert bios, and rich media.
 */

// =============================================================================
// CORE HUB PAGE TYPES
// =============================================================================

export interface HubPage {
  id: string;
  slug: string;
  type: HubPageType;
  title: string;
  subtitle?: string;
  description: string;
  featuredImage: MediaAsset;
  heroVideo?: VideoAsset;
  author: Author;
  reviewedBy?: Author;
  publishedAt: string;
  updatedAt: string;
  readingTime: number; // minutes
  wordCount: number;
  category: string;
  tags: string[];
  sections: HubSection[];
  relatedProducts: RelatedProduct[];
  relatedGuides: RelatedGuide[];
  faq: FAQItem[];
  tableOfContents: TOCItem[];
  seo: HubPageSEO;
  schema: HubPageSchema;
  metrics?: HubPageMetrics;
}

export type HubPageType =
  | 'buying-guide'
  | 'how-to-guide'
  | 'comparison'
  | 'roundup'
  | 'explainer'
  | 'listicle'
  | 'review';

// =============================================================================
// AUTHOR / EXPERT TYPES
// =============================================================================

export interface Author {
  id: string;
  name: string;
  slug: string;
  title: string;
  bio: string;
  avatar: string;
  credentials?: string[];
  expertise?: string[];
  socialLinks?: SocialLink[];
  articles?: number;
  verified?: boolean;
}

export interface SocialLink {
  platform: 'twitter' | 'linkedin' | 'instagram' | 'youtube' | 'website';
  url: string;
  handle?: string;
}

// =============================================================================
// CONTENT SECTIONS
// =============================================================================

export interface HubSection {
  id: string;
  type: HubSectionType;
  title?: string;
  anchor?: string;
  content: HubSectionContent;
}

export type HubSectionType =
  | 'intro'
  | 'text'
  | 'comparison-table'
  | 'product-picks'
  | 'how-to-steps'
  | 'video'
  | 'image-gallery'
  | 'expert-tip'
  | 'callout'
  | 'pros-cons'
  | 'checklist'
  | 'embed'
  | 'cta';

export type HubSectionContent =
  | TextContent
  | ComparisonTableContent
  | ProductPicksContent
  | HowToStepsContent
  | VideoContent
  | ImageGalleryContent
  | ExpertTipContent
  | CalloutContent
  | ProsConsContent
  | ChecklistContent
  | EmbedContent
  | CTAContent;

export interface TextContent {
  type: 'text';
  html: string;
  markdown?: string;
}

export interface ComparisonTableContent {
  type: 'comparison-table';
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  highlightBest?: boolean;
  features: string[];
}

export interface ComparisonColumn {
  productId: string;
  name: string;
  image: string;
  price: number;
  rating?: number;
  badge?: string;
  url: string;
}

export interface ComparisonRow {
  feature: string;
  values: (string | boolean | number)[];
  highlight?: number; // Index of best value
}

export interface ProductPicksContent {
  type: 'product-picks';
  title?: string;
  description?: string;
  picks: ProductPick[];
  layout: 'grid' | 'list' | 'carousel';
}

export interface ProductPick {
  productId: string;
  rank?: number;
  badge?: string;
  reason: string;
  prosSnippet?: string[];
  consSnippet?: string[];
}

export interface HowToStepsContent {
  type: 'how-to-steps';
  steps: HowToStep[];
  estimatedTime?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  supplies?: string[];
  tools?: string[];
}

export interface HowToStep {
  number: number;
  title: string;
  description: string;
  image?: MediaAsset;
  video?: VideoAsset;
  tip?: string;
  warning?: string;
}

export interface VideoContent {
  type: 'video';
  video: VideoAsset;
  caption?: string;
  timestamps?: VideoTimestamp[];
}

export interface VideoTimestamp {
  time: number;
  label: string;
}

export interface ImageGalleryContent {
  type: 'image-gallery';
  images: MediaAsset[];
  layout: 'grid' | 'masonry' | 'carousel' | 'comparison';
  caption?: string;
}

export interface ExpertTipContent {
  type: 'expert-tip';
  expert: Author;
  tip: string;
  context?: string;
}

export interface CalloutContent {
  type: 'callout';
  variant: 'info' | 'warning' | 'success' | 'tip' | 'quote';
  title?: string;
  text: string;
  icon?: string;
  attribution?: string;
}

export interface ProsConsContent {
  type: 'pros-cons';
  pros: string[];
  cons: string[];
  verdict?: string;
}

export interface ChecklistContent {
  type: 'checklist';
  title?: string;
  items: ChecklistItem[];
  printable?: boolean;
}

export interface ChecklistItem {
  text: string;
  checked?: boolean;
  important?: boolean;
}

export interface EmbedContent {
  type: 'embed';
  provider: 'youtube' | 'vimeo' | 'instagram' | 'twitter' | 'tiktok' | 'iframe';
  url: string;
  aspectRatio?: string;
}

export interface CTAContent {
  type: 'cta';
  variant: 'primary' | 'secondary' | 'banner';
  title: string;
  description?: string;
  buttonText: string;
  buttonUrl: string;
  image?: string;
}

// =============================================================================
// MEDIA TYPES
// =============================================================================

export interface MediaAsset {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  caption?: string;
  credit?: string;
  srcSet?: string;
  sizes?: string;
}

export interface VideoAsset {
  id: string;
  provider: 'youtube' | 'vimeo' | 'self-hosted' | 'mux';
  url: string;
  embedUrl?: string;
  thumbnail: string;
  duration: number; // seconds
  title: string;
  description?: string;
  captions?: VideoCaption[];
  chapters?: VideoChapter[];
}

export interface VideoCaption {
  language: string;
  label: string;
  url: string;
}

export interface VideoChapter {
  time: number;
  title: string;
}

// =============================================================================
// RELATED CONTENT TYPES
// =============================================================================

export interface RelatedProduct {
  productId: string;
  relevanceScore: number;
  context?: string; // Why this product is relevant
}

export interface RelatedGuide {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
  category: string;
  readingTime: number;
}

// =============================================================================
// FAQ & TOC TYPES
// =============================================================================

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface TOCItem {
  id: string;
  title: string;
  anchor: string;
  level: number;
  children?: TOCItem[];
}

// =============================================================================
// SEO & SCHEMA TYPES
// =============================================================================

export interface HubPageSEO {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  ogImage: string;
  noIndex?: boolean;
  noFollow?: boolean;
}

export interface HubPageSchema {
  article: boolean;
  faq: boolean;
  howTo: boolean;
  breadcrumb: boolean;
  speakable: boolean;
  video: boolean;
  author: boolean;
}

export interface HubPageMetrics {
  views: number;
  shares: number;
  avgTimeOnPage: number;
  bounceRate: number;
  conversions: number;
}

// =============================================================================
// CONTENT HUB TYPES
// =============================================================================

export interface ContentHub {
  id: string;
  slug: string;
  name: string;
  description: string;
  featuredImage: string;
  categories: HubCategory[];
  featuredGuides: string[]; // Guide IDs
  recentGuides: string[];
  popularGuides: string[];
  experts: Author[];
  seo: HubPageSEO;
}

export interface HubCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon?: string;
  guideCount: number;
  featuredGuide?: string;
}
