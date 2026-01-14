/**
 * Layout Templates
 *
 * Pre-built page layout configurations for different store styles.
 * These serve as starting points that tenants can customize.
 */

import type {
  PageLayout,
  LayoutTemplate,
  LayoutTemplateConfig,
  BlockType,
} from '@/types/blocks';

// =============================================================================
// TEMPLATE REGISTRY
// =============================================================================

export const LAYOUT_TEMPLATES: Record<LayoutTemplate, LayoutTemplateConfig> = {
  'myntra-editorial': {
    id: 'myntra-editorial',
    name: 'Fashion Editorial',
    description: 'Myntra-inspired layout with editorial stories, lookbooks, and curated collections',
    thumbnail: '/templates/myntra-editorial.png',
    category: 'fashion',
    defaultLayout: createMyntraEditorialLayout(),
    recommendedBlocks: [
      'hero',
      'collection-stories',
      'editorial-cards',
      'featured-products',
      'ugc-gallery',
      'brand-showcase',
      'newsletter',
    ],
    requiredBlocks: ['hero', 'featured-products'],
  },

  'flipkart-deals': {
    id: 'flipkart-deals',
    name: 'Deals & Offers',
    description: 'Flipkart-inspired layout focused on deals, flash sales, and promotional content',
    thumbnail: '/templates/flipkart-deals.png',
    category: 'marketplace',
    defaultLayout: createFlipkartDealsLayout(),
    recommendedBlocks: [
      'hero',
      'banner-strip',
      'deals-carousel',
      'campaign-rail',
      'category-grid',
      'featured-products',
      'countdown-banner',
    ],
    requiredBlocks: ['hero', 'deals-carousel'],
  },

  'decathlon-activity': {
    id: 'decathlon-activity',
    name: 'Activity & Sports',
    description: 'Decathlon-inspired layout with activity-based navigation and service promos',
    thumbnail: '/templates/decathlon-activity.png',
    category: 'sports',
    defaultLayout: createDecathlonActivityLayout(),
    recommendedBlocks: [
      'hero',
      'activity-hub',
      'service-promos',
      'featured-products',
      'testimonials',
      'content-cards',
      'newsletter',
    ],
    requiredBlocks: ['hero', 'activity-hub'],
  },

  'minimal-modern': {
    id: 'minimal-modern',
    name: 'Minimal Modern',
    description: 'Clean, minimalist design with focus on product imagery',
    thumbnail: '/templates/minimal-modern.png',
    category: 'luxury',
    defaultLayout: createMinimalModernLayout(),
    recommendedBlocks: [
      'hero',
      'featured-products',
      'collection-stories',
      'brand-showcase',
      'newsletter',
    ],
  },

  'luxury-immersive': {
    id: 'luxury-immersive',
    name: 'Luxury Immersive',
    description: 'High-end experience with video heroes, parallax effects, and editorial content',
    thumbnail: '/templates/luxury-immersive.png',
    category: 'luxury',
    defaultLayout: createLuxuryImmersiveLayout(),
    recommendedBlocks: [
      'video-hero',
      'collection-stories',
      'editorial-cards',
      'featured-products',
      'testimonials',
      'brand-showcase',
    ],
  },

  'marketplace-dense': {
    id: 'marketplace-dense',
    name: 'Marketplace Dense',
    description: 'Dense product grid with mega navigation for large catalogs',
    thumbnail: '/templates/marketplace-dense.png',
    category: 'marketplace',
    defaultLayout: createMarketplaceDenseLayout(),
    recommendedBlocks: [
      'banner-strip',
      'hero',
      'category-grid',
      'deals-carousel',
      'featured-products',
      'brand-showcase',
    ],
  },

  'content-commerce': {
    id: 'content-commerce',
    name: 'Content Commerce',
    description: 'Editorial-first layout with embedded commerce modules',
    thumbnail: '/templates/content-commerce.png',
    category: 'content',
    defaultLayout: createContentCommerceLayout(),
    recommendedBlocks: [
      'hero',
      'editorial-cards',
      'featured-products',
      'ugc-gallery',
      'newsletter',
      'content-cards',
    ],
  },

  custom: {
    id: 'custom',
    name: 'Custom',
    description: 'Start from scratch with a blank layout',
    thumbnail: '/templates/custom.png',
    category: 'content',
    defaultLayout: createEmptyLayout(),
    recommendedBlocks: [],
  },
};

// =============================================================================
// TEMPLATE GETTERS
// =============================================================================

export function getLayoutTemplate(templateId: LayoutTemplate): LayoutTemplateConfig {
  return LAYOUT_TEMPLATES[templateId] || LAYOUT_TEMPLATES.custom;
}

export function getLayoutTemplates(): LayoutTemplateConfig[] {
  return Object.values(LAYOUT_TEMPLATES);
}

export function getTemplatesByCategory(
  category: LayoutTemplateConfig['category']
): LayoutTemplateConfig[] {
  return Object.values(LAYOUT_TEMPLATES).filter((t) => t.category === category);
}

// =============================================================================
// LAYOUT BUILDERS
// =============================================================================

