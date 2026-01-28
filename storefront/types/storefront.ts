// Storefront Types - Ported from Admin types.ts

// ========================================
// API Response Types
// ========================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationInfo;
  metadata?: Record<string, unknown>;
}

// ========================================
// Product Types
// ========================================

export type ProductStatus = 'DRAFT' | 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'REJECTED' | 'OUT_OF_STOCK';
export type InventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'BACK_ORDER' | 'DISCONTINUED';

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  position: number;
  width?: number;
  height?: number;
  isPrimary?: boolean; // Mark as one of the primary/featured images (max 3)
}

export interface ProductDimensions {
  length?: string | number;
  width?: string | number;
  height?: string | number;
  unit?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: string;
  comparePrice?: string;
  quantity: number;
  inventoryStatus?: InventoryStatus;
  attributes?: Record<string, unknown>;
}

export interface Product {
  id: string;
  tenantId: string;
  vendorId?: string;
  categoryId?: string;
  name: string;
  slug?: string;
  sku: string;
  brand?: string;
  description?: string;
  price: string;
  comparePrice?: string;
  currency?: string;
  status: ProductStatus;
  inventoryStatus?: InventoryStatus;
  quantity?: number;
  averageRating?: number;
  reviewCount?: number;
  images?: (ProductImage | string)[];
  variants?: ProductVariant[];
  weight?: string;
  dimensions?: ProductDimensions;
  categories?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// ========================================
// Category Types
// ========================================

export interface CategoryImage {
  id: string;
  url: string;
  altText?: string;
  position: number;
  width?: number;
  height?: number;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  images?: CategoryImage[]; // Gallery images from admin
  parentId?: string | null;
  level: number;
  position: number;
  isActive: boolean;
  children?: Category[];
  productCount?: number; // Number of products in this category
}

// ========================================
// Storefront Theme Types
// ========================================

export type ThemeTemplate =
  // Original themes
  | 'vibrant' | 'minimal' | 'dark' | 'neon' | 'ocean' | 'sunset' | 'forest' | 'luxury' | 'rose' | 'corporate' | 'earthy' | 'arctic'
  // Industry-specific themes
  | 'fashion' | 'streetwear' | 'food' | 'bakery' | 'cafe' | 'electronics' | 'beauty' | 'wellness' | 'jewelry' | 'kids' | 'sports' | 'home'
  // Editorial theme - clean, typography-first design
  | 'editorial';
export type CardStyle = 'default' | 'minimal' | 'bordered' | 'elevated';
export type GridColumns = 2 | 3 | 4;
export type ColorMode = 'light' | 'dark' | 'both' | 'system';

export interface StorefrontMarketingConfig {
  enablePromoBanners: boolean;
  enableProductPromotions: boolean;
  enablePersonalizedOffers: boolean;
  enableReferralProgram: boolean;
  enableLoyaltyProgram: boolean;
  enableAbandonedCartRecovery: boolean;
}

export interface LocalizationConfig {
  defaultCurrency: string;
  defaultLanguage: string;
  supportedCurrencies?: string[];
  supportedLanguages?: string[];
  currencyDisplay?: 'symbol' | 'code' | 'name';
  numberFormat?: string;
  dateFormat?: string;
  currency?: string; // Alias for defaultCurrency for backwards compatibility
}

export interface StorefrontSettings {
  id: string;
  tenantId: string;
  themeTemplate: ThemeTemplate;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  fontPrimary: string;
  fontSecondary: string;
  colorMode: ColorMode;
  headerConfig: StorefrontHeaderConfig;
  homepageConfig: StorefrontHomepageConfig;
  footerConfig: StorefrontFooterConfig;
  productConfig: StorefrontProductConfig;
  checkoutConfig: StorefrontCheckoutConfig;
  typographyConfig?: TypographyConfig;
  layoutConfig?: LayoutConfig;
  spacingStyleConfig?: SpacingStyleConfig;
  mobileConfig?: MobileConfig;
  advancedConfig?: AdvancedConfig;
  marketingConfig?: StorefrontMarketingConfig;
  localization?: LocalizationConfig;
  contentPages?: ContentPage[];
  analyticsConfig?: AnalyticsConfig;
  customCss?: string;
  createdAt: string;
  updatedAt: string;
}

// ========================================
// Content Page Types
// ========================================

export type ContentPageType = 'STATIC' | 'BLOG' | 'FAQ' | 'POLICY' | 'LANDING' | 'CUSTOM';
export type ContentPageStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface ContentPage {
  id: string;
  type: ContentPageType;
  status: ContentPageStatus;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  viewCount: number;
  showInMenu: boolean;
  showInFooter: boolean;
  isFeatured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StorefrontHeaderConfig {
  showAnnouncement: boolean;
  announcementText?: string;
  announcementLink?: string;
  announcementBgColor?: string;
  navLinks: StorefrontNavLink[];
  showSearch: boolean;
  showCart: boolean;
  showAccount: boolean;
  stickyHeader: boolean;
}

export interface StorefrontNavLink {
  id: string;
  label: string;
  href: string;
  isExternal: boolean;
  position: number;
  // Enhanced navigation features
  icon?: string;                    // Lucide icon name
  badge?: string;                   // e.g., "New", "Sale"
  badgeColor?: string;              // Badge background color
  children?: StorefrontNavLink[];   // Sub-menu items
  // Mega-menu config (only for top-level items)
  isMegaMenu?: boolean;
  megaMenuColumns?: number;         // 2, 3, or 4 columns
  megaMenuImage?: string;           // Featured image URL
  megaMenuImageAlt?: string;
}

export interface StorefrontHomepageConfig {
  heroEnabled: boolean;
  heroBackgroundType?: 'animated' | 'static' | 'image' | 'video' | 'color'; // Background type selector
  heroImage?: string;
  heroVideo?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtaText?: string;
  heroCtaLink?: string;
  heroOverlayOpacity: number;
  heroTextColor?: string;           // Custom text color for hero section
  heroAnimationsEnabled?: boolean;  // Enable/disable blob animations (default true)
  heroAnimatedBackground?: boolean; // Enable/disable animated gradient background (legacy, use heroBackgroundType)
  sections: StorefrontSection[];
  featuredProductIds?: string[];
  featuredCategoryIds?: string[];
  showNewsletter: boolean;
  newsletterTitle?: string;
  newsletterSubtitle?: string;
  showTestimonials: boolean;
  testimonials?: StorefrontTestimonial[];
}

export interface StorefrontSection {
  id: string;
  type: 'featured_products' | 'categories' | 'banner' | 'newsletter' | 'testimonials' | 'custom_html';
  title?: string;
  subtitle?: string;
  enabled: boolean;
  position: number;
  config?: Record<string, unknown>;
}

export interface StorefrontTestimonial {
  id: string;
  name: string;
  role?: string;
  content: string;
  avatarUrl?: string;
  rating: number;
}

export type PaymentMethod =
  | 'visa' | 'mastercard' | 'amex' | 'discover'
  | 'paypal' | 'apple_pay' | 'google_pay' | 'stripe'
  | 'afterpay' | 'klarna' | 'zip' | 'bank_transfer';

export interface TrustBadge {
  id: string;
  label: string;
  icon?: string;          // Lucide icon name
  imageUrl?: string;      // Custom badge image
  href?: string;          // Link to verification page
}

export interface StorefrontFooterConfig {
  showFooter: boolean;
  footerBgColor?: string;
  footerTextColor?: string;
  linkGroups: StorefrontFooterLinkGroup[];
  columnLayout?: number; // 1, 2, 3, or 4 columns
  showSocialIcons: boolean;
  socialLinks: StorefrontSocialLink[];
  showContactInfo: boolean;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  showNewsletter: boolean;
  copyrightText?: string;
  showPoweredBy: boolean;
  // Payment icons
  showPaymentIcons?: boolean;
  paymentMethods?: PaymentMethod[];
  // Trust badges
  showTrustBadges?: boolean;
  trustBadges?: TrustBadge[];
}

export interface StorefrontFooterLinkGroup {
  id: string;
  title: string;
  links: StorefrontNavLink[];
}

export interface StorefrontSocialLink {
  id: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'pinterest';
  url: string;
}

export interface StorefrontProductConfig {
  gridColumns: GridColumns;
  cardStyle: CardStyle;
  showQuickView: boolean;
  showWishlist: boolean;
  showRatings: boolean;
  showSaleBadge: boolean;
  showStockStatus: boolean;
  imageAspectRatio: 'square' | 'portrait' | 'landscape';
  hoverEffect: 'none' | 'zoom' | 'fade' | 'slide';
}

export interface StorefrontCheckoutConfig {
  guestCheckoutEnabled: boolean;
  showOrderNotes: boolean;
  showGiftOptions: boolean;
  requirePhone: boolean;
  requireCompany: boolean;
  showTrustBadges: boolean;
  trustBadges?: string[];
  showTermsCheckbox: boolean;
  termsText?: string;
  termsLink?: string;
  showPaymentIcons: boolean;
  paymentIconsUrls?: string[];
}

// ========================================
// Typography Configuration
// ========================================

export type HeadingScale = 'compact' | 'default' | 'large';
export type FontWeight = 300 | 400 | 500 | 600 | 700 | 800;
export type LineHeight = 'tight' | 'normal' | 'relaxed';
export type LetterSpacing = 'tight' | 'normal' | 'wide';

export interface TypographyConfig {
  headingFont: string;
  bodyFont: string;
  baseFontSize: number;
  headingScale: HeadingScale;
  headingWeight: FontWeight;
  bodyWeight: FontWeight;
  headingLineHeight: LineHeight;
  bodyLineHeight: LineHeight;
  headingLetterSpacing: LetterSpacing;
}

// ========================================
// Layout Configuration
// ========================================

export type NavigationStyle = 'header' | 'sidebar-left' | 'sidebar-right' | 'minimal';
export type ContainerWidth = 'narrow' | 'default' | 'wide' | 'full';
export type ContentPadding = 'compact' | 'default' | 'spacious';
export type HomepageLayout = 'hero-grid' | 'carousel' | 'minimal' | 'magazine';
export type HeaderLayout = 'logo-left' | 'logo-center' | 'mega-menu';
export type HeaderHeight = 'compact' | 'default' | 'tall';
export type FooterLayout = 'simple' | 'multi-column' | 'minimal' | 'centered';
export type ProductListLayout = 'grid' | 'list' | 'masonry';
export type ProductDetailLayout = 'image-left' | 'image-right' | 'gallery-top' | 'split';
export type CategoryLayout = 'sidebar-left' | 'sidebar-right' | 'no-sidebar';

export interface LayoutConfig {
  navigationStyle: NavigationStyle;
  containerWidth: ContainerWidth;
  contentPadding: ContentPadding;
  homepageLayout: HomepageLayout;
  headerLayout: HeaderLayout;
  headerHeight: HeaderHeight;
  footerLayout: FooterLayout;
  productListLayout: ProductListLayout;
  productGridColumns: {
    mobile: 1 | 2;
    tablet: 2 | 3;
    desktop: 3 | 4 | 5;
  };
  productDetailLayout: ProductDetailLayout;
  categoryLayout: CategoryLayout;
  showCategoryBanner: boolean;
}

// ========================================
// Spacing & Style Configuration
// ========================================

export type BorderRadius = 'none' | 'small' | 'medium' | 'large' | 'full';
export type ButtonStyle = 'square' | 'rounded' | 'pill';
export type ButtonSize = 'small' | 'medium' | 'large';
export type CardStyleType = 'flat' | 'bordered' | 'elevated' | 'glass';
export type CardPadding = 'compact' | 'default' | 'spacious';
export type SectionSpacing = 'compact' | 'default' | 'spacious';
export type ShadowIntensity = 'none' | 'subtle' | 'medium' | 'strong';
export type AnimationSpeed = 'none' | 'fast' | 'normal' | 'slow';

export interface SpacingStyleConfig {
  borderRadius: BorderRadius;
  buttonStyle: ButtonStyle;
  buttonSize: ButtonSize;
  cardStyle: CardStyleType;
  cardPadding: CardPadding;
  sectionSpacing: SectionSpacing;
  imageRadius: BorderRadius;
  productImageAspect: 'square' | 'portrait' | 'landscape' | 'auto';
  shadowIntensity: ShadowIntensity;
  animationSpeed: AnimationSpeed;
  hoverEffects: boolean;
}

// ========================================
// Mobile Configuration
// ========================================

export type MobileMenuStyle = 'slide' | 'fullscreen' | 'dropdown';
export type MobileHeaderStyle = 'compact' | 'standard' | 'minimal';
export type MobileButtonSize = 'default' | 'large' | 'extra-large';

export interface MobileConfig {
  mobileMenuStyle: MobileMenuStyle;
  bottomNav: boolean;
  bottomNavItems: ('home' | 'search' | 'categories' | 'cart' | 'account')[];
  mobileHeaderStyle: MobileHeaderStyle;
  hideHeaderSearch: boolean;
  showMobileSearch: boolean;
  stickyAddToCart: boolean;
  mobileProductGridColumns: 1 | 2;
  swipeGestures: boolean;
  pinchToZoom: boolean;
  touchFriendlyButtons: boolean;
  mobileButtonSize: MobileButtonSize;
  hapticFeedback: boolean;
  reducedMotion: boolean;
  lowDataMode: boolean;
}

// ========================================
// Advanced Configuration
// ========================================

export interface AdvancedConfig {
  customCss: string;
  visibility: {
    showBreadcrumbs: boolean;
    showBackToTop: boolean;
    showCookieBanner: boolean;
    showPromoBar: boolean;
  };
  performance: {
    lazyLoadImages: boolean;
    preloadCriticalFonts: boolean;
  };
}

// ========================================
// Theme Presets
// ========================================

export interface ThemePreset {
  id: ThemeTemplate;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Bold gradients and eye-catching colors',
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    accentColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    textColor: '#18181B',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean and subtle elegance',
    primaryColor: '#18181B',
    secondaryColor: '#71717A',
    accentColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#18181B',
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Sleek dark mode aesthetic',
    primaryColor: '#A855F7',
    secondaryColor: '#22D3EE',
    accentColor: '#F472B6',
    backgroundColor: '#09090B',
    textColor: '#FAFAFA',
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Cyberpunk-inspired glow effects',
    primaryColor: '#22D3EE',
    secondaryColor: '#A3E635',
    accentColor: '#F472B6',
    backgroundColor: '#0F172A',
    textColor: '#F8FAFC',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Calm blues and teals',
    primaryColor: '#0EA5E9',
    secondaryColor: '#14B8A6',
    accentColor: '#6366F1',
    backgroundColor: '#FFFFFF',
    textColor: '#0F172A',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm and inviting oranges',
    primaryColor: '#F97316',
    secondaryColor: '#EF4444',
    accentColor: '#FBBF24',
    backgroundColor: '#FFFBEB',
    textColor: '#292524',
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural greens for organic brands',
    primaryColor: '#16A34A',
    secondaryColor: '#15803D',
    accentColor: '#84CC16',
    backgroundColor: '#F0FDF4',
    textColor: '#14532D',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    description: 'Elegant gold and black for premium brands',
    primaryColor: '#B8860B',
    secondaryColor: '#18181B',
    accentColor: '#D4AF37',
    backgroundColor: '#FAFAFA',
    textColor: '#18181B',
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Soft and romantic pinks',
    primaryColor: '#DB2777',
    secondaryColor: '#EC4899',
    accentColor: '#F472B6',
    backgroundColor: '#FDF2F8',
    textColor: '#831843',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional blue for business',
    primaryColor: '#2563EB',
    secondaryColor: '#1D4ED8',
    accentColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
    textColor: '#1E293B',
  },
  {
    id: 'earthy',
    name: 'Earthy',
    description: 'Warm browns and naturals',
    primaryColor: '#92400E',
    secondaryColor: '#78350F',
    accentColor: '#D97706',
    backgroundColor: '#FFFBEB',
    textColor: '#451A03',
  },
  {
    id: 'arctic',
    name: 'Arctic',
    description: 'Cool whites and icy blues',
    primaryColor: '#0284C7',
    secondaryColor: '#0369A1',
    accentColor: '#38BDF8',
    backgroundColor: '#F0F9FF',
    textColor: '#0C4A6E',
  },
  // ========================================
  // Industry-Specific Theme Presets
  // ========================================
  {
    id: 'fashion',
    name: 'Fashion',
    description: 'Elegant editorial style for clothing and apparel',
    primaryColor: '#1A1A2E',
    secondaryColor: '#E94560',
    accentColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
    textColor: '#1A1A2E',
  },
  {
    id: 'streetwear',
    name: 'Streetwear',
    description: 'Bold and edgy for urban fashion brands',
    primaryColor: '#0D0D0D',
    secondaryColor: '#FF6B35',
    accentColor: '#FFD700',
    backgroundColor: '#FAFAFA',
    textColor: '#0D0D0D',
  },
  {
    id: 'food',
    name: 'Fresh Food',
    description: 'Fresh and appetizing for groceries and food delivery',
    primaryColor: '#2D5016',
    secondaryColor: '#F4A261',
    accentColor: '#E76F51',
    backgroundColor: '#FEFEFE',
    textColor: '#1A1A1A',
  },
  {
    id: 'bakery',
    name: 'Bakery',
    description: 'Warm and cozy for bakeries and dessert shops',
    primaryColor: '#8B4513',
    secondaryColor: '#F5DEB3',
    accentColor: '#D2691E',
    backgroundColor: '#FFFAF0',
    textColor: '#3E2723',
  },
  {
    id: 'cafe',
    name: 'Coffee & Cafe',
    description: 'Rustic and inviting for coffee shops and cafes',
    primaryColor: '#3C2415',
    secondaryColor: '#D4A574',
    accentColor: '#8B7355',
    backgroundColor: '#FAF6F1',
    textColor: '#2C1810',
  },
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Modern and futuristic for tech and gadgets',
    primaryColor: '#0F1419',
    secondaryColor: '#00D4FF',
    accentColor: '#7C3AED',
    backgroundColor: '#FFFFFF',
    textColor: '#0F1419',
  },
  {
    id: 'beauty',
    name: 'Beauty',
    description: 'Glamorous and soft for cosmetics and skincare',
    primaryColor: '#2D1B4E',
    secondaryColor: '#E8B4B8',
    accentColor: '#D4AF37',
    backgroundColor: '#FDF8F8',
    textColor: '#2D1B4E',
  },
  {
    id: 'wellness',
    name: 'Wellness',
    description: 'Calm and natural for health and wellness brands',
    primaryColor: '#1B4D3E',
    secondaryColor: '#A8E6CF',
    accentColor: '#56C596',
    backgroundColor: '#F5FFFA',
    textColor: '#1B4D3E',
  },
  {
    id: 'jewelry',
    name: 'Jewelry',
    description: 'Premium and luxurious for jewelry and accessories',
    primaryColor: '#1C1C1C',
    secondaryColor: '#D4AF37',
    accentColor: '#B8860B',
    backgroundColor: '#FFFEF7',
    textColor: '#1C1C1C',
  },
  {
    id: 'kids',
    name: 'Kids & Toys',
    description: 'Playful and colorful for children\'s products',
    primaryColor: '#FF6B6B',
    secondaryColor: '#4ECDC4',
    accentColor: '#FFE66D',
    backgroundColor: '#FFFFFF',
    textColor: '#2D3436',
  },
  {
    id: 'sports',
    name: 'Sports',
    description: 'Dynamic and energetic for sports and outdoors',
    primaryColor: '#1E3A5F',
    secondaryColor: '#00D9FF',
    accentColor: '#FF4757',
    backgroundColor: '#FFFFFF',
    textColor: '#1E3A5F',
  },
  {
    id: 'home',
    name: 'Home & Decor',
    description: 'Modern and sophisticated for home and furniture',
    primaryColor: '#2C3E50',
    secondaryColor: '#E67E22',
    accentColor: '#27AE60',
    backgroundColor: '#FFFFFF',
    textColor: '#2C3E50',
  },
  // ========================================
  // Editorial Theme - Typography-First Design
  // ========================================
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Clean, typography-first design with generous whitespace',
    primaryColor: '#292524',
    secondaryColor: '#78716C',
    accentColor: '#1C1917',
    backgroundColor: '#FAFAFA',
    textColor: '#1C1917',
  },
];

