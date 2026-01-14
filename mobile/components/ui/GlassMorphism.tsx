import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { BlurView, BlurViewProps } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';

import { useColors, useIsDark } from '@/providers/ThemeProvider';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface GlassMorphismProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: BlurViewProps['tint'];
  style?: ViewStyle;
  borderRadius?: number;
  showBorder?: boolean;
  variant?: 'light' | 'dark' | 'frosted' | 'premium';
}

export function GlassMorphism({
  children,
  intensity = 50,
  tint,
  style,
  borderRadius = 20,
  showBorder = true,
  variant = 'frosted',
}: GlassMorphismProps) {
  const isDark = useIsDark();
  const colors = useColors();

  const getVariantStyles = (): {
    blurTint: BlurViewProps['tint'];
    overlayColors: string[];
    borderColor: string;
  } => {
    switch (variant) {
      case 'light':
        return {
          blurTint: 'light',
          overlayColors: ['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.2)'],
          borderColor: 'rgba(255,255,255,0.5)',
        };
      case 'dark':
        return {
          blurTint: 'dark',
          overlayColors: ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)'],
          borderColor: 'rgba(255,255,255,0.1)',
        };
      case 'premium':
        return {
          blurTint: isDark ? 'dark' : 'light',
          overlayColors: isDark
            ? ['rgba(79,70,229,0.2)', 'rgba(139,92,246,0.1)']
            : ['rgba(79,70,229,0.1)', 'rgba(139,92,246,0.05)'],
          borderColor: isDark
            ? 'rgba(139,92,246,0.3)'
            : 'rgba(79,70,229,0.2)',
        };
      case 'frosted':
      default:
        return {
          blurTint: isDark ? 'dark' : 'light',
          overlayColors: isDark
            ? ['rgba(31,41,55,0.6)', 'rgba(31,41,55,0.4)']
            : ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.4)'],
          borderColor: isDark
            ? 'rgba(255,255,255,0.1)'
            : 'rgba(0,0,0,0.1)',
        };
    }
  };

  const variantStyles = getVariantStyles();
  const actualTint = tint || variantStyles.blurTint;

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      <AnimatedBlurView
        intensity={intensity}
        tint={actualTint}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      <LinearGradient
        colors={variantStyles.overlayColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />
      {showBorder && (
        <View
          style={[
            styles.border,
            {
              borderRadius,
              borderColor: variantStyles.borderColor,
            },
          ]}
        />
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

// Gradient Glass Card with animated shine effect
interface GlassCardProps extends GlassMorphismProps {
  showShine?: boolean;
}

export function GlassCard({
  children,
  showShine = false,
  ...props
}: GlassCardProps) {
  const colors = useColors();

  return (
    <GlassMorphism {...props}>
      {showShine && (
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: props.borderRadius }]}
        />
      )}
      {children}
    </GlassMorphism>
  );
}

// Floating Glass Button
interface GlassButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
}

export function GlassButton({
  children,
  onPress,
  style,
  size = 'md',
  variant = 'primary',
}: GlassButtonProps) {
  const colors = useColors();
  const isDark = useIsDark();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 16 };
      case 'lg':
        return { paddingVertical: 16, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 12, paddingHorizontal: 24 };
    }
  };

  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return isDark
          ? ['rgba(79,70,229,0.6)', 'rgba(139,92,246,0.4)']
          : ['rgba(79,70,229,0.8)', 'rgba(139,92,246,0.6)'];
      case 'secondary':
        return isDark
          ? ['rgba(245,158,11,0.5)', 'rgba(251,191,36,0.3)']
          : ['rgba(245,158,11,0.7)', 'rgba(251,191,36,0.5)'];
      default:
        return isDark
          ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']
          : ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.02)'];
    }
  };

  return (
    <GlassMorphism
      variant={variant === 'ghost' ? 'frosted' : 'premium'}
      borderRadius={size === 'sm' ? 12 : size === 'lg' ? 20 : 16}
      style={{ ...getSizeStyles(), ...style }}
    >
      {children}
    </GlassMorphism>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});
