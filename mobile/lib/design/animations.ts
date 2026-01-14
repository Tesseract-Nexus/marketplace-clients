import { Easing } from 'react-native-reanimated';

// Spring configurations for different interactions
export const springs = {
  // Snappy for buttons and quick feedback
  snappy: {
    damping: 15,
    stiffness: 400,
    mass: 0.8,
  },
  // Bouncy for playful elements
  bouncy: {
    damping: 10,
    stiffness: 180,
    mass: 1,
  },
  // Smooth for transitions
  smooth: {
    damping: 20,
    stiffness: 200,
    mass: 1,
  },
  // Gentle for subtle animations
  gentle: {
    damping: 25,
    stiffness: 120,
    mass: 1.2,
  },
  // Heavy for dramatic effects
  heavy: {
    damping: 30,
    stiffness: 300,
    mass: 1.5,
  },
} as const;

// Timing configurations
export const timings = {
  fast: {
    duration: 150,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  normal: {
    duration: 300,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  slow: {
    duration: 500,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  // Ease out for entering elements
  easeOut: {
    duration: 400,
    easing: Easing.bezier(0, 0, 0.2, 1),
  },
  // Ease in for exiting elements
  easeIn: {
    duration: 300,
    easing: Easing.bezier(0.4, 0, 1, 1),
  },
  // Ease in-out for moving elements
  easeInOut: {
    duration: 350,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  },
} as const;

// Stagger delays for list animations
export const stagger = {
  fast: 30,
  normal: 50,
  slow: 80,
} as const;

// Entrance animation presets
export const entranceDelays = {
  hero: 0,
  stats: 100,
  content: 200,
  actions: 300,
  footer: 400,
} as const;

// Scale presets for press feedback
export const scales = {
  pressed: 0.96,
  active: 0.98,
  hover: 1.02,
  bounce: 1.05,
} as const;

// Blur intensities
export const blurs = {
  subtle: 10,
  medium: 20,
  heavy: 40,
  extreme: 80,
} as const;

// Shadow presets
export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  }),
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 15,
  },
} as const;

// Premium gradient presets
export const premiumGradients = {
  // Primary brand gradients
  sunrise: ['#FF6B6B', '#FFE66D'] as const,
  ocean: ['#667EEA', '#764BA2'] as const,
  aurora: ['#a8edea', '#fed6e3'] as const,
  cosmic: ['#6366F1', '#8B5CF6', '#D946EF'] as const,

  // Status gradients
  success: ['#10B981', '#34D399'] as const,
  warning: ['#F59E0B', '#FBBF24'] as const,
  error: ['#EF4444', '#F87171'] as const,
  info: ['#3B82F6', '#60A5FA'] as const,

  // Premium effects
  gold: ['#F59E0B', '#D97706', '#B45309'] as const,
  silver: ['#9CA3AF', '#D1D5DB', '#E5E7EB'] as const,
  platinum: ['#E5E7EB', '#F3F4F6', '#FFFFFF'] as const,

  // Dark mode friendly
  midnight: ['#1E1B4B', '#312E81', '#4338CA'] as const,
  twilight: ['#18181B', '#27272A', '#3F3F46'] as const,

  // Glass effects
  glass: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] as const,
  glassDark: ['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.1)'] as const,

  // Mesh gradients (for backgrounds)
  mesh1: ['#ffecd2', '#fcb69f'] as const,
  mesh2: ['#a1c4fd', '#c2e9fb'] as const,
  mesh3: ['#d4fc79', '#96e6a1'] as const,
} as const;

// Border radius presets
export const radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  full: 9999,
} as const;

// Spacing scale (8pt grid)
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;
