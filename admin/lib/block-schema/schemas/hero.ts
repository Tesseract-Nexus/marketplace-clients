/**
 * Hero Block Schema
 */

import { BlockSchema, BlockFieldSchema } from '../types';

const HERO_SLIDE_SCHEMA: BlockFieldSchema = {
  name: 'slide',
  type: 'object',
  label: 'Slide',
  fields: [
    {
      name: 'id',
      type: 'string',
      label: 'ID',
      required: true,
    },
    {
      name: 'media',
      type: 'object',
      label: 'Media',
      required: true,
      fields: [
        { name: 'id', type: 'string', label: 'ID', required: true },
        {
          name: 'type',
          type: 'select',
          label: 'Type',
          options: [
            { value: 'image', label: 'Image' },
            { value: 'video', label: 'Video' },
          ],
          default: 'image',
          width: 'half',
        },
        { name: 'url', type: 'media', label: 'URL', mediaType: 'any', required: true },
        { name: 'alt', type: 'string', label: 'Alt Text' },
        { name: 'mobileUrl', type: 'media', label: 'Mobile Image', mediaType: 'image' },
        {
          name: 'aspectRatio',
          type: 'select',
          label: 'Aspect Ratio',
          options: [
            { value: '16:9', label: '16:9 (Widescreen)' },
            { value: '21:9', label: '21:9 (Ultrawide)' },
            { value: '4:3', label: '4:3' },
            { value: '1:1', label: '1:1 (Square)' },
            { value: 'auto', label: 'Auto' },
          ],
          default: '16:9',
          width: 'half',
        },
        {
          name: 'overlay',
          type: 'object',
          label: 'Overlay',
          collapsible: true,
          collapsed: true,
          fields: [
            {
              name: 'type',
              type: 'select',
              label: 'Type',
              options: [
                { value: 'none', label: 'None' },
                { value: 'gradient', label: 'Gradient' },
                { value: 'solid', label: 'Solid' },
              ],
              width: 'half',
            },
            { name: 'color', type: 'color', label: 'Color', width: 'half' },
            { name: 'opacity', type: 'number', label: 'Opacity', min: 0, max: 100, step: 5, width: 'half' },
            {
              name: 'direction',
              type: 'select',
              label: 'Direction',
              options: [
                { value: 'to-top', label: 'To Top' },
                { value: 'to-bottom', label: 'To Bottom' },
                { value: 'to-left', label: 'To Left' },
                { value: 'to-right', label: 'To Right' },
                { value: 'radial', label: 'Radial' },
              ],
              width: 'half',
              showWhen: { field: 'overlay.type', operator: 'equals', value: 'gradient' },
            },
          ],
        },
      ],
    },
    {
      name: 'badge',
      type: 'object',
      label: 'Badge',
      collapsible: true,
      collapsed: true,
      fields: [
        { name: 'text', type: 'string', label: 'Text', width: 'half' },
        { name: 'icon', type: 'icon', label: 'Icon', width: 'half' },
        {
          name: 'style',
          type: 'select',
          label: 'Style',
          options: [
            { value: 'primary', label: 'Primary' },
            { value: 'secondary', label: 'Secondary' },
            { value: 'accent', label: 'Accent' },
            { value: 'warning', label: 'Warning' },
            { value: 'success', label: 'Success' },
          ],
        },
      ],
    },
    {
      name: 'headline',
      type: 'string',
      label: 'Headline',
      required: true,
      placeholder: 'Your headline here',
    },
    {
      name: 'subheadline',
      type: 'string',
      label: 'Subheadline',
      placeholder: 'Supporting text',
    },
    {
      name: 'description',
      type: 'string',
      label: 'Description',
      multiline: true,
      rows: 2,
    },
    {
      name: 'ctas',
      type: 'array',
      label: 'Call-to-Action Buttons',
      maxItems: 3,
      itemSchema: {
        name: 'cta',
        type: 'object',
        label: 'Button',
        fields: [
          { name: 'id', type: 'string', label: 'ID', required: true },
          { name: 'label', type: 'string', label: 'Label', required: true, width: 'half' },
          { name: 'href', type: 'url', label: 'URL', required: true, width: 'half' },
          {
            name: 'style',
            type: 'select',
            label: 'Style',
            options: [
              { value: 'primary', label: 'Primary' },
              { value: 'secondary', label: 'Secondary' },
              { value: 'outline', label: 'Outline' },
              { value: 'ghost', label: 'Ghost' },
              { value: 'gradient', label: 'Gradient' },
              { value: 'glow', label: 'Glow' },
              { value: 'glass', label: 'Glass' },
            ],
            default: 'primary',
            width: 'half',
          },
          {
            name: 'size',
            type: 'select',
            label: 'Size',
            options: [
              { value: 'sm', label: 'Small' },
              { value: 'md', label: 'Medium' },
              { value: 'lg', label: 'Large' },
              { value: 'xl', label: 'Extra Large' },
            ],
            default: 'md',
            width: 'half',
          },
          { name: 'icon', type: 'icon', label: 'Icon', width: 'half' },
          {
            name: 'iconPosition',
            type: 'select',
            label: 'Icon Position',
            options: [
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
            ],
            default: 'right',
            width: 'half',
          },
          { name: 'openInNewTab', type: 'boolean', label: 'Open in New Tab', default: false },
        ],
      },
    },
    {
      name: 'contentAlignment',
      type: 'select',
      label: 'Content Alignment',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ],
      default: 'center',
      width: 'half',
    },
    {
      name: 'verticalAlignment',
      type: 'select',
      label: 'Vertical Alignment',
      options: [
        { value: 'top', label: 'Top' },
        { value: 'center', label: 'Center' },
        { value: 'bottom', label: 'Bottom' },
      ],
      default: 'center',
      width: 'half',
    },
    {
      name: 'textColor',
      type: 'select',
      label: 'Text Color',
      options: [
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'auto', label: 'Auto' },
      ],
      default: 'auto',
    },
    {
      name: 'countdown',
      type: 'object',
      label: 'Countdown Timer',
      collapsible: true,
      collapsed: true,
      fields: [
        { name: 'enabled', type: 'boolean', label: 'Enable Countdown', default: false },
        { name: 'endDate', type: 'datetime', label: 'End Date', showWhen: { field: 'countdown.enabled', operator: 'equals', value: true } },
        { name: 'showDays', type: 'boolean', label: 'Show Days', default: true, width: 'quarter' },
        { name: 'showHours', type: 'boolean', label: 'Show Hours', default: true, width: 'quarter' },
        { name: 'showMinutes', type: 'boolean', label: 'Show Minutes', default: true, width: 'quarter' },
        { name: 'showSeconds', type: 'boolean', label: 'Show Seconds', default: true, width: 'quarter' },
        {
          name: 'style',
          type: 'select',
          label: 'Style',
          options: [
            { value: 'digital', label: 'Digital' },
            { value: 'flip', label: 'Flip' },
            { value: 'circular', label: 'Circular' },
            { value: 'minimal', label: 'Minimal' },
          ],
          default: 'digital',
        },
        { name: 'expiredMessage', type: 'string', label: 'Expired Message' },
      ],
    },
  ],
};

