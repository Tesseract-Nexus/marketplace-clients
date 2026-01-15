/**
 * Block-Based Layout System
 *
 * This schema enables JSON-driven page composition with configurable blocks,
 * supporting Myntra-style editorial, Flipkart-style deals, and Decathlon-style
 * activity-based navigation patterns.
 */

// =============================================================================
// BASE TYPES
// =============================================================================

export type BlockType =
  | 'hero'
  | 'featured-products'
  | 'deals-carousel'
  | 'collection-stories'
  | 'editorial-cards'
  | 'category-grid'
  | 'activity-hub'
  | 'ugc-gallery'
  | 'service-promos'
  | 'newsletter'
  | 'campaign-rail'
  | 'banner-strip'
  | 'testimonials'
  | 'brand-showcase'
  | 'content-cards'
  | 'video-hero'
  | 'countdown-banner'
  | 'loyalty-banner'
  | 'custom-html';

export type BlockVariant =
  | 'default'
  | 'minimal'
  | 'editorial'
  | 'immersive'
  | 'compact'
  | 'expanded'
  | 'grid'
  | 'carousel'
  | 'masonry'
  // Hero variants
  | 'promotional'
  | 'split'
  | 'video'
  | 'parallax'
  // Product grid variants
  | 'featured'
  // Newsletter variants
  | 'inline'
  | 'card'
  | 'banner'
  | 'popup'
  // Banner strip variants
  | 'scrolling'
  | 'static'
  | 'rotating'
  // Countdown banner variants
  | 'detailed';

export type MediaAspectRatio =
  | '1:1'
  | '4:3'
  | '16:9'
  | '21:9'
  | '9:16'
  | '3:4'
  | 'auto';

export type ContentAlignment = 'left' | 'center' | 'right';
export type VerticalAlignment = 'top' | 'center' | 'bottom';

export type CTAStyle =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'gradient'
  | 'glow'
  | 'glass';

export type AnimationPreset =
  | 'none'
  | 'fade'
  | 'slide-up'
  | 'slide-left'
  | 'slide-right'
  | 'scale'
  | 'blur'
  | 'parallax';

// =============================================================================
// TARGETING & PERSONALIZATION
// =============================================================================

export interface TargetingRule {
  type: 'cohort' | 'location' | 'device' | 'time' | 'behavior' | 'custom';
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: string | string[] | number | boolean;
  field?: string; // For custom targeting
}

export interface PersonalizationConfig {
  enabled: boolean;
  targetCohorts?: string[]; // VIP, frequent-buyers, new-users, etc.
  targetingRules?: TargetingRule[];
  fallbackBlockId?: string; // Show this block if targeting doesn't match
  priority?: number; // Higher priority blocks shown first when multiple match
}

// =============================================================================
// SCHEDULING & CAMPAIGNS
// =============================================================================

export interface ScheduleConfig {
  enabled: boolean;
  startDate?: string; // ISO date string
  endDate?: string;
  timezone?: string;
  recurringSchedule?: {
    type: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[]; // 0-6 for weekly
    daysOfMonth?: number[]; // 1-31 for monthly
    startTime?: string; // HH:mm format
    endTime?: string;
  };
}

export interface CountdownConfig {
  enabled: boolean;
  endDate: string;
  showDays?: boolean;
  showHours?: boolean;
  showMinutes?: boolean;
  showSeconds?: boolean;
  expiredMessage?: string;
  expiredAction?: 'hide' | 'show-message' | 'redirect';
  expiredRedirectUrl?: string;
  style?: 'digital' | 'flip' | 'circular' | 'minimal';
}

// =============================================================================
// MEDIA & CONTENT
// =============================================================================

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'lottie';
  url: string;
  alt?: string;
  thumbnailUrl?: string;
  mobileUrl?: string; // Different media for mobile
  aspectRatio?: MediaAspectRatio;
  focalPoint?: { x: number; y: number }; // 0-100 percentage
  overlay?: {
    type: 'gradient' | 'solid' | 'pattern';
    color?: string;
    opacity?: number;
    direction?: 'to-top' | 'to-bottom' | 'to-left' | 'to-right' | 'radial';
  };
  videoOptions?: {
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    controls?: boolean;
    poster?: string;
  };
}