// ========================================
// Google Fonts
// ========================================

export const GOOGLE_FONTS = [
  // Sans-serif fonts
  { name: 'Inter', category: 'sans-serif' },
  { name: 'Roboto', category: 'sans-serif' },
  { name: 'Open Sans', category: 'sans-serif' },
  { name: 'Lato', category: 'sans-serif' },
  { name: 'Poppins', category: 'sans-serif' },
  { name: 'Montserrat', category: 'sans-serif' },
  { name: 'Nunito', category: 'sans-serif' },
  { name: 'Work Sans', category: 'sans-serif' },
  { name: 'Raleway', category: 'sans-serif' },
  { name: 'DM Sans', category: 'sans-serif' },
  { name: 'Plus Jakarta Sans', category: 'sans-serif' },
  { name: 'Outfit', category: 'sans-serif' },
  { name: 'Manrope', category: 'sans-serif' },
  { name: 'Space Grotesk', category: 'sans-serif' },
  // Serif fonts - Editorial display fonts for typography-first design
  { name: 'Playfair Display', category: 'serif' },
  { name: 'Cormorant Garamond', category: 'serif' },
  { name: 'Libre Baskerville', category: 'serif' },
  { name: 'DM Serif Display', category: 'serif' },
  { name: 'Merriweather', category: 'serif' },
  { name: 'Lora', category: 'serif' },
  { name: 'Crimson Pro', category: 'serif' },
  { name: 'Source Serif Pro', category: 'serif' },
] as const;

