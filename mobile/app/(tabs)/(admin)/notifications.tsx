import { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { PressableCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatRelativeTime } from '@/lib/utils/formatting';
import { useNotifications } from '@/hooks/useNotifications';
import { typography } from '@/lib/design/typography';

import type { Notification } from '@/types/entities';

const NOTIFICATION_ICONS: Record<string, { icon: string; color: string }> = {
  order_placed: { icon: 'receipt', color: '#3B82F6' },
  order_confirmed: { icon: 'checkmark-circle', color: '#10B981' },
  order_shipped: { icon: 'airplane', color: '#8B5CF6' },
  order_delivered: { icon: 'checkmark-done', color: '#10B981' },
  order_cancelled: { icon: 'close-circle', color: '#EF4444' },
  payment_received: { icon: 'wallet', color: '#10B981' },
  payment_failed: { icon: 'alert-circle', color: '#EF4444' },
  refund_processed: { icon: 'return-down-back', color: '#F59E0B' },
  product_low_stock: { icon: 'warning', color: '#F59E0B' },
  product_out_of_stock: { icon: 'cube', color: '#EF4444' },
  new_customer: { icon: 'person-add', color: '#3B82F6' },
  new_review: { icon: 'star', color: '#F59E0B' },
  support_ticket: { icon: 'chatbubble-ellipses', color: '#6366F1' },
  system: { icon: 'information-circle', color: '#6B7280' },
};

function NotificationItem({
  notification,
  index,
  onPress,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  index: number;
  onPress: () => void;
  onMarkRead: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const isRead = !!notification.read_at;
  const iconConfig = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.system;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 40).springify()}
      layout={Layout.springify()}
    >
      <PressableCard
        style={StyleSheet.flatten([
          styles.notificationItem,
          { backgroundColor: isDark ? colors.surface : colors.card },
          !isRead && { backgroundColor: isDark ? `${colors.primary}15` : `${colors.primary}08` },
        ])}
        onPress={onPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${iconConfig.color}15` }]}>
          <Ionicons name={iconConfig.icon as any} size={20} color={iconConfig.color} />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                { color: colors.text },
                !isRead && { fontWeight: '700' },
              ]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            {!isRead && (
              <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
            )}
          </View>
          <Text
            style={[styles.message, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {notification.message}
          </Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {formatRelativeTime(notification.created_at)}
          </Text>
        </View>
        <View style={styles.actionsContainer}>
          {!isRead && (
            <Pressable
              style={[styles.actionButton, { backgroundColor: `${colors.primary}10` }]}
              onPress={(e) => {
                e.stopPropagation?.();
                onMarkRead();
              }}
              hitSlop={8}
            >
              <Ionicons name="checkmark" size={16} color={colors.primary} />
            </Pressable>
          )}
          <Pressable
            style={[styles.actionButton, { backgroundColor: `${colors.error}10` }]}
            onPress={(e) => {
              e.stopPropagation?.();
              onDelete();
            }}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
          </Pressable>
        </View>
      </PressableCard>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const [refreshing, setRefreshing] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refresh,
  } = useNotifications({ enablePolling: true, pollingInterval: 30000 });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read_at) {
      try {
        await markAsRead(notification.id);
      } catch {
        // Ignore error, continue with navigation
      }
    }

    // Navigate to relevant screen based on notification data
    const data = notification.data as Record<string, string> | undefined;
    if (data?.order_id) {
      router.push(`/(tabs)/(admin)/order-detail?id=${data.order_id}`);
    } else if (data?.product_id) {
      router.push(`/(tabs)/(admin)/product-detail?id=${data.product_id}`);
    } else if (data?.customer_id) {
      router.push(`/(tabs)/(admin)/customer-detail?id=${data.customer_id}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
    } catch {
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await deleteNotification(id);
    } catch {
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      'Delete All Notifications',
      'Are you sure you want to delete all notifications? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllNotifications();
            } catch {
              Alert.alert('Error', 'Failed to delete notifications');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={styles.headerActions}>
          {notifications.length > 0 && (
            <Pressable style={styles.headerButton} onPress={handleDeleteAll}>
              <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Unread Count & Mark All Read */}
      {unreadCount > 0 && (
        <Animated.View entering={FadeInDown} style={styles.unreadBanner}>
          <View style={[styles.unreadPill, { backgroundColor: isDark ? colors.surface : `${colors.primary}10` }]}>
            <Ionicons name="notifications" size={16} color={colors.primary} />
            <Text style={[styles.unreadText, { color: colors.primary }]}>
              {unreadCount} unread
            </Text>
          </View>
          <Pressable
            style={[styles.markAllButton, { backgroundColor: colors.primary }]}
            onPress={handleMarkAllRead}
          >
            <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Error Banner */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.errorLight }]}>
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} width="100%" height={90} borderRadius={12} style={{ marginBottom: 10 }} />
            ))}
          </View>
        ) : notifications.length > 0 ? (
          <View style={styles.notificationsList}>
            {notifications.map((notification, index) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                index={index}
                onPress={() => handleNotificationPress(notification)}
                onMarkRead={() => markAsRead(notification.id)}
                onDelete={() => handleDeleteNotification(notification.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: isDark ? colors.surface : `${colors.primary}10` }]}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              You're all caught up! New notifications will appear here when you receive orders, reviews, or important updates.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    ...typography.title2,
    textAlign: 'center',
  },
  headerActions: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  unreadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  unreadText: {
    ...typography.captionMedium,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  markAllText: {
    ...typography.captionMedium,
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  errorText: {
    ...typography.caption,
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    gap: 10,
  },
  notificationsList: {
    gap: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...typography.calloutMedium,
    flex: 1,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  message: {
    ...typography.caption,
    marginTop: 3,
    lineHeight: 18,
  },
  time: {
    ...typography.micro,
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'column',
    gap: 6,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    ...typography.title3,
    marginBottom: 8,
  },
  emptyMessage: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
});
