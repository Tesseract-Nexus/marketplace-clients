import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/providers/ThemeProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SearchHeaderProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onFilterPress?: () => void;
  filterCount?: number;
  style?: ViewStyle;
}

export function SearchHeader({
  value,
  onChangeText,
  placeholder = 'Search...',
  autoFocus = false,
  onFilterPress,
  filterCount = 0,
  style,
}: SearchHeaderProps) {
  const colors = useColors();
  const [isFocused, setIsFocused] = useState(false);

  const scale = useSharedValue(1);

  const animatedFilterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleFilterPress = () => {
    scale.value = withSpring(0.9, { damping: 15 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15 });
    }, 100);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFilterPress?.();
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: `${colors.text}06`,
            borderColor: isFocused ? colors.primary : 'transparent',
            borderWidth: isFocused ? 2 : 0,
          },
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? colors.primary : colors.textSecondary}
        />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          autoFocus={autoFocus}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, { color: colors.text }]}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
            <Pressable onPress={() => onChangeText('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </Pressable>
          </Animated.View>
        )}
      </View>

      {onFilterPress && (
        <AnimatedPressable
          style={[
            styles.filterButton,
            { backgroundColor: filterCount > 0 ? colors.primary : `${colors.text}06` },
            animatedFilterStyle,
          ]}
          onPress={handleFilterPress}
        >
          <Ionicons
            name="options"
            size={20}
            color={filterCount > 0 ? colors.textOnPrimary : colors.textSecondary}
          />
          {filterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: colors.textOnPrimary }]}>
              <Animated.Text
                style={[styles.filterBadgeText, { color: colors.primary }]}
              >
                {filterCount}
              </Animated.Text>
            </View>
          )}
        </AnimatedPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
