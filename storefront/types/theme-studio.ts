/**
 * Theme Studio Types
 *
 * Extended theming system with full token control, version history,
 * accessibility validation, and preset management.
 */

// =============================================================================
// COLOR SYSTEM
// =============================================================================

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface SemanticColors {
  // Primary brand color
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryForeground: string;

  // Secondary brand color
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  secondaryForeground: string;

  // Accent color
  accent: string;
  accentLight: string;
  accentDark: string;
  accentForeground: string;

  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;

  // Foreground/text colors
  foreground: string;
  foregroundSecondary: string;
  foregroundMuted: string;

  // Surface colors (cards, modals, etc.)
  surface: string;
  surfaceElevated: string;
  surfaceOverlay: string;

  // Border colors
  border: string;
  borderLight: string;
  borderDark: string;

  // Input colors
  input: string;
  inputFocus: string;
  inputError: string;

  // Ring/focus colors
  ring: string;
  ringOffset: string;
}

export interface FeedbackColors {
  success: string;
  successLight: string;
  successDark: string;
  successForeground: string;

  warning: string;
  warningLight: string;
  warningDark: string;
  warningForeground: string;

  error: string;
  errorLight: string;
  errorDark: string;
  errorForeground: string;

  info: string;
  infoLight: string;
  infoDark: string;
  infoForeground: string;
}

export interface GradientConfig {
  id: string;
  name: string;
  type: 'linear' | 'radial' | 'conic';
  angle?: number; // For linear gradients
  stops: Array<{
    color: string;
    position: number; // 0-100
  }>;
  cssValue?: string; // Computed CSS value
}

export interface ColorPalette {
  // Core semantic colors
  semantic: SemanticColors;

  // Feedback/state colors
  feedback: FeedbackColors;

  // Extended color scales (for advanced customization)
  scales?: {
    primary?: ColorScale;
    secondary?: ColorScale;
    accent?: ColorScale;
    neutral?: ColorScale;
  };

  // Custom brand gradients
  gradients?: GradientConfig[];

  // Chart colors
  chart?: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
  };

  // Dark mode overrides
  dark?: Partial<SemanticColors & FeedbackColors>;
}

// =============================================================================
// TYPOGRAPHY SYSTEM
// =============================================================================

export interface FontFamily {
  name: string;
  fallback: string[];
  source: 'google' | 'adobe' | 'custom' | 'system';
  weights: number[];
  styles?: ('normal' | 'italic')[];
  variable?: boolean;
  variableName?: string;
  url?: string; // For custom fonts
}

export interface FontScale {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  '7xl': string;
  '8xl': string;
  '9xl': string;
}

export interface LineHeightScale {
  none: string;
  tight: string;
  snug: string;
  normal: string;
  relaxed: string;
  loose: string;
}

export interface LetterSpacingScale {
  tighter: string;
  tight: string;
  normal: string;
  wide: string;
  wider: string;
  widest: string;
}

export interface TypographyStyle {
  fontFamily?: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: string;
  letterSpacing?: string;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface TypographyConfig {
  // Font families
  fonts: {
    heading: FontFamily;
    body: FontFamily;
    mono?: FontFamily;
    display?: FontFamily; // For hero text, special headings
  };

  // Font size scale
  fontSizes: FontScale;

  // Line heights
  lineHeights: LineHeightScale;

  // Letter spacing
  letterSpacing: LetterSpacingScale;

  // Font weights
  fontWeights: {
    thin: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
    black: number;
  };

  // Heading styles (h1-h6)
  headings: {
    h1: TypographyStyle;
    h2: TypographyStyle;
    h3: TypographyStyle;
    h4: TypographyStyle;
    h5: TypographyStyle;
    h6: TypographyStyle;
  };

  // Body text styles
  body: {
    large: TypographyStyle;
    default: TypographyStyle;
    small: TypographyStyle;
  };

  // Special text styles
  special?: {
    display?: TypographyStyle;
    caption?: TypographyStyle;
    overline?: TypographyStyle;
    quote?: TypographyStyle;
    code?: TypographyStyle;
  };

  // Responsive scaling
  responsiveScale?: {
    mobile: number; // Multiplier, e.g., 0.875
    tablet: number;
    desktop: number;
  };
}

// =============================================================================
// SPACING SYSTEM
// =============================================================================

export interface SpacingScale {
  px: string;
  0: string;
  0.5: string;
  1: string;
  1.5: string;
  2: string;
  2.5: string;
  3: string;
  3.5: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
  14: string;
  16: string;
  20: string;
  24: string;
  28: string;
  32: string;
  36: string;
  40: string;
  44: string;
  48: string;
  52: string;
  56: string;
  60: string;
  64: string;
  72: string;
  80: string;
  96: string;
}

export interface SpacingConfig {
  // Base unit (default: 4px)
  baseUnit: number;

