import React, { ReactNode } from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

import { useColors, useSpacing } from '@/providers/ThemeProvider';
import { Button } from './Button';

type EmptyStateType =
  | 'no-data'
  | 'no-products'
  | 'no-orders'
  | 'no-customers'
  | 'no-results'
  | 'no-notifications'
  | 'cart-empty'
  | 'error'
  | 'offline';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: ReactNode;
  iconName?: keyof typeof Ionicons.glyphMap;
  animation?: any; // Lottie animation source
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: ViewStyle;
}

const DEFAULT_CONTENT: Record<
  EmptyStateType,
  { title: string; description: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  'no-data': {
    title: 'No Data',
    description: 'There is no data to display.',
    icon: 'folder-open-outline',
  },
  'no-products': {
    title: 'No Products Yet',
    description: 'Start by adding your first product to your store.',
    icon: 'cube-outline',
  },
  'no-orders': {
    title: 'No Orders Yet',
    description: 'When customers place orders, they will appear here.',
    icon: 'receipt-outline',
  },
  'no-customers': {
    title: 'No Customers Yet',
    description: 'Your customer list will grow as people shop.',
    icon: 'people-outline',
  },
  'no-results': {
    title: 'No Results Found',
    description: 'Try adjusting your search or filters.',
    icon: 'search-outline',
  },
  'no-notifications': {
    title: 'All Caught Up',
    description: "You don't have any notifications right now.",
    icon: 'notifications-outline',
  },
  'cart-empty': {
    title: 'Your Cart is Empty',
    description: 'Start shopping and add items to your cart.',
    icon: 'cart-outline',
  },
  error: {
    title: 'Something Went Wrong',
    description: 'An error occurred. Please try again.',
    icon: 'alert-circle-outline',
  },
  offline: {
    title: 'No Connection',
    description: 'Please check your internet connection.',
    icon: 'cloud-offline-outline',
  },
};

export function EmptyState({
  type = 'no-data',
  title,
  description,
  icon,
  iconName,
  animation,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
}: EmptyStateProps) {
  const colors = useColors();
  const spacing = useSpacing();
  const defaultContent = DEFAULT_CONTENT[type];

  const displayTitle = title || defaultContent.title;
  const displayDescription = description || defaultContent.description;
  const displayIconName = iconName || defaultContent.icon;

  return (
    <View
      style={[
        {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing['2xl'],
        },
        style,
      ]}
    >
      {/* Animation or Icon */}
      {animation ? (
        <LottieView autoPlay loop source={animation} style={{ width: 200, height: 200 }} />
      ) : icon ? (
        <View style={{ marginBottom: spacing.lg }}>{icon}</View>
      ) : (
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
          }}
        >
          <Ionicons color={colors.textTertiary} name={displayIconName} size={40} />
        </View>
      )}

      {/* Title */}
      <Text
        style={{
          fontSize: 20,
          fontWeight: '600',
          color: colors.text,
          textAlign: 'center',
          marginBottom: spacing.sm,
        }}
      >
        {displayTitle}
      </Text>

      {/* Description */}
      <Text
        style={{
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: 'center',
          lineHeight: 20,
          maxWidth: 280,
        }}
      >
        {displayDescription}
      </Text>

      {/* Actions */}
      {onAction || onSecondaryAction ? (
        <View style={{ marginTop: spacing.xl, alignItems: 'center', gap: spacing.sm }}>
          {onAction && actionLabel ? <Button title={actionLabel} onPress={onAction} /> : null}
          {onSecondaryAction && secondaryActionLabel ? (
            <Button title={secondaryActionLabel} variant="ghost" onPress={onSecondaryAction} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

// Quick empty state variants
export function NoProductsEmpty({ onAdd }: { onAdd?: () => void }) {
  return <EmptyState actionLabel="Add Product" type="no-products" onAction={onAdd} />;
}

export function NoOrdersEmpty() {
  return <EmptyState type="no-orders" />;
}

export function NoCustomersEmpty() {
  return <EmptyState type="no-customers" />;
}

export function NoSearchResultsEmpty({ onClear }: { onClear?: () => void }) {
  return <EmptyState actionLabel="Clear Search" type="no-results" onAction={onClear} />;
}

export function CartEmptyState({ onShop }: { onShop?: () => void }) {
  return <EmptyState actionLabel="Start Shopping" type="cart-empty" onAction={onShop} />;
}

export function ErrorState({ onRetry, error }: { onRetry?: () => void; error?: string }) {
  return <EmptyState actionLabel="Try Again" description={error} type="error" onAction={onRetry} />;
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return <EmptyState actionLabel="Retry" type="offline" onAction={onRetry} />;
}
