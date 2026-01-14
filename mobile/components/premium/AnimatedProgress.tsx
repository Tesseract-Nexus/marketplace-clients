import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import { useColors } from '@/providers/ThemeProvider';
import { premiumGradients } from '@/lib/design/animations';

interface AnimatedProgressBarProps {
  progress: number; // 0-100
  height?: number;
  gradient?: readonly [string, string, ...string[]];
  backgroundColor?: string;
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  delay?: number;
  style?: ViewStyle;
}

export function AnimatedProgressBar({
  progress,
  height = 8,
  gradient = premiumGradients.cosmic,
  backgroundColor,
  showLabel = false,
  label,
  animated = true,
  delay = 0,
  style,
}: AnimatedProgressBarProps) {
  const colors = useColors();
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      animatedProgress.value = withDelay(
        delay,
        withTiming(Math.min(progress, 100), {
          duration: 1200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        })
      );
    } else {
      animatedProgress.value = progress;
    }
  }, [progress, animated, delay]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }));

  return (
    <View style={[styles.barContainer, style]}>
      {(showLabel || label) && (
        <View style={styles.labelRow}>
          {label && (
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {label}
            </Text>
          )}
          {showLabel && (
            <Text style={[styles.percentage, { color: colors.text }]}>
              {Math.round(progress)}%
            </Text>
          )}
        </View>
      )}
      <View
        style={[
          styles.barBackground,
          {
            height,
            backgroundColor: backgroundColor || `${colors.text}10`,
            borderRadius: height / 2,
          },
        ]}
      >
        <Animated.View style={[styles.barFill, { borderRadius: height / 2 }, progressStyle]}>
          <LinearGradient
            colors={[...gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, { borderRadius: height / 2 }]}
          />
        </Animated.View>
      </View>
    </View>
  );
}

interface CircularProgressProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  gradient?: readonly [string, string];
  backgroundColor?: string;
  showValue?: boolean;
  label?: string;
  delay?: number;
}

export function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 10,
  gradient = ['#6366F1', '#8B5CF6'],
  backgroundColor,
  showValue = true,
  label,
  delay = 0,
}: CircularProgressProps) {
  const colors = useColors();
  const [displayProgress, setDisplayProgress] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (displayProgress / 100) * circumference;

  useEffect(() => {
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const duration = 1500;
      const startValue = 0;
      const endValue = Math.min(progress, 100);

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progressFraction = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progressFraction, 3);
        const current = startValue + (endValue - startValue) * eased;

        setDisplayProgress(current);

        if (progressFraction < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, delay);

    return () => clearTimeout(timeout);
  }, [progress, delay]);

  return (
    <View style={[styles.circularContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <SvgGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={gradient[0]} />
            <Stop offset="100%" stopColor={gradient[1]} />
          </SvgGradient>
        </Defs>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor || `${colors.text}10`}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {showValue && (
        <View style={styles.circularContent}>
          <Text style={[styles.circularValue, { color: colors.text }]}>
            {Math.round(displayProgress)}%
          </Text>
          {label && (
            <Text style={[styles.circularLabel, { color: colors.textSecondary }]}>
              {label}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// Multi-segment progress (for comparing values)
interface SegmentedProgressProps {
  segments: Array<{
    value: number;
    color: string;
    label?: string;
  }>;
  height?: number;
  style?: ViewStyle;
}

export function SegmentedProgress({
  segments,
  height = 12,
  style,
}: SegmentedProgressProps) {
  const colors = useColors();
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  return (
    <View style={style}>
      <View
        style={[
          styles.segmentedBar,
          {
            height,
            backgroundColor: `${colors.text}10`,
            borderRadius: height / 2,
          },
        ]}
      >
        {segments.map((segment, index) => {
          const width = (segment.value / total) * 100;
          return (
            <Animated.View
              key={index}
              style={[
                styles.segment,
                {
                  width: `${width}%`,
                  backgroundColor: segment.color,
                  borderTopLeftRadius: index === 0 ? height / 2 : 0,
                  borderBottomLeftRadius: index === 0 ? height / 2 : 0,
                  borderTopRightRadius: index === segments.length - 1 ? height / 2 : 0,
                  borderBottomRightRadius: index === segments.length - 1 ? height / 2 : 0,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.segmentLabels}>
        {segments.map((segment, index) => (
          <View key={index} style={styles.segmentLabel}>
            <View
              style={[styles.segmentDot, { backgroundColor: segment.color }]}
            />
            <Text style={[styles.segmentText, { color: colors.textSecondary }]}>
              {segment.label || `${Math.round((segment.value / total) * 100)}%`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {},
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '700',
  },
  barBackground: {
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    overflow: 'hidden',
  },
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  circularContent: {
    alignItems: 'center',
  },
  circularValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  circularLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  segmentedBar: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
  },
  segmentLabels: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  segmentLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  segmentText: {
    fontSize: 12,
  },
});
