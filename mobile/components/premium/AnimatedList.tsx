import React, { ReactNode, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Easing,
  Extrapolation,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { springs, shadows, stagger } from '@/lib/design/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Animated list item with stagger effect
interface AnimatedListItemProps {
  children: ReactNode;
  index: number;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  staggerDelay?: number;
  animationType?: 'fade' | 'slide' | 'scale' | 'spring';
}

export function AnimatedListItem({
  children,
  index,
  onPress,
  onLongPress,
  style,
  staggerDelay = stagger.normal,
  animationType = 'spring',
}: AnimatedListItemProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const scale = useSharedValue(1);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(index * staggerDelay, withSpring(1, springs.smooth));
  }, [index, staggerDelay]);

  const handlePressIn = () => {
    if (onPress || onLongPress) {
      scale.value = withSpring(0.97, springs.snappy);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.bouncy);
  };

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    let transforms: any[] = [{ scale: scale.value }];

    switch (animationType) {
      case 'fade':
        break;
      case 'slide':
        transforms = [
          { translateX: interpolate(progress.value, [0, 1], [50, 0]) },
          { scale: scale.value },
        ];
        break;
      case 'scale':
        transforms = [
          {
            scale: interpolate(progress.value, [0, 1], [0.8, 1], Extrapolation.CLAMP) * scale.value,
          },
        ];
        break;
      case 'spring':
      default:
        transforms = [
          { translateY: interpolate(progress.value, [0, 1], [30, 0]) },
          { scale: scale.value },
        ];
        break;
    }

    return {
      opacity: progress.value,
      transform: transforms,
    };
  });

  const Wrapper = onPress || onLongPress ? AnimatedPressable : Animated.View;

  return (
    <Wrapper
      style={[
        styles.listItem,
        { backgroundColor: isDark ? colors.surface : colors.card },
        shadows.sm,
        animatedStyle,
        style,
      ]}
      onLongPress={onLongPress}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {children}
    </Wrapper>
  );
}

// Swipeable list item
interface SwipeableItemProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  style?: ViewStyle;
}

export function SwipeableItem({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  style,
}: SwipeableItemProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.swipeableContainer, style]}>
      {/* Left action */}
      {leftAction ? (
        <View style={[styles.swipeAction, styles.leftAction]}>{leftAction}</View>
      ) : null}

      {/* Right action */}
      {rightAction ? (
        <View style={[styles.swipeAction, styles.rightAction]}>{rightAction}</View>
      ) : null}

      {/* Main content */}
      <Animated.View
        style={[
          styles.swipeableContent,
          { backgroundColor: isDark ? colors.surface : colors.card },
          animatedStyle,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

// Reorderable list item
interface ReorderableItemProps {
  children: ReactNode;
  isActive?: boolean;
  style?: ViewStyle;
}

export function ReorderableItem({ children, isActive = false, style }: ReorderableItemProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const scale = useSharedValue(1);
  const elevation = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      scale.value = withSpring(1.03, springs.snappy);
      elevation.value = withTiming(1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      scale.value = withSpring(1, springs.smooth);
      elevation.value = withTiming(0);
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    zIndex: isActive ? 100 : 0,
    shadowOpacity: interpolate(elevation.value, [0, 1], [0.05, 0.25]),
    shadowRadius: interpolate(elevation.value, [0, 1], [2, 15]),
  }));

  return (
    <Animated.View
      style={[
        styles.reorderableItem,
        { backgroundColor: isDark ? colors.surface : colors.card },
        shadows.sm,
        animatedStyle,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Expandable list item
interface ExpandableItemProps {
  header: ReactNode;
  children: ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  style?: ViewStyle;
}

export function ExpandableItem({
  header,
  children,
  expanded = false,
  onToggle,
  style,
}: ExpandableItemProps) {
  const colors = useColors();
  const isDark = useIsDark();
  const height = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withSpring(expanded ? 180 : 0, springs.smooth);
  }, [expanded]);

  const contentStyle = useAnimatedStyle(() => ({
    height: expanded ? 'auto' : 0,
    opacity: expanded ? 1 : 0,
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View
      style={[
        styles.expandableItem,
        { backgroundColor: isDark ? colors.surface : colors.card },
        shadows.sm,
        style,
      ]}
    >
      <Pressable
        style={styles.expandableHeader}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle?.();
        }}
      >
        {header}
      </Pressable>
      {expanded ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.expandableContent}
        >
          {children}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  listItem: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 20,
  },
  swipeableContainer: {
    position: 'relative',
    marginVertical: 4,
    marginHorizontal: 20,
  },
  swipeAction: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  leftAction: {
    left: 0,
  },
  rightAction: {
    right: 0,
  },
  swipeableContent: {
    borderRadius: 16,
    padding: 16,
  },
  reorderableItem: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
  },
  expandableItem: {
    borderRadius: 16,
    marginVertical: 4,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  expandableHeader: {
    padding: 16,
  },
  expandableContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});
