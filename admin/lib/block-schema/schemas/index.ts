/**
 * Block Schemas Index
 *
 * Exports all block schemas for the registry.
 */

import { BlockSchema, BlockFieldSchema } from '../types';

// Import individual schemas
import { heroSchema } from './hero';
import { featuredProductsSchema } from './featured-products';

// =============================================================================
// DEALS CAROUSEL SCHEMA
// =============================================================================

export const dealsCarouselSchema: BlockSchema = {
  type: 'deals-carousel',
  name: 'Deals Carousel',
  description: 'Flipkart-style deals carousel with countdowns and stock progress',
  icon: 'Percent',
  category: 'campaign',
  thumbnail: '/thumbnails/blocks/deals-carousel.png',

  fields: [
    { name: 'title', type: 'string', label: 'Title', required: true, group: 'content' },
    { name: 'subtitle', type: 'string', label: 'Subtitle', group: 'content' },
    {
      name: 'badge',
      type: 'object',
      label: 'Badge',
      group: 'content',
      fields: [
        { name: 'text', type: 'string', label: 'Text', width: 'half' },
        {
          name: 'style',
          type: 'select',
          label: 'Style',
          options: [
            { value: 'primary', label: 'Primary' },
            { value: 'warning', label: 'Warning' },
            { value: 'destructive', label: 'Destructive' },
          ],
          width: 'half',
        },
      ],
    },
    {
      name: 'globalCountdown',
      type: 'object',
      label: 'Global Countdown',
      group: 'content',
      collapsible: true,
      fields: [
        { name: 'enabled', type: 'boolean', label: 'Enable', default: false },
        { name: 'endDate', type: 'datetime', label: 'End Date' },
        { name: 'style', type: 'select', label: 'Style', options: [
          { value: 'digital', label: 'Digital' },
          { value: 'flip', label: 'Flip' },
        ], default: 'digital' },
      ],
    },
    {
      name: 'source',
      type: 'object',
      label: 'Deals Source',
      required: true,
      group: 'content',
      fields: [
        {
          name: 'type',
          type: 'select',
          label: 'Source Type',
          options: [
            { value: 'manual', label: 'Manual' },
            { value: 'campaign', label: 'Campaign' },
            { value: 'category', label: 'Category' },
            { value: 'auto', label: 'Auto (On Sale)' },
          ],
        },
        { name: 'campaignId', type: 'string', label: 'Campaign ID', showWhen: { field: 'source.type', operator: 'equals', value: 'campaign' } },
        { name: 'categoryId', type: 'category', label: 'Category', showWhen: { field: 'source.type', operator: 'equals', value: 'category' } },
      ],
    },
    {
      name: 'itemsPerView',
      type: 'object',
      label: 'Items Per View',
      group: 'layout',
      fields: [
        { name: 'mobile', type: 'number', label: 'Mobile', min: 1, max: 3, default: 2, width: 'third' },
        { name: 'tablet', type: 'number', label: 'Tablet', min: 2, max: 4, default: 3, width: 'third' },
        { name: 'desktop', type: 'number', label: 'Desktop', min: 3, max: 6, default: 5, width: 'third' },
      ],
    },
    { name: 'showArrows', type: 'boolean', label: 'Show Arrows', default: true, group: 'layout', width: 'half' },
    { name: 'autoScroll', type: 'boolean', label: 'Auto Scroll', default: true, group: 'layout', width: 'half' },
    { name: 'cardStyle', type: 'select', label: 'Card Style', options: [
      { value: 'compact', label: 'Compact' },
      { value: 'detailed', label: 'Detailed' },
      { value: 'minimal', label: 'Minimal' },
    ], default: 'compact', group: 'styling' },
    { name: 'showStockProgress', type: 'boolean', label: 'Show Stock Progress', default: true, group: 'styling', width: 'half' },
    { name: 'showDiscountBadge', type: 'boolean', label: 'Show Discount Badge', default: true, group: 'styling', width: 'half' },
    { name: 'viewAllUrl', type: 'url', label: 'View All URL', group: 'content' },
  ],
  includeBaseFields: true,
  defaultConfig: { variant: 'default', source: { type: 'auto' }, cardStyle: 'compact', showStockProgress: true, showDiscountBadge: true },
};

