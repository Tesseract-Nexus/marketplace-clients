import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { typography, gradients } from '@/lib/design/typography';

interface InsightCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: readonly [string, string];
  onPress?: () => void;
  index?: number;
}

export function InsightCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  onPress,
  index = 0,
}: InsightCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <LinearGradient
          colors={[...gradient]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.container}
        >
          <View style={styles.iconContainer}>
            <Ionicons color="rgba(255,255,255,0.9)" name={icon} size={18} />
          </View>

          <Text style={styles.value}>{value}</Text>
          <Text style={styles.title}>{title}</Text>

          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// Quick Action Button (Apple Music style)
interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress?: () => void;
  index?: number;
}

export function QuickAction({ icon, label, color, onPress, index = 0 }: QuickActionProps) {
  const colors = useColors();
  const isDark = useIsDark();

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 500 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.actionWrapper, animatedStyle]}>
      <Pressable
        style={styles.actionButton}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <LinearGradient colors={[`${color}20`, `${color}10`]} style={styles.actionIconContainer}>
          <Ionicons color={color} name={icon} size={26} />
        </LinearGradient>
        <Text numberOfLines={1} style={[styles.actionLabel, { color: colors.text }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// Activity Item (Tesla style)
interface ActivityItemProps {
  title: string;
  subtitle: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  onPress?: () => void;
  index?: number;
}

export function ActivityItem({
  title,
  subtitle,
  time,
  icon,
  iconColor,
  onPress,
  index = 0,
}: ActivityItemProps) {
  const colors = useColors();
  const isDark = useIsDark();

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[
          styles.activityContainer,
          { backgroundColor: isDark ? colors.surface : colors.card },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={[styles.activityIcon, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons color={iconColor} name={icon} size={18} />
        </View>

        <View style={styles.activityContent}>
          <Text style={[styles.activityTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.activitySubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>

        <Text style={[styles.activityTime, { color: colors.textTertiary }]}>{time}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Insight Card
  wrapper: {
    width: 140,
    marginRight: 12,
  },
  container: {
    borderRadius: 20,
    padding: 16,
    minHeight: 130,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: {
    ...typography.title2,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  title: {
    ...typography.captionMedium,
    color: 'rgba(255,255,255,0.8)',
  },
  subtitle: {
    ...typography.micro,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },

  // Quick Action
  actionWrapper: {
    flex: 1,
    minWidth: 70,
    maxWidth: 85,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    ...typography.captionMedium,
    textAlign: 'center',
  },

  // Activity Item
  activityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    ...typography.bodyMedium,
    marginBottom: 2,
  },
  activitySubtitle: {
    ...typography.caption,
  },
  activityTime: {
    ...typography.micro,
  },
});
