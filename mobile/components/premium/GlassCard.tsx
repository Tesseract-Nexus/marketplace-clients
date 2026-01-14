import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { springs, shadows } from '@/lib/design/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: 'light' | 'medium' | 'heavy';
  variant?: 'default' | 'gradient' | 'bordered' | 'elevated';
  gradientColors?: readonly [string, string, ...string[]];
  onPress?: () => void;
  disabled?: boolean;
  haptic?: boolean;
}

export function GlassCard({
  children,
  style,
  intensity = 'medium',
  variant = 'default',
  gradientColors,
  onPress,
  disabled = false,
  haptic = true,
}: GlassCardProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const blurIntensity = {
    light: 20,
    medium: 40,
    heavy: 60,
  }[intensity];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: interpolate(pressed.value, [0, 1], [0.1, 0.2]),
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.97, springs.snappy);
      pressed.value = withSpring(1, springs.snappy);
      if (haptic) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.bouncy);
    pressed.value = withSpring(0, springs.smooth);
  };

  const CardContent = (
    <BlurView
      intensity={blurIntensity}
      tint={isDark ? 'dark' : 'light'}
      style={[styles.blur, variant === 'bordered' && styles.bordered]}
    >
      {variant === 'gradient' && gradientColors ? (
        <LinearGradient
          colors={[...gradientColors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientOverlay}
        />
      ) : null}
      <View
        style={[
          styles.content,
          {
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(255,255,255,0.7)',
          },
        ]}
      >
        {children}
      </View>
    </BlurView>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        style={[
          styles.container,
          variant === 'elevated' && shadows.lg,
          animatedStyle,
          style,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        {CardContent}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        variant === 'elevated' && shadows.lg,
        style,
      ]}
    >
      {CardContent}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  blur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  bordered: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  content: {
    padding: 20,
    borderRadius: 24,
  },
});