// ========================================
// Default Configurations
// ========================================

export const DEFAULT_TYPOGRAPHY_CONFIG: TypographyConfig = {
  headingFont: 'Inter',
  bodyFont: 'Inter',
  baseFontSize: 16,
  headingScale: 'default',
  headingWeight: 700,
  bodyWeight: 400,
  headingLineHeight: 'normal',
  bodyLineHeight: 'normal',
  headingLetterSpacing: 'normal',
};

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  navigationStyle: 'header',
  containerWidth: 'default',
  contentPadding: 'default',
  homepageLayout: 'hero-grid',
  headerLayout: 'logo-left',
  headerHeight: 'default',
  footerLayout: 'multi-column',
  productListLayout: 'grid',
  productGridColumns: { mobile: 2, tablet: 3, desktop: 4 },
  productDetailLayout: 'image-left',
  categoryLayout: 'sidebar-left',
  showCategoryBanner: true,
};

export const DEFAULT_SPACING_STYLE_CONFIG: SpacingStyleConfig = {
  borderRadius: 'medium',
  buttonStyle: 'rounded',
  buttonSize: 'medium',
  cardStyle: 'elevated',
  cardPadding: 'default',
  sectionSpacing: 'default',
  imageRadius: 'medium',
  productImageAspect: 'square',
  shadowIntensity: 'subtle',
  animationSpeed: 'normal',
  hoverEffects: true,
};

