import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { premiumGradients, shadows } from '@/lib/design/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = 100;

interface ParallaxHeaderProps {
  scrollY: SharedValue<number>;
  title: string;
  subtitle?: string;
  gradient?: readonly [string, string, ...string[]];
  backgroundImage?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  children?: ReactNode;
}

export function ParallaxHeader({
  scrollY,
  title,
  subtitle,
  gradient = premiumGradients.cosmic,
  backgroundImage,
  leftAction,
  rightAction,
  children,
}: ParallaxHeaderProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();

  const headerHeight = HEADER_MAX_HEIGHT + insets.top;
  const minHeight = HEADER_MIN_HEIGHT + insets.top;

  // Header animation styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
      [headerHeight, minHeight],
      Extrapolation.CLAMP
    );

    return {
      height,
    };
  });

  // Background scale for parallax effect
  const backgroundStyle = useAnimatedStyle(() => {
    'worklet';
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.3, 1],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
      [0, -50],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }] as any,
    };
  });

  // Title animations
  const titleStyle = useAnimatedStyle(() => {
    'worklet';
    const opacity = interpolate(
      scrollY.value,
      [0, 80, 120],
      [1, 0.5, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -20],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.9],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }, { scale }] as any,
    };
  });

  // Mini title (shows when scrolled)
  const miniTitleStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [80, 120],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  // Content opacity (fades out when scrolling)
  const contentStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 60],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.header, headerAnimatedStyle]}>
      {/* Background */}
      <Animated.View style={[styles.backgroundContainer, backgroundStyle]}>
        <LinearGradient
          colors={[...gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Decorative elements */}
        <View style={styles.decoration}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>
      </Animated.View>

      {/* Top bar with actions */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBarAction}>{leftAction}</View>

        <Animated.Text style={[styles.miniTitle, miniTitleStyle]}>
          {title}
        </Animated.Text>

        <View style={styles.topBarAction}>{rightAction}</View>
      </View>

      {/* Main title */}
      <Animated.View style={[styles.titleContainer, titleStyle]}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </Animated.View>

      {/* Additional content */}
      {children && (
        <Animated.View style={[styles.content, contentStyle]}>
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
}

// Simplified sticky header for lists
interface StickyHeaderProps {
  scrollY: SharedValue<number>;
  title: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  threshold?: number;
}

export function StickyHeader({
  scrollY,
  title,
  leftAction,
  rightAction,
  threshold = 50,
}: StickyHeaderProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [threshold - 20, threshold],
      [0, 1],
      Extrapolation.CLAMP
    );

    const backgroundColor = interpolate(
      scrollY.value,
      [threshold - 20, threshold],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      backgroundColor: `rgba(${isDark ? '24,24,27' : '255,255,255'}, ${backgroundColor})`,
      borderBottomColor: `rgba(0,0,0,${opacity * 0.1})`,
    };
  });

  const titleStyle = useAnimatedStyle(() => {
    'worklet';
    const opacity = interpolate(
      scrollY.value,
      [threshold - 20, threshold],
      [0, 1],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [threshold - 20, threshold],
      [10, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }] as any,
    };
  });

  return (
    <Animated.View
      style={[
        styles.stickyHeader,
        { paddingTop: insets.top },
        headerStyle,
      ]}
    >
      <View style={styles.stickyHeaderContent}>
        <View style={styles.topBarAction}>{leftAction}</View>
        <Animated.Text
          style={[styles.stickyTitle, { color: colors.text }, titleStyle]}
        >
          {title}
        </Animated.Text>
        <View style={styles.topBarAction}>{rightAction}</View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  decoration: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: -50,
    right: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: -30,
    left: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    top: '40%',
    left: '60%',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  topBarAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: 1,
  },
  stickyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  stickyTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
});
