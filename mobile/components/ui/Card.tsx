import React, { ReactNode } from 'react';
import { View, Pressable, ViewStyle, PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useColors, useBorderRadius, useShadows, useSpacing } from '@/providers/ThemeProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps {
  children: ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  className?: string;
}

export function Card({
  children,
  variant = 'elevated',
  padding = 'md',
  style,
  className,
}: CardProps) {
  const colors = useColors();
  const borderRadius = useBorderRadius();
  const shadows = useShadows();
  const spacing = useSpacing();

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return spacing.sm;
      case 'md':
        return spacing.md;
      case 'lg':
        return spacing.lg;
    }
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.card,
          ...shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          backgroundColor: colors.surface,
        };
    }
  };

  const cardStyle: ViewStyle = {
    borderRadius: borderRadius.xl,
    padding: getPadding(),
    overflow: 'hidden',
    ...getVariantStyle(),
    ...style,
  };

  return (
    <View className={className} style={cardStyle}>
      {children}
    </View>
  );
}

// Pressable Card variant
interface PressableCardProps extends CardProps, Omit<PressableProps, 'style' | 'children'> {
  haptic?: boolean;
}

export function PressableCard({
  children,
  variant = 'elevated',
  padding = 'md',
  haptic = true,
  style,
  onPress,
  onPressIn,
  ...props
}: PressableCardProps) {
  const colors = useColors();
  const borderRadius = useBorderRadius();
  const shadows = useShadows();
  const spacing = useSpacing();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    if (haptic) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPressIn?.(e);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'sm':
        return spacing.sm;
      case 'md':
        return spacing.md;
      case 'lg':
        return spacing.lg;
    }
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: colors.card,
          ...shadows.md,
        };
      case 'outlined':
        return {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          backgroundColor: colors.surface,
        };
    }
  };

  const cardStyle: ViewStyle = {
    borderRadius: borderRadius.xl,
    padding: getPadding(),
    overflow: 'hidden',
    ...getVariantStyle(),
    ...style,
  };

  return (
    <AnimatedPressable
      style={[cardStyle, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

// Card Header
interface CardHeaderProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  const colors = useColors();
  const spacing = useSpacing();

  return (
    <View
      style={[
        {
          paddingBottom: spacing.sm,
          marginBottom: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// Card Footer
interface CardFooterProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function CardFooter({ children, style }: CardFooterProps) {
  const colors = useColors();
  const spacing = useSpacing();

  return (
    <View
      style={[
        {
          paddingTop: spacing.sm,
          marginTop: spacing.sm,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
