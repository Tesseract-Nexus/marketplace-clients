import React, { ReactNode } from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';

import { useColors, useBorderRadius } from '@/providers/ThemeProvider';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'outline';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children?: ReactNode;
  label?: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  dot?: boolean;
  style?: ViewStyle;
}

export function Badge({
  children,
  label,
  variant = 'default',
  size = 'md',
  icon,
  dot = false,
  style,
}: BadgeProps) {
  const colors = useColors();
  const borderRadius = useBorderRadius();

  const getVariantStyle = (): { bg: string; text: string; border?: string } => {
    switch (variant) {
      case 'primary':
        return { bg: colors.primaryLight, text: colors.primary };
      case 'secondary':
        return { bg: colors.surface, text: colors.text };
      case 'success':
        return { bg: colors.successLight, text: colors.success };
      case 'warning':
        return { bg: colors.warningLight, text: colors.warning };
      case 'error':
        return { bg: colors.errorLight, text: colors.error };
      case 'info':
        return { bg: colors.primaryLight, text: colors.primary };
      case 'outline':
        return { bg: 'transparent', text: colors.text, border: colors.border };
      default:
        return { bg: colors.surface, text: colors.textSecondary };
    }
  };

  const getSizeStyle = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingHorizontal: 6, paddingVertical: 2 },
          text: { fontSize: 10 },
        };
      case 'md':
        return {
          container: { paddingHorizontal: 8, paddingVertical: 4 },
          text: { fontSize: 12 },
        };
      case 'lg':
        return {
          container: { paddingHorizontal: 12, paddingVertical: 6 },
          text: { fontSize: 14 },
        };
    }
  };

  const variantStyle = getVariantStyle();
  const sizeStyle = getSizeStyle();

  if (dot) {
    return (
      <View
        style={[
          {
            width: size === 'sm' ? 6 : size === 'md' ? 8 : 10,
            height: size === 'sm' ? 6 : size === 'md' ? 8 : 10,
            borderRadius: borderRadius.full,
            backgroundColor: variantStyle.text,
          },
          style,
        ]}
      />
    );
  }

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: variantStyle.bg,
    borderRadius: borderRadius.full,
    borderWidth: variant === 'outline' ? 1 : 0,
    borderColor: variantStyle.border,
    ...sizeStyle.container,
    ...style,
  };

  const textStyle: TextStyle = {
    color: variantStyle.text,
    fontWeight: '600',
    ...sizeStyle.text,
  };

  return (
    <View style={containerStyle}>
      {icon ? <View style={{ marginRight: 4 }}>{icon}</View> : null}
      <Text style={textStyle}>{label || children}</Text>
    </View>
  );
}

// Status Badge - specific variants for order/payment status
interface StatusBadgeProps {
  status: string;
  size?: BadgeSize;
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getVariant = (): BadgeVariant => {
    const statusLower = status.toLowerCase();

    // Success statuses
    if (
      ['active', 'completed', 'delivered', 'paid', 'fulfilled', 'approved'].includes(statusLower)
    ) {
      return 'success';
    }

    // Warning statuses
    if (['pending', 'processing', 'partially_fulfilled', 'trialing'].includes(statusLower)) {
      return 'warning';
    }

    // Error statuses
    if (
      ['failed', 'cancelled', 'refunded', 'rejected', 'suspended', 'blocked'].includes(statusLower)
    ) {
      return 'error';
    }

    // Primary statuses
    if (['confirmed', 'shipped', 'authorized'].includes(statusLower)) {
      return 'primary';
    }

    return 'default';
  };

  const formatStatus = (status: string): string => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return <Badge label={formatStatus(status)} size={size} variant={getVariant()} />;
}

// Notification Badge (count badge)
interface CountBadgeProps {
  count: number;
  maxCount?: number;
  size?: BadgeSize;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function CountBadge({
  count,
  maxCount = 99,
  size = 'sm',
  variant = 'error',
  style,
}: CountBadgeProps) {
  const colors = useColors();
  const borderRadius = useBorderRadius();

  if (count <= 0) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  const isDouble = count > 9;

  const getSizeValue = () => {
    switch (size) {
      case 'sm':
        return { height: 16, minWidth: isDouble ? 20 : 16, fontSize: 10 };
      case 'md':
        return { height: 20, minWidth: isDouble ? 24 : 20, fontSize: 12 };
      case 'lg':
        return { height: 24, minWidth: isDouble ? 28 : 24, fontSize: 14 };
    }
  };

  const sizeValue = getSizeValue();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'error':
        return colors.error;
      case 'primary':
        return colors.primary;
      case 'success':
        return colors.success;
      default:
        return colors.error;
    }
  };

  return (
    <View
      style={[
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: borderRadius.full,
          height: sizeValue.height,
          minWidth: sizeValue.minWidth,
          paddingHorizontal: 4,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: colors.textOnPrimary,
          fontSize: sizeValue.fontSize,
          fontWeight: '700',
        }}
      >
        {displayCount}
      </Text>
    </View>
  );
}