export const heroSchema: BlockSchema = {
  type: 'hero',
  name: 'Hero',
  description: 'Large header section with images, text, and call-to-action',
  icon: 'Image',
  category: 'hero',
  thumbnail: '/thumbnails/blocks/hero.png',

  variants: [
    {
      id: 'editorial',
      name: 'Editorial',
      description: 'Myntra-style with gradient overlays and editorial copy',
      thumbnail: '/thumbnails/blocks/hero-editorial.png',
    },
    {
      id: 'promotional',
      name: 'Promotional',
      description: 'Flipkart-style solid shapes, deal-focused',
      thumbnail: '/thumbnails/blocks/hero-promotional.png',
    },
    {
      id: 'immersive',
      name: 'Immersive',
      description: 'Full-bleed photography with minimal overlay',
      thumbnail: '/thumbnails/blocks/hero-immersive.png',
    },
    {
      id: 'split',
      name: 'Split',
      description: 'Half image, half content',
      thumbnail: '/thumbnails/blocks/hero-split.png',
    },
    {
      id: 'carousel',
      name: 'Carousel',
      description: 'Multiple slides with navigation',
      thumbnail: '/thumbnails/blocks/hero-carousel.png',
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Simple text and CTA, minimal design',
      thumbnail: '/thumbnails/blocks/hero-minimal.png',
    },
    {
      id: 'parallax',
      name: 'Parallax',
      description: 'Parallax scrolling effect',
      thumbnail: '/thumbnails/blocks/hero-parallax.png',
    },
  ],
  defaultVariant: 'editorial',

  fields: [
    // Slides
    {
      name: 'slides',
      type: 'array',
      label: 'Slides',
      required: true,
      minItems: 1,
      maxItems: 10,
      itemSchema: HERO_SLIDE_SCHEMA,
      group: 'content',
    },

    // Carousel settings
    {
      name: 'autoplay',
      type: 'boolean',
      label: 'Autoplay',
      description: 'Auto-advance slides',
      default: true,
      group: 'content',
      width: 'quarter',
      showWhen: { field: 'variant', operator: 'equals', value: 'carousel' },
    },
    {
      name: 'autoplayInterval',
      type: 'number',
      label: 'Interval (ms)',
      min: 2000,
      max: 10000,
      step: 500,
      default: 5000,
      group: 'content',
      width: 'quarter',
      showWhen: [
        { field: 'variant', operator: 'equals', value: 'carousel' },
        { field: 'autoplay', operator: 'equals', value: true },
      ],
    },
    {
      name: 'showDots',
      type: 'boolean',
      label: 'Show Dots',
      default: true,
      group: 'content',
      width: 'quarter',
      showWhen: { field: 'variant', operator: 'equals', value: 'carousel' },
    },
    {
      name: 'showArrows',
      type: 'boolean',
      label: 'Show Arrows',
      default: true,
      group: 'content',
      width: 'quarter',
      showWhen: { field: 'variant', operator: 'equals', value: 'carousel' },
    },

    // Height settings
    {
      name: 'minHeight',
      type: 'string',
      label: 'Min Height',
      placeholder: '500px or 80vh',
      default: '70vh',
      group: 'layout',
      width: 'third',
    },
    {
      name: 'maxHeight',
      type: 'string',
      label: 'Max Height',
      placeholder: '800px or 90vh',
      group: 'layout',
      width: 'third',
    },
    {
      name: 'mobileMinHeight',
      type: 'string',
      label: 'Mobile Min Height',
      placeholder: '400px or 60vh',
      default: '50vh',
      group: 'layout',
      width: 'third',
    },

    // Stats bar
    {
      name: 'showStats',
      type: 'boolean',
      label: 'Show Stats Bar',
      default: false,
      group: 'content',
    },
    {
      name: 'stats',
      type: 'array',
      label: 'Stats',
      maxItems: 4,
      group: 'content',
      showWhen: { field: 'showStats', operator: 'equals', value: true },
      itemSchema: {
        name: 'stat',
        type: 'object',
        label: 'Stat',
        fields: [
          { name: 'icon', type: 'icon', label: 'Icon', width: 'quarter' },
          { name: 'value', type: 'string', label: 'Value', width: 'quarter' },
          { name: 'label', type: 'string', label: 'Label', width: 'half' },
          { name: 'animated', type: 'boolean', label: 'Animate', default: true },
        ],
      },
    },

    // Decorations
    {
      name: 'showDecorations',
      type: 'boolean',
      label: 'Show Decorations',
      default: false,
      group: 'styling',
    },
    {
      name: 'decorations',
      type: 'object',
      label: 'Decoration Types',
      group: 'styling',
      showWhen: { field: 'showDecorations', operator: 'equals', value: true },
      fields: [
        { name: 'blobs', type: 'boolean', label: 'Blobs', width: 'quarter' },
        { name: 'particles', type: 'boolean', label: 'Particles', width: 'quarter' },
        { name: 'aurora', type: 'boolean', label: 'Aurora', width: 'quarter' },
        { name: 'gradient', type: 'boolean', label: 'Gradient', width: 'quarter' },
      ],
    },

    // Scroll indicator
    {
      name: 'showScrollIndicator',
      type: 'boolean',
      label: 'Show Scroll Indicator',
      default: false,
      group: 'content',
    },
  ],

  includeBaseFields: true,

  defaultConfig: {
    variant: 'editorial',
    slides: [
      {
        id: 'slide-1',
        media: {
          id: 'media-1',
          type: 'image',
          url: '',
          alt: 'Hero image',
        },
        headline: 'Welcome to Our Store',
        subheadline: 'Discover amazing products',
        ctas: [
          {
            id: 'cta-1',
            label: 'Shop Now',
            href: '/products',
            style: 'primary',
            size: 'lg',
          },
        ],
        contentAlignment: 'center',
        verticalAlignment: 'center',
        textColor: 'auto',
      },
    ],
    minHeight: '70vh',
    mobileMinHeight: '50vh',
    showOnMobile: true,
    showOnTablet: true,
    showOnDesktop: true,
    animation: 'fade',
  },
};
