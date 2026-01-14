import React, { useEffect } from 'react';
import { View, ViewStyle, StyleSheet, DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors, useBorderRadius } from '@/providers/ThemeProvider';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius,
  style,
}: SkeletonProps) {
  const colors = useColors();
  const defaultBorderRadius = useBorderRadius();
  const shimmerPosition = useSharedValue(0);

  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, [shimmerPosition]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            shimmerPosition.value,
            [0, 1],
            [-200, 200]
          ),
        },
      ],
    };
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: borderRadius ?? defaultBorderRadius.md,
          backgroundColor: colors.surface,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            colors.background,
            'transparent',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// Skeleton Text Line
interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  lastLineWidth?: DimensionValue;
  spacing?: number;
}

export function SkeletonText({
  lines = 3,
  lineHeight = 16,
  lastLineWidth = '60%',
  spacing = 8,
}: SkeletonTextProps) {
  return (
    <View>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          style={{ marginTop: index > 0 ? spacing : 0 }}
        />
      ))}
    </View>
  );
}

// Skeleton Card
export function SkeletonCard() {
  const spacing = 12;

  return (
    <View style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing }}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={{ flex: 1, marginLeft: spacing }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      <SkeletonText lines={2} spacing={6} />
    </View>
  );
}

// Skeleton Product Card
export function SkeletonProductCard() {
  const borderRadius = useBorderRadius();

  return (
    <View>
      <Skeleton
        height={180}
        borderRadius={borderRadius.xl}
        style={{ marginBottom: 12 }}
      />
      <Skeleton width="80%" height={16} />
      <Skeleton width="40%" height={14} style={{ marginTop: 6 }} />
      <Skeleton width="30%" height={20} style={{ marginTop: 8 }} />
    </View>
  );
}

// Skeleton List Item
export function SkeletonListItem() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
      }}
    >
      <Skeleton width={56} height={56} borderRadius={12} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="50%" height={12} style={{ marginTop: 6 }} />
        <Skeleton width="30%" height={12} style={{ marginTop: 6 }} />
      </View>
      <Skeleton width={60} height={24} borderRadius={12} />
    </View>
  );
}

// Skeleton Dashboard Stats
export function SkeletonDashboardStats() {
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {[1, 2].map((i) => (
        <View
          key={i}
          style={{
            flex: 1,
            padding: 16,
            backgroundColor: 'transparent',
          }}
        >
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width="60%" height={24} style={{ marginTop: 12 }} />
          <Skeleton width="40%" height={14} style={{ marginTop: 6 }} />
        </View>
      ))}
    </View>
  );
}

// Skeleton Order Item
export function SkeletonOrderItem() {
  return (
    <View style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Skeleton width={100} height={18} />
        <Skeleton width={80} height={24} borderRadius={12} />
      </View>
      <Skeleton width="60%" height={14} />
      <View style={{ flexDirection: 'row', marginTop: 12, gap: 12 }}>
        <Skeleton width={48} height={48} borderRadius={8} />
        <Skeleton width={48} height={48} borderRadius={8} />
        <Skeleton width={48} height={48} borderRadius={8} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <Skeleton width="30%" height={14} />
        <Skeleton width="20%" height={16} />
      </View>
    </View>
  );
}