// =============================================================================
// COLLECTION STORIES SCHEMA
// =============================================================================

export const collectionStoriesSchema: BlockSchema = {
  type: 'collection-stories',
  name: 'Collection Stories',
  description: 'Myntra-style editorial collection cards',
  icon: 'BookOpen',
  category: 'collections',
  thumbnail: '/thumbnails/blocks/collection-stories.png',

  fields: [
    { name: 'title', type: 'string', label: 'Title', group: 'content' },
    { name: 'subtitle', type: 'string', label: 'Subtitle', group: 'content' },
    {
      name: 'stories',
      type: 'array',
      label: 'Stories',
      required: true,
      minItems: 1,
      maxItems: 8,
      group: 'content',
      itemSchema: {
        name: 'story',
        type: 'object',
        label: 'Story',
        fields: [
          { name: 'id', type: 'string', label: 'ID', required: true },
          { name: 'title', type: 'string', label: 'Title', required: true },
          { name: 'subtitle', type: 'string', label: 'Subtitle' },
          { name: 'description', type: 'string', label: 'Description', multiline: true },
          { name: 'media', type: 'media', label: 'Image', mediaType: 'image', required: true },
          { name: 'tag', type: 'string', label: 'Tag' },
          { name: 'collectionId', type: 'collection', label: 'Collection' },
          { name: 'style', type: 'select', label: 'Style', options: [
            { value: 'portrait', label: 'Portrait' },
            { value: 'landscape', label: 'Landscape' },
            { value: 'square', label: 'Square' },
          ], default: 'portrait' },
          { name: 'overlay', type: 'select', label: 'Overlay', options: [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'gradient', label: 'Gradient' },
            { value: 'none', label: 'None' },
          ], default: 'gradient' },
          {
            name: 'cta',
            type: 'object',
            label: 'CTA Button',
            fields: [
              { name: 'label', type: 'string', label: 'Label', width: 'half' },
              { name: 'href', type: 'url', label: 'URL', width: 'half' },
            ],
          },
        ],
      },
    },
    {
      name: 'layout',
      type: 'select',
      label: 'Layout',
      options: [
        { value: 'grid', label: 'Grid' },
        { value: 'carousel', label: 'Carousel' },
        { value: 'masonry', label: 'Masonry' },
        { value: 'featured', label: 'Featured (1 large + 2 small)' },
      ],
      default: 'grid',
      group: 'layout',
    },
    {
      name: 'columns',
      type: 'object',
      label: 'Columns',
      group: 'layout',
      fields: [
        { name: 'mobile', type: 'number', label: 'Mobile', min: 1, max: 2, default: 1, width: 'third' },
        { name: 'tablet', type: 'number', label: 'Tablet', min: 2, max: 3, default: 2, width: 'third' },
        { name: 'desktop', type: 'number', label: 'Desktop', min: 2, max: 4, default: 3, width: 'third' },
      ],
    },
    { name: 'gap', type: 'string', label: 'Gap', default: '1.5rem', group: 'layout' },
    { name: 'cardStyle', type: 'select', label: 'Card Style', options: [
      { value: 'overlay', label: 'Overlay' },
      { value: 'below', label: 'Below' },
      { value: 'hidden', label: 'Hidden' },
    ], default: 'overlay', group: 'styling' },
    { name: 'hoverEffect', type: 'select', label: 'Hover Effect', options: [
      { value: 'zoom', label: 'Zoom' },
      { value: 'lift', label: 'Lift' },
      { value: 'overlay', label: 'Overlay' },
      { value: 'none', label: 'None' },
    ], default: 'zoom', group: 'styling' },
    { name: 'aspectRatio', type: 'select', label: 'Aspect Ratio', options: [
      { value: '3:4', label: 'Portrait (3:4)' },
      { value: '4:3', label: 'Landscape (4:3)' },
      { value: '1:1', label: 'Square (1:1)' },
      { value: '16:9', label: 'Widescreen (16:9)' },
    ], default: '3:4', group: 'styling' },
  ],
  includeBaseFields: true,
  defaultConfig: { layout: 'grid', cardStyle: 'overlay', hoverEffect: 'zoom', aspectRatio: '3:4', stories: [] },
};

