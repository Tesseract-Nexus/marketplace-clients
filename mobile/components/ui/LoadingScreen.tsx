import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useColors } from '@/providers/ThemeProvider';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

export function LoadingScreen({ message, fullScreen = true, overlay = false }: LoadingScreenProps) {
  const colors = useColors();

  const containerStyle = [
    styles.container,
    fullScreen && styles.fullScreen,
    overlay && [styles.overlay, { backgroundColor: colors.overlay }],
    !overlay && { backgroundColor: colors.background },
  ];

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={containerStyle}
    >
      <ActivityIndicator color={colors.primary} size="large" />
      {message ? (
        <Text style={[styles.message, { color: overlay ? colors.textInverse : colors.text }]}>
          {message}
        </Text>
      ) : null}
    </Animated.View>
  );
}

// Loading indicator for inline use
interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  color?: string;
  style?: object;
}

export function LoadingIndicator({ size = 'small', color, style }: LoadingIndicatorProps) {
  const colors = useColors();

  return (
    <View style={[styles.indicator, style]}>
      <ActivityIndicator color={color || colors.primary} size={size} />
    </View>
  );
}

// Pull to refresh indicator
interface RefreshIndicatorProps {
  refreshing: boolean;
}

export function RefreshIndicator({ refreshing }: RefreshIndicatorProps) {
  const colors = useColors();

  if (!refreshing) {
    return null;
  }

  return (
    <View style={styles.refreshContainer}>
      <ActivityIndicator color={colors.primary} size="small" />
    </View>
  );
}

// Loading button state
export function ButtonLoading({ color }: { color?: string }) {
  const colors = useColors();

  return <ActivityIndicator color={color || colors.textOnPrimary} size="small" />;
}

// Inline loading with text
interface InlineLoadingProps {
  text?: string;
}

export function InlineLoading({ text = 'Loading...' }: InlineLoadingProps) {
  const colors = useColors();

  return (
    <View style={styles.inlineContainer}>
      <ActivityIndicator color={colors.primary} size="small" />
      <Text style={[styles.inlineText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

// Page loading skeleton wrapper
interface LoadingWrapperProps {
  loading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  error?: Error | null;
  onRetry?: () => void;
}

export function LoadingWrapper({
  loading,
  children,
  skeleton,
  error,
  onRetry,
}: LoadingWrapperProps) {
  const colors = useColors();

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error.message}</Text>
        {onRetry ? (
          <Text style={[styles.retryText, { color: colors.primary }]} onPress={onRetry}>
            Tap to retry
          </Text>
        ) : null}
      </View>
    );
  }

  if (loading) {
    return skeleton ? <>{skeleton}</> : <LoadingScreen fullScreen={false} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullScreen: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  indicator: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshContainer: {
    padding: 10,
    alignItems: 'center',
  },
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  inlineText: {
    marginLeft: 8,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
