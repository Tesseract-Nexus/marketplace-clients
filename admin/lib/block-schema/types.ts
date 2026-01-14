/**
 * Block Schema Types
 *
 * Type definitions for the schema-driven block editor system.
 * These schemas define how block configuration forms are generated.
 */

// =============================================================================
// FIELD TYPES
// =============================================================================

export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'color'
  | 'media'
  | 'richtext'
  | 'markdown'
  | 'code'
  | 'array'
  | 'object'
  | 'datetime'
  | 'date'
  | 'time'
  | 'url'
  | 'icon'
  | 'product'
  | 'category'
  | 'collection'
  | 'json';

export type ValidationRuleType =
  | 'required'
  | 'min'
  | 'max'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'email'
  | 'url'
  | 'custom';

export interface ValidationRule {
  type: ValidationRuleType;
  value?: string | number | boolean;
  message: string;
}

// =============================================================================
// FIELD SCHEMA
// =============================================================================

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

export interface ConditionRule {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value?: string | number | boolean | string[];
}

export interface BlockFieldSchema {
  name: string;
  type: FieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  default?: unknown;
  validation?: ValidationRule[];

  // Select options (for select/multiselect)
  options?: SelectOption[];

  // Array configuration
  itemSchema?: BlockFieldSchema;
  minItems?: number;
  maxItems?: number;

  // Object configuration (nested fields)
  fields?: BlockFieldSchema[];

  // Conditional visibility
  showWhen?: ConditionRule | ConditionRule[];

  // UI hints
  uiComponent?: string;
  width?: 'full' | 'half' | 'third' | 'quarter';
  group?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  helpText?: string;
  helpUrl?: string;

  // Media specific
  mediaType?: 'image' | 'video' | 'lottie' | 'any';
  aspectRatio?: string;
  maxFileSize?: number;

  // Code specific
  language?: 'html' | 'css' | 'javascript' | 'json';

  // Number specific
  min?: number;
  max?: number;
  step?: number;
  unit?: string;

  // String specific
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
}

// =============================================================================
// BLOCK SCHEMA
// =============================================================================

export interface BlockSchemaVariant {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  additionalFields?: BlockFieldSchema[];
  hiddenFields?: string[];
}

export interface BlockSchema {
  type: string;
  name: string;
  description: string;
  icon: string;
  category: BlockCategory;
  thumbnail?: string;

  // Variants
  variants?: BlockSchemaVariant[];
  defaultVariant?: string;

  // Field definitions
  fields: BlockFieldSchema[];

  // Base block fields (common to all blocks)
  includeBaseFields?: boolean;

  // Template defaults
  defaultConfig?: Record<string, unknown>;

  // Constraints
  maxPerPage?: number;
  allowedSections?: string[];
  requiredPermissions?: string[];

  // Preview
  previewComponent?: string;
}

export type BlockCategory =
  | 'hero'
  | 'products'
  | 'collections'
  | 'navigation'
  | 'content'
  | 'campaign'
  | 'engagement'
  | 'special';

export interface BlockCategoryInfo {
  id: BlockCategory;
  name: string;
  description: string;
  icon: string;
}

// =============================================================================
// FIELD GROUPS
// =============================================================================

export interface FieldGroup {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

// =============================================================================
// SCHEMA REGISTRY
// =============================================================================

export interface BlockSchemaRegistry {
  schemas: Map<string, BlockSchema>;
  categories: BlockCategoryInfo[];
  fieldGroups: FieldGroup[];

