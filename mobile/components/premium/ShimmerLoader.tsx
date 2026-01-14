import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Dimensions, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors, useIsDark } from '@/providers/ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ShimmerLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'default' | 'circle' | 'text' | 'card';
}

export function ShimmerLoader({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  variant = 'default',
}: ShimmerLoaderProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const translateX = useSharedValue(-SCREEN_WIDTH);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(SCREEN_WIDTH, {
        duration: 1500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'circle':
        return {
          width: height,
          height,
          borderRadius: height / 2,
        };
      case 'text':
        return {
          width: typeof width === 'number' ? width : '60%',
          height: 14,
          borderRadius: 4,
        };
      case 'card':
        return {
          width: '100%',
          height: 120,
          borderRadius: 16,
        };
      default:
        return {
          width: typeof width === 'number' ? width : undefined,
          height,
          borderRadius,
        };
    }
  };

  const baseColor = isDark ? '#27272A' : '#E5E7EB';
  const shimmerColor = isDark ? '#3F3F46' : '#F3F4F6';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: baseColor },
        getVariantStyles(),
        typeof width === 'string' && { width: width as DimensionValue },
        style,
      ]}
    >
      <Animated.View style={[styles.shimmer, animatedStyle]}>
        <LinearGradient
          colors={['transparent', shimmerColor, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

// Preset shimmer components
export function ShimmerAvatar({ size = 48 }: { size?: number }) {
  return <ShimmerLoader variant="circle" height={size} />;
}

export function ShimmerText({ width = '60%' }: { width?: number | string }) {
  return <ShimmerLoader variant="text" width={width} />;
}

export function ShimmerCard() {
  return <ShimmerLoader variant="card" />;
}

// Card skeleton preset
export function CardSkeleton() {
  const colors = useColors();
  const isDark = useIsDark();

  return (
    <View
      style={[
        styles.cardSkeleton,
        { backgroundColor: isDark ? colors.surface : colors.card },
      ]}
    >
      <View style={styles.cardSkeletonHeader}>
        <ShimmerAvatar size={44} />
        <View style={styles.cardSkeletonHeaderText}>
          <ShimmerText width="70%" />
          <ShimmerText width="40%" />
        </View>
      </View>
      <ShimmerLoader height={16} style={{ marginTop: 16 }} />
      <ShimmerLoader height={16} width="80%" style={{ marginTop: 8 }} />
      <View style={styles.cardSkeletonFooter}>
        <ShimmerLoader height={32} width={80} borderRadius={8} />
        <ShimmerLoader height={32} width={80} borderRadius={8} />
      </View>
    </View>
  );
}

// Stats skeleton preset
export function StatsSkeleton() {
  return (
    <View style={styles.statsRow}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={styles.statItem}>
          <ShimmerLoader height={48} borderRadius={12} />
          <ShimmerText width="60%" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: SCREEN_WIDTH,
  },
  gradient: {
    flex: 1,
    width: SCREEN_WIDTH * 0.5,
  },
  cardSkeleton: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  cardSkeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardSkeletonHeaderText: {
    flex: 1,
    gap: 8,
  },
  cardSkeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    gap: 8,
  },
});
