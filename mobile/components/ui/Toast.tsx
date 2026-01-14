import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInUp,
  FadeOutUp,
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';

import { useColors, useBorderRadius, useShadows } from '@/providers/ThemeProvider';

// Check if we're running in Expo Go (which doesn't have burnt native module)
const isExpoGo = Constants.appOwnership === 'expo';

// Only import burnt in development builds (not Expo Go)
let burntToast: ((options: { title: string; message?: string; preset?: string; haptic?: string; duration?: number }) => void) | null = null;

if (!isExpoGo) {
  try {
    // Dynamic import to prevent bundler from including it in Expo Go builds
    const burnt = require('burnt');
    burntToast = burnt.toast;
  } catch {
    burntToast = null;
  }
}

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type?: ToastType;
  title: string;
  message?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
  duration?: number;
}

// Store for managing fallback toasts
let toastTimeout: NodeJS.Timeout | null = null;
let toastVisible = false;
let toastListeners: Array<(visible: boolean, title: string, message?: string, type?: ToastType) => void> = [];

export const subscribeToFallbackToast = (
  listener: (visible: boolean, title: string, message?: string, type?: ToastType) => void
) => {
  toastListeners.push(listener);
  return () => {
    toastListeners = toastListeners.filter(l => l !== listener);
  };
};

// Fallback toast using custom component (for Expo Go) - auto-dismisses after 2.5 seconds
const fallbackToast = (title: string, message?: string, type?: ToastType) => {
  // Provide haptic feedback
  if (type === 'success') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } else if (type === 'error') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } else if (type === 'warning') {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } else {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // Clear any existing timeout
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  // Notify listeners to show toast
  toastVisible = true;
  toastListeners.forEach(l => l(true, title, message, type));

  // Auto-dismiss after 2.5 seconds
  toastTimeout = setTimeout(() => {
    toastVisible = false;
    toastListeners.forEach(l => l(false, '', undefined, undefined));
  }, 2500);
};

// Using burnt for native toast experience (with fallback)
export const toast = {
  success: (title: string, message?: string) => {
    if (burntToast) {
      burntToast({
        title,
        message,
        preset: 'done',
        haptic: 'success',
      });
    } else {
      fallbackToast(title, message, 'success');
    }
  },

  error: (title: string, message?: string) => {
    if (burntToast) {
      burntToast({
        title,
        message,
        preset: 'error',
        haptic: 'error',
      });
    } else {
      fallbackToast(title, message, 'error');
    }
  },

  warning: (title: string, message?: string) => {
    if (burntToast) {
      burntToast({
        title,
        message,
        preset: 'none',
        haptic: 'warning',
      });
    } else {
      fallbackToast(title, message, 'warning');
    }
  },

  info: (title: string, message?: string) => {
    if (burntToast) {
      burntToast({
        title,
        message,
        preset: 'none',
        haptic: 'success',
      });
    } else {
      fallbackToast(title, message, 'info');
    }
  },

  loading: (title: string) => {
    if (burntToast) {
      burntToast({
        title,
        preset: 'none',
        duration: 10,
      });
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  dismiss: () => {
    // No-op for now
  },

  // Promise-based toast for async operations
  promise: async <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    }
  ): Promise<T> => {
    toast.loading(loading);

    try {
      const result = await promise;
      const successMessage = typeof success === 'function' ? success(result) : success;
      toast.success(successMessage);
      return result;
    } catch (err) {
      const errorMessage = typeof error === 'function' ? error(err as Error) : error;
      toast.error(errorMessage);
      throw err;
    }
  },
};

// Custom Toast Component (for more control)
export function Toast({
  type = 'info',
  title,
  message,
  action,
  onDismiss,
}: ToastProps) {
  const colors = useColors();
  const borderRadius = useBorderRadius();
  const shadows = useShadows();
  const insets = useSafeAreaInsets();

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: colors.success,
          bgColor: colors.successLight,
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          color: colors.error,
          bgColor: colors.errorLight,
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          color: colors.warning,
          bgColor: colors.warningLight,
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          color: colors.info,
          bgColor: colors.infoLight,
        };
    }
  };

  const config = getTypeConfig();

  return (
    <Animated.View
      entering={SlideInUp.springify().damping(20)}
      exiting={SlideOutUp.duration(200)}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: borderRadius.xl,
          marginTop: insets.top + 8,
          borderLeftWidth: 4,
          borderLeftColor: config.color,
          ...shadows.lg,
        },
      ]}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: config.bgColor },
          ]}
        >
          <Ionicons name={config.icon} size={20} color={config.color} />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {message && (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
          )}
        </View>

        {action && (
          <Pressable onPress={action.onPress} style={styles.actionButton}>
            <Text style={[styles.actionText, { color: colors.primary }]}>
              {action.label}
            </Text>
          </Pressable>
        )}

        {onDismiss && (
          <Pressable onPress={onDismiss} style={styles.dismissButton}>
            <Ionicons name="close" size={20} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  message: {
    fontSize: 12,
    marginTop: 2,
  },
  actionButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    marginLeft: 8,
    padding: 4,
  },
});