  // Spacing scale
  scale: SpacingScale;

  // Layout spacing
  layout: {
    containerPadding: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
    sectionSpacing: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
    gridGap: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
    headerHeight: {
      mobile: string;
      desktop: string;
    };
    mobileNavHeight: string;
    sidebarWidth: string;
  };

  // Component spacing presets
  components: {
    cardPadding: string;
    buttonPadding: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    inputPadding: string;
    modalPadding: string;
    dropdownPadding: string;
  };
}

// =============================================================================
// BORDER & RADIUS SYSTEM
// =============================================================================

export interface BorderRadiusScale {
  none: string;
  sm: string;
  default: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  full: string;
}

export interface BorderConfig {
  // Border width scale
  widths: {
    none: string;
    thin: string;
    default: string;
    thick: string;
  };

  // Border radius scale
  radius: BorderRadiusScale;

  // Component-specific radii
  components: {
    button: string;
    input: string;
    card: string;
    modal: string;
    badge: string;
    avatar: string;
    tooltip: string;
    productCard: string;
    image: string;
  };
}

// =============================================================================
// SHADOW SYSTEM
// =============================================================================

export interface ShadowScale {
  none: string;
  sm: string;
  default: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

export interface ShadowConfig {
  scale: ShadowScale;

  // Colored shadows (for brand elements)
  colored?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };

  // Component-specific shadows
  components?: {
    card?: string;
    cardHover?: string;
    modal?: string;
    dropdown?: string;
    button?: string;
    buttonHover?: string;
    header?: string;
  };
}

// =============================================================================
// MOTION & ANIMATION SYSTEM
// =============================================================================

export interface TransitionConfig {
  // Duration scale
  durations: {
    fastest: string;
    faster: string;
    fast: string;
    normal: string;
    slow: string;
    slower: string;
    slowest: string;
  };

  // Easing functions
  easings: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    easeInBack: string;
    easeOutBack: string;
    easeInOutBack: string;
    spring: string;
    bounce: string;
  };

  // Default transitions
  defaults: {
    all: string;
    colors: string;
    opacity: string;
    transform: string;
    shadow: string;
  };
}

export interface AnimationPresets {
  // Entrance animations
  entrance: {
    fadeIn: string;
    fadeInUp: string;
    fadeInDown: string;
    fadeInLeft: string;
    fadeInRight: string;
    scaleIn: string;
    slideIn: string;
  };

  // Exit animations
  exit: {
    fadeOut: string;
    fadeOutUp: string;
    fadeOutDown: string;
    scaleOut: string;
    slideOut: string;
  };

  // Attention animations
  attention: {
    pulse: string;
    bounce: string;
    shake: string;
    wiggle: string;
    heartbeat: string;
    flash: string;
  };

  // Continuous animations
  continuous: {
    spin: string;
    ping: string;
    float: string;
    shimmer: string;
  };

  // Custom keyframes
  custom?: Record<string, string>;
}

export interface MotionConfig {
  // Enable/disable animations globally
  enabled: boolean;

  // Respect user's reduced motion preference
  respectReducedMotion: boolean;

  // Transitions
  transitions: TransitionConfig;

  // Animation presets
  animations: AnimationPresets;