// =============================================================================
// CATEGORY GRID SCHEMA
// =============================================================================

export const categoryGridSchema: BlockSchema = {
  type: 'category-grid',
  name: 'Category Grid',
  description: 'Display categories in a grid or carousel',
  icon: 'Grid',
  category: 'navigation',
  thumbnail: '/thumbnails/blocks/category-grid.png',

  fields: [
    { name: 'title', type: 'string', label: 'Title', group: 'content' },
    { name: 'subtitle', type: 'string', label: 'Subtitle', group: 'content' },
    {
      name: 'badge',
      type: 'object',
      label: 'Badge',
      group: 'content',
      fields: [
        { name: 'text', type: 'string', label: 'Text', width: 'half' },
        { name: 'icon', type: 'icon', label: 'Icon', width: 'half' },
      ],
    },
    {
      name: 'source',
      type: 'object',
      label: 'Category Source',
      required: true,
      group: 'content',
      fields: [
        { name: 'type', type: 'select', label: 'Source Type', options: [
          { value: 'auto', label: 'Auto (Top Level)' },
          { value: 'manual', label: 'Manual Selection' },
        ], default: 'auto' },
        { name: 'parentCategoryId', type: 'category', label: 'Parent Category', showWhen: { field: 'source.type', operator: 'equals', value: 'auto' } },
        { name: 'level', type: 'number', label: 'Category Level', min: 0, max: 3, showWhen: { field: 'source.type', operator: 'equals', value: 'auto' } },
        { name: 'limit', type: 'number', label: 'Limit', min: 1, max: 20, default: 8 },
      ],
    },
    { name: 'layout', type: 'select', label: 'Layout', options: [
      { value: 'grid', label: 'Grid' },
      { value: 'carousel', label: 'Carousel' },
      { value: 'list', label: 'List' },
    ], default: 'grid', group: 'layout' },
    {
      name: 'columns',
      type: 'object',
      label: 'Columns',
      group: 'layout',
      fields: [
        { name: 'mobile', type: 'number', label: 'Mobile', min: 2, max: 4, default: 3, width: 'third' },
        { name: 'tablet', type: 'number', label: 'Tablet', min: 3, max: 6, default: 4, width: 'third' },
        { name: 'desktop', type: 'number', label: 'Desktop', min: 4, max: 8, default: 6, width: 'third' },
      ],
    },
    { name: 'cardStyle', type: 'select', label: 'Card Style', options: [
      { value: 'image-only', label: 'Image Only' },
      { value: 'overlay', label: 'Overlay' },
      { value: 'below', label: 'Below' },
      { value: 'icon', label: 'Icon' },
    ], default: 'overlay', group: 'styling' },
    { name: 'aspectRatio', type: 'select', label: 'Aspect Ratio', options: [
      { value: '1:1', label: 'Square (1:1)' },
      { value: '4:3', label: 'Landscape (4:3)' },
      { value: '3:4', label: 'Portrait (3:4)' },
    ], default: '1:1', group: 'styling' },
    { name: 'showProductCount', type: 'boolean', label: 'Show Product Count', default: false, group: 'styling', width: 'half' },
    { name: 'hoverEffect', type: 'select', label: 'Hover Effect', options: [
      { value: 'zoom', label: 'Zoom' },
      { value: 'lift', label: 'Lift' },
      { value: 'overlay', label: 'Overlay' },
      { value: 'none', label: 'None' },
    ], default: 'zoom', group: 'styling', width: 'half' },
    { name: 'viewAllUrl', type: 'url', label: 'View All URL', group: 'content' },
    { name: 'viewAllText', type: 'string', label: 'View All Text', default: 'View All', group: 'content' },
  ],
  includeBaseFields: true,
  defaultConfig: { source: { type: 'auto', limit: 8 }, layout: 'grid', cardStyle: 'overlay', aspectRatio: '1:1', hoverEffect: 'zoom' },
};

// =============================================================================
// NEWSLETTER SCHEMA
// =============================================================================