export const DEFAULT_MOBILE_CONFIG: MobileConfig = {
  mobileMenuStyle: 'slide',
  bottomNav: true,
  bottomNavItems: ['home', 'search', 'categories', 'cart', 'account'],
  mobileHeaderStyle: 'standard',
  hideHeaderSearch: false,
  showMobileSearch: true,
  stickyAddToCart: true,
  mobileProductGridColumns: 2,
  swipeGestures: true,
  pinchToZoom: true,
  touchFriendlyButtons: true,
  mobileButtonSize: 'large',
  hapticFeedback: false,
  reducedMotion: false,
  lowDataMode: false,
};

// ========================================
// Analytics Configuration
// ========================================

export interface AnalyticsConfig {
  // Google
  googleAnalyticsId?: string;      // G-XXXXXXXXXX
  googleTagManagerId?: string;     // GTM-XXXXXXX
  // Meta
  facebookPixelId?: string;
  // Social Platforms
  tiktokPixelId?: string;
  pinterestTagId?: string;
  snapchatPixelId?: string;
  // Settings
  enableEnhancedEcommerce?: boolean;
  cookieConsentRequired?: boolean;
}

export const DEFAULT_ADVANCED_CONFIG: AdvancedConfig = {
  customCss: '',
  visibility: {
    showBreadcrumbs: true,
    showBackToTop: true,
    showCookieBanner: false,
    showPromoBar: false,
  },
  performance: {
    lazyLoadImages: true,
    preloadCriticalFonts: true,
  },
};

