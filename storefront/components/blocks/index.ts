/**
 * Block Components Index
 *
 * This file exports all block components for the JSON-driven page composition system.
 * Each block type corresponds to a configuration schema defined in @/types/blocks.ts
 */

// Core components
export { SectionComposer } from './SectionComposer';
export { BlockRenderer } from './BlockRenderer';
export { HomePageLayout, LayoutPreview } from './HomePageLayout';

// Hero blocks
export { HeroBlock } from './hero/HeroBlock';
export { VideoHeroBlock } from './hero/VideoHeroBlock';

// Product blocks
export { FeaturedProductsBlock } from './products/FeaturedProductsBlock';
export { DealsCarouselBlock } from './products/DealsCarouselBlock';

// Collection blocks
export { CollectionStoriesBlock } from './collections/CollectionStoriesBlock';
export { EditorialCardsBlock } from './collections/EditorialCardsBlock';

// Navigation blocks
export { CategoryGridBlock } from './navigation/CategoryGridBlock';
export { ActivityHubBlock } from './navigation/ActivityHubBlock';

// Content blocks
export { UGCGalleryBlock } from './content/UGCGalleryBlock';
export { ServicePromosBlock } from './content/ServicePromosBlock';
export { NewsletterBlock } from './content/NewsletterBlock';
export { TestimonialsBlock } from './content/TestimonialsBlock';
export { BrandShowcaseBlock } from './content/BrandShowcaseBlock';
export { ContentCardsBlock } from './content/ContentCardsBlock';

// Campaign blocks
export { CampaignRailBlock } from './campaign/CampaignRailBlock';
export { BannerStripBlock } from './campaign/BannerStripBlock';
export { CountdownBannerBlock } from './campaign/CountdownBannerBlock';
export { LoyaltyBannerBlock } from './campaign/LoyaltyBannerBlock';

// Special blocks
export { CustomHtmlBlock } from './special/CustomHtmlBlock';

// Re-export types for convenience
export type { BlockComponentProps } from './BlockRenderer';