export interface CTAButton {
  id: string;
  label: string;
  href: string;
  style: CTAStyle;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: string; // Lucide icon name
  iconPosition?: 'left' | 'right';
  openInNewTab?: boolean;
  trackingId?: string;
}

export interface RichText {
  type: 'plain' | 'markdown' | 'portable-text';
  content: string;
}

// =============================================================================
// BASE BLOCK CONFIG
// =============================================================================

export interface BaseBlockConfig {
  id: string;
  type: BlockType;
  variant?: BlockVariant;
  enabled: boolean;

  // Layout
  fullWidth?: boolean;
  containerWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  margin?: {
    top?: string;
    bottom?: string;
  };

  // Visibility
  showOnMobile?: boolean;
  showOnTablet?: boolean;
  showOnDesktop?: boolean;

  // Styling
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundGradient?: string;
  borderRadius?: string;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';

  // Animation
  animation?: AnimationPreset;
  animationDelay?: number;
  animationDuration?: number;

  // Personalization & Scheduling
  personalization?: PersonalizationConfig;
  schedule?: ScheduleConfig;

  // Analytics
  trackingId?: string;
  trackingEvents?: string[];

  // Admin
  adminLabel?: string; // Display name in admin UI
  adminNotes?: string;
  isLocked?: boolean; // Prevent editing by non-admins
}

// =============================================================================
// HERO BLOCK
// =============================================================================

export type HeroVariant =
  | 'editorial'      // Myntra-style with gradient overlays, editorial copy
  | 'promotional'    // Flipkart-style solid shapes, deal-focused
  | 'immersive'      // Decathlon-style full-bleed photography
  | 'split'          // Half image, half content
  | 'carousel'       // Multiple slides
  | 'video'          // Video background
  | 'minimal'        // Simple text + CTA
  | 'parallax';      // Parallax scrolling effect

export interface HeroSlide {
  id: string;
  media: MediaItem;
  badge?: {
    text: string;
    icon?: string;
    style?: 'primary' | 'secondary' | 'accent' | 'warning' | 'success';
  };
  headline: string;
  subheadline?: string;
  description?: string;
  ctas?: CTAButton[];
  contentAlignment?: ContentAlignment;
  verticalAlignment?: VerticalAlignment;
  textColor?: 'light' | 'dark' | 'auto';
  countdown?: CountdownConfig;
}

export interface HeroBlockConfig extends BaseBlockConfig {
  type: 'hero';
  variant: HeroVariant;

  // Single hero or carousel
  slides: HeroSlide[];
  autoplay?: boolean;
  autoplayInterval?: number;
  showDots?: boolean;
  showArrows?: boolean;

  // Layout
  minHeight?: string;
  maxHeight?: string;
  mobileMinHeight?: string;

  // Stats (like current HeroSection)
  showStats?: boolean;
  stats?: Array<{
    icon: string;
    value: string | number;
    label: string;
    animated?: boolean;
  }>;

  // Decorative elements
  showDecorations?: boolean;
  decorations?: {
    blobs?: boolean;
    particles?: boolean;
    aurora?: boolean;
    gradient?: boolean;
  };

  // Scroll indicator
  showScrollIndicator?: boolean;
}

// =============================================================================
// FEATURED PRODUCTS BLOCK
// =============================================================================

export type ProductGridVariant =
  | 'grid'           // Standard grid
  | 'carousel'       // Horizontal scroll
  | 'masonry'        // Pinterest-style
  | 'featured'       // One large + smaller grid
  | 'editorial';     // With story cards mixed in

export interface FeaturedProductsBlockConfig extends BaseBlockConfig {
  type: 'featured-products';
  variant: ProductGridVariant;