export const DEFAULT_STOREFRONT_SETTINGS: Omit<StorefrontSettings, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> = {
  themeTemplate: 'vibrant',
  primaryColor: '#8B5CF6',
  secondaryColor: '#EC4899',
  fontPrimary: 'Inter',
  fontSecondary: 'Inter',
  colorMode: 'both',
  headerConfig: {
    showAnnouncement: false,
    navLinks: [
      { id: '1', label: 'Products', href: '/products', isExternal: false, position: 0 },
      { id: '2', label: 'Categories', href: '/categories', isExternal: false, position: 1 },
    ],
    showSearch: true,
    showCart: true,
    showAccount: true,
    stickyHeader: true,
  },
  homepageConfig: {
    heroEnabled: true,
    heroBackgroundType: 'animated',
    heroAnimatedBackground: true,
    heroTitle: 'Welcome to Our Store',
    heroSubtitle: 'Discover amazing products',
    heroCtaText: 'Shop Now',
    heroCtaLink: '/products',
    heroOverlayOpacity: 0.4,
    sections: [
      { id: '1', type: 'featured_products', title: 'Featured Products', enabled: true, position: 0 },
      { id: '2', type: 'categories', title: 'Shop by Category', enabled: true, position: 1 },
    ],
    showNewsletter: true,
    newsletterTitle: 'Subscribe to our newsletter',
    newsletterSubtitle: 'Get updates on new products and exclusive offers',
    showTestimonials: false,
  },
  footerConfig: {
    showFooter: true,
    linkGroups: [
      {
        id: '1',
        title: 'Shop',
        links: [
          { id: '1', label: 'All Products', href: '/products', isExternal: false, position: 0 },
          { id: '2', label: 'New Arrivals', href: '/products?sort=newest', isExternal: false, position: 1 },
        ],
      },
      {
        id: '2',
        title: 'Support',
        links: [
          { id: '1', label: 'Contact Us', href: '/contact', isExternal: false, position: 0 },
          { id: '2', label: 'FAQ', href: '/faq', isExternal: false, position: 1 },
        ],
      },
    ],
    showSocialIcons: true,
    socialLinks: [],
    showContactInfo: true,
    showNewsletter: false,
    showPoweredBy: true,
  },
  productConfig: {
    gridColumns: 4,
    cardStyle: 'default',
    showQuickView: true,
    showWishlist: true,
    showRatings: true,
    showSaleBadge: true,
    showStockStatus: true,
    imageAspectRatio: 'square',
    hoverEffect: 'zoom',
  },
  checkoutConfig: {
    guestCheckoutEnabled: true,
    showOrderNotes: true,
    showGiftOptions: false,
    requirePhone: true,
    requireCompany: false,
    showTrustBadges: true,
    showTermsCheckbox: true,
    termsText: 'I agree to the terms and conditions',
    termsLink: '/terms',
    showPaymentIcons: true,
  },
  typographyConfig: DEFAULT_TYPOGRAPHY_CONFIG,
  layoutConfig: DEFAULT_LAYOUT_CONFIG,
  spacingStyleConfig: DEFAULT_SPACING_STYLE_CONFIG,
  mobileConfig: DEFAULT_MOBILE_CONFIG,
  advancedConfig: DEFAULT_ADVANCED_CONFIG,
  marketingConfig: {
    enablePromoBanners: true,
    enableProductPromotions: true,
    enablePersonalizedOffers: true,
    enableReferralProgram: true,
    enableLoyaltyProgram: true,
    enableAbandonedCartRecovery: true,
  },
};

