import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/providers/ThemeProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface DataListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  leftIconColor?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  rightText?: string;
  rightSubtext?: string;
  badge?: string;
  badgeColor?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  actions?: {
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
    onPress: () => void;
  }[];
  index?: number;
  style?: ViewStyle;
}

export function DataListItem({
  title,
  subtitle,
  description,
  leftIcon,
  leftIconColor,
  leftElement,
  rightElement,
  rightText,
  rightSubtext,
  badge,
  badgeColor,
  onPress,
  onLongPress,
  actions,
  index = 0,
  style,
}: DataListItemProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const Container = onPress ? AnimatedPressable : Animated.View;

  return (
    <Container
      entering={FadeInRight.delay(index * 50).springify()}
      style={[
        styles.container,
        { backgroundColor: colors.surface },
        onPress && animatedStyle,
        style,
      ]}
      onLongPress={onLongPress}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* Left Section */}
      <View style={styles.leftSection}>
        {leftElement}
        {leftIcon && !leftElement ? (
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${leftIconColor || colors.primary}15` },
            ]}
          >
            <Ionicons color={leftIconColor || colors.primary} name={leftIcon} size={22} />
          </View>
        ) : null}

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
              {title}
            </Text>
            {badge ? (
              <View
                style={[styles.badge, { backgroundColor: `${badgeColor || colors.primary}15` }]}
              >
                <Text style={[styles.badgeText, { color: badgeColor || colors.primary }]}>
                  {badge}
                </Text>
              </View>
            ) : null}
          </View>
          {subtitle ? (
            <Text numberOfLines={1} style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
          {description ? (
            <Text numberOfLines={2} style={[styles.description, { color: colors.textTertiary }]}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Right Section */}
      <View style={styles.rightSection}>
        {rightElement}
        {rightText && !rightElement ? (
          <View style={styles.rightTextContainer}>
            <Text style={[styles.rightText, { color: colors.text }]}>{rightText}</Text>
            {rightSubtext ? (
              <Text style={[styles.rightSubtext, { color: colors.textSecondary }]}>
                {rightSubtext}
              </Text>
            ) : null}
          </View>
        ) : null}
        {actions ? (
          <View style={styles.actionsContainer}>
            {actions.map((action, i) => (
              <Pressable
                key={i}
                hitSlop={4}
                style={[
                  styles.actionButton,
                  { backgroundColor: `${action.color || colors.primary}10` },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  action.onPress();
                }}
              >
                <Ionicons color={action.color || colors.primary} name={action.icon} size={18} />
              </Pressable>
            ))}
          </View>
        ) : null}
        {onPress && !rightElement && !actions ? (
          <Ionicons color={colors.textTertiary} name="chevron-forward" size={20} />
        ) : null}
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    marginHorizontal: 20,
    marginVertical: 4,
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  rightTextContainer: {
    alignItems: 'flex-end',
  },
  rightText: {
    fontSize: 15,
    fontWeight: '600',
  },
  rightSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
