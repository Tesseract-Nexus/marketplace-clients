import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '@/providers/ThemeProvider';
import { gradients } from '@/lib/design/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FloatingActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  onPress: () => void;
  gradient?: boolean;
  color?: string;
  position?: 'left' | 'center' | 'right';
  style?: ViewStyle;
}

export function FloatingActionButton({
  icon,
  label,
  onPress,
  gradient = true,
  color,
  position = 'right',
  style,
}: FloatingActionButtonProps) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const getPosition = (): ViewStyle => {
    switch (position) {
      case 'left':
        return { left: 20 };
      case 'center':
        return { left: '50%', marginLeft: label ? -60 : -28 };
      case 'right':
      default:
        return { right: 20 };
    }
  };

  const ButtonContent = () => (
    <>
      <Ionicons name={icon} size={24} color="#FFFFFF" />
      {label && <Text style={styles.label}>{label}</Text>}
    </>
  );

  return (
    <AnimatedPressable
      style={[
        styles.container,
        getPosition(),
        animatedStyle,
        style,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      entering={FadeInUp.delay(200).springify()}
    >
      {gradient ? (
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, label && styles.buttonExpanded]}
        >
          <ButtonContent />
        </LinearGradient>
      ) : (
        <Animated.View
          style={[
            styles.button,
            label && styles.buttonExpanded,
            { backgroundColor: color || colors.primary },
          ]}
        >
          <ButtonContent />
        </Animated.View>
      )}
    </AnimatedPressable>
  );
}

// Quick Actions FAB Group
interface QuickActionsProps {
  actions: Array<{
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    color?: string;
  }>;
  mainIcon?: keyof typeof Ionicons.glyphMap;
}

export function QuickActionsFAB({ actions, mainIcon = 'add' }: QuickActionsProps) {
  const colors = useColors();
  const [isOpen, setIsOpen] = React.useState(false);
  const rotation = useSharedValue(0);

  const mainButtonStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsOpen(!isOpen);
    rotation.value = withSpring(isOpen ? 0 : 45, { damping: 15 });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <Pressable style={styles.backdrop} onPress={toggleOpen} />
      )}

      {/* Action Items */}
      {isOpen &&
        actions.map((action, index) => (
          <Animated.View
            key={index}
            entering={FadeInUp.delay(index * 50).springify()}
            style={[styles.actionItem, { bottom: 100 + index * 60 }]}
          >
            <Text style={[styles.actionLabel, { color: colors.text }]}>
              {action.label}
            </Text>
            <Pressable
              style={[
                styles.actionButton,
                { backgroundColor: action.color || colors.primary },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                action.onPress();
                setIsOpen(false);
                rotation.value = withSpring(0, { damping: 15 });
              }}
            >
              <Ionicons name={action.icon} size={22} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        ))}

      {/* Main Button */}
      <Pressable
        style={[styles.container, { right: 20 }]}
        onPress={toggleOpen}
      >
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <Animated.View style={mainButtonStyle}>
            <Ionicons name={mainIcon} size={28} color="#FFFFFF" />
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    zIndex: 100,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonExpanded: {
    width: 'auto',
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 99,
  },
  actionItem: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 100,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
