import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useColors } from '@/providers/ThemeProvider';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  count?: number;
  delay?: number;
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  iconColor,
  action,
  count,
  delay = 0,
  style,
}: SectionHeaderProps) {
  const colors = useColors();

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={[styles.container, style]}
    >
      <View style={styles.leftSection}>
        {icon && (
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${iconColor || colors.primary}15` },
            ]}
          >
            <Ionicons
              name={icon}
              size={18}
              color={iconColor || colors.primary}
            />
          </View>
        )}
        <View>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {count !== undefined && (
              <View style={[styles.countBadge, { backgroundColor: `${colors.primary}15` }]}>
                <Text style={[styles.countText, { color: colors.primary }]}>
                  {count}
                </Text>
              </View>
            )}
          </View>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {action && (
        <Pressable
          style={[styles.actionButton, { backgroundColor: `${colors.primary}10` }]}
          onPress={action.onPress}
          hitSlop={8}
        >
          <Text style={[styles.actionLabel, { color: colors.primary }]}>
            {action.label}
          </Text>
          <Ionicons name="arrow-forward" size={14} color={colors.primary} />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});
