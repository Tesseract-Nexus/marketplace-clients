import { StorefrontSettings, THEME_PRESETS, DEFAULT_STOREFRONT_SETTINGS } from '@/types/storefront';

/**
 * Settings merge utilities
 * Extracted from app/layout.tsx to reduce file size
 */

/**
 * Get default settings with theme preset
 */
export function getDefaultSettings(
  slug: string,
  tenantId?: string,
  themeTemplate?: string
): StorefrontSettings {
  // Use the specified themeTemplate, or fall back to 'vibrant' as default
  const templateId = themeTemplate || 'vibrant';
  const theme =
    THEME_PRESETS.find((t) => t.id === templateId) ??
    THEME_PRESETS.find((t) => t.id === 'vibrant') ??
    THEME_PRESETS[0];

  return {
    ...DEFAULT_STOREFRONT_SETTINGS,
    id: slug,
    tenantId: tenantId || slug,
    themeTemplate: templateId,
    primaryColor: theme?.primaryColor ?? '#8B5CF6',
    secondaryColor: theme?.secondaryColor ?? '#EC4899',
    accentColor: theme?.accentColor ?? '#F59E0B',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as StorefrontSettings;
}

/**
 * Merge typography config ensuring all required fields exist
 */
export function mergeTypographyConfig(
  defaultConfig: StorefrontSettings['typographyConfig'],
  apiConfig: StorefrontSettings['typographyConfig'] | undefined
): StorefrontSettings['typographyConfig'] {
  const baseConfig = {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    baseFontSize: 16,
    headingScale: 'default' as const,
    headingWeight: 700 as const,
    bodyWeight: 400 as const,
    headingLineHeight: 'normal' as const,
    bodyLineHeight: 'normal' as const,
    headingLetterSpacing: 'normal' as const,
  };

  const merged = {
    ...baseConfig,
    ...(defaultConfig || {}),
    ...(apiConfig || {}),
  };

  // Ensure fonts are always set even if API returns empty strings
  return {
    ...merged,
    headingFont: merged.headingFont || baseConfig.headingFont,
    bodyFont: merged.bodyFont || baseConfig.bodyFont,
  };
}

/**
 * Merge layout config ensuring all required fields exist
 */
export function mergeLayoutConfig(
  defaultConfig: StorefrontSettings['layoutConfig'],
  apiConfig: StorefrontSettings['layoutConfig'] | undefined
): StorefrontSettings['layoutConfig'] {
  const baseConfig: StorefrontSettings['layoutConfig'] = {
    navigationStyle: 'header' as const,
    containerWidth: 'default' as const,
    contentPadding: 'default' as const,
    homepageLayout: 'hero-grid' as const,
    headerLayout: 'logo-left' as const,
    headerHeight: 'default' as const,
    footerLayout: 'multi-column' as const,
    productListLayout: 'grid' as const,
    productGridColumns: { mobile: 2, tablet: 3, desktop: 4 },
    productDetailLayout: 'image-left' as const,
    categoryLayout: 'sidebar-left' as const,
    showCategoryBanner: true,
  };

  return {
    ...baseConfig,
    ...(defaultConfig || {}),
    ...(apiConfig || {}),
  };
}

/**
 * Deep merge settings with defaults to ensure all required fields exist
 */
export function mergeWithDefaults(
  apiSettings: Partial<StorefrontSettings> | null,
  defaults: StorefrontSettings
): StorefrontSettings {
  if (!apiSettings) return defaults;

  // If themeTemplate is set, derive colors from the preset if not explicitly provided
  let themeColors: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  } = {};
  if (apiSettings.themeTemplate) {
    const preset = THEME_PRESETS.find((t) => t.id === apiSettings.themeTemplate);
    if (preset) {
      themeColors = {
        primaryColor: preset.primaryColor,
        secondaryColor: preset.secondaryColor,
        accentColor: preset.accentColor,
      };
    }
  }

  return {
    ...defaults,
    ...apiSettings,
    // Use API colors if provided, otherwise use theme preset colors, then defaults
    primaryColor:
      apiSettings.primaryColor || themeColors.primaryColor || defaults.primaryColor,
    secondaryColor:
      apiSettings.secondaryColor || themeColors.secondaryColor || defaults.secondaryColor,
    accentColor:
      apiSettings.accentColor || themeColors.accentColor || defaults.accentColor,
    // Ensure fonts are always set (even if API returns empty strings)
    fontPrimary: apiSettings.fontPrimary || defaults.fontPrimary,
    fontSecondary: apiSettings.fontSecondary || defaults.fontSecondary,
    colorMode: apiSettings.colorMode || defaults.colorMode,
    // Deep merge nested configs
    headerConfig: {
      ...defaults.headerConfig,
      ...(apiSettings.headerConfig || {}),
    },
    homepageConfig: {
      ...defaults.homepageConfig,
      ...(apiSettings.homepageConfig || {}),
    },
    footerConfig: {
      ...defaults.footerConfig,
      ...(apiSettings.footerConfig || {}),
    },
    productConfig: {
      ...defaults.productConfig,
      ...(apiSettings.productConfig || {}),
    },
    checkoutConfig: {
      ...defaults.checkoutConfig,
      ...(apiSettings.checkoutConfig || {}),
    },
    typographyConfig: mergeTypographyConfig(
      defaults.typographyConfig,
      apiSettings.typographyConfig
    ),
    layoutConfig: mergeLayoutConfig(defaults.layoutConfig, apiSettings.layoutConfig),
    // Merge marketing config from admin settings
    marketingConfig: {
      ...defaults.marketingConfig,
      ...(apiSettings.marketingConfig || {}),
    } as StorefrontSettings['marketingConfig'],
  };
}
