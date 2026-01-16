import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '@/providers/ThemeProvider';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface FilterChip {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  count?: number;
}

interface FilterChipsProps {
  chips: FilterChip[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  showAll?: boolean;
  allLabel?: string;
  style?: ViewStyle;
}

export function FilterChips({
  chips,
  selectedId,
  onSelect,
  showAll = true,
  allLabel = 'All',
  style,
}: FilterChipsProps) {
  const colors = useColors();

  const allChips = showAll ? [{ id: null, label: allLabel } as FilterChip, ...chips] : chips;

  return (
    <ScrollView
      horizontal
      contentContainerStyle={[styles.container, style]}
      showsHorizontalScrollIndicator={false}
    >
      {allChips.map((chip) => (
        <ChipItem
          key={chip.id ?? 'all'}
          chip={chip}
          isSelected={selectedId === chip.id}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(chip.id);
          }}
        />
      ))}
    </ScrollView>
  );
}

interface ChipItemProps {
  chip: FilterChip;
  isSelected: boolean;
  onPress: () => void;
}

function ChipItem({ chip, isSelected, onPress }: ChipItemProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? colors.primary : `${colors.text}08`,
          borderColor: isSelected ? colors.primary : `${colors.text}10`,
        },
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {chip.icon ? (
        <Ionicons
          color={isSelected ? colors.textOnPrimary : colors.textSecondary}
          name={chip.icon}
          size={16}
          style={styles.chipIcon}
        />
      ) : null}
      <Text style={[styles.chipLabel, { color: isSelected ? colors.textOnPrimary : colors.text }]}>
        {chip.label}
      </Text>
      {chip.count !== undefined ? (
        <Text
          style={[
            styles.chipCount,
            {
              color: isSelected ? colors.textOnPrimary : colors.textSecondary,
              backgroundColor: isSelected ? `${colors.textOnPrimary}20` : `${colors.text}08`,
            },
          ]}
        >
          {chip.count}
        </Text>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  chipIcon: {
    marginRight: 2,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipCount: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