export const newsletterSchema: BlockSchema = {
  type: 'newsletter',
  name: 'Newsletter',
  description: 'Email subscription form',
  icon: 'Mail',
  category: 'engagement',
  thumbnail: '/thumbnails/blocks/newsletter.png',

  variants: [
    { id: 'inline', name: 'Inline', description: 'Simple inline form' },
    { id: 'card', name: 'Card', description: 'Card with background' },
    { id: 'banner', name: 'Banner', description: 'Full-width banner' },
  ],
  defaultVariant: 'card',

  fields: [
    { name: 'title', type: 'string', label: 'Title', required: true, default: 'Stay Updated', group: 'content' },
    { name: 'subtitle', type: 'string', label: 'Subtitle', group: 'content' },
    { name: 'description', type: 'string', label: 'Description', multiline: true, group: 'content' },
    { name: 'placeholder', type: 'string', label: 'Placeholder', default: 'Enter your email', group: 'content' },
    { name: 'buttonText', type: 'string', label: 'Button Text', default: 'Subscribe', group: 'content' },
    { name: 'buttonStyle', type: 'select', label: 'Button Style', options: [
      { value: 'primary', label: 'Primary' },
      { value: 'secondary', label: 'Secondary' },
      { value: 'outline', label: 'Outline' },
      { value: 'gradient', label: 'Gradient' },
    ], default: 'primary', group: 'styling' },
    { name: 'showNameField', type: 'boolean', label: 'Show Name Field', default: false, group: 'content', width: 'half' },
    { name: 'showPhoneField', type: 'boolean', label: 'Show Phone Field', default: false, group: 'content', width: 'half' },
    { name: 'privacyText', type: 'string', label: 'Privacy Text', group: 'content' },
    { name: 'privacyUrl', type: 'url', label: 'Privacy URL', group: 'content' },
    { name: 'successTitle', type: 'string', label: 'Success Title', default: 'Thank you!', group: 'content' },
    { name: 'successMessage', type: 'string', label: 'Success Message', default: 'You have been subscribed.', group: 'content' },
    { name: 'backgroundStyle', type: 'select', label: 'Background Style', options: [
      { value: 'solid', label: 'Solid' },
      { value: 'gradient', label: 'Gradient' },
      { value: 'image', label: 'Image' },
      { value: 'pattern', label: 'Pattern' },
    ], default: 'gradient', group: 'styling' },
  ],
  includeBaseFields: true,
  defaultConfig: { variant: 'card', title: 'Stay Updated', buttonText: 'Subscribe', buttonStyle: 'primary', backgroundStyle: 'gradient' },
};

// =============================================================================
// TESTIMONIALS SCHEMA
// =============================================================================