  // Content
  title?: string;
  subtitle?: string;

  // Data source
  source: {
    type: 'collection' | 'category' | 'tag' | 'manual' | 'bestsellers' | 'new-arrivals' | 'trending' | 'personalized';
    collectionId?: string;
    categoryId?: string;
    tag?: string;
    productIds?: string[];
    limit?: number;
  };

  // Grid options
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: string;

  // Card options
  cardStyle?: 'default' | 'minimal' | 'detailed' | 'overlay';
  showQuickAdd?: boolean;
  showWishlist?: boolean;
  showRating?: boolean;
  showBadges?: boolean;
  imageAspectRatio?: MediaAspectRatio;

  // Actions
  showViewAll?: boolean;
  viewAllText?: string;
  viewAllUrl?: string;
}

// =============================================================================
// DEALS CAROUSEL BLOCK (Flipkart Big Billion Days style)
// =============================================================================

export interface DealItem {
  id: string;
  productId?: string;
  title: string;
  description?: string;
  image: MediaItem;
  originalPrice?: number;
  salePrice: number;
  discountPercent?: number;
  badge?: string;
  url: string;
  countdown?: CountdownConfig;
  stockInfo?: {
    total: number;
    sold: number;
    showProgress?: boolean;
  };
}

export interface DealsCarouselBlockConfig extends BaseBlockConfig {
  type: 'deals-carousel';

  // Header
  title: string;
  subtitle?: string;
  badge?: {
    text: string;
    style: 'primary' | 'warning' | 'destructive';
  };

  // Global countdown (for flash sales)
  globalCountdown?: CountdownConfig;

  // Deals
  source: {
    type: 'manual' | 'campaign' | 'category' | 'auto';
    campaignId?: string;
    categoryId?: string;
    deals?: DealItem[];
  };

  // Layout
  itemsPerView?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  showArrows?: boolean;
  autoScroll?: boolean;
  autoScrollInterval?: number;

  // Card style
  cardStyle?: 'compact' | 'detailed' | 'minimal';
  showStockProgress?: boolean;
  showDiscountBadge?: boolean;

  // Actions
  viewAllUrl?: string;
}

// =============================================================================
// COLLECTION STORIES BLOCK (Myntra-style editorial)
// =============================================================================

export interface CollectionStory {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  media: MediaItem;
  cta?: CTAButton;
  tag?: string;
  collectionId?: string;
  style?: 'portrait' | 'landscape' | 'square';
  overlay?: 'light' | 'dark' | 'gradient' | 'none';
}

export interface CollectionStoriesBlockConfig extends BaseBlockConfig {
  type: 'collection-stories';

  // Header
  title?: string;
  subtitle?: string;

  // Stories
  stories: CollectionStory[];

  // Layout
  layout: 'grid' | 'carousel' | 'masonry' | 'featured'; // featured = 1 large + 2 small
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: string;

  // Style
  cardStyle?: 'overlay' | 'below' | 'hidden';
  hoverEffect?: 'zoom' | 'lift' | 'overlay' | 'none';
  aspectRatio?: MediaAspectRatio;
}

// =============================================================================
// EDITORIAL CARDS BLOCK (Content + Commerce)
// =============================================================================

export interface EditorialCard {
  id: string;
  type: 'article' | 'guide' | 'lookbook' | 'video' | 'quiz';
  title: string;
  excerpt?: string;
  content?: RichText;
  media: MediaItem;
  author?: {
    name: string;
    avatar?: string;
    title?: string;
  };
  category?: string;
  tags?: string[];
  readTime?: number;
  url: string;
  cta?: CTAButton;
  relatedProducts?: string[];
  publishedAt?: string;
}

export interface EditorialCardsBlockConfig extends BaseBlockConfig {
  type: 'editorial-cards';

  // Header
  title?: string;
  subtitle?: string;

