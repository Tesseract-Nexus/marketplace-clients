import { Appearance, ColorSchemeName } from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { darkenColor, lightenColor } from '@/lib/utils/helpers';
import type { Theme, ThemeColors, ThemeMode } from '@/types/theme';

import { useTenantStore } from './tenant-store';

// Default colors (Indigo theme - Tesla-inspired)
const DEFAULT_COLORS: ThemeColors = {
  // Brand
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primaryLight: '#818CF8',
  secondary: '#F59E0B',
  accent: '#EC4899',

  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Neutral
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceHover: '#F3F4F6',
  card: '#FFFFFF',
  cardHover: '#F9FAFB',

  // Text
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',

  // Border
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderFocus: '#4F46E5',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  backdrop: 'rgba(0, 0, 0, 0.3)',
};

const DARK_COLORS: ThemeColors = {
  // Brand
  primary: '#818CF8',
  primaryDark: '#6366F1',
  primaryLight: '#A5B4FC',
  secondary: '#FBBF24',
  accent: '#F472B6',

  // Semantic
  success: '#34D399',
  successLight: '#064E3B',
  warning: '#FBBF24',
  warningLight: '#78350F',
  error: '#F87171',
  errorLight: '#7F1D1D',
  info: '#60A5FA',
  infoLight: '#1E3A8A',

  // Neutral
  background: '#111827',
  surface: '#1F2937',
  surfaceHover: '#374151',
  card: '#1F2937',
  cardHover: '#374151',

  // Text
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  textInverse: '#111827',
  textOnPrimary: '#FFFFFF',

  // Border
  border: '#374151',
  borderLight: '#4B5563',
  borderFocus: '#818CF8',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  backdrop: 'rgba(0, 0, 0, 0.5)',
};

const DEFAULT_THEME: Theme = {
  colors: DEFAULT_COLORS,
  fonts: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    display: 'Inter_700Bold',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    '4xl': 96,
  },
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
    spring: {
      damping: 20,
      stiffness: 300,
      mass: 1,
    },
  },
};

interface ThemeState {
  // State
  theme: Theme;
  mode: ThemeMode;
  isDark: boolean;
  systemColorScheme: ColorSchemeName;

  // Actions
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  applyTenantTheme: () => void;
  resetTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: DEFAULT_THEME,
      mode: 'system',
      isDark: Appearance.getColorScheme() === 'dark',
      systemColorScheme: Appearance.getColorScheme(),

      // Set theme mode
      setMode: (mode: ThemeMode) => {
        const systemColorScheme = Appearance.getColorScheme();
        const isDark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');

        const baseColors = isDark ? DARK_COLORS : DEFAULT_COLORS;

        // Apply tenant theme colors if available
        const tenantTheme = useTenantStore.getState().currentTenant?.settings?.theme;

        let colors = { ...baseColors };
        if (tenantTheme) {
          colors = {
            ...colors,
            primary: tenantTheme.primary_color || colors.primary,
            primaryDark: tenantTheme.primary_dark || darkenColor(colors.primary, 20),
            primaryLight: tenantTheme.primary_light || lightenColor(colors.primary, 20),
            secondary: tenantTheme.secondary_color || colors.secondary,
            accent: tenantTheme.accent_color || colors.accent,
          };
        }

        set({
          mode,
          isDark,
          theme: {
            ...get().theme,
            colors,
          },
        });
      },

      // Toggle between light and dark
      toggleMode: () => {
        const { mode, isDark } = get();
        if (mode === 'system') {
          set({ mode: isDark ? 'light' : 'dark' });
          get().setMode(isDark ? 'light' : 'dark');
        } else {
          const newMode = isDark ? 'light' : 'dark';
          get().setMode(newMode);
        }
      },

      // Apply tenant-specific theme
      applyTenantTheme: () => {
        const { isDark } = get();
        const tenantTheme = useTenantStore.getState().currentTenant?.settings?.theme;

        const baseColors = isDark ? DARK_COLORS : DEFAULT_COLORS;

        let colors = { ...baseColors };
        if (tenantTheme) {
          colors = {
            ...colors,
            primary: tenantTheme.primary_color || colors.primary,
            primaryDark:
              tenantTheme.primary_dark ||
              darkenColor(tenantTheme.primary_color || colors.primary, 20),
            primaryLight:
              tenantTheme.primary_light ||
              lightenColor(tenantTheme.primary_color || colors.primary, 20),
            secondary: tenantTheme.secondary_color || colors.secondary,
            accent: tenantTheme.accent_color || colors.accent,
          };
        }

        set({
          theme: {
            ...get().theme,
            colors,
          },
        });
      },

      // Reset to default theme
      resetTheme: () => {
        const isDark = get().isDark;
        set({
          theme: {
            ...DEFAULT_THEME,
            colors: isDark ? DARK_COLORS : DEFAULT_COLORS,
          },
        });
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        mode: state.mode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reapply theme after rehydration
          state.setMode(state.mode);
        }
      },
    }
  )
);

// Listen for system color scheme changes
Appearance.addChangeListener(({ colorScheme }) => {
  const { mode, setMode } = useThemeStore.getState();
  useThemeStore.setState({ systemColorScheme: colorScheme });

  if (mode === 'system') {
    setMode('system');
  }
});

// Selector hooks
export const useTheme = () => useThemeStore((state) => state.theme);
export const useThemeMode = () => useThemeStore((state) => state.mode);
export const useIsDark = () => useThemeStore((state) => state.isDark);
export const useColors = () => useThemeStore((state) => state.theme.colors);
export const useSpacing = () => useThemeStore((state) => state.theme.spacing);
export const useBorderRadius = () => useThemeStore((state) => state.theme.borderRadius);
export const useShadows = () => useThemeStore((state) => state.theme.shadows);