export const testimonialsSchema: BlockSchema = {
  type: 'testimonials',
  name: 'Testimonials',
  description: 'Customer reviews and testimonials',
  icon: 'MessageSquare',
  category: 'content',
  thumbnail: '/thumbnails/blocks/testimonials.png',

  fields: [
    { name: 'title', type: 'string', label: 'Title', group: 'content' },
    { name: 'subtitle', type: 'string', label: 'Subtitle', group: 'content' },
    {
      name: 'source',
      type: 'object',
      label: 'Source',
      group: 'content',
      fields: [
        { name: 'type', type: 'select', label: 'Source Type', options: [
          { value: 'manual', label: 'Manual' },
          { value: 'product', label: 'Product Reviews' },
          { value: 'latest', label: 'Latest Reviews' },
        ], default: 'manual' },
        { name: 'productId', type: 'product', label: 'Product', showWhen: { field: 'source.type', operator: 'equals', value: 'product' } },
        { name: 'limit', type: 'number', label: 'Limit', min: 1, max: 12, default: 6 },
        {
          name: 'testimonials',
          type: 'array',
          label: 'Testimonials',
          showWhen: { field: 'source.type', operator: 'equals', value: 'manual' },
          itemSchema: {
            name: 'testimonial',
            type: 'object',
            label: 'Testimonial',
            fields: [
              { name: 'id', type: 'string', label: 'ID', required: true },
              { name: 'content', type: 'string', label: 'Content', required: true, multiline: true },
              { name: 'author', type: 'object', label: 'Author', fields: [
                { name: 'name', type: 'string', label: 'Name', required: true, width: 'half' },
                { name: 'title', type: 'string', label: 'Title', width: 'half' },
                { name: 'avatar', type: 'media', label: 'Avatar', mediaType: 'image' },
                { name: 'company', type: 'string', label: 'Company' },
              ] },
              { name: 'rating', type: 'number', label: 'Rating', min: 1, max: 5 },
              { name: 'verified', type: 'boolean', label: 'Verified', default: false },
            ],
          },
        },
      ],
    },
    { name: 'layout', type: 'select', label: 'Layout', options: [
      { value: 'carousel', label: 'Carousel' },
      { value: 'grid', label: 'Grid' },
      { value: 'masonry', label: 'Masonry' },
    ], default: 'carousel', group: 'layout' },
    {
      name: 'columns',
      type: 'object',
      label: 'Columns',
      group: 'layout',
      fields: [
        { name: 'mobile', type: 'number', label: 'Mobile', min: 1, max: 2, default: 1, width: 'third' },
        { name: 'tablet', type: 'number', label: 'Tablet', min: 1, max: 3, default: 2, width: 'third' },
        { name: 'desktop', type: 'number', label: 'Desktop', min: 2, max: 4, default: 3, width: 'third' },
      ],
    },
    { name: 'cardStyle', type: 'select', label: 'Card Style', options: [
      { value: 'minimal', label: 'Minimal' },
      { value: 'detailed', label: 'Detailed' },
      { value: 'quote', label: 'Quote' },
    ], default: 'quote', group: 'styling' },
    { name: 'showRating', type: 'boolean', label: 'Show Rating', default: true, group: 'styling', width: 'quarter' },
    { name: 'showAvatar', type: 'boolean', label: 'Show Avatar', default: true, group: 'styling', width: 'quarter' },
    { name: 'showDate', type: 'boolean', label: 'Show Date', default: false, group: 'styling', width: 'quarter' },
    { name: 'showVerifiedBadge', type: 'boolean', label: 'Show Verified', default: true, group: 'styling', width: 'quarter' },
  ],
  includeBaseFields: true,
  defaultConfig: { source: { type: 'manual', testimonials: [] }, layout: 'carousel', cardStyle: 'quote', showRating: true, showAvatar: true },
};

// =============================================================================
// SERVICE PROMOS SCHEMA
// =============================================================================

export const servicePromosSchema: BlockSchema = {
  type: 'service-promos',
  name: 'Service Promos',
  description: 'Highlight services like shipping, returns, and support',
  icon: 'Truck',
  category: 'content',
  thumbnail: '/thumbnails/blocks/service-promos.png',

  fields: [
    { name: 'title', type: 'string', label: 'Title', group: 'content' },
    { name: 'subtitle', type: 'string', label: 'Subtitle', group: 'content' },
    {
      name: 'services',
      type: 'array',
      label: 'Services',
      required: true,
      minItems: 1,
      maxItems: 6,
      group: 'content',
      itemSchema: {
        name: 'service',
        type: 'object',
        label: 'Service',
        fields: [
          { name: 'id', type: 'string', label: 'ID', required: true },
          { name: 'title', type: 'string', label: 'Title', required: true },
          { name: 'description', type: 'string', label: 'Description' },
          { name: 'icon', type: 'icon', label: 'Icon', required: true },
          { name: 'image', type: 'media', label: 'Image', mediaType: 'image' },
          { name: 'url', type: 'url', label: 'URL' },
          { name: 'badge', type: 'string', label: 'Badge' },
          { name: 'features', type: 'array', label: 'Features', itemSchema: { name: 'feature', type: 'string', label: 'Feature' } },
        ],
      },
    },
    { name: 'layout', type: 'select', label: 'Layout', options: [
      { value: 'grid', label: 'Grid' },
      { value: 'carousel', label: 'Carousel' },
      { value: 'list', label: 'List' },
      { value: 'icons', label: 'Icons Only' },
    ], default: 'grid', group: 'layout' },
    {
      name: 'columns',
      type: 'object',
      label: 'Columns',
      group: 'layout',
      fields: [
        { name: 'mobile', type: 'number', label: 'Mobile', min: 1, max: 2, default: 2, width: 'third' },
        { name: 'tablet', type: 'number', label: 'Tablet', min: 2, max: 4, default: 3, width: 'third' },
        { name: 'desktop', type: 'number', label: 'Desktop', min: 3, max: 6, default: 4, width: 'third' },
      ],
    },
    { name: 'cardStyle', type: 'select', label: 'Card Style', options: [
      { value: 'minimal', label: 'Minimal' },
      { value: 'detailed', label: 'Detailed' },
      { value: 'icon-focused', label: 'Icon Focused' },
    ], default: 'minimal', group: 'styling' },
    { name: 'iconStyle', type: 'select', label: 'Icon Style', options: [
      { value: 'circle', label: 'Circle' },
      { value: 'square', label: 'Square' },
      { value: 'none', label: 'None' },
    ], default: 'circle', group: 'styling' },
    { name: 'showFeatures', type: 'boolean', label: 'Show Features', default: false, group: 'styling' },
  ],
  includeBaseFields: true,
  defaultConfig: { services: [], layout: 'grid', cardStyle: 'minimal', iconStyle: 'circle' },
};

