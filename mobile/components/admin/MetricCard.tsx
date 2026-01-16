import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  withSpring,
} from 'react-native-reanimated';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { typography, gradients } from '@/lib/design/typography';
import { Sparkline } from '@/components/charts/Sparkline';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: keyof typeof Ionicons.glyphMap;
  gradient?: readonly [string, string];
  sparklineData?: number[];
  onPress?: () => void;
  delay?: number;
  variant?: 'default' | 'compact' | 'glass';
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  gradient,
  sparklineData,
  onPress,
  delay = 0,
  variant = 'default',
}: MetricCardProps) {
  const colors = useColors();
  const isDark = useIsDark();

  const scale = useSharedValue(1);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const valueAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 1, 1]),
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [10, 0]),
      },
    ],
  }));

  const isPositive = (change ?? 0) >= 0;
  const iconColor = gradient ? '#FFFFFF' : colors.primary;
  const textColor = gradient ? '#FFFFFF' : colors.text;
  const secondaryTextColor = gradient ? 'rgba(255,255,255,0.7)' : colors.textSecondary;

  const CardContent = (
    <View style={styles.content}>
      {/* Icon */}
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: gradient ? 'rgba(255,255,255,0.2)' : `${colors.primary}15`,
          },
        ]}
      >
        <Ionicons color={iconColor} name={icon} size={20} />
      </View>

      {/* Value */}
      <Animated.Text style={[styles.value, { color: textColor }, valueAnimatedStyle]}>
        {value}
      </Animated.Text>

      {/* Title & Change Row */}
      <View style={styles.bottomRow}>
        <Text style={[styles.title, { color: secondaryTextColor }]}>{title}</Text>

        {change !== undefined ? (
          <View
            style={[
              styles.changeBadge,
              {
                backgroundColor: gradient
                  ? isPositive
                    ? 'rgba(16,185,129,0.25)'
                    : 'rgba(239,68,68,0.25)'
                  : isPositive
                    ? colors.successLight
                    : colors.errorLight,
              },
            ]}
          >
            <Ionicons
              color={
                isPositive
                  ? gradient
                    ? '#34D399'
                    : colors.success
                  : gradient
                    ? '#F87171'
                    : colors.error
              }
              name={isPositive ? 'arrow-up' : 'arrow-down'}
              size={10}
            />
            <Text
              style={[
                styles.changeText,
                {
                  color: isPositive
                    ? gradient
                      ? '#34D399'
                      : colors.success
                    : gradient
                      ? '#F87171'
                      : colors.error,
                },
              ]}
            >
              {Math.abs(change)}%
            </Text>
          </View>
        ) : null}
      </View>

      {/* Sparkline (if provided) */}
      {sparklineData && sparklineData.length > 0 ? (
        <View style={styles.sparklineContainer}>
          <Sparkline
            data={sparklineData}
            height={24}
            showFill={false}
            strokeColor={gradient ? 'rgba(255,255,255,0.6)' : colors.primary}
            strokeWidth={1.5}
            width={60}
          />
        </View>
      ) : null}
    </View>
  );

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {gradient ? (
          <LinearGradient
            colors={[...gradient]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.container}
          >
            {CardContent}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.container,
              {
                backgroundColor: isDark ? colors.surface : colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              },
            ]}
          >
            {CardContent}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Compact stat pill for horizontal scrolling
export function StatPill({
  label,
  value,
  icon,
  color,
  onPress,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress?: () => void;
}) {
  const colors = useColors();
  const isDark = useIsDark();

  return (
    <Pressable
      style={[styles.pillContainer, { backgroundColor: isDark ? colors.surface : colors.card }]}
      onPress={onPress}
    >
      <View style={[styles.pillIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons color={color} name={icon} size={16} />
      </View>
      <View style={styles.pillContent}>
        <Text style={[styles.pillValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.pillLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
    minHeight: 120,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: {
    ...typography.title1,
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.caption,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  changeText: {
    ...typography.micro,
    fontWeight: '600',
  },
  sparklineContainer: {
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
  // Pill styles
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 10,
    marginRight: 10,
  },
  pillIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillContent: {},
  pillValue: {
    ...typography.bodyMedium,
  },
  pillLabel: {
    ...typography.micro,
  },
});
