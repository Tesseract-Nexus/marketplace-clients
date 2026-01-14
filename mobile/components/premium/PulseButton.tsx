import React, { useEffect } from 'react';
import { Text, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/providers/ThemeProvider';
import { springs, shadows, premiumGradients } from '@/lib/design/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface PulseButtonProps {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  gradient?: readonly [string, string, ...string[]];
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'solid' | 'outline' | 'ghost';
  pulse?: boolean;
  glow?: boolean;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function PulseButton({
  title,
  onPress,
  icon,
  gradient = premiumGradients.cosmic,
  size = 'md',
  variant = 'solid',
  pulse = false,
  glow = false,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
}: PulseButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const loadingRotation = useSharedValue(0);

  useEffect(() => {
    if (pulse && !disabled) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [pulse, disabled]);

  useEffect(() => {
    if (glow && !disabled) {
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1500 }),
          withTiming(0.2, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [glow, disabled]);

  useEffect(() => {
    if (loading) {
      loadingRotation.value = withRepeat(
        withTiming(360, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [loading]);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, springs.snappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.bouncy);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pulseScale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: 1.1 }],
  }));

  const loadingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${loadingRotation.value}deg` }],
  }));

  const getSizeStyles = (): { container: ViewStyle; text: TextStyle; iconSize: number } => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: 10, paddingHorizontal: 16 },
          text: { fontSize: 14 },
          iconSize: 16,
        };
      case 'md':
        return {
          container: { paddingVertical: 14, paddingHorizontal: 24 },
          text: { fontSize: 16 },
          iconSize: 20,
        };
      case 'lg':
        return {
          container: { paddingVertical: 18, paddingHorizontal: 32 },
          text: { fontSize: 18 },
          iconSize: 22,
        };
      case 'xl':
        return {
          container: { paddingVertical: 22, paddingHorizontal: 40 },
          text: { fontSize: 20 },
          iconSize: 24,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const renderContent = () => (
    <>
      {loading ? (
        <Animated.View style={loadingStyle}>
          <Ionicons name="sync" size={sizeStyles.iconSize} color="#FFFFFF" />
        </Animated.View>
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={sizeStyles.iconSize}
              color={variant === 'solid' ? '#FFFFFF' : gradient[0]}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            style={[
              styles.text,
              sizeStyles.text,
              { color: variant === 'solid' ? '#FFFFFF' : gradient[0] },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </>
  );

  return (
    <AnimatedPressable
      style={[
        styles.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      {/* Glow effect */}
      {glow && (
        <Animated.View style={[styles.glow, glowStyle]}>
          <LinearGradient
            colors={[...gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {variant === 'solid' ? (
        <LinearGradient
          colors={disabled ? ['#9CA3AF', '#6B7280'] : [...gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, sizeStyles.container, shadows.md]}
        >
          {renderContent()}
        </LinearGradient>
      ) : variant === 'outline' ? (
        <Animated.View
          style={[
            styles.outline,
            sizeStyles.container,
            { borderColor: gradient[0] },
          ]}
        >
          {renderContent()}
        </Animated.View>
      ) : (
        <Animated.View style={[styles.ghost, sizeStyles.container]}>
          {renderContent()}
        </Animated.View>
      )}
    </AnimatedPressable>
  );
}

// Floating Action Button variant
interface FABProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  gradient?: readonly [string, string, ...string[]];
  size?: number;
  pulse?: boolean;
}

export function FAB({
  icon,
  onPress,
  gradient = premiumGradients.cosmic,
  size = 56,
  pulse = true,
}: FABProps) {
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (pulse) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [pulse]);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, springs.snappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.bouncy);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulseScale.value }],
  }));

  return (
    <AnimatedPressable
      style={[
        styles.fab,
        { width: size, height: size, borderRadius: size / 2 },
        shadows.xl,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <LinearGradient
        colors={[...gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.fabGradient, { borderRadius: size / 2 }]}
      >
        <Ionicons name={icon} size={size * 0.45} color="#FFFFFF" />
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  outline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    opacity: 0.4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    overflow: 'hidden',
  },
  fabGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