  // Content
  source: {
    type: 'manual' | 'category' | 'tag' | 'latest';
    category?: string;
    tag?: string;
    cards?: EditorialCard[];
    limit?: number;
  };

  // Layout
  layout: 'grid' | 'carousel' | 'list' | 'featured';
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };

  // Card style
  cardStyle?: 'minimal' | 'detailed' | 'overlay';
  showAuthor?: boolean;
  showCategory?: boolean;
  showReadTime?: boolean;
  showExcerpt?: boolean;
  imageAspectRatio?: MediaAspectRatio;

  // Actions
  viewAllUrl?: string;
}

// =============================================================================
// CATEGORY GRID BLOCK
// =============================================================================

export interface CategoryGridItem {
  id: string;
  categoryId: string;
  title?: string; // Override category name
  image?: MediaItem; // Override category image
  badge?: string;
  url?: string; // Override default URL
}

export interface CategoryGridBlockConfig extends BaseBlockConfig {
  type: 'category-grid';

  // Header
  title?: string;
  subtitle?: string;
  badge?: {
    text: string;
    icon?: string;
  };

  // Categories
  source: {
    type: 'auto' | 'manual';
    parentCategoryId?: string; // Show children of this category
    level?: number; // Show categories at this level
    categories?: CategoryGridItem[];
    limit?: number;
  };

  // Layout
  layout: 'grid' | 'carousel' | 'list';
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };

  // Card style
  cardStyle?: 'image-only' | 'overlay' | 'below' | 'icon';
  aspectRatio?: MediaAspectRatio;
  showProductCount?: boolean;
  hoverEffect?: 'zoom' | 'lift' | 'overlay' | 'none';

  // Actions
  viewAllUrl?: string;
  viewAllText?: string;
}

// =============================================================================
// ACTIVITY HUB BLOCK (Decathlon-style shop by activity)
// =============================================================================

export interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  image?: MediaItem;
  url: string;
  productCount?: number;
  featured?: boolean;
  subActivities?: Array<{
    id: string;
    title: string;
    url: string;
  }>;
}

export interface ActivityHubBlockConfig extends BaseBlockConfig {
  type: 'activity-hub';

  // Header
  title?: string;
  subtitle?: string;

  // Navigation style
  navigationStyle: 'cards' | 'icons' | 'list' | 'mega-menu';

  // Activities
  activities: ActivityItem[];

  // Layout
  layout: 'grid' | 'carousel' | 'sidebar';
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };

  // Features
  showQuiz?: boolean;
  quizConfig?: {
    title: string;
    description: string;
    url: string;
    buttonText: string;
  };

  // Card style
  cardStyle?: 'minimal' | 'detailed' | 'icon-focused';
  showProductCount?: boolean;
  showSubActivities?: boolean;
}

// =============================================================================
// UGC GALLERY BLOCK (User Generated Content)
// =============================================================================

export interface UGCItem {
  id: string;
  type: 'image' | 'video';
  media: MediaItem;
  author: {
    name: string;
    handle?: string;
    avatar?: string;
    platform?: 'instagram' | 'tiktok' | 'twitter' | 'facebook' | 'internal';
  };
  caption?: string;
  likes?: number;
  taggedProducts?: string[];
  url?: string;
  verified?: boolean;
}

export interface UGCGalleryBlockConfig extends BaseBlockConfig {
  type: 'ugc-gallery';

  // Header
  title?: string;
  subtitle?: string;
  hashtag?: string;

  // Content
  source: {
    type: 'manual' | 'hashtag' | 'tagged' | 'curated';
    hashtag?: string;
    items?: UGCItem[];
    limit?: number;
  };

  // Layout
  layout: 'grid' | 'carousel' | 'masonry';
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };

  // Features
  showAuthor?: boolean;
  showCaption?: boolean;
  showLikes?: boolean;
  showProductTags?: boolean;
  enableLightbox?: boolean;

  // CTA
  submitCta?: {
    enabled: boolean;
    text: string;
    url: string;
  };
}