  // Scroll animations
  scrollAnimations?: {
    enabled: boolean;
    threshold: number;
    rootMargin: string;
    defaultAnimation: string;
  };

  // Page transitions
  pageTransitions?: {
    enabled: boolean;
    type: 'fade' | 'slide' | 'scale' | 'none';
    duration: string;
  };
}

// =============================================================================
// COMPONENT THEME SYSTEM
// =============================================================================

export interface ButtonTheme {
  variants: {
    primary: {
      background: string;
      foreground: string;
      border?: string;
      hoverBackground: string;
      activeBackground: string;
    };
    secondary: {
      background: string;
      foreground: string;
      border?: string;
      hoverBackground: string;
      activeBackground: string;
    };
    outline: {
      background: string;
      foreground: string;
      border: string;
      hoverBackground: string;
      activeBackground: string;
    };
    ghost: {
      background: string;
      foreground: string;
      hoverBackground: string;
      activeBackground: string;
    };
    destructive: {
      background: string;
      foreground: string;
      hoverBackground: string;
      activeBackground: string;
    };
  };
  sizes: {
    sm: { height: string; padding: string; fontSize: string; borderRadius: string };
    md: { height: string; padding: string; fontSize: string; borderRadius: string };
    lg: { height: string; padding: string; fontSize: string; borderRadius: string };
    xl: { height: string; padding: string; fontSize: string; borderRadius: string };
    icon: { size: string; borderRadius: string };
  };
  defaults: {
    fontWeight: number;
    transition: string;
    focusRing: string;
  };
}

export interface CardTheme {
  variants: {
    default: {
      background: string;
      border: string;
      shadow: string;
      borderRadius: string;
    };
    elevated: {
      background: string;
      border: string;
      shadow: string;
      borderRadius: string;
    };
    outlined: {
      background: string;
      border: string;
      shadow: string;
      borderRadius: string;
    };
    interactive: {
      background: string;
      border: string;
      shadow: string;
      hoverShadow: string;
      borderRadius: string;
    };
  };
  padding: {
    sm: string;
    md: string;
    lg: string;
  };
}

export interface InputTheme {
  variants: {
    default: {
      background: string;
      border: string;
      focusBorder: string;
      focusRing: string;
      placeholder: string;
    };
    filled: {
      background: string;
      border: string;
      focusBorder: string;
      focusRing: string;
      placeholder: string;
    };
    flushed: {
      background: string;
      border: string;
      focusBorder: string;
      focusRing: string;
      placeholder: string;
    };
  };
  sizes: {
    sm: { height: string; padding: string; fontSize: string; borderRadius: string };
    md: { height: string; padding: string; fontSize: string; borderRadius: string };
    lg: { height: string; padding: string; fontSize: string; borderRadius: string };
  };
  states: {
    error: { border: string; focusBorder: string; focusRing: string };
    success: { border: string; focusBorder: string; focusRing: string };
    disabled: { background: string; border: string; opacity: number };
  };
}

export interface BadgeTheme {
  variants: {
    default: { background: string; foreground: string };
    primary: { background: string; foreground: string };
    secondary: { background: string; foreground: string };
    success: { background: string; foreground: string };
    warning: { background: string; foreground: string };
    destructive: { background: string; foreground: string };
    outline: { background: string; foreground: string; border: string };
  };
  sizes: {
    sm: { height: string; padding: string; fontSize: string; borderRadius: string };
    md: { height: string; padding: string; fontSize: string; borderRadius: string };
    lg: { height: string; padding: string; fontSize: string; borderRadius: string };
  };
}

export interface ComponentThemes {
  button: ButtonTheme;
  card: CardTheme;
  input: InputTheme;
  badge: BadgeTheme;
  // Add more component themes as needed
}

// =============================================================================
// BREAKPOINTS & RESPONSIVE
// =============================================================================

export interface BreakpointConfig {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ContainerConfig {
  center: boolean;
  padding: {
    DEFAULT: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  };
  maxWidth: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    full: string;
  };
}

export interface ResponsiveConfig {
  breakpoints: BreakpointConfig;
  container: ContainerConfig;
}

