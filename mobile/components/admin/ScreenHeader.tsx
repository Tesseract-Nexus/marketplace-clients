import React, { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { typography } from '@/lib/design/typography';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    badge?: number;
  };
  rightActions?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    badge?: number;
  }[];
  transparent?: boolean;
  large?: boolean;
  children?: ReactNode;
  style?: ViewStyle;
}

export function ScreenHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightAction,
  rightActions,
  transparent = false,
  large = true,
  children,
  style,
}: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const actions = rightActions || (rightAction ? [rightAction] : []);

  const HeaderContent = (
    <View style={[styles.container, { paddingTop: insets.top + 8 }, style]}>
      {/* Top Row with Back/Actions */}
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable
            hitSlop={8}
            style={[styles.iconButton, { backgroundColor: `${colors.text}08` }]}
            onPress={handleBack}
          >
            <Ionicons color={colors.text} name="arrow-back" size={22} />
          </Pressable>
        ) : (
          <View style={styles.iconButton} />
        )}

        {!large ? (
          <Animated.Text
            entering={FadeInDown.delay(50)}
            style={[styles.titleSmall, { color: colors.text }]}
          >
            {title}
          </Animated.Text>
        ) : null}

        <View style={styles.actionsRow}>
          {actions.map((action, index) => (
            <Pressable
              key={index}
              hitSlop={8}
              style={[styles.iconButton, { backgroundColor: `${colors.primary}10` }]}
              onPress={action.onPress}
            >
              <Ionicons color={colors.primary} name={action.icon} size={22} />
              {action.badge !== undefined && action.badge > 0 ? (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>{action.badge > 99 ? '99+' : action.badge}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Large Title */}
      {large ? (
        <Animated.View entering={FadeInDown.delay(100)} style={styles.titleContainer}>
          <Text style={[styles.titleLarge, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </Animated.View>
      ) : null}

      {/* Additional content (search, filters, etc.) */}
      {children}
    </View>
  );

  if (transparent) {
    return HeaderContent;
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>{HeaderContent}</View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 8,
  },
  container: {
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  titleSmall: {
    ...typography.headline,
    flex: 1,
    textAlign: 'center',
  },
  titleContainer: {
    marginBottom: 8,
  },
  titleLarge: {
    ...typography.title1,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.callout,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
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
});