// ========================================
// Cart Types
// ========================================

export type CartItemStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'PRICE_CHANGED';

export interface PriceChangeInfo {
  oldPrice: number;
  newPrice: number;
  difference: number;
  isIncrease: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  priceAtAdd?: number; // Price when item was added
  quantity: number;
  image?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lb' | 'g' | 'oz';
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: 'cm' | 'in' | 'm';
  variant?: {
    name: string;
    attributes?: Record<string, string>;
  };
  selected?: boolean; // For selective checkout - defaults to true
  status?: CartItemStatus; // Availability status
  availableStock?: number; // Current available stock
  statusMessage?: string; // Human-readable status message
  priceChange?: PriceChangeInfo; // Details about price change if applicable
  addedAt?: string; // When item was added to cart
  lastValidatedAt?: string; // When item was last validated
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  originalSubtotal?: number; // Subtotal at original prices
  tax: number;
  shipping: number;
  total: number;
  itemCount: number;
  hasUnavailableItems?: boolean;
  hasPriceChanges?: boolean;
  unavailableCount?: number;
  outOfStockCount?: number;
  lowStockCount?: number;
  priceChangedCount?: number;
  expiresAt?: string; // When the cart expires
  lastValidatedAt?: string; // Last validation timestamp
}

// ========================================
// Tenant Types
// ========================================

export interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  storefrontId: string;
  logoUrl?: string;
  isActive: boolean;
}
