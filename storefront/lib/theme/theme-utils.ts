import {
  StorefrontSettings,
  ThemeTemplate,
  THEME_PRESETS,
  BorderRadius,
  ShadowIntensity,
  AnimationSpeed,
  HeadingScale,
  LineHeight,
  LetterSpacing,
  ContainerWidth,
  ContentPadding,
  SectionSpacing,
  ButtonStyle,
  CardStyleType,
} from '@/types/storefront';

// ========================================
// Color Utilities
// ========================================

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result || !result[1] || !result[2] || !result[3]) return null;
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const { r, g, b } = rgb;
  const toLinear = (c: number) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function isColorDark(hex: string): boolean {
  return getLuminance(hex) < 0.5;
}

export function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  const amount = Math.round(255 * (percent / 100));

  return rgbToHex(
    Math.min(255, r + amount),
    Math.min(255, g + amount),
    Math.min(255, b + amount)
  );
}

export function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  const amount = Math.round(255 * (percent / 100));

  return rgbToHex(
    Math.max(0, r - amount),
    Math.max(0, g - amount),
    Math.max(0, b - amount)
  );
}

export function getContrastColor(hex: string): string {
  return isColorDark(hex) ? '#FFFFFF' : '#000000';
}

export function getReadableTextColor(bgHex: string, preferDark: boolean = false): string {
  // For text that needs to be readable on a background
  // Returns either the original color or a contrasting version
  const luminance = getLuminance(bgHex);
  if (preferDark) {
    // In dark mode, we want lighter text
    return luminance > 0.5 ? darkenColor(bgHex, 30) : bgHex;
  }
  // In light mode, we want darker text for readability
  return luminance > 0.5 ? bgHex : lightenColor(bgHex, 20);
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function ensureContrast(fgHex: string, bgHex: string, minRatio: number = 4.5): string {
  // Adjust foreground color to ensure minimum contrast ratio with background
  let ratio = getContrastRatio(fgHex, bgHex);
  if (ratio >= minRatio) return fgHex;

  const bgLuminance = getLuminance(bgHex);

  // If background is dark, lighten the foreground; otherwise darken it
  let adjusted = fgHex;
  for (let i = 0; i < 10 && ratio < minRatio; i++) {
    adjusted = bgLuminance < 0.5 ? lightenColor(adjusted, 10) : darkenColor(adjusted, 10);
    ratio = getContrastRatio(adjusted, bgHex);
  }

  return adjusted;
}

// ========================================
// Theme Preset Helpers
// ========================================

export function getThemePreset(template: ThemeTemplate) {
  const preset = THEME_PRESETS.find((p) => p.id === template);
  const fallback = THEME_PRESETS[0];
  return preset ?? fallback ?? {
    id: 'vibrant' as ThemeTemplate,
    name: 'Vibrant',
    description: 'Bold gradients and eye-catching colors',
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    accentColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    textColor: '#18181B',
  };
}

// ========================================
// CSS Variable Mappings
// ========================================

const BORDER_RADIUS_VALUES: Record<BorderRadius, string> = {
  none: '0',
  small: '0.25rem',
  medium: '0.5rem',
  large: '0.75rem',
  full: '9999px',
};

const SHADOW_VALUES: Record<ShadowIntensity, string> = {
  none: 'none',
  subtle: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  medium: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  strong: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
};

const ANIMATION_SPEED_VALUES: Record<AnimationSpeed, string> = {
  none: '0ms',
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
};

const HEADING_SCALE_VALUES: Record<HeadingScale, { h1: string; h2: string; h3: string; h4: string }> = {
  compact: { h1: '2rem', h2: '1.5rem', h3: '1.25rem', h4: '1.125rem' },
  default: { h1: '2.5rem', h2: '2rem', h3: '1.5rem', h4: '1.25rem' },
  large: { h1: '3rem', h2: '2.5rem', h3: '1.75rem', h4: '1.5rem' },
};

const LINE_HEIGHT_VALUES: Record<LineHeight, string> = {
  tight: '1.25',
  normal: '1.5',
  relaxed: '1.75',
};

const LETTER_SPACING_VALUES: Record<LetterSpacing, string> = {
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
};

const CONTAINER_WIDTH_VALUES: Record<ContainerWidth, string> = {
  narrow: '1024px',
  default: '1280px',
  wide: '1536px',
  full: '100%',
};

const CONTENT_PADDING_VALUES: Record<ContentPadding, string> = {
  compact: '1rem',
  default: '1.5rem',
  spacious: '2rem',
};

const SECTION_SPACING_VALUES: Record<SectionSpacing, string> = {
  compact: '3rem',
  default: '5rem',
  spacious: '7rem',
};

const BUTTON_RADIUS_VALUES: Record<ButtonStyle, string> = {
  square: '0',
  rounded: '0.5rem',
  pill: '9999px',
};

const CARD_SHADOW_VALUES: Record<CardStyleType, string> = {
  flat: 'none',
  bordered: 'none',
  elevated: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
};

// ========================================
// Serif Font Detection (for editorial typography)
// ========================================

/**
 * List of serif fonts that should use editorial letter-spacing
 */
const SERIF_FONTS = [
  'Playfair Display',
  'Cormorant Garamond',
  'Libre Baskerville',
  'DM Serif Display',
  'Merriweather',
  'Lora',
  'Crimson Pro',
  'Source Serif Pro',
];

/**
 * Checks if a font is a serif font
 */
function isSerifFont(fontName: string): boolean {
  return SERIF_FONTS.some(serif => fontName.toLowerCase().includes(serif.toLowerCase()));
}

// ========================================
// CSS Variable Generator
// ========================================

export function generateCssVariables(settings: StorefrontSettings): Record<string, string> {
  const preset = getThemePreset(settings.themeTemplate);
  const typography = settings.typographyConfig;
  const layout = settings.layoutConfig;
  const spacing = settings.spacingStyleConfig;
  const headingScales = typography ? HEADING_SCALE_VALUES[typography.headingScale] : HEADING_SCALE_VALUES.default;

  return {
    // Theme Colors
    '--tenant-primary': settings.primaryColor || preset.primaryColor,
    '--tenant-primary-light': lightenColor(settings.primaryColor || preset.primaryColor, 15),
    '--tenant-primary-dark': darkenColor(settings.primaryColor || preset.primaryColor, 15),
    '--tenant-secondary': settings.secondaryColor || preset.secondaryColor,
    '--tenant-secondary-light': lightenColor(settings.secondaryColor || preset.secondaryColor, 15),
    '--tenant-secondary-dark': darkenColor(settings.secondaryColor || preset.secondaryColor, 15),
    '--tenant-accent': settings.accentColor || preset.accentColor,
    '--tenant-background': preset.backgroundColor,
    '--tenant-foreground': preset.textColor,
    '--tenant-primary-foreground': getContrastColor(settings.primaryColor || preset.primaryColor),
    '--tenant-secondary-foreground': getContrastColor(settings.secondaryColor || preset.secondaryColor),

    // Accessible text colors (for text on light/dark backgrounds)
    '--tenant-primary-readable': ensureContrast(settings.primaryColor || preset.primaryColor, '#FFFFFF'),
    '--tenant-primary-readable-dark': ensureContrast(settings.primaryColor || preset.primaryColor, '#18181B'),
    '--tenant-secondary-readable': ensureContrast(settings.secondaryColor || preset.secondaryColor, '#FFFFFF'),
    '--tenant-secondary-readable-dark': ensureContrast(settings.secondaryColor || preset.secondaryColor, '#18181B'),

    // Text color for use on gradient backgrounds (derived from primary luminance)
    '--tenant-gradient-text': isColorDark(settings.primaryColor || preset.primaryColor) ? '#FFFFFF' : '#18181B',

    // Typography - Detect serif fonts and use appropriate fallback
    '--font-heading': `'${typography?.headingFont || settings.fontPrimary}', ${isSerifFont(typography?.headingFont || settings.fontPrimary) ? 'Georgia, serif' : 'sans-serif'}`,
    '--font-body': `'${typography?.bodyFont || settings.fontSecondary}', ${isSerifFont(typography?.bodyFont || settings.fontSecondary) ? 'Georgia, serif' : 'sans-serif'}`,
    '--font-size-base': `${typography?.baseFontSize || 16}px`,
    '--font-weight-heading': String(typography?.headingWeight || 700),
    '--font-weight-body': String(typography?.bodyWeight || 400),
    '--line-height-heading': LINE_HEIGHT_VALUES[typography?.headingLineHeight || 'normal'],
    '--line-height-body': LINE_HEIGHT_VALUES[typography?.bodyLineHeight || 'normal'],
    '--letter-spacing-heading': LETTER_SPACING_VALUES[typography?.headingLetterSpacing || 'normal'],
    '--heading-h1': headingScales.h1,
    '--heading-h2': headingScales.h2,
    '--heading-h3': headingScales.h3,
    '--heading-h4': headingScales.h4,

    // Layout
    '--container-width': CONTAINER_WIDTH_VALUES[layout?.containerWidth || 'default'],
    '--content-padding': CONTENT_PADDING_VALUES[layout?.contentPadding || 'default'],
    '--section-spacing': SECTION_SPACING_VALUES[spacing?.sectionSpacing || 'default'],

    // Spacing & Style
    '--border-radius': BORDER_RADIUS_VALUES[spacing?.borderRadius || 'medium'],
    '--button-radius': BUTTON_RADIUS_VALUES[spacing?.buttonStyle || 'rounded'],
    '--image-radius': BORDER_RADIUS_VALUES[spacing?.imageRadius || 'medium'],
    '--card-shadow': CARD_SHADOW_VALUES[spacing?.cardStyle || 'elevated'],
    '--shadow': SHADOW_VALUES[spacing?.shadowIntensity || 'subtle'],
    '--animation-speed': ANIMATION_SPEED_VALUES[spacing?.animationSpeed || 'normal'],

    // Header
    '--header-height': settings.layoutConfig?.headerHeight === 'compact' ? '56px' :
                       settings.layoutConfig?.headerHeight === 'tall' ? '80px' : '64px',

    // Gradients
    '--tenant-gradient': `linear-gradient(135deg, ${settings.primaryColor || preset.primaryColor}, ${settings.secondaryColor || preset.secondaryColor})`,
    '--tenant-gradient-subtle': `linear-gradient(135deg, ${lightenColor(settings.primaryColor || preset.primaryColor, 40)}, ${lightenColor(settings.secondaryColor || preset.secondaryColor, 40)})`,
  };
}

// ========================================
// CSS Variable Injection
// ========================================

export function injectCssVariables(variables: Record<string, string>): void {
  const root = document.documentElement;
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

// Critical CSS variables that need !important to override globals.css defaults
const CRITICAL_VARIABLES = [
  '--tenant-primary',
  '--tenant-primary-light',
  '--tenant-primary-dark',
  '--tenant-secondary',
  '--tenant-secondary-light',
  '--tenant-secondary-dark',
  '--tenant-accent',
  '--tenant-background',
  '--tenant-foreground',
  '--tenant-primary-foreground',
  '--tenant-secondary-foreground',
  '--tenant-gradient',
  '--tenant-gradient-subtle',
];

export function generateCssString(variables: Record<string, string>): string {
  return Object.entries(variables)
    .map(([key, value]) => {
      // Add !important to critical theme variables to prevent FOUC
      const important = CRITICAL_VARIABLES.includes(key) ? ' !important' : '';
      return `${key}: ${value}${important};`;
    })
    .join('\n  ');
}

// ========================================
// Dark Mode Helpers
// ========================================

export function isDarkTheme(template: ThemeTemplate): boolean {
  return template === 'dark' || template === 'neon' || template === 'electronics' || template === 'streetwear';
}

// ========================================
// Industry-Specific Theme Utilities
// ========================================

export type IndustryCategory =
  | 'fashion'
  | 'food'
  | 'tech'
  | 'beauty'
  | 'kids'
  | 'luxury'
  | 'general';

export function getIndustryCategory(template: ThemeTemplate): IndustryCategory {
  switch (template) {
    case 'fashion':
    case 'streetwear':
      return 'fashion';
    case 'food':
    case 'bakery':
    case 'cafe':
      return 'food';
    case 'electronics':
      return 'tech';
    case 'beauty':
    case 'wellness':
      return 'beauty';
    case 'kids':
      return 'kids';
    case 'jewelry':
    case 'luxury':
      return 'luxury';
    default:
      return 'general';
  }
}

// Recommended product card style per industry
export function getRecommendedCardStyle(template: ThemeTemplate): string {
  switch (template) {
    case 'fashion':
    case 'streetwear':
      return 'minimal'; // Clean, editorial look
    case 'food':
    case 'bakery':
    case 'cafe':
      return 'elevated'; // Appetizing with shadows
    case 'electronics':
      return 'bordered'; // Tech, precise
    case 'jewelry':
    case 'luxury':
      return 'glass'; // Premium glass effect
    case 'kids':
      return 'elevated'; // Playful with depth
    default:
      return 'elevated';
  }
}

// Recommended image aspect ratio per industry
export function getRecommendedAspectRatio(template: ThemeTemplate): 'square' | 'portrait' | 'landscape' {
  switch (template) {
    case 'fashion':
    case 'streetwear':
    case 'beauty':
      return 'portrait'; // Models, clothing looks better in portrait
    case 'food':
    case 'bakery':
    case 'cafe':
      return 'square'; // Food looks appetizing in square
    case 'electronics':
    case 'home':
      return 'landscape'; // Products with details
    default:
      return 'square';
  }
}

// Recommended hover effect per industry
export function getRecommendedHoverEffect(template: ThemeTemplate): 'none' | 'zoom' | 'fade' | 'slide' {
  switch (template) {
    case 'fashion':
    case 'beauty':
      return 'fade'; // Subtle, elegant
    case 'electronics':
    case 'sports':
      return 'zoom'; // Dynamic, detailed
    case 'jewelry':
    case 'luxury':
      return 'none'; // Let the product speak
    case 'kids':
      return 'zoom'; // Fun, engaging
    default:
      return 'zoom';
  }
}

export function getEffectiveColorMode(
  colorMode: StorefrontSettings['colorMode'],
  systemPrefersDark: boolean
): 'light' | 'dark' {
  if (colorMode === 'light') return 'light';
  if (colorMode === 'dark') return 'dark';
  if (colorMode === 'system') return systemPrefersDark ? 'dark' : 'light';
  // 'both' - use system preference
  return systemPrefersDark ? 'dark' : 'light';
}

// ========================================
// Enterprise Validation Utilities
// ========================================

/**
 * Validates if a string is a valid hex color code
 * Supports both 3-digit (#RGB) and 6-digit (#RRGGBB) formats
 */
export function isValidHexColor(color: string): boolean {
  if (!color) return false;
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Normalizes a hex color to 6-digit format
 * Converts #RGB to #RRGGBB
 */
export function normalizeHexColor(color: string): string {
  if (!isValidHexColor(color)) return color;
  const hex = color.replace('#', '');
  if (hex.length === 3) {
    return '#' + hex.split('').map(c => c + c).join('');
  }
  return color.toUpperCase();
}

/**
 * Validates theme template ID against known presets
 */
export function isValidThemeTemplate(template: string): template is ThemeTemplate {
  const validTemplates: ThemeTemplate[] = [
    'vibrant', 'minimal', 'dark', 'neon', 'ocean', 'sunset',
    'forest', 'luxury', 'rose', 'corporate', 'earthy', 'arctic',
    'fashion', 'streetwear', 'food', 'bakery', 'cafe', 'electronics',
    'beauty', 'wellness', 'jewelry', 'kids', 'sports', 'home',
    'editorial'
  ];
  return validTemplates.includes(template as ThemeTemplate);
}

/**
 * Checks if the theme template is the editorial design system
 */
export function isEditorialTheme(template: ThemeTemplate): boolean {
  return template === 'editorial';
}

/**
 * Enterprise-grade theme validation
 * Validates all color properties meet WCAG accessibility standards
 */
export interface ThemeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  accessibilityScore: 'AAA' | 'AA' | 'A' | 'FAIL';
}

export function validateThemeColors(
  primaryColor: string,
  secondaryColor: string,
  backgroundColor: string,
  textColor: string
): ThemeValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate color formats
  if (!isValidHexColor(primaryColor)) {
    errors.push('Primary color must be a valid hex color (e.g., #8B5CF6)');
  }
  if (!isValidHexColor(secondaryColor)) {
    errors.push('Secondary color must be a valid hex color');
  }
  if (!isValidHexColor(backgroundColor)) {
    errors.push('Background color must be a valid hex color');
  }
  if (!isValidHexColor(textColor)) {
    errors.push('Text color must be a valid hex color');
  }

  // Check accessibility contrast ratios (WCAG 2.1)
  let accessibilityScore: ThemeValidationResult['accessibilityScore'] = 'FAIL';

  if (errors.length === 0) {
    const textBgContrast = getContrastRatio(textColor, backgroundColor);
    const primaryBgContrast = getContrastRatio(primaryColor, backgroundColor);

    // WCAG AAA requires 7:1 for normal text
    if (textBgContrast >= 7) {
      accessibilityScore = 'AAA';
    }
    // WCAG AA requires 4.5:1 for normal text
    else if (textBgContrast >= 4.5) {
      accessibilityScore = 'AA';
    }
    // WCAG A requires 3:1 for large text
    else if (textBgContrast >= 3) {
      accessibilityScore = 'A';
      warnings.push(`Text contrast ratio (${textBgContrast.toFixed(2)}:1) meets minimum but consider improving for better accessibility`);
    }
    else {
      errors.push(`Text contrast ratio (${textBgContrast.toFixed(2)}:1) is below WCAG minimum. Minimum 4.5:1 required.`);
    }

    // Check primary color against background
    if (primaryBgContrast < 3) {
      warnings.push(`Primary color may have low visibility on background (${primaryBgContrast.toFixed(2)}:1 contrast)`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    accessibilityScore: errors.length === 0 ? accessibilityScore : 'FAIL'
  };
}

// ========================================
// Theme Configuration Helpers
// ========================================

/**
 * Gets recommended configuration for a given industry/theme
 * Returns optimal settings for the storefront based on the theme template
 */
export interface RecommendedThemeConfig {
  cardStyle: string;
  aspectRatio: 'square' | 'portrait' | 'landscape';
  hoverEffect: 'none' | 'zoom' | 'fade' | 'slide';
  gridColumns: { mobile: 1 | 2; tablet: 2 | 3; desktop: 3 | 4 | 5 };
  animationSpeed: 'none' | 'fast' | 'normal' | 'slow';
  shadowIntensity: 'none' | 'subtle' | 'medium' | 'strong';
}

export function getRecommendedThemeConfig(template: ThemeTemplate): RecommendedThemeConfig {
  const baseConfig: RecommendedThemeConfig = {
    cardStyle: getRecommendedCardStyle(template),
    aspectRatio: getRecommendedAspectRatio(template),
    hoverEffect: getRecommendedHoverEffect(template),
    gridColumns: { mobile: 2, tablet: 3, desktop: 4 },
    animationSpeed: 'normal',
    shadowIntensity: 'subtle',
  };

  // Industry-specific adjustments
  switch (template) {
    case 'fashion':
    case 'streetwear':
      return { ...baseConfig, gridColumns: { mobile: 2, tablet: 3, desktop: 3 }, animationSpeed: 'fast' };
    case 'jewelry':
    case 'luxury':
      return { ...baseConfig, gridColumns: { mobile: 2, tablet: 2, desktop: 3 }, animationSpeed: 'slow', shadowIntensity: 'none' };
    case 'electronics':
      return { ...baseConfig, gridColumns: { mobile: 2, tablet: 3, desktop: 4 }, shadowIntensity: 'medium' };
    case 'kids':
      return { ...baseConfig, animationSpeed: 'fast', shadowIntensity: 'strong' };
    case 'food':
    case 'bakery':
    case 'cafe':
      return { ...baseConfig, gridColumns: { mobile: 2, tablet: 3, desktop: 4 }, shadowIntensity: 'medium' };
    default:
      return baseConfig;
  }
}

/**
 * Merges custom theme settings with preset defaults
 * Ensures all required fields have valid values
 */
export function mergeThemeWithPreset(
  settings: Partial<StorefrontSettings>,
  template: ThemeTemplate
): { primaryColor: string; secondaryColor: string; accentColor: string; backgroundColor: string; textColor: string } {
  const preset = getThemePreset(template);
  return {
    primaryColor: settings.primaryColor || preset.primaryColor,
    secondaryColor: settings.secondaryColor || preset.secondaryColor,
    accentColor: settings.accentColor || preset.accentColor,
    backgroundColor: preset.backgroundColor,
    textColor: preset.textColor,
  };
}

// ========================================
// Performance & Caching Utilities
// ========================================

// Memoization cache for CSS variable generation
const cssVariableCache = new Map<string, Record<string, string>>();

/**
 * Generates CSS variables with memoization for performance
 * Uses content hash to detect if regeneration is needed
 */
export function generateCssVariablesCached(settings: StorefrontSettings): Record<string, string> {
  // Create a cache key from relevant settings
  const cacheKey = JSON.stringify({
    template: settings.themeTemplate,
    primary: settings.primaryColor,
    secondary: settings.secondaryColor,
    accent: settings.accentColor,
    typography: settings.typographyConfig,
    layout: settings.layoutConfig,
    spacing: settings.spacingStyleConfig,
  });

  if (cssVariableCache.has(cacheKey)) {
    return cssVariableCache.get(cacheKey)!;
  }

  const variables = generateCssVariables(settings);
  cssVariableCache.set(cacheKey, variables);

  // Limit cache size to prevent memory leaks
  if (cssVariableCache.size > 100) {
    const firstKey = cssVariableCache.keys().next().value;
    if (firstKey) cssVariableCache.delete(firstKey);
  }

  return variables;
}

/**
 * Clears the CSS variable cache
 * Useful when switching tenants or forcing theme refresh
 */
export function clearCssVariableCache(): void {
  cssVariableCache.clear();
}

// ========================================
// Multi-Tenant Theme Isolation
// ========================================

/**
 * Generates a tenant-specific CSS scope for style isolation
 * Ensures styles don't leak between different tenants
 */
export function generateTenantScope(tenantId: string): string {
  return `[data-tenant="${tenantId}"]`;
}

/**
 * Wraps CSS variables in a tenant-specific scope
 * For multi-tenant environments where multiple storefronts may coexist
 */
export function generateScopedCssString(
  variables: Record<string, string>,
  tenantId?: string
): string {
  const cssVariables = Object.entries(variables)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  if (tenantId) {
    return `${generateTenantScope(tenantId)} {\n${cssVariables}\n}`;
  }

  return `:root {\n${cssVariables}\n}`;
}
