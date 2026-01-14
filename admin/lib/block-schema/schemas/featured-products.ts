/**
 * Featured Products Block Schema
 */

import { BlockSchema } from '../types';

export const featuredProductsSchema: BlockSchema = {
  type: 'featured-products',
  name: 'Featured Products',
  description: 'Showcase products in a grid, carousel, or featured layout',
  icon: 'ShoppingBag',
  category: 'products',
  thumbnail: '/thumbnails/blocks/featured-products.png',

  variants: [
    { id: 'grid', name: 'Grid', description: 'Standard product grid' },
    { id: 'carousel', name: 'Carousel', description: 'Horizontal scrolling carousel' },
    { id: 'masonry', name: 'Masonry', description: 'Pinterest-style layout' },
    { id: 'featured', name: 'Featured', description: 'One large product with smaller grid' },
    { id: 'editorial', name: 'Editorial', description: 'Products mixed with story cards' },
  ],
  defaultVariant: 'grid',

  fields: [
    // Header
    {
      name: 'title',
      type: 'string',
      label: 'Title',
      placeholder: 'Featured Products',
      group: 'content',
    },
    {
      name: 'subtitle',
      type: 'string',
      label: 'Subtitle',
      placeholder: 'Discover our best sellers',
      group: 'content',
    },

    // Data source
    {
      name: 'source',
      type: 'object',
      label: 'Product Source',
      required: true,
      group: 'content',
      fields: [
        {
          name: 'type',
          type: 'select',
          label: 'Source Type',
          options: [
            { value: 'manual', label: 'Manual Selection' },
            { value: 'collection', label: 'Collection' },
            { value: 'category', label: 'Category' },
            { value: 'tag', label: 'Tag' },
            { value: 'bestsellers', label: 'Best Sellers' },
            { value: 'new-arrivals', label: 'New Arrivals' },
            { value: 'trending', label: 'Trending' },
            { value: 'personalized', label: 'Personalized' },
          ],
          default: 'bestsellers',
        },
        {
          name: 'collectionId',
          type: 'collection',
          label: 'Collection',
          showWhen: { field: 'source.type', operator: 'equals', value: 'collection' },
        },
        {
          name: 'categoryId',
          type: 'category',
          label: 'Category',
          showWhen: { field: 'source.type', operator: 'equals', value: 'category' },
        },
        {
          name: 'tag',
          type: 'string',
          label: 'Tag',
          showWhen: { field: 'source.type', operator: 'equals', value: 'tag' },
        },
        {
          name: 'productIds',
          type: 'array',
          label: 'Products',
          showWhen: { field: 'source.type', operator: 'equals', value: 'manual' },
          itemSchema: {
            name: 'productId',
            type: 'product',
            label: 'Product',
          },
        },
        {
          name: 'limit',
          type: 'number',
          label: 'Product Limit',
          min: 1,
          max: 24,
          default: 8,
        },
      ],
    },

    // Grid options
    {
      name: 'columns',
      type: 'object',
      label: 'Columns',
      group: 'layout',
      fields: [
        { name: 'mobile', type: 'number', label: 'Mobile', min: 1, max: 3, default: 2, width: 'third' },
        { name: 'tablet', type: 'number', label: 'Tablet', min: 2, max: 4, default: 3, width: 'third' },
        { name: 'desktop', type: 'number', label: 'Desktop', min: 3, max: 6, default: 4, width: 'third' },
      ],
    },
    {
      name: 'gap',
      type: 'string',
      label: 'Gap',
      placeholder: '1rem',
      default: '1rem',
      group: 'layout',
    },

    // Card options
    {
      name: 'cardStyle',
      type: 'select',
      label: 'Card Style',
      options: [
        { value: 'default', label: 'Default' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'detailed', label: 'Detailed' },
        { value: 'overlay', label: 'Overlay' },
      ],
      default: 'default',
      group: 'styling',
    },
    {
      name: 'showQuickAdd',
      type: 'boolean',
      label: 'Show Quick Add',
      default: true,
      group: 'styling',
      width: 'half',
    },
    {
      name: 'showWishlist',
      type: 'boolean',
      label: 'Show Wishlist',
      default: true,
      group: 'styling',
      width: 'half',
    },
    {
      name: 'showRating',
      type: 'boolean',
      label: 'Show Rating',
      default: true,
      group: 'styling',
      width: 'half',
    },
    {
      name: 'showBadges',
      type: 'boolean',
      label: 'Show Badges',
      default: true,
      group: 'styling',
      width: 'half',
    },
    {
      name: 'imageAspectRatio',
      type: 'select',
      label: 'Image Aspect Ratio',
      options: [
        { value: '1:1', label: 'Square (1:1)' },
        { value: '4:3', label: 'Landscape (4:3)' },
        { value: '3:4', label: 'Portrait (3:4)' },
        { value: '16:9', label: 'Widescreen (16:9)' },
        { value: 'auto', label: 'Auto' },
      ],
      default: '1:1',
      group: 'styling',
    },

    // View all
    {
      name: 'showViewAll',
      type: 'boolean',
      label: 'Show View All Link',
      default: true,
      group: 'content',
    },
    {
      name: 'viewAllText',
      type: 'string',
      label: 'View All Text',
      default: 'View All',
      group: 'content',
      showWhen: { field: 'showViewAll', operator: 'equals', value: true },
      width: 'half',
    },
    {
      name: 'viewAllUrl',
      type: 'url',
      label: 'View All URL',
      group: 'content',
      showWhen: { field: 'showViewAll', operator: 'equals', value: true },
      width: 'half',
    },
  ],

  includeBaseFields: true,

  defaultConfig: {
    variant: 'grid',
    source: {
      type: 'bestsellers',
      limit: 8,
    },
    columns: {
      mobile: 2,
      tablet: 3,
      desktop: 4,
    },
    gap: '1rem',
    cardStyle: 'default',
    showQuickAdd: true,
    showWishlist: true,
    showRating: true,
    showBadges: true,
    imageAspectRatio: '1:1',
    showViewAll: true,
    viewAllText: 'View All',
  },
};