// =============================================================================
// BANNER STRIP SCHEMA
// =============================================================================

export const bannerStripSchema: BlockSchema = {
  type: 'banner-strip',
  name: 'Banner Strip',
  description: 'Scrolling or rotating announcement strip',
  icon: 'AlignHorizontalDistributeCenter',
  category: 'campaign',
  thumbnail: '/thumbnails/blocks/banner-strip.png',

  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Items',
      required: true,
      minItems: 1,
      maxItems: 10,
      group: 'content',
      itemSchema: {
        name: 'item',
        type: 'object',
        label: 'Item',
        fields: [
          { name: 'id', type: 'string', label: 'ID', required: true },
          { name: 'text', type: 'string', label: 'Text', required: true },
          { name: 'icon', type: 'icon', label: 'Icon' },
          { name: 'url', type: 'url', label: 'URL' },
        ],
      },
    },
    { name: 'variant', type: 'select', label: 'Variant', options: [
      { value: 'scrolling', label: 'Scrolling' },
      { value: 'static', label: 'Static' },
      { value: 'rotating', label: 'Rotating' },
    ], default: 'scrolling', group: 'layout' },
    { name: 'speed', type: 'select', label: 'Speed', options: [
      { value: 'slow', label: 'Slow' },
      { value: 'medium', label: 'Medium' },
      { value: 'fast', label: 'Fast' },
    ], default: 'medium', group: 'layout' },
    { name: 'pauseOnHover', type: 'boolean', label: 'Pause on Hover', default: true, group: 'layout' },
  ],
  includeBaseFields: true,
  defaultConfig: { items: [], variant: 'scrolling', speed: 'medium', pauseOnHover: true },
};

// =============================================================================
// CUSTOM HTML SCHEMA
// =============================================================================

export const customHtmlSchema: BlockSchema = {
  type: 'custom-html',
  name: 'Custom HTML',
  description: 'Add custom HTML content',
  icon: 'Code',
  category: 'special',
  thumbnail: '/thumbnails/blocks/custom-html.png',
  requiredPermissions: ['STOREFRONTS_ADVANCED'],

  fields: [
    { name: 'html', type: 'code', label: 'HTML', language: 'html', required: true, group: 'content' },
    { name: 'css', type: 'code', label: 'CSS', language: 'css', group: 'content' },
    { name: 'sandboxed', type: 'boolean', label: 'Sandboxed', description: 'Isolate in iframe for security', default: true, group: 'content' },
    { name: 'allowScripts', type: 'boolean', label: 'Allow Scripts', description: 'Enable JavaScript (use with caution)', default: false, group: 'content' },
    { name: 'minHeight', type: 'string', label: 'Min Height', placeholder: '200px', group: 'layout' },
    { name: 'maxHeight', type: 'string', label: 'Max Height', placeholder: '600px', group: 'layout' },
  ],
  includeBaseFields: true,
  defaultConfig: { html: '', sandboxed: true, allowScripts: false },
};

// =============================================================================
// ACTIVITY HUB SCHEMA
// =============================================================================

