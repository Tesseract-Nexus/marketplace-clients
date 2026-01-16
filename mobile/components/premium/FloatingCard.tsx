import React, { useEffect, ReactNode } from 'react';
import { View, Pressable, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
  Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { springs, shadows, premiumGradients } from '@/lib/design/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FloatingCardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  gradient?: readonly [string, string, ...string[]];
  floating?: boolean;
  glowing?: boolean;
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: number;
  delay?: number;
}

export function FloatingCard({
  children,
  style,
  onPress,
  gradient,
  floating = true,
  glowing = false,
  elevation = 'lg',
  borderRadius = 24,
  delay = 0,
}: FloatingCardProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const enterProgress = useSharedValue(0);

  useEffect(() => {
    // Entry animation
    enterProgress.value = withTiming(1, {
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    // Floating animation
    if (floating) {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }

    // Glow animation
    if (glowing && gradient) {
      glowOpacity.value = withRepeat(
        withSequence(withTiming(0.5, { duration: 1500 }), withTiming(0.2, { duration: 1500 })),
        -1,
        true
      );
    }
  }, [floating, glowing, gradient]);

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.97, springs.snappy);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.bouncy);
  };

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
        {
          translateY: interpolate(enterProgress.value, [0, 1], [30, 0], Extrapolation.CLAMP),
        },
      ] as any,
      opacity: enterProgress.value,
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const getShadow = () => {
    switch (elevation) {
      case 'none':
        return shadows.none;
      case 'sm':
        return shadows.sm;
      case 'md':
        return shadows.md;
      case 'lg':
        return shadows.lg;
      case 'xl':
        return shadows.xl;
      default:
        return shadows.lg;
    }
  };

  const CardWrapper = onPress ? AnimatedPressable : Animated.View;

  return (
    <CardWrapper
      style={[styles.container, { borderRadius }, getShadow(), animatedStyle, style]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Glow effect */}
      {glowing && gradient ? (
        <Animated.View style={[styles.glow, { borderRadius: borderRadius + 8 }, glowStyle]}>
          <LinearGradient
            colors={[...gradient]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}

      {/* Card content */}
      {gradient ? (
        <LinearGradient
          colors={[...gradient]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[styles.gradient, { borderRadius }]}
        >
          {children}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.content,
            {
              borderRadius,
              backgroundColor: isDark ? colors.surface : colors.card,
            },
          ]}
        >
          {children}
        </View>
      )}
    </CardWrapper>
  );
}

// Hero Card variant for main stats
interface HeroCardProps {
  children: ReactNode;
  gradient?: readonly [string, string, ...string[]];
  style?: ViewStyle;
}

export function HeroCard({ children, gradient = premiumGradients.cosmic, style }: HeroCardProps) {
  return (
    <FloatingCard
      floating
      glowing
      elevation="xl"
      gradient={gradient}
      style={StyleSheet.flatten([styles.heroCard, style])}
    >
      {children}
    </FloatingCard>
  );
}

// Stat Card with animated value
interface StatCardProps {
  children: ReactNode;
  delay?: number;
  style?: ViewStyle;
  onPress?: () => void;
}

export function StatCard({ children, delay = 0, style, onPress }: StatCardProps) {
  return (
    <FloatingCard
      delay={delay}
      elevation="md"
      floating={false}
      style={StyleSheet.flatten([styles.statCard, style])}
      onPress={onPress}
    >
      {children}
    </FloatingCard>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
  },
  glow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    zIndex: -1,
  },
  gradient: {
    padding: 20,
  },
  content: {
    padding: 20,
  },
  heroCard: {
    marginHorizontal: 20,
  },
  statCard: {
    flex: 1,
  },
});
