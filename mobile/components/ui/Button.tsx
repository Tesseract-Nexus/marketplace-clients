import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  PressableProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useColors, useBorderRadius } from '@/providers/ThemeProvider';
import { cn } from '@/lib/utils/cn';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  children?: React.ReactNode;
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  haptic?: boolean;
  className?: string;
  textClassName?: string;
  style?: ViewStyle;
}

export function Button({
  children,
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  haptic = true,
  className,
  textClassName,
  style,
  onPress,
  onPressIn,
  ...props
}: ButtonProps) {
  const colors = useColors();
  const borderRadius = useBorderRadius();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    if (haptic) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPressIn?.(e);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const getBackgroundColor = (): string => {
    if (disabled || loading) {
      return colors.border;
    }
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'destructive':
      case 'danger':
        return colors.error;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (disabled) {
      return colors.textSecondary;
    }
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'destructive':
      case 'danger':
        return colors.textOnPrimary;
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.text;
      default:
        return colors.textOnPrimary;
    }
  };

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: 8, paddingHorizontal: 16 },
          text: { fontSize: 14 },
        };
      case 'md':
        return {
          container: { paddingVertical: 12, paddingHorizontal: 24 },
          text: { fontSize: 16 },
        };
      case 'lg':
        return {
          container: { paddingVertical: 16, paddingHorizontal: 32 },
          text: { fontSize: 18 },
        };
      case 'xl':
        return {
          container: { paddingVertical: 20, paddingHorizontal: 40 },
          text: { fontSize: 20 },
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const backgroundColor = getBackgroundColor();
  const textColor = getTextColor();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor,
    borderRadius: borderRadius.xl,
    borderWidth: variant === 'outline' ? 2 : 0,
    borderColor: variant === 'outline' ? colors.primary : undefined,
    opacity: disabled || loading ? 0.6 : 1,
    ...sizeStyles.container,
    ...(fullWidth && { width: '100%' }),
    ...style,
  };

  const textStyle: TextStyle = {
    color: textColor,
    fontWeight: '600',
    textAlign: 'center',
    ...sizeStyles.text,
  };

  return (
    <AnimatedPressable
      disabled={disabled || loading}
      style={[containerStyle, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {leftIcon ? <>{leftIcon}</> : null}
          {title || children ? (
            <Text
              className={textClassName}
              style={[
                textStyle,
                leftIcon ? { marginLeft: 8 } : undefined,
                rightIcon ? { marginRight: 8 } : undefined,
              ]}
            >
              {title || children}
            </Text>
          ) : null}
          {rightIcon ? <>{rightIcon}</> : null}
        </>
      )}
    </AnimatedPressable>
  );
}

// Icon Button variant
interface IconButtonProps extends Omit<
  ButtonProps,
  'title' | 'children' | 'leftIcon' | 'rightIcon'
> {
  icon: React.ReactNode;
}

export function IconButton({ icon, size = 'md', variant = 'ghost', ...props }: IconButtonProps) {
  const colors = useColors();
  const borderRadius = useBorderRadius();

  const getSizeValue = (): number => {
    switch (size) {
      case 'sm':
        return 32;
      case 'md':
        return 40;
      case 'lg':
        return 48;
      case 'xl':
        return 56;
    }
  };

  const sizeValue = getSizeValue();

  return (
    <Button
      size={size}
      style={{
        width: sizeValue,
        height: sizeValue,
        paddingHorizontal: 0,
        paddingVertical: 0,
        borderRadius: borderRadius.full,
      }}
      variant={variant}
      {...props}
    >
      {icon}
    </Button>
  );
}