// =============================================================================
// SERVICE PROMOS BLOCK (Decathlon-style services)
// =============================================================================

export interface ServicePromo {
  id: string;
  title: string;
  description?: string;
  icon: string;
  image?: MediaItem;
  url?: string;
  badge?: string;
  features?: string[];
}

export interface ServicePromosBlockConfig extends BaseBlockConfig {
  type: 'service-promos';

  // Header
  title?: string;
  subtitle?: string;

  // Services
  services: ServicePromo[];

  // Layout
  layout: 'grid' | 'carousel' | 'list' | 'icons';
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };

  // Style
  cardStyle?: 'minimal' | 'detailed' | 'icon-focused';
  iconStyle?: 'circle' | 'square' | 'none';
  showFeatures?: boolean;
}

// =============================================================================
// NEWSLETTER BLOCK
// =============================================================================

export interface NewsletterBlockConfig extends BaseBlockConfig {
  type: 'newsletter';

  // Content
  title: string;
  subtitle?: string;
  description?: string;

  // Form
  placeholder?: string;
  buttonText?: string;
  buttonStyle?: CTAStyle;

  // Features
  showNameField?: boolean;
  showPhoneField?: boolean;
  privacyText?: string;
  privacyUrl?: string;

  // Success state
  successTitle?: string;
  successMessage?: string;

  // Style
  variant?: 'inline' | 'card' | 'banner' | 'popup';
  backgroundStyle?: 'solid' | 'gradient' | 'image' | 'pattern';
}

// =============================================================================
// CAMPAIGN RAIL BLOCK (Big Billion Days style event rails)
// =============================================================================

export interface CampaignRailBlockConfig extends BaseBlockConfig {
  type: 'campaign-rail';

  // Campaign info
  campaignId: string;
  campaignName: string;

  // Header
  title: string;
  subtitle?: string;
  logo?: MediaItem;

  // Countdown
  countdown?: CountdownConfig;

  // Content
  source: {
    type: 'deals' | 'products' | 'categories' | 'mixed';
    items: Array<DealItem | CategoryGridItem | { productId: string }>;
  };

  // Layout
  layout: 'carousel' | 'grid' | 'stacked';

  // Styling
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  };

  // Priority
  priority?: number;

  // Schedule
  schedule: ScheduleConfig;
}

// =============================================================================
// BANNER STRIP BLOCK
// =============================================================================

export interface BannerStripBlockConfig extends BaseBlockConfig {
  type: 'banner-strip';

  // Content
  items: Array<{
    id: string;
    text: string;
    icon?: string;
    url?: string;
  }>;

  // Style
  variant?: 'scrolling' | 'static' | 'rotating';
  speed?: 'slow' | 'medium' | 'fast';
  pauseOnHover?: boolean;
}

// =============================================================================
// TESTIMONIALS BLOCK
// =============================================================================

export interface Testimonial {
  id: string;
  content: string;
  author: {
    name: string;
    title?: string;
    avatar?: string;
    company?: string;
  };
  rating?: number;
  productId?: string;
  date?: string;
  verified?: boolean;
}

export interface TestimonialsBlockConfig extends BaseBlockConfig {
  type: 'testimonials';

  // Header
  title?: string;
  subtitle?: string;

  // Content
  source: {
    type: 'manual' | 'product' | 'latest';
    productId?: string;
    testimonials?: Testimonial[];
    limit?: number;
  };

  // Layout
  layout: 'carousel' | 'grid' | 'masonry';
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };

  // Style
  cardStyle?: 'minimal' | 'detailed' | 'quote';
  showRating?: boolean;
  showAvatar?: boolean;
  showDate?: boolean;
  showVerifiedBadge?: boolean;
}

// =============================================================================
// BRAND SHOWCASE BLOCK
// =============================================================================

export interface BrandItem {
  id: string;
  name: string;
  logo: MediaItem;
  url?: string;
  featured?: boolean;
}