  getSchema(type: string): BlockSchema | undefined;
  getSchemasByCategory(category: BlockCategory): BlockSchema[];
  getAllSchemas(): BlockSchema[];
}

// =============================================================================
// BASE BLOCK FIELDS
// =============================================================================

export const BASE_BLOCK_FIELDS: BlockFieldSchema[] = [
  // Layout group
  {
    name: 'fullWidth',
    type: 'boolean',
    label: 'Full Width',
    description: 'Extend block to full viewport width',
    default: false,
    group: 'layout',
  },
  {
    name: 'containerWidth',
    type: 'select',
    label: 'Container Width',
    options: [
      { value: 'sm', label: 'Small (640px)' },
      { value: 'md', label: 'Medium (768px)' },
      { value: 'lg', label: 'Large (1024px)' },
      { value: 'xl', label: 'Extra Large (1280px)' },
      { value: 'full', label: 'Full Width' },
    ],
    default: 'lg',
    group: 'layout',
    showWhen: { field: 'fullWidth', operator: 'equals', value: false },
  },
  {
    name: 'padding',
    type: 'object',
    label: 'Padding',
    group: 'layout',
    fields: [
      { name: 'top', type: 'string', label: 'Top', placeholder: '2rem', width: 'quarter' },
      { name: 'bottom', type: 'string', label: 'Bottom', placeholder: '2rem', width: 'quarter' },
      { name: 'left', type: 'string', label: 'Left', placeholder: '1rem', width: 'quarter' },
      { name: 'right', type: 'string', label: 'Right', placeholder: '1rem', width: 'quarter' },
    ],
    collapsible: true,
    collapsed: true,
  },
  {
    name: 'margin',
    type: 'object',
    label: 'Margin',
    group: 'layout',
    fields: [
      { name: 'top', type: 'string', label: 'Top', placeholder: '0', width: 'half' },
      { name: 'bottom', type: 'string', label: 'Bottom', placeholder: '0', width: 'half' },
    ],
    collapsible: true,
    collapsed: true,
  },

  // Visibility group
  {
    name: 'showOnMobile',
    type: 'boolean',
    label: 'Show on Mobile',
    default: true,
    group: 'visibility',
    width: 'third',
  },
  {
    name: 'showOnTablet',
    type: 'boolean',
    label: 'Show on Tablet',
    default: true,
    group: 'visibility',
    width: 'third',
  },
  {
    name: 'showOnDesktop',
    type: 'boolean',
    label: 'Show on Desktop',
    default: true,
    group: 'visibility',
    width: 'third',
  },

  // Styling group
  {
    name: 'backgroundColor',
    type: 'color',
    label: 'Background Color',
    group: 'styling',
    width: 'half',
  },
  {
    name: 'backgroundImage',
    type: 'media',
    label: 'Background Image',
    mediaType: 'image',
    group: 'styling',
  },
  {
    name: 'backgroundGradient',
    type: 'string',
    label: 'Background Gradient',
    placeholder: 'linear-gradient(to right, #000, #333)',
    group: 'styling',
  },
  {
    name: 'borderRadius',
    type: 'string',
    label: 'Border Radius',
    placeholder: '0.5rem',
    group: 'styling',
    width: 'half',
  },
  {
    name: 'shadow',
    type: 'select',
    label: 'Shadow',
    options: [
      { value: 'none', label: 'None' },
      { value: 'sm', label: 'Small' },
      { value: 'md', label: 'Medium' },
      { value: 'lg', label: 'Large' },
      { value: 'xl', label: 'Extra Large' },
    ],
    default: 'none',
    group: 'styling',
    width: 'half',
  },

  // Animation group
  {
    name: 'animation',
    type: 'select',
    label: 'Animation',
    options: [
      { value: 'none', label: 'None' },
      { value: 'fade', label: 'Fade In' },
      { value: 'slide-up', label: 'Slide Up' },
      { value: 'slide-left', label: 'Slide Left' },
      { value: 'slide-right', label: 'Slide Right' },
      { value: 'scale', label: 'Scale' },
      { value: 'blur', label: 'Blur' },
      { value: 'parallax', label: 'Parallax' },
    ],
    default: 'fade',
    group: 'animation',
    width: 'half',
  },
  {
    name: 'animationDelay',
    type: 'number',
    label: 'Animation Delay (ms)',
    min: 0,
    max: 2000,
    step: 50,
    default: 0,
    group: 'animation',
    width: 'quarter',
  },
  {
    name: 'animationDuration',
    type: 'number',
    label: 'Animation Duration (ms)',
    min: 100,
    max: 2000,
    step: 50,
    default: 500,
    group: 'animation',
    width: 'quarter',
  },

  // Analytics group
  {
    name: 'trackingId',
    type: 'string',
    label: 'Tracking ID',
    description: 'Custom ID for analytics events',
    group: 'analytics',
    width: 'half',
  },
  {
    name: 'trackingEvents',
    type: 'multiselect',
    label: 'Tracking Events',
    options: [
      { value: 'view', label: 'View' },
      { value: 'click', label: 'Click' },
      { value: 'scroll', label: 'Scroll' },
      { value: 'interact', label: 'Interact' },
    ],
    group: 'analytics',
    width: 'half',
  },

  // Admin group
  {
    name: 'adminLabel',
    type: 'string',
    label: 'Admin Label',
    description: 'Display name in admin UI',
    group: 'admin',
    width: 'half',
  },
  {
    name: 'adminNotes',
    type: 'string',
    label: 'Admin Notes',
    multiline: true,
    rows: 2,
    group: 'admin',
  },
  {
    name: 'isLocked',
    type: 'boolean',
    label: 'Lock Block',
    description: 'Prevent editing by non-admins',
    default: false,
    group: 'admin',
  },
];

// =============================================================================
// FIELD GROUPS
// =============================================================================

export const DEFAULT_FIELD_GROUPS: FieldGroup[] = [
  {
    id: 'content',
    name: 'Content',
    description: 'Block content and text',
    icon: 'FileText',
  },
  {
    id: 'layout',
    name: 'Layout',
    description: 'Size and positioning',
    icon: 'Layout',
    collapsible: true,
  },
  {
    id: 'visibility',
    name: 'Device Visibility',
    description: 'Show/hide on different devices',
    icon: 'Monitor',
    collapsible: true,
    defaultCollapsed: true,
  },
  {
    id: 'styling',
    name: 'Styling',
    description: 'Colors and appearance',
    icon: 'Palette',
    collapsible: true,
    defaultCollapsed: true,
  },
  {
    id: 'animation',
    name: 'Animation',
    description: 'Entrance animations',
    icon: 'Sparkles',
    collapsible: true,
    defaultCollapsed: true,
  },
  {
    id: 'schedule',
    name: 'Schedule',
    description: 'Time-based visibility',
    icon: 'Calendar',
    collapsible: true,
    defaultCollapsed: true,
  },
  {
    id: 'targeting',
    name: 'Audience Targeting',
    description: 'Personalization rules',
    icon: 'Users',
    collapsible: true,
    defaultCollapsed: true,
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Tracking and events',
    icon: 'BarChart',
    collapsible: true,
    defaultCollapsed: true,
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Internal settings',
    icon: 'Settings',
    collapsible: true,
    defaultCollapsed: true,
  },
];

// =============================================================================
// BLOCK CATEGORIES
// =============================================================================

export const BLOCK_CATEGORIES: BlockCategoryInfo[] = [
  {
    id: 'hero',
    name: 'Hero & Headers',
    description: 'Large header sections with images and text',
    icon: 'Image',
  },
  {
    id: 'products',
    name: 'Products',
    description: 'Product grids, carousels, and showcases',
    icon: 'ShoppingBag',
  },
  {
    id: 'collections',
    name: 'Collections & Stories',
    description: 'Editorial and collection showcases',
    icon: 'Layers',
  },
  {
    id: 'navigation',
    name: 'Navigation',
    description: 'Category grids and activity hubs',
    icon: 'Grid',
  },
  {
    id: 'content',
    name: 'Content',
    description: 'Text, testimonials, and UGC',
    icon: 'FileText',
  },
  {
    id: 'campaign',
    name: 'Campaigns & Promos',
    description: 'Deals, countdowns, and promotional content',
    icon: 'Zap',
  },
  {
    id: 'engagement',
    name: 'Engagement',
    description: 'Newsletter, loyalty, and interactive blocks',
    icon: 'Heart',
  },
  {
    id: 'special',
    name: 'Special',
    description: 'Custom HTML and advanced blocks',
    icon: 'Code',
  },
];
