import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  interpolateColor,
  Extrapolation,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { useCartStore } from '@/stores/cart-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface TabItem {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused?: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

interface AnimatedTabBarProps {
  tabs: TabItem[];
  activeIndex: number;
  onTabPress: (index: number) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabBarItem({
  tab,
  index,
  isActive,
  onPress,
  tabWidth,
}: {
  tab: TabItem;
  index: number;
  isActive: boolean;
  onPress: () => void;
  tabWidth: number;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const progress = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isActive ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isActive, progress]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.85, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, [scale]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const containerStyle = useAnimatedStyle((): any => ({
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle((): any => {
    const translateY = interpolate(progress.value, [0, 1], [0, -4], Extrapolation.CLAMP);
    const iconScale = interpolate(progress.value, [0, 1], [1, 1.15], Extrapolation.CLAMP);

    return {
      transform: [{ translateY }, { scale: iconScale }],
    };
  });

  const labelStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0.7, 0.85, 1], Extrapolation.CLAMP);
    const translateY = interpolate(progress.value, [0, 1], [0, -2], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const iconColor = isActive ? colors.primary : colors.textTertiary;
  const iconName = isActive && tab.iconFocused ? tab.iconFocused : tab.icon;

  return (
    <AnimatedPressable
      style={[styles.tabItem, { width: tabWidth }, containerStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        <Ionicons name={iconName} size={24} color={iconColor} />
        {tab.badge !== undefined && tab.badge > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
            <Text style={styles.badgeText}>
              {tab.badge > 99 ? '99+' : tab.badge}
            </Text>
          </View>
        )}
      </Animated.View>
      <Animated.Text
        style={[
          styles.label,
          { color: iconColor },
          labelStyle,
        ]}
      >
        {tab.label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

export function AnimatedTabBar({
  tabs,
  activeIndex,
  onTabPress,
}: AnimatedTabBarProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const { getItemCount } = useCartStore();

  const tabWidth = (SCREEN_WIDTH - 32) / tabs.length;
  const indicatorPosition = useSharedValue(activeIndex * tabWidth);

  useEffect(() => {
    indicatorPosition.value = withSpring(activeIndex * tabWidth, {
      damping: 18,
      stiffness: 150,
    });
  }, [activeIndex, tabWidth, indicatorPosition]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
  }));

  // Add cart badge to cart tab
  const tabsWithBadges = tabs.map((tab) => {
    if (tab.name === 'cart') {
      return { ...tab, badge: getItemCount() };
    }
    return tab;
  });

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Glassmorphism Background */}
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)' },
          ]}
        />
      )}

      {/* Top Border Gradient */}
      <LinearGradient
        colors={
          isDark
            ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)', 'transparent']
            : ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.01)', 'transparent']
        }
        style={styles.topBorder}
      />

      {/* Floating Indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            width: tabWidth - 16,
            backgroundColor: isDark
              ? 'rgba(79,70,229,0.15)'
              : 'rgba(79,70,229,0.1)',
          },
          indicatorStyle,
        ]}
      >
        <LinearGradient
          colors={[
            isDark ? 'rgba(79,70,229,0.3)' : 'rgba(79,70,229,0.2)',
            isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
        />
      </Animated.View>

      {/* Tab Items */}
      <View style={styles.tabsContainer}>
        {tabsWithBadges.map((tab, index) => (
          <TabBarItem
            key={tab.name}
            tab={tab}
            index={index}
            isActive={index === activeIndex}
            onPress={() => onTabPress(index)}
            tabWidth={tabWidth}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 48,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  indicator: {
    position: 'absolute',
    top: 8,
    left: 24,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
});