export const activityHubSchema: BlockSchema = {
  type: 'activity-hub',
  name: 'Activity Hub',
  description: 'Decathlon-style shop by activity navigation',
  icon: 'Activity',
  category: 'navigation',
  thumbnail: '/thumbnails/blocks/activity-hub.png',

  fields: [
    { name: 'title', type: 'string', label: 'Title', group: 'content' },
    { name: 'subtitle', type: 'string', label: 'Subtitle', group: 'content' },
    { name: 'navigationStyle', type: 'select', label: 'Navigation Style', options: [
      { value: 'cards', label: 'Cards' },
      { value: 'icons', label: 'Icons' },
      { value: 'list', label: 'List' },
      { value: 'mega-menu', label: 'Mega Menu' },
    ], default: 'cards', group: 'layout' },
    {
      name: 'activities',
      type: 'array',
      label: 'Activities',
      required: true,
      minItems: 1,
      group: 'content',
      itemSchema: {
        name: 'activity',
        type: 'object',
        label: 'Activity',
        fields: [
          { name: 'id', type: 'string', label: 'ID', required: true },
          { name: 'title', type: 'string', label: 'Title', required: true },
          { name: 'description', type: 'string', label: 'Description' },
          { name: 'icon', type: 'icon', label: 'Icon' },
          { name: 'image', type: 'media', label: 'Image', mediaType: 'image' },
          { name: 'url', type: 'url', label: 'URL', required: true },
          { name: 'productCount', type: 'number', label: 'Product Count' },
          { name: 'featured', type: 'boolean', label: 'Featured', default: false },
          {
            name: 'subActivities',
            type: 'array',
            label: 'Sub-Activities',
            itemSchema: {
              name: 'subActivity',
              type: 'object',
              label: 'Sub-Activity',
              fields: [
                { name: 'id', type: 'string', label: 'ID', required: true },
                { name: 'title', type: 'string', label: 'Title', required: true },
                { name: 'url', type: 'url', label: 'URL', required: true },
              ],
            },
          },
        ],
      },
    },
    { name: 'layout', type: 'select', label: 'Layout', options: [
      { value: 'grid', label: 'Grid' },
      { value: 'carousel', label: 'Carousel' },
      { value: 'sidebar', label: 'Sidebar' },
    ], default: 'grid', group: 'layout' },
    {
      name: 'columns',
      type: 'object',
      label: 'Columns',
      group: 'layout',
      fields: [
        { name: 'mobile', type: 'number', label: 'Mobile', min: 2, max: 4, default: 3, width: 'third' },
        { name: 'tablet', type: 'number', label: 'Tablet', min: 3, max: 5, default: 4, width: 'third' },
        { name: 'desktop', type: 'number', label: 'Desktop', min: 4, max: 8, default: 6, width: 'third' },
      ],
    },
    { name: 'showQuiz', type: 'boolean', label: 'Show Activity Quiz', default: false, group: 'content' },
    {
      name: 'quizConfig',
      type: 'object',
      label: 'Quiz Config',
      showWhen: { field: 'showQuiz', operator: 'equals', value: true },
      group: 'content',
      fields: [
        { name: 'title', type: 'string', label: 'Title' },
        { name: 'description', type: 'string', label: 'Description' },
        { name: 'url', type: 'url', label: 'URL' },
        { name: 'buttonText', type: 'string', label: 'Button Text' },
      ],
    },
    { name: 'cardStyle', type: 'select', label: 'Card Style', options: [
      { value: 'minimal', label: 'Minimal' },
      { value: 'detailed', label: 'Detailed' },
      { value: 'icon-focused', label: 'Icon Focused' },
    ], default: 'detailed', group: 'styling' },
    { name: 'showProductCount', type: 'boolean', label: 'Show Product Count', default: true, group: 'styling', width: 'half' },
    { name: 'showSubActivities', type: 'boolean', label: 'Show Sub-Activities', default: true, group: 'styling', width: 'half' },
  ],
  includeBaseFields: true,
  defaultConfig: { activities: [], navigationStyle: 'cards', layout: 'grid', cardStyle: 'detailed' },
};

// =============================================================================
// EXPORT ALL SCHEMAS
// =============================================================================

export {
  heroSchema,
  featuredProductsSchema,
};

export const ALL_BLOCK_SCHEMAS: BlockSchema[] = [
  heroSchema,
  featuredProductsSchema,
  dealsCarouselSchema,
  collectionStoriesSchema,
  categoryGridSchema,
  newsletterSchema,
  testimonialsSchema,
  servicePromosSchema,
  bannerStripSchema,
  customHtmlSchema,
  activityHubSchema,
];