// =============================================================================
// COMPLETE THEME CONFIG
// =============================================================================

export interface ThemeTokens {
  colors: ColorPalette;
  typography: TypographyConfig;
  spacing: SpacingConfig;
  borders: BorderConfig;
  shadows: ShadowConfig;
  motion: MotionConfig;
  responsive: ResponsiveConfig;
  components?: Partial<ComponentThemes>;
}

export interface ThemeMetadata {
  id: string;
  name: string;
  description?: string;
  category: 'fashion' | 'electronics' | 'sports' | 'luxury' | 'marketplace' | 'minimal' | 'custom';
  thumbnail?: string;
  author?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThemePreset {
  metadata: ThemeMetadata;
  tokens: ThemeTokens;
  isDefault?: boolean;
  isLocked?: boolean; // System presets can't be edited
  parentPresetId?: string; // For derived themes
}

// =============================================================================
// THEME VERSION HISTORY
// =============================================================================

export interface ThemeVersion {
  id: string;
  themeId: string;
  version: number;
  tokens: ThemeTokens;
  changelog?: string;
  createdAt: string;
  createdBy?: string;
  isPublished: boolean;
  publishedAt?: string;
}

export interface ThemeVersionHistory {
  themeId: string;
  currentVersion: number;
  versions: ThemeVersion[];
}

// =============================================================================
// THEME VALIDATION
// =============================================================================

export interface ColorContrastResult {
  ratio: number;
  aa: boolean; // Meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
  aaa: boolean; // Meets WCAG AAA (7:1 for normal text, 4.5:1 for large text)
  aaLargeText: boolean;
  aaaLargeText: boolean;
}

export interface ThemeValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    path: string;
    message: string;
  }>;
  accessibility: {
    colorContrast: Array<{
      foreground: string;
      background: string;
      result: ColorContrastResult;
      context: string; // e.g., "primary button text"
    }>;
    fontSizeWarnings: string[];
    touchTargetWarnings: string[];
  };
}

// =============================================================================
// THEME DRAFT & PUBLISH
// =============================================================================

export type ThemeStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived';

export interface ThemeDraft {
  id: string;
  themeId: string;
  status: ThemeStatus;
  tokens: Partial<ThemeTokens>; // Can be partial for incremental editing
  previewUrl?: string;
  scheduledPublishAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// THEME STUDIO STATE
// =============================================================================

export interface ThemeStudioState {
  // Current theme being edited
  currentTheme: ThemePreset | null;
  currentDraft: ThemeDraft | null;

  // Preview
  previewMode: 'desktop' | 'tablet' | 'mobile';
  previewUrl: string;
  isPreviewLoading: boolean;

  // Editor state
  activeSection: 'colors' | 'typography' | 'spacing' | 'borders' | 'shadows' | 'motion' | 'components';
  hasUnsavedChanges: boolean;
  lastSavedAt?: string;

  // Validation
  validationResult?: ThemeValidationResult;
  isValidating: boolean;

  // History
  canUndo: boolean;
  canRedo: boolean;
  historyIndex: number;

  // UI
  isSidebarOpen: boolean;
  isCompareMode: boolean;
  compareThemeId?: string;
}

// =============================================================================
// THEME CSS GENERATION
// =============================================================================

export interface ThemeCSSOutput {
  // CSS custom properties
  cssVariables: string;

  // Tailwind config overrides
  tailwindConfig: Record<string, unknown>;

  // Component-specific styles
  componentStyles: string;

  // Dark mode overrides
  darkModeStyles: string;

  // Scoped styles (for multi-tenant isolation)
  scopedSelector?: string;
}

// =============================================================================
// HELPER FUNCTIONS & TYPES
// =============================================================================

export function validateThemeTokens(tokens: ThemeTokens): ThemeValidationResult {
  const errors: ThemeValidationResult['errors'] = [];
  const warnings: ThemeValidationResult['warnings'] = [];
  const accessibility: ThemeValidationResult['accessibility'] = {
    colorContrast: [],
    fontSizeWarnings: [],
    touchTargetWarnings: [],
  };

  // Basic validation
  if (!tokens.colors?.semantic?.primary) {
    errors.push({
      path: 'colors.semantic.primary',
      message: 'Primary color is required',
      severity: 'error',
    });
  }

  if (!tokens.typography?.fonts?.body) {
    errors.push({
      path: 'typography.fonts.body',
      message: 'Body font is required',
      severity: 'error',
    });
  }

  // Add more validations...

  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    warnings,
    accessibility,
  };
}