export interface BrandShowcaseBlockConfig extends BaseBlockConfig {
  type: 'brand-showcase';

  // Header
  title?: string;
  subtitle?: string;

  // Brands
  brands: BrandItem[];

  // Layout
  layout: 'grid' | 'carousel' | 'marquee';
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };

  // Style
  grayscale?: boolean;
  grayscaleOnHover?: boolean;
  showNames?: boolean;
}

// =============================================================================
// COUNTDOWN BANNER BLOCK
// =============================================================================

export interface CountdownBannerBlockConfig extends BaseBlockConfig {
  type: 'countdown-banner';

  // Content
  title: string;
  subtitle?: string;
  description?: string;

  // Countdown
  countdown: CountdownConfig;

  // Media
  backgroundMedia?: MediaItem;

  // CTA
  cta?: CTAButton;

  // Style
  variant?: 'minimal' | 'detailed' | 'immersive';
  textColor?: 'light' | 'dark' | 'auto';
}

// =============================================================================
// LOYALTY BANNER BLOCK
// =============================================================================

export interface LoyaltyBannerBlockConfig extends BaseBlockConfig {
  type: 'loyalty-banner';

  // Content
  title: string;
  subtitle?: string;
  description?: string;

  // Features
  features?: Array<{
    icon: string;
    title: string;
    description?: string;
  }>;

  // CTA
  joinCta?: CTAButton;
  learnMoreUrl?: string;

  // Member view
  showMemberView?: boolean;
  memberTitle?: string;
  memberSubtitle?: string;

  // Style
  variant?: 'card' | 'banner' | 'inline';
  backgroundMedia?: MediaItem;
}

// =============================================================================
// CUSTOM HTML BLOCK
// =============================================================================

export interface CustomHtmlBlockConfig extends BaseBlockConfig {
  type: 'custom-html';

  // Content
  html: string;
  css?: string;

  // Safety
  sandboxed?: boolean;
  allowScripts?: boolean;

  // Size
  minHeight?: string;
  maxHeight?: string;
}

// =============================================================================
// VIDEO HERO BLOCK
// =============================================================================

export interface VideoHeroBlockConfig extends BaseBlockConfig {
  type: 'video-hero';

  // Video
  video: MediaItem & { type: 'video' };
  fallbackImage?: MediaItem;

  // Content
  badge?: {
    text: string;
    icon?: string;
  };
  headline: string;
  subheadline?: string;
  ctas?: CTAButton[];

  // Layout
  contentAlignment?: ContentAlignment;
  verticalAlignment?: VerticalAlignment;
  minHeight?: string;

  // Video controls
  showControls?: boolean;
  showPlayButton?: boolean;
  muteButton?: boolean;

  // Text
  textColor?: 'light' | 'dark' | 'auto';
  overlay?: {
    color?: string;
    opacity?: number;
  };
}

// =============================================================================
// CONTENT CARDS BLOCK (Generic content/promo cards)
// =============================================================================

export interface ContentCard {
  id: string;
  title: string;
  description?: string;
  media?: MediaItem;
  icon?: string;
  badge?: string;
  url?: string;
  cta?: CTAButton;
  metadata?: Record<string, string>;
}

export interface ContentCardsBlockConfig extends BaseBlockConfig {
  type: 'content-cards';

  // Header
  title?: string;
  subtitle?: string;

  // Cards
  cards: ContentCard[];

  // Layout
  layout: 'grid' | 'carousel' | 'list';
  columns?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };

  // Style
  cardStyle?: 'minimal' | 'detailed' | 'icon' | 'image';
  aspectRatio?: MediaAspectRatio;
  hoverEffect?: 'zoom' | 'lift' | 'overlay' | 'none';
}

// =============================================================================
// BLOCK CONFIG UNION TYPE
// =============================================================================

