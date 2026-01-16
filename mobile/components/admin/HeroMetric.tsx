import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { typography, gradients, animations } from '@/lib/design/typography';
import { Sparkline } from '@/components/charts/Sparkline';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface HeroMetricProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  gradient?: readonly [string, string];
  sparklineData?: number[];
  onPress?: () => void;
}

// Animated counter component
function AnimatedNumber({ value }: { value: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3, 1], [0, 1, 1]),
    transform: [
      {
        translateY: interpolate(progress.value, [0, 1], [20, 0]),
      },
    ],
  }));

  return <Animated.Text style={[styles.heroValue, animatedStyle]}>{value}</Animated.Text>;
}

export function HeroMetric({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  icon = 'wallet',
  gradient = gradients.revenue,
  sparklineData = [45, 52, 48, 60, 55, 70, 65, 80, 75, 95],
  onPress,
}: HeroMetricProps) {
  const colors = useColors();
  const isDark = useIsDark();

  const isPositive = (change ?? 0) >= 0;

  return (
    <View>
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={[...gradient]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.container}
        >
          {/* Glass overlay */}
          <View style={styles.glassOverlay}>
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="light" />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Header Row */}
            <View style={styles.headerRow}>
              <View style={styles.iconContainer}>
                <Ionicons color="rgba(255,255,255,0.9)" name={icon} size={20} />
              </View>
              <Text style={styles.title}>{title}</Text>
            </View>

            {/* Value Row */}
            <View style={styles.valueRow}>
              <View style={styles.valueContainer}>
                <AnimatedNumber value={value} />

                {/* Change indicator */}
                {change !== undefined ? (
                  <View style={styles.changeContainer}>
                    <View
                      style={[
                        styles.changeBadge,
                        {
                          backgroundColor: isPositive
                            ? 'rgba(16,185,129,0.2)'
                            : 'rgba(239,68,68,0.2)',
                        },
                      ]}
                    >
                      <Ionicons
                        color={isPositive ? '#34D399' : '#F87171'}
                        name={isPositive ? 'trending-up' : 'trending-down'}
                        size={14}
                      />
                      <Text
                        style={[styles.changeValue, { color: isPositive ? '#34D399' : '#F87171' }]}
                      >
                        {isPositive ? '+' : ''}
                        {change.toFixed(1)}%
                      </Text>
                    </View>
                    <Text style={styles.changeLabel}>{changeLabel}</Text>
                  </View>
                ) : null}
              </View>

              {/* Sparkline */}
              {sparklineData && sparklineData.length > 0 ? (
                <View style={styles.sparklineContainer}>
                  <Sparkline
                    data={sparklineData}
                    fillColor="rgba(255,255,255,0.3)"
                    height={48}
                    strokeColor="rgba(255,255,255,0.8)"
                    strokeWidth={2.5}
                    width={100}
                  />
                </View>
              ) : null}
            </View>
          </View>

          {/* Decorative circles */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  content: {
    padding: 24,
    zIndex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    ...typography.calloutMedium,
    color: 'rgba(255,255,255,0.9)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  valueContainer: {
    flex: 1,
  },
  heroValue: {
    ...typography.display,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  changeValue: {
    ...typography.calloutMedium,
  },
  changeLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.6)',
  },
  sparklineContainer: {
    marginLeft: 16,
  },
  // Decorative elements
  decorativeCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