export function mergeThemeTokens(
  base: ThemeTokens,
  overrides: Partial<ThemeTokens>
): ThemeTokens {
  return {
    colors: {
      ...base.colors,
      ...overrides.colors,
      semantic: {
        ...base.colors.semantic,
        ...overrides.colors?.semantic,
      },
      feedback: {
        ...base.colors.feedback,
        ...overrides.colors?.feedback,
      },
    },
    typography: {
      ...base.typography,
      ...overrides.typography,
      fonts: {
        ...base.typography.fonts,
        ...overrides.typography?.fonts,
      },
      headings: {
        ...base.typography.headings,
        ...overrides.typography?.headings,
      },
    },
    spacing: {
      ...base.spacing,
      ...overrides.spacing,
    },
    borders: {
      ...base.borders,
      ...overrides.borders,
    },
    shadows: {
      ...base.shadows,
      ...overrides.shadows,
    },
    motion: {
      ...base.motion,
      ...overrides.motion,
    },
    responsive: {
      ...base.responsive,
      ...overrides.responsive,
    },
    components: {
      ...base.components,
      ...overrides.components,
    },
  };
}

export function generateCSSVariables(tokens: ThemeTokens): string {
  const lines: string[] = [':root {'];

  // Colors
  const { semantic, feedback } = tokens.colors;
  lines.push(`  /* Primary Colors */`);
  lines.push(`  --color-primary: ${semantic.primary};`);
  lines.push(`  --color-primary-light: ${semantic.primaryLight};`);
  lines.push(`  --color-primary-dark: ${semantic.primaryDark};`);
  lines.push(`  --color-primary-foreground: ${semantic.primaryForeground};`);

  lines.push(`  /* Secondary Colors */`);
  lines.push(`  --color-secondary: ${semantic.secondary};`);
  lines.push(`  --color-secondary-foreground: ${semantic.secondaryForeground};`);

  lines.push(`  /* Accent Colors */`);
  lines.push(`  --color-accent: ${semantic.accent};`);
  lines.push(`  --color-accent-foreground: ${semantic.accentForeground};`);

  lines.push(`  /* Background Colors */`);
  lines.push(`  --color-background: ${semantic.background};`);
  lines.push(`  --color-foreground: ${semantic.foreground};`);

  lines.push(`  /* Feedback Colors */`);
  lines.push(`  --color-success: ${feedback.success};`);
  lines.push(`  --color-warning: ${feedback.warning};`);
  lines.push(`  --color-error: ${feedback.error};`);
  lines.push(`  --color-info: ${feedback.info};`);

  // Typography
  lines.push(`  /* Typography */`);
  lines.push(`  --font-heading: ${tokens.typography.fonts.heading.name}, ${tokens.typography.fonts.heading.fallback.join(', ')};`);
  lines.push(`  --font-body: ${tokens.typography.fonts.body.name}, ${tokens.typography.fonts.body.fallback.join(', ')};`);

  // Spacing
  lines.push(`  /* Spacing */`);
  lines.push(`  --spacing-base: ${tokens.spacing.baseUnit}px;`);

  // Border radius
  lines.push(`  /* Border Radius */`);
  Object.entries(tokens.borders.radius).forEach(([key, value]) => {
    lines.push(`  --radius-${key}: ${value};`);
  });

  // Shadows
  lines.push(`  /* Shadows */`);
  Object.entries(tokens.shadows.scale).forEach(([key, value]) => {
    lines.push(`  --shadow-${key}: ${value};`);
  });

  lines.push('}');

  return lines.join('\n');
}