export type BlockConfig =
  | HeroBlockConfig
  | FeaturedProductsBlockConfig
  | DealsCarouselBlockConfig
  | CollectionStoriesBlockConfig
  | EditorialCardsBlockConfig
  | CategoryGridBlockConfig
  | ActivityHubBlockConfig
  | UGCGalleryBlockConfig
  | ServicePromosBlockConfig
  | NewsletterBlockConfig
  | CampaignRailBlockConfig
  | BannerStripBlockConfig
  | TestimonialsBlockConfig
  | BrandShowcaseBlockConfig
  | CountdownBannerBlockConfig
  | LoyaltyBannerBlockConfig
  | CustomHtmlBlockConfig
  | VideoHeroBlockConfig
  | ContentCardsBlockConfig;

// =============================================================================
// PAGE LAYOUT
// =============================================================================

export interface PageSection {
  id: string;
  name?: string;
  blocks: BlockConfig[];

  // Section-level settings
  fullWidth?: boolean;
  backgroundColor?: string;
  backgroundImage?: string;
  padding?: {
    top?: string;
    bottom?: string;
  };

  // Visibility
  enabled: boolean;
  showOnMobile?: boolean;
  showOnTablet?: boolean;
  showOnDesktop?: boolean;

  // Personalization
  personalization?: PersonalizationConfig;
  schedule?: ScheduleConfig;
}

export interface PageLayout {
  id: string;
  name: string;
  slug: string;
  type: 'home' | 'landing' | 'category' | 'collection' | 'campaign' | 'custom';

  // Sections
  sections: PageSection[];

  // SEO
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };

  // Settings
  settings?: {
    showHeader?: boolean;
    showFooter?: boolean;
    showMobileNav?: boolean;
    headerVariant?: string;
    footerVariant?: string;
  };

  // Status
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  publishedAt?: string;
  scheduledAt?: string;

  // Versioning
  version: number;
  previousVersionId?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

// =============================================================================
// TEMPLATE PRESETS
// =============================================================================

export type LayoutTemplate =
  | 'myntra-editorial'      // Fashion/editorial focus with stories and lookbooks
  | 'flipkart-deals'        // Deal-heavy with carousels and countdowns
  | 'decathlon-activity'    // Activity-based navigation with services
  | 'minimal-modern'        // Clean, minimal design
  | 'luxury-immersive'      // High-end with video heroes and parallax
  | 'marketplace-dense'     // Dense product grids, mega menus
  | 'content-commerce'      // Editorial-first with embedded products
  | 'custom';

export interface LayoutTemplateConfig {
  id: LayoutTemplate;
  name: string;
  description: string;
  thumbnail: string;
  category: 'fashion' | 'electronics' | 'sports' | 'luxury' | 'marketplace' | 'content';
  defaultLayout: PageLayout;
  recommendedBlocks: BlockType[];
  requiredBlocks?: BlockType[];
}

// =============================================================================
// EXPORT HELPERS
// =============================================================================

export function isHeroBlock(block: BlockConfig): block is HeroBlockConfig {
  return block.type === 'hero';
}

export function isFeaturedProductsBlock(block: BlockConfig): block is FeaturedProductsBlockConfig {
  return block.type === 'featured-products';
}

export function isDealsCarouselBlock(block: BlockConfig): block is DealsCarouselBlockConfig {
  return block.type === 'deals-carousel';
}

export function isCollectionStoriesBlock(block: BlockConfig): block is CollectionStoriesBlockConfig {
  return block.type === 'collection-stories';
}

export function isEditorialCardsBlock(block: BlockConfig): block is EditorialCardsBlockConfig {
  return block.type === 'editorial-cards';
}

export function isCategoryGridBlock(block: BlockConfig): block is CategoryGridBlockConfig {
  return block.type === 'category-grid';
}

export function isActivityHubBlock(block: BlockConfig): block is ActivityHubBlockConfig {
  return block.type === 'activity-hub';
}

export function isCampaignRailBlock(block: BlockConfig): block is CampaignRailBlockConfig {
  return block.type === 'campaign-rail';
}