function createEmptyLayout(): PageLayout {
  return {
    id: 'empty',
    name: 'Empty Layout',
    slug: 'empty',
    type: 'custom',
    sections: [],
    status: 'draft',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createMyntraEditorialLayout(): PageLayout {
  return {
    id: 'myntra-editorial',
    name: 'Fashion Editorial Homepage',
    slug: 'home',
    type: 'home',
    sections: [
      // Hero Section
      {
        id: 'hero-section',
        name: 'Hero',
        enabled: true,
        blocks: [
          {
            id: 'main-hero',
            type: 'hero',
            variant: 'editorial',
            enabled: true,
            slides: [
              {
                id: 'slide-1',
                media: {
                  id: 'hero-media-1',
                  type: 'image',
                  url: '/placeholder-hero-fashion.jpg',
                  alt: 'New Season Collection',
                  mobileUrl: '/placeholder-hero-fashion-mobile.jpg',
                  overlay: {
                    type: 'gradient',
                    direction: 'to-right',
                    opacity: 0.5,
                  },
                },
                badge: {
                  text: 'New Season',
                  style: 'accent',
                  icon: 'sparkles',
                },
                headline: 'Discover Your Style',
                subheadline: 'Explore the latest trends curated just for you',
                ctas: [
                  {
                    id: 'cta-shop',
                    label: 'Shop Now',
                    href: '/products',
                    style: 'gradient',
                    size: 'xl',
                  },
                  {
                    id: 'cta-lookbook',
                    label: 'View Lookbook',
                    href: '/lookbook',
                    style: 'glass',
                    size: 'xl',
                  },
                ],
                contentAlignment: 'left',
                textColor: 'light',
              },
            ],
            showStats: true,
            stats: [
              { icon: 'users', value: '50K+', label: 'Happy Customers', animated: true },
              { icon: 'package', value: '10K+', label: 'Products', animated: true },
              { icon: 'star', value: '4.8', label: 'Rating', animated: true },
            ],
            showScrollIndicator: true,
            showDecorations: true,
            decorations: { blobs: true },
            animation: 'fade',
          },
        ],
      },

      // Collection Stories
      {
        id: 'stories-section',
        name: 'Curated Collections',
        enabled: true,
        padding: { top: '4rem', bottom: '4rem' },
        blocks: [
          {
            id: 'collection-stories',
            type: 'collection-stories',
            enabled: true,
            title: 'Curated For You',
            subtitle: 'Handpicked collections that define the season',
            stories: [
              {
                id: 'story-1',
                title: 'Summer Essentials',
                subtitle: 'Light, breezy, and effortlessly chic',
                media: {
                  id: 'story-1-media',
                  type: 'image',
                  url: '/placeholder-collection-1.jpg',
                  alt: 'Summer Collection',
                },
                tag: 'Trending',
                cta: { id: 'story-1-cta', label: 'Shop Collection', href: '/collections/summer', style: 'primary' },
                style: 'portrait',
                overlay: 'gradient',
              },
              {
                id: 'story-2',
                title: 'Work From Anywhere',
                subtitle: 'Professional meets comfortable',
                media: {
                  id: 'story-2-media',
                  type: 'image',
                  url: '/placeholder-collection-2.jpg',
                  alt: 'Work Collection',
                },
                cta: { id: 'story-2-cta', label: 'Explore', href: '/collections/work', style: 'primary' },
                style: 'landscape',
                overlay: 'gradient',
              },
              {
                id: 'story-3',
                title: 'Weekend Vibes',
                subtitle: 'Casual comfort for your days off',
                media: {
                  id: 'story-3-media',
                  type: 'image',
                  url: '/placeholder-collection-3.jpg',
                  alt: 'Weekend Collection',
                },
                cta: { id: 'story-3-cta', label: 'Shop Now', href: '/collections/weekend', style: 'primary' },
                style: 'landscape',
                overlay: 'gradient',
              },
            ],
            layout: 'featured',
            cardStyle: 'overlay',
            hoverEffect: 'zoom',
            animation: 'slide-up',
          },
        ],
      },

      // Featured Products
      {
        id: 'featured-products-section',
        name: 'Trending Now',
        enabled: true,
        padding: { top: '4rem', bottom: '4rem' },
        backgroundColor: 'var(--muted)',
        blocks: [
          {
            id: 'trending-products',
            type: 'featured-products',
            variant: 'carousel',
            enabled: true,
            title: 'Trending Now',
            subtitle: 'Most loved styles this week',
            source: {
              type: 'trending',
              limit: 12,
            },
            showQuickAdd: true,
            showWishlist: true,
            showRating: true,
            showBadges: true,
            showViewAll: true,
            viewAllText: 'View All Trending',
            viewAllUrl: '/products?sort=trending',
            animation: 'fade',
          },
        ],
      },

      // Editorial Content
      {
        id: 'editorial-section',
        name: 'Style Guide',
        enabled: true,
        padding: { top: '4rem', bottom: '4rem' },
        blocks: [
          {
            id: 'editorial-cards',
            type: 'editorial-cards',
            enabled: true,
            title: 'Style Guide',
            subtitle: 'Tips, trends, and inspiration',
            source: {
              type: 'manual',
              cards: [
                {
                  id: 'article-1',
                  type: 'guide',
                  title: 'How to Build a Capsule Wardrobe',
                  excerpt: 'Simplify your style with these essential pieces',
                  media: {
                    id: 'article-1-media',
                    type: 'image',
                    url: '/placeholder-article-1.jpg',
                    alt: 'Capsule Wardrobe Guide',
                  },
                  author: { name: 'Style Team', title: 'Fashion Editor' },
                  category: 'Style Tips',
                  readTime: 5,
                  url: '/blog/capsule-wardrobe',
                },
                {
                  id: 'article-2',
                  type: 'lookbook',
                  title: 'Summer Wedding Guest Looks',
                  excerpt: 'What to wear to every summer celebration',
                  media: {
                    id: 'article-2-media',
                    type: 'image',
                    url: '/placeholder-article-2.jpg',
                    alt: 'Wedding Guest Style',
                  },
                  author: { name: 'Style Team', title: 'Fashion Editor' },
                  category: 'Occasions',
                  readTime: 4,
                  url: '/blog/wedding-guest-style',
                },
                {
                  id: 'article-3',
                  type: 'article',
                  title: 'Sustainable Fashion Guide',
                  excerpt: 'Make eco-conscious choices without compromising style',
                  media: {
                    id: 'article-3-media',
                    type: 'image',
                    url: '/placeholder-article-3.jpg',
                    alt: 'Sustainable Fashion',
                  },
                  author: { name: 'Eco Team', title: 'Sustainability Editor' },
                  category: 'Sustainability',
                  readTime: 6,
                  url: '/blog/sustainable-fashion',
                },
              ],
            },
            layout: 'grid',
            columns: { mobile: 1, tablet: 2, desktop: 3 },
            cardStyle: 'detailed',
            showAuthor: true,
            showReadTime: true,
            showExcerpt: true,
            imageAspectRatio: '16:9',
            animation: 'slide-up',
          },
        ],
      },

      // UGC Gallery
      {
        id: 'ugc-section',
        name: 'Community Style',
        enabled: true,
        padding: { top: '4rem', bottom: '4rem' },
        backgroundColor: 'var(--muted)',
        blocks: [
          {
            id: 'ugc-gallery',
            type: 'ugc-gallery',
            enabled: true,
            title: 'Style It Your Way',
            subtitle: 'See how our community rocks their favorites',
            hashtag: 'MyStyle',
            source: {
              type: 'curated',
              items: [],
              limit: 8,
            },
            layout: 'masonry',
            columns: { mobile: 2, tablet: 3, desktop: 4 },
            showAuthor: true,
            showProductTags: true,
            enableLightbox: true,
            submitCta: {
              enabled: true,
              text: 'Share Your Style',
              url: '/community/submit',
            },
            animation: 'fade',
          },
        ],
      },

      // Brand Showcase
      {
        id: 'brands-section',
        name: 'Featured Brands',
        enabled: true,
        padding: { top: '3rem', bottom: '3rem' },
        blocks: [
          {
            id: 'brand-showcase',
            type: 'brand-showcase',
            enabled: true,
            title: 'Shop by Brand',
            brands: [],
            layout: 'carousel',
            columns: { mobile: 3, tablet: 5, desktop: 8 },
            grayscale: true,
            grayscaleOnHover: true,
            showNames: false,
            animation: 'fade',
          },
        ],
      },

      // Newsletter
      {
        id: 'newsletter-section',
        name: 'Newsletter',
        enabled: true,
        blocks: [
          {
            id: 'newsletter',
            type: 'newsletter',
            enabled: true,
            title: 'Stay in Style',
            subtitle: 'Get exclusive offers and style updates',
            description: 'Join our community and be the first to know about new arrivals, sales, and style tips.',
            placeholder: 'Enter your email',
            buttonText: 'Subscribe',
            buttonStyle: 'gradient',
            variant: 'card',
            backgroundStyle: 'gradient',
            privacyText: 'By subscribing, you agree to our Privacy Policy',
            privacyUrl: '/privacy',
            successTitle: "You're In!",
            successMessage: 'Thanks for subscribing. Check your inbox for a welcome gift!',
            animation: 'slide-up',
          },
        ],
      },
    ],
    status: 'published',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createFlipkartDealsLayout(): PageLayout {
  return {
    id: 'flipkart-deals',
    name: 'Deals & Offers Homepage',
    slug: 'home',
    type: 'home',
    sections: [
      // Announcement Banner
      {
        id: 'banner-section',
        name: 'Announcement',
        enabled: true,
        blocks: [
          {
            id: 'announcement-banner',
            type: 'banner-strip',
            enabled: true,
            items: [
              { id: 'banner-1', text: 'Free Shipping on orders over $50', icon: 'truck' },
              { id: 'banner-2', text: 'New Users: Extra 10% OFF', icon: 'gift' },
              { id: 'banner-3', text: 'Easy 30-Day Returns', icon: 'refresh-cw' },
            ],
            variant: 'scrolling',
            speed: 'medium',
            pauseOnHover: true,
          },
        ],
      },

      // Hero
      {
        id: 'hero-section',
        name: 'Hero',
        enabled: true,
        blocks: [
          {
            id: 'promo-hero',
            type: 'hero',
            variant: 'promotional',
            enabled: true,
            slides: [
              {
                id: 'slide-1',
                media: {
                  id: 'promo-media-1',
                  type: 'image',
                  url: '/placeholder-hero-deals.jpg',
                  alt: 'Big Sale',
                },
                badge: {
                  text: 'MEGA SALE',
                  style: 'warning',
                },
                headline: 'Up to 70% OFF',
                subheadline: 'Limited time offers on top brands',
                ctas: [
                  {
                    id: 'cta-shop-deals',
                    label: 'Shop Deals',
                    href: '/deals',
                    style: 'primary',
                    size: 'xl',
                  },
                ],
                countdown: {
                  enabled: true,
                  endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
                  showDays: true,
                  showHours: true,
                  showMinutes: true,
                  showSeconds: true,
                  style: 'flip',
                },
              },
            ],
            autoplay: true,
            autoplayInterval: 5000,
            showDots: true,
            animation: 'scale',
          },
        ],
      },

      // Deals Carousel
      {
        id: 'deals-section',
        name: 'Flash Deals',
        enabled: true,
        padding: { top: '2rem', bottom: '2rem' },
        blocks: [
          {
            id: 'flash-deals',
            type: 'deals-carousel',
            enabled: true,
            title: 'Flash Deals',
            subtitle: 'Grab them before they\'re gone!',
            badge: {
              text: 'LIVE NOW',
              style: 'destructive',
            },
            globalCountdown: {
              enabled: true,
              endDate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
              showHours: true,
              showMinutes: true,
              showSeconds: true,
              expiredMessage: 'Sale Ended',
              expiredAction: 'show-message',
            },
            source: {
              type: 'campaign',
              campaignId: 'flash-sale',
              deals: [],
            },
            itemsPerView: { mobile: 2, tablet: 3, desktop: 5 },
            showArrows: true,
            cardStyle: 'detailed',
            showStockProgress: true,
            showDiscountBadge: true,
            viewAllUrl: '/deals',
            animation: 'slide-left',
          },
        ],
      },

      // Category Grid
      {
        id: 'categories-section',
        name: 'Shop by Category',
        enabled: true,
        padding: { top: '2rem', bottom: '2rem' },
        blocks: [
          {
            id: 'category-grid',
            type: 'category-grid',
            enabled: true,
            title: 'Shop by Category',
            badge: {
              text: 'Categories',
              icon: 'grid',
            },
            source: {
              type: 'auto',
              level: 0,
              limit: 8,
            },
            layout: 'carousel',
            cardStyle: 'icon',
            aspectRatio: '1:1',
            showProductCount: true,
            hoverEffect: 'lift',
            viewAllUrl: '/categories',
            viewAllText: 'View All',
            animation: 'fade',
          },
        ],
      },

      // Featured Products Grid
      {
        id: 'featured-section',
        name: 'Best Sellers',
        enabled: true,
        padding: { top: '2rem', bottom: '2rem' },
        backgroundColor: 'var(--muted)',
        blocks: [
          {
            id: 'best-sellers',
            type: 'featured-products',
            variant: 'grid',
            enabled: true,
            title: 'Best Sellers',
            subtitle: 'Our most popular products',
            source: {
              type: 'bestsellers',
              limit: 8,
            },
            columns: { mobile: 2, tablet: 3, desktop: 4 },
            showQuickAdd: true,
            showWishlist: true,
            showRating: true,
            showBadges: true,
            showViewAll: true,
            viewAllUrl: '/products?sort=bestselling',
            animation: 'slide-up',
          },
        ],
      },

      // Campaign Rail
      {
        id: 'campaign-section',
        name: 'Special Campaign',
        enabled: true,
        blocks: [
          {
            id: 'campaign-rail',
            type: 'campaign-rail',
            enabled: true,
            campaignId: 'summer-sale',
            campaignName: 'Summer Sale',
            title: 'Summer Sale',
            subtitle: 'Hot deals for the hot season',
            countdown: {
              enabled: true,
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              showDays: true,
              showHours: true,
              showMinutes: true,
              showSeconds: true,
            },
            source: {
              type: 'deals',
              items: [],
            },
            layout: 'carousel',
            theme: {
              primaryColor: '#ff6b35',
              secondaryColor: '#f7c52d',
            },
            schedule: {
              enabled: true,
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            },
            animation: 'fade',
          },
        ],
      },

      // Countdown Banner
      {
        id: 'countdown-section',
        name: 'Next Sale',
        enabled: true,
        padding: { top: '2rem', bottom: '2rem' },
        blocks: [
          {
            id: 'next-sale-countdown',
            type: 'countdown-banner',
            enabled: true,
            title: 'Weekend Sale Coming Soon',
            subtitle: 'Mark your calendar!',
            description: 'Our biggest weekend sale is almost here. Get ready for amazing deals.',
            countdown: {
              enabled: true,
              endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
              showDays: true,
              showHours: true,
              showMinutes: true,
              showSeconds: true,
              expiredMessage: 'Sale is Live!',
              expiredAction: 'redirect',
              expiredRedirectUrl: '/sale',
            },
            cta: {
              id: 'remind-me',
              label: 'Remind Me',
              href: '/sale/notify',
              style: 'primary',
            },
            variant: 'detailed',
            animation: 'slide-up',
          },
        ],
      },

      // Brand Showcase
      {
        id: 'brands-section',
        name: 'Top Brands',
        enabled: true,
        padding: { top: '2rem', bottom: '2rem' },
        blocks: [
          {
            id: 'top-brands',
            type: 'brand-showcase',
            enabled: true,
            title: 'Shop Top Brands',
            brands: [],
            layout: 'marquee',
            grayscale: false,
            showNames: true,
            animation: 'fade',
          },
        ],
      },

      // Newsletter
      {
        id: 'newsletter-section',
        name: 'Newsletter',
        enabled: true,
        blocks: [
          {
            id: 'deals-newsletter',
            type: 'newsletter',
            enabled: true,
            title: 'Never Miss a Deal',
            subtitle: 'Get exclusive offers in your inbox',
            placeholder: 'Your email address',
            buttonText: 'Get Deals',
            buttonStyle: 'primary',
            variant: 'banner',
            animation: 'fade',
          },
        ],
      },
    ],
    status: 'published',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createDecathlonActivityLayout(): PageLayout {
  return {
    id: 'decathlon-activity',
    name: 'Activity & Sports Homepage',
    slug: 'home',
    type: 'home',
    sections: [
      // Hero
      {
        id: 'hero-section',
        name: 'Hero',
        enabled: true,
        blocks: [
          {
            id: 'sports-hero',
            type: 'hero',
            variant: 'immersive',
            enabled: true,
            slides: [
              {
                id: 'slide-1',
                media: {
                  id: 'sports-media-1',
                  type: 'image',
                  url: '/placeholder-hero-sports.jpg',
                  alt: 'Sports & Adventure',
                  focalPoint: { x: 50, y: 30 },
                },
                headline: 'Sport For All',
                subheadline: 'Gear up for your next adventure',
                ctas: [
                  {
                    id: 'cta-shop-sport',
                    label: 'Shop by Sport',
                    href: '/sports',
                    style: 'gradient',
                    size: 'xl',
                  },
                  {
                    id: 'cta-find-store',
                    label: 'Find a Store',
                    href: '/stores',
                    style: 'glass',
                    size: 'xl',
                  },
                ],
                textColor: 'light',
              },
            ],
            minHeight: '80vh',
            showScrollIndicator: true,
            animation: 'fade',
          },
        ],
      },

      // Activity Hub
      {
        id: 'activity-section',
        name: 'Shop by Activity',
        enabled: true,
        padding: { top: '4rem', bottom: '4rem' },
        blocks: [
          {
            id: 'activity-hub',
            type: 'activity-hub',
            enabled: true,
            title: 'What\'s Your Sport?',
            subtitle: 'Find gear tailored to your passion',
            navigationStyle: 'cards',
            activities: [
              {
                id: 'running',
                title: 'Running',
                description: 'Shoes, apparel & accessories',
                icon: '🏃',
                url: '/sports/running',
                productCount: 450,
                featured: true,
              },
              {
                id: 'cycling',
                title: 'Cycling',
                description: 'Bikes, gear & maintenance',
                icon: '🚴',
                url: '/sports/cycling',
                productCount: 380,
                featured: true,
              },
              {
                id: 'swimming',
                title: 'Swimming',
                description: 'Swimwear, goggles & gear',
                icon: '🏊',
                url: '/sports/swimming',
                productCount: 220,
                featured: true,
              },
              {
                id: 'hiking',
                title: 'Hiking',
                description: 'Boots, backpacks & outdoor gear',
                icon: '🥾',
                url: '/sports/hiking',
                productCount: 320,
              },
              {
                id: 'fitness',
                title: 'Fitness',
                description: 'Equipment & workout wear',
                icon: '💪',
                url: '/sports/fitness',
                productCount: 560,
              },
              {
                id: 'yoga',
                title: 'Yoga',
                description: 'Mats, blocks & apparel',
                icon: '🧘',
                url: '/sports/yoga',
                productCount: 180,
              },
              {
                id: 'camping',
                title: 'Camping',
                description: 'Tents, sleeping bags & more',
                icon: '⛺',
                url: '/sports/camping',
                productCount: 290,
              },
              {
                id: 'team-sports',
                title: 'Team Sports',
                description: 'Football, basketball & more',
                icon: '⚽',
                url: '/sports/team-sports',
                productCount: 420,
              },
            ],
            layout: 'grid',
            columns: { mobile: 2, tablet: 3, desktop: 4 },
            showQuiz: true,
            quizConfig: {
              title: 'Not sure where to start?',
              description: 'Take our quiz to find the perfect gear for your needs',
              url: '/quiz/sport-finder',
              buttonText: 'Take the Quiz',
            },
            cardStyle: 'detailed',
            showProductCount: true,
            showSubActivities: false,
            animation: 'slide-up',
          },
        ],
      },

      // Service Promos
      {
        id: 'services-section',
        name: 'Our Services',
        enabled: true,
        padding: { top: '3rem', bottom: '3rem' },
        backgroundColor: 'var(--muted)',
        blocks: [
          {
            id: 'service-promos',
            type: 'service-promos',
            enabled: true,
            title: 'More Than Just Shopping',
            subtitle: 'Services to support your sporting journey',
            services: [
              {
                id: 'bike-repair',
                title: 'Bike Workshop',
                description: 'Professional repairs & maintenance',
                icon: 'wrench',
                url: '/services/bike-workshop',
                features: ['Same-day service', 'Free estimates', 'Expert technicians'],
              },
              {
                id: 'sports-advice',
                title: 'Expert Advice',
                description: 'Get personalized recommendations',
                icon: 'message-circle',
                url: '/services/advice',
                badge: 'Free',
              },
              {
                id: 'click-collect',
                title: 'Click & Collect',
                description: 'Order online, pick up in store',
                icon: 'package-check',
                url: '/services/click-collect',
                features: ['Ready in 2 hours', '500+ locations'],
              },
              {
                id: 'rentals',
                title: 'Gear Rental',
                description: 'Try before you buy',
                icon: 'calendar',
                url: '/services/rentals',
                badge: 'New',
              },
            ],
            layout: 'grid',
            columns: { mobile: 1, tablet: 2, desktop: 4 },
            cardStyle: 'detailed',
            iconStyle: 'circle',
            showFeatures: true,
            animation: 'fade',
          },
        ],
      },

      // Featured Products
      {
        id: 'featured-section',
        name: 'New Arrivals',
        enabled: true,
        padding: { top: '4rem', bottom: '4rem' },
        blocks: [
          {
            id: 'new-arrivals',
            type: 'featured-products',
            variant: 'carousel',
            enabled: true,
            title: 'Just Landed',
            subtitle: 'The latest gear for your next adventure',
            source: {
              type: 'new-arrivals',
              limit: 12,
            },
            showQuickAdd: true,
            showWishlist: true,
            showRating: true,
            showBadges: true,
            showViewAll: true,
            viewAllUrl: '/products?sort=newest',
            animation: 'slide-left',
          },
        ],
      },

      // Content Cards (Guides)
      {
        id: 'guides-section',
        name: 'Sport Guides',
        enabled: true,
        padding: { top: '3rem', bottom: '3rem' },
        blocks: [
          {
            id: 'sport-guides',
            type: 'content-cards',
            enabled: true,
            title: 'Expert Guides',
            subtitle: 'Tips and advice from our sports specialists',
            cards: [
              {
                id: 'guide-1',
                title: 'How to Choose Running Shoes',
                description: 'Find the perfect fit for your gait and terrain',
                media: {
                  id: 'guide-1-media',
                  type: 'image',
                  url: '/placeholder-guide-1.jpg',
                  alt: 'Running Shoes Guide',
                },
                icon: 'book-open',
                url: '/guides/running-shoes',
              },
              {
                id: 'guide-2',
                title: 'Beginner\'s Cycling Checklist',
                description: 'Everything you need to hit the road',
                media: {
                  id: 'guide-2-media',
                  type: 'image',
                  url: '/placeholder-guide-2.jpg',
                  alt: 'Cycling Guide',
                },
                icon: 'book-open',
                url: '/guides/cycling-basics',
              },
              {
                id: 'guide-3',
                title: 'Home Gym Setup Guide',
                description: 'Build your perfect workout space',
                media: {
                  id: 'guide-3-media',
                  type: 'image',
                  url: '/placeholder-guide-3.jpg',
                  alt: 'Home Gym Guide',
                },
                icon: 'book-open',
                url: '/guides/home-gym',
              },
            ],
            layout: 'grid',
            columns: { mobile: 1, tablet: 2, desktop: 3 },
            cardStyle: 'image',
            aspectRatio: '16:9',
            hoverEffect: 'lift',
            animation: 'slide-up',
          },
        ],
      },

      // Testimonials
      {
        id: 'testimonials-section',
        name: 'Customer Stories',
        enabled: true,
        padding: { top: '3rem', bottom: '3rem' },
        backgroundColor: 'var(--muted)',
        blocks: [
          {
            id: 'customer-testimonials',
            type: 'testimonials',
            enabled: true,
            title: 'What Athletes Say',
            subtitle: 'Stories from our community',
            source: {
              type: 'manual',
              testimonials: [
                {
                  id: 'testimonial-1',
                  content: 'The expert advice I got helped me find the perfect running shoes. My knee pain is completely gone!',
                  author: {
                    name: 'Sarah M.',
                    title: 'Marathon Runner',
                  },
                  rating: 5,
                  verified: true,
                },
                {
                  id: 'testimonial-2',
                  content: 'Amazing bike workshop service. They fixed my bike same day and it rides better than ever.',
                  author: {
                    name: 'Mike T.',
                    title: 'Weekend Cyclist',
                  },
                  rating: 5,
                  verified: true,
                },
                {
                  id: 'testimonial-3',
                  content: 'Love the gear rental service. Got to try camping equipment before investing in my own.',
                  author: {
                    name: 'Emma K.',
                    title: 'Outdoor Enthusiast',
                  },
                  rating: 5,
                  verified: true,
                },
              ],
            },
            layout: 'carousel',
            cardStyle: 'quote',
            showRating: true,
            showAvatar: false,
            showVerifiedBadge: true,
            animation: 'fade',
          },
        ],
      },

      // Loyalty Banner
      {
        id: 'loyalty-section',
        name: 'Loyalty Program',
        enabled: true,
        padding: { top: '2rem', bottom: '2rem' },
        blocks: [
          {
            id: 'loyalty-banner',
            type: 'loyalty-banner',
            enabled: true,
            title: 'Join Our Sports Club',
            subtitle: 'Earn points with every purchase',
            description: 'Get exclusive access to member prices, early product launches, and special events.',
            features: [
              { icon: 'gift', title: 'Earn Points', description: '1 point per $1 spent' },
              { icon: 'percent', title: 'Member Prices', description: 'Exclusive discounts' },
              { icon: 'calendar', title: 'Early Access', description: 'New products first' },
              { icon: 'users', title: 'Events', description: 'Free workshops & rides' },
            ],
            joinCta: {
              id: 'join-club',
              label: 'Join Free',
              href: '/loyalty/join',
              style: 'primary',
            },
            learnMoreUrl: '/loyalty',
            variant: 'card',
            showMemberView: true,
            memberTitle: 'Your Club Status',
            memberSubtitle: 'View your points and rewards',
            animation: 'slide-up',
          },
        ],
      },

      // Newsletter
      {
        id: 'newsletter-section',
        name: 'Newsletter',
        enabled: true,
        blocks: [
          {
            id: 'sports-newsletter',
            type: 'newsletter',
            enabled: true,
            title: 'Stay Active, Stay Informed',
            subtitle: 'Tips, deals, and inspiration for your sporting life',
            placeholder: 'Your email',
            buttonText: 'Subscribe',
            buttonStyle: 'gradient',
            variant: 'inline',
            backgroundStyle: 'gradient',
            animation: 'fade',
          },
        ],
      },
    ],
    status: 'published',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createMinimalModernLayout(): PageLayout {
  return {
    id: 'minimal-modern',
    name: 'Minimal Modern Homepage',
    slug: 'home',
    type: 'home',
    sections: [
      {
        id: 'hero-section',
        name: 'Hero',
        enabled: true,
        blocks: [
          {
            id: 'minimal-hero',
            type: 'hero',
            variant: 'minimal',
            enabled: true,
            slides: [
              {
                id: 'slide-1',
                media: { id: 'media-1', type: 'image', url: '' },
                headline: 'Refined Simplicity',
                subheadline: 'Curated essentials for modern living',
                ctas: [
                  { id: 'cta-1', label: 'Explore Collection', href: '/products', style: 'primary', size: 'lg' },
                ],
              },
            ],
            animation: 'fade',
          },
        ],
      },
      {
        id: 'products-section',
        name: 'Featured Products',
        enabled: true,
        padding: { top: '6rem', bottom: '6rem' },
        blocks: [
          {
            id: 'featured',
            type: 'featured-products',
            variant: 'grid',
            enabled: true,
            source: { type: 'trending', limit: 6 },
            columns: { mobile: 1, tablet: 2, desktop: 3 },
            cardStyle: 'minimal',
            showQuickAdd: false,
            showWishlist: true,
            animation: 'fade',
          },
        ],
      },
      {
        id: 'brands-section',
        name: 'Brands',
        enabled: true,
        padding: { top: '4rem', bottom: '4rem' },
        blocks: [
          {
            id: 'brands',
            type: 'brand-showcase',
            enabled: true,
            brands: [],
            layout: 'grid',
            columns: { mobile: 3, tablet: 4, desktop: 6 },
            grayscale: true,
            grayscaleOnHover: true,
            animation: 'fade',
          },
        ],
      },
    ],
    status: 'published',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createLuxuryImmersiveLayout(): PageLayout {
  return {
    id: 'luxury-immersive',
    name: 'Luxury Immersive Homepage',
    slug: 'home',
    type: 'home',
    sections: [
      {
        id: 'video-hero-section',
        name: 'Video Hero',
        enabled: true,
        fullWidth: true,
        blocks: [
          {
            id: 'video-hero',
            type: 'video-hero',
            enabled: true,
            video: {
              id: 'hero-video',
              type: 'video',
              url: '/placeholder-video.mp4',
              videoOptions: { autoplay: true, muted: true, loop: true },
            },
            headline: 'Crafted Excellence',
            subheadline: 'Where tradition meets innovation',
            ctas: [
              { id: 'cta-discover', label: 'Discover', href: '/collections', style: 'glass', size: 'xl' },
            ],
            contentAlignment: 'center',
            verticalAlignment: 'center',
            minHeight: '100vh',
            textColor: 'light',
            animation: 'fade',
          },
        ],
      },
      {
        id: 'stories-section',
        name: 'Collection Stories',
        enabled: true,
        padding: { top: '6rem', bottom: '6rem' },
        blocks: [
          {
            id: 'luxury-stories',
            type: 'collection-stories',
            enabled: true,
            stories: [],
            layout: 'masonry',
            cardStyle: 'overlay',
            hoverEffect: 'zoom',
            aspectRatio: '3:4',
            animation: 'parallax',
          },
        ],
      },
      {
        id: 'products-section',
        name: 'Signature Pieces',
        enabled: true,
        padding: { top: '4rem', bottom: '4rem' },
        blocks: [
          {
            id: 'signature-products',
            type: 'featured-products',
            variant: 'editorial',
            enabled: true,
            title: 'Signature Pieces',
            source: { type: 'collection', collectionId: 'signature', limit: 4 },
            cardStyle: 'overlay',
            animation: 'slide-up',
          },
        ],
      },
    ],
    status: 'published',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createMarketplaceDenseLayout(): PageLayout {
  return {
    id: 'marketplace-dense',
    name: 'Marketplace Dense Homepage',
    slug: 'home',
    type: 'home',
    sections: [
      {
        id: 'banner-section',
        name: 'Promo Banner',
        enabled: true,
        blocks: [
          {
            id: 'promo-banner',
            type: 'banner-strip',
            enabled: true,
            items: [
              { id: 'item-1', text: 'Free Shipping over $35', icon: 'truck' },
              { id: 'item-2', text: 'Same Day Delivery', icon: 'clock' },
              { id: 'item-3', text: '24/7 Customer Support', icon: 'headphones' },
            ],
            variant: 'static',
          },
        ],
      },
      {
        id: 'hero-section',
        name: 'Hero Carousel',
        enabled: true,
        blocks: [
          {
            id: 'hero-carousel',
            type: 'hero',
            variant: 'carousel',
            enabled: true,
            slides: [],
            autoplay: true,
            autoplayInterval: 4000,
            showDots: true,
            showArrows: true,
            animation: 'slide-left',
          },
        ],
      },
      {
        id: 'categories-section',
        name: 'Categories',
        enabled: true,
        padding: { top: '1.5rem', bottom: '1.5rem' },
        blocks: [
          {
            id: 'category-strip',
            type: 'category-grid',
            enabled: true,
            source: { type: 'auto', level: 0, limit: 10 },
            layout: 'carousel',
            cardStyle: 'icon',
            aspectRatio: '1:1',
            animation: 'fade',
          },
        ],
      },
      {
        id: 'deals-section',
        name: 'Today\'s Deals',
        enabled: true,
        padding: { top: '1rem', bottom: '1rem' },
        blocks: [
          {
            id: 'daily-deals',
            type: 'deals-carousel',
            enabled: true,
            title: 'Today\'s Deals',
            badge: { text: 'HOT', style: 'destructive' },
            source: { type: 'auto', deals: [] },
            itemsPerView: { mobile: 2, tablet: 4, desktop: 6 },
            cardStyle: 'compact',
            showStockProgress: true,
            animation: 'fade',
          },
        ],
      },
      {
        id: 'products-section',
        name: 'Products Grid',
        enabled: true,
        padding: { top: '1.5rem', bottom: '1.5rem' },
        blocks: [
          {
            id: 'products-grid',
            type: 'featured-products',
            variant: 'grid',
            enabled: true,
            title: 'Popular Products',
            source: { type: 'bestsellers', limit: 12 },
            columns: { mobile: 2, tablet: 4, desktop: 6 },
            showQuickAdd: true,
            animation: 'fade',
          },
        ],
      },
    ],
    status: 'published',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function createContentCommerceLayout(): PageLayout {
  return {
    id: 'content-commerce',
    name: 'Content Commerce Homepage',
    slug: 'home',
    type: 'home',
    sections: [
      {
        id: 'hero-section',
        name: 'Editorial Hero',
        enabled: true,
        blocks: [
          {
            id: 'editorial-hero',
            type: 'hero',
            variant: 'split',
            enabled: true,
            slides: [
              {
                id: 'slide-1',
                media: { id: 'media-1', type: 'image', url: '/placeholder-editorial.jpg' },
                badge: { text: 'Editor\'s Pick', style: 'primary' },
                headline: 'The Art of Living Well',
                subheadline: 'Curated content and products for mindful living',
                description: 'Explore our latest collection of thoughtfully designed products and inspiring stories.',
                ctas: [
                  { id: 'cta-read', label: 'Read More', href: '/blog/latest', style: 'primary' },
                  { id: 'cta-shop', label: 'Shop Now', href: '/products', style: 'outline' },
                ],
              },
            ],
            animation: 'fade',
          },
        ],
      },
      {
        id: 'editorial-section',
        name: 'Featured Stories',
        enabled: true,
        padding: { top: '4rem', bottom: '4rem' },
        blocks: [
          {
            id: 'featured-stories',
            type: 'editorial-cards',
            enabled: true,
            title: 'Latest Stories',
            source: { type: 'latest', limit: 3 },
            layout: 'featured',
            cardStyle: 'detailed',
            showAuthor: true,
            showReadTime: true,
            animation: 'slide-up',
          },
        ],
      },
      {
        id: 'products-section',
        name: 'Shop the Edit',
        enabled: true,
        padding: { top: '3rem', bottom: '3rem' },
        backgroundColor: 'var(--muted)',
        blocks: [
          {
            id: 'shop-edit',
            type: 'featured-products',
            variant: 'editorial',
            enabled: true,
            title: 'Shop the Edit',
            subtitle: 'Products featured in our latest stories',
            source: { type: 'collection', collectionId: 'editorial-picks', limit: 6 },
            animation: 'fade',
          },
        ],
      },
      {
        id: 'ugc-section',
        name: 'Community',
        enabled: true,
        padding: { top: '4rem', bottom: '4rem' },
        blocks: [
          {
            id: 'community-gallery',
            type: 'ugc-gallery',
            enabled: true,
            title: 'From Our Community',
            hashtag: 'LiveWell',
            source: { type: 'curated', items: [], limit: 6 },
            layout: 'grid',
            columns: { mobile: 2, tablet: 3, desktop: 6 },
            showAuthor: true,
            showProductTags: true,
            animation: 'fade',
          },
        ],
      },
    ],
    status: 'published',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
