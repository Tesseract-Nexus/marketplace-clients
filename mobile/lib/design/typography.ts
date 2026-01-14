/**
 * Typography Scale - Tesla/Spotify inspired
 * Consistent type hierarchy for the mobile app
 */

import { TextStyle } from 'react-native';

export const typography = {
  // Display - Hero stats, main numbers
  display: {
    fontSize: 42,
    fontWeight: '700' as const,
    lineHeight: 48,
    letterSpacing: -0.5,
  },

  // Large - Revenue numbers, key metrics
  large: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.3,
  },

  // Title 1 - Screen titles
  title1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: 0,
  },

  // Title 2 - Section headers
  title2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: 0,
  },

  // Title 3 - Card titles
  title3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },

  // Headline - Emphasized text
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.2,
  },

  // Body - Regular text
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },

  // Body Medium - Emphasized body
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 22,
    letterSpacing: 0,
  },

  // Callout - Secondary info
  callout: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },

  // Callout Medium
  calloutMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },

  // Caption - Labels, timestamps
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },

  // Caption Medium
  captionMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },

  // Micro - Very small labels
  micro: {
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
} as const satisfies Record<string, TextStyle>;

// Gradient pairs for stats cards (Tesla/Spotify inspired)
export const gradients = {
  // Primary - Indigo to Purple (Spotify vibe)
  primary: ['#4F46E5', '#7C3AED'] as const,
  primaryDark: ['#3730A3', '#5B21B6'] as const,

  // Success - Emerald gradient
  success: ['#10B981', '#059669'] as const,
  successDark: ['#047857', '#065F46'] as const,

  // Warning - Amber gradient
  warning: ['#F59E0B', '#D97706'] as const,
  warningDark: ['#B45309', '#92400E'] as const,

  // Info - Blue gradient
  info: ['#3B82F6', '#2563EB'] as const,
  infoDark: ['#1D4ED8', '#1E40AF'] as const,

  // Revenue - Green gradient (money!)
  revenue: ['#34D399', '#10B981'] as const,
  revenueDark: ['#10B981', '#059669'] as const,

  // Premium - Deep indigo (Tesla dark)
  premium: ['#1E1B4B', '#312E81'] as const,
  premiumAlt: ['#0F172A', '#1E293B'] as const,

  // Sunset - Warm gradient
  sunset: ['#F97316', '#EC4899'] as const,

  // Ocean - Cool gradient
  ocean: ['#06B6D4', '#3B82F6'] as const,

  // Glass effect backgrounds
  glassLight: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] as const,
  glassDark: ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.1)'] as const,
} as const;

// Animation presets
export const animations = {
  // Timing
  fast: 150,
  normal: 300,
  slow: 500,

  // Spring configs
  spring: {
    default: { damping: 15, stiffness: 400 },
    gentle: { damping: 20, stiffness: 300 },
    bouncy: { damping: 10, stiffness: 500 },
    stiff: { damping: 30, stiffness: 600 },
  },

  // Delays for stagger effects
  stagger: {
    fast: 50,
    normal: 100,
    slow: 150,
  },
} as const;

// Spacing scale (8pt grid)
export const spacing = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
  '16': 64,
  '20': 80,
  '24': 96,
} as const;

// Border radius scale
export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;
