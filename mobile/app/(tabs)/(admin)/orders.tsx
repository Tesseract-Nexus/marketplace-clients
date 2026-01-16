import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInRight,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { useInfiniteQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatRelativeTime } from '@/lib/utils/formatting';
import { typography, gradients } from '@/lib/design/typography';
import { QUERY_KEYS } from '@/lib/constants';
import { ordersApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { CardSkeleton } from '@/components/premium';
import { springs, shadows, premiumGradients } from '@/lib/design/animations';
import type { Order } from '@/types/entities';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ORDER_STATUSES = [
  { id: 'all', label: 'All', icon: 'apps' as const, count: 0 },
  { id: 'pending', label: 'Pending', icon: 'time' as const, count: 0 },
  { id: 'processing', label: 'Processing', icon: 'sync' as const, count: 0 },
  { id: 'shipped', label: 'Shipped', icon: 'airplane' as const, count: 0 },
  { id: 'delivered', label: 'Delivered', icon: 'checkmark-circle' as const, count: 0 },
  { id: 'cancelled', label: 'Cancelled', icon: 'close-circle' as const, count: 0 },
] as const;

// Animated Counter Component
function AnimatedStatValue({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startValue = 0;
    const endValue = value;
    const duration = 1200;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <Text style={styles.animatedValue}>
      {prefix}
      {displayValue.toLocaleString()}
    </Text>
  );
}

// Status Timeline Component
function StatusTimeline({ status }: { status?: string }) {
  const colors = useColors();
  const isDark = useIsDark();

  const normalizedStatus = status || 'pending';
  const steps = ['pending', 'processing', 'shipped', 'delivered'];
  const currentIndex = steps.indexOf(normalizedStatus);
  const isCancelled = normalizedStatus === 'cancelled';

  if (isCancelled) {
    return (
      <Animated.View
        entering={FadeInDown.delay(200).springify()}
        style={[styles.timelineCancelled, { backgroundColor: colors.errorLight }]}
      >
        <Ionicons color={colors.error} name="close-circle" size={14} />
        <Text style={[styles.timelineCancelledText, { color: colors.error }]}>Order Cancelled</Text>
      </Animated.View>
    );
  }

  return (
    <View style={styles.timeline}>
      {steps.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <View key={step} style={styles.timelineStep}>
            <View
              style={[
                styles.timelineDot,
                {
                  backgroundColor: isCompleted
                    ? colors.success
                    : isDark
                      ? colors.surface
                      : '#E5E7EB',
                  borderColor: isCompleted ? colors.success : colors.border,
                },
              ]}
            >
              {isCompleted ? <Ionicons color="#FFFFFF" name="checkmark" size={10} /> : null}
            </View>
            {!isLast ? (
              <View
                style={[
                  styles.timelineLine,
                  {
                    backgroundColor: index < currentIndex ? colors.success : colors.border,
                  },
                ]}
              />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

// Enhanced Order Card Component with Premium Design
function OrderCard({ order, index }: { order: Order; index: number }) {
  const colors = useColors();
  const isDark = useIsDark();
  const router = useRouter();

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springs.snappy);
    translateY.value = withSpring(-2, springs.snappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.bouncy);
    translateY.value = withSpring(0, springs.bouncy);
  };

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }, { translateY: translateY.value }] as any,
    };
  });

  const orderStatus = order.status || 'pending';
  const statusConfig = {
    pending: {
      label: 'Pending',
      variant: 'warning' as const,
      icon: 'time' as const,
      color: colors.warning,
      gradient: premiumGradients.warning,
    },
    processing: {
      label: 'Processing',
      variant: 'info' as const,
      icon: 'sync' as const,
      color: colors.info,
      gradient: premiumGradients.info,
    },
    shipped: {
      label: 'Shipped',
      variant: 'info' as const,
      icon: 'airplane' as const,
      color: colors.info,
      gradient: premiumGradients.ocean,
    },
    delivered: {
      label: 'Delivered',
      variant: 'success' as const,
      icon: 'checkmark-circle' as const,
      color: colors.success,
      gradient: premiumGradients.success,
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'error' as const,
      icon: 'close-circle' as const,
      color: colors.error,
      gradient: premiumGradients.error,
    },
    refunded: {
      label: 'Refunded',
      variant: 'secondary' as const,
      icon: 'return-down-back' as const,
      color: colors.textSecondary,
      gradient: premiumGradients.silver,
    },
  }[orderStatus] || {
    label: orderStatus,
    variant: 'secondary' as const,
    icon: 'help' as const,
    color: colors.textSecondary,
    gradient: premiumGradients.silver,
  };

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50)
        .springify()
        .damping(14)}
      layout={Layout.springify()}
      style={animatedStyle}
    >
      <Pressable
        style={[
          styles.orderCard,
          {
            backgroundColor: isDark ? colors.surface : colors.card,
            borderColor: colors.border,
          },
          shadows.md,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push(`/(tabs)/(admin)/order-detail?id=${order.id}`);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Header */}
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <LinearGradient
              colors={[...statusConfig.gradient]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={styles.orderIconContainer}
            >
              <Ionicons color="#FFFFFF" name={statusConfig.icon} size={18} />
            </LinearGradient>
            <View>
              <Text style={[styles.orderNumber, { color: colors.text }]}>
                #{order.order_number}
              </Text>
              <Text style={[styles.orderTime, { color: colors.textTertiary }]}>
                {formatRelativeTime(order.created_at)}
              </Text>
            </View>
          </View>
          <View style={styles.orderTotalContainer}>
            <Text style={[styles.orderTotal, { color: colors.text }]}>
              {formatCurrency(order.total)}
            </Text>
            <View style={[styles.orderTotalBadge, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons color={colors.success} name="trending-up" size={10} />
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.customerRow}>
          <View style={[styles.customerAvatar, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.customerInitial, { color: colors.primary }]}>
              {order.customer?.first_name?.[0] || 'G'}
            </Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={[styles.customerName, { color: colors.text }]}>
              {order.customer?.first_name} {order.customer?.last_name}
            </Text>
            <Text style={[styles.customerEmail, { color: colors.textSecondary }]}>
              {order.items?.length || 0} items
            </Text>
          </View>
          <Badge label={statusConfig.label} size="sm" variant={statusConfig.variant} />
        </View>

        {/* Status Timeline */}
        <StatusTimeline status={orderStatus} />

        {/* Footer */}
        <View style={[styles.orderFooter, { borderTopColor: colors.border }]}>
          <View style={styles.paymentInfo}>
            <View
              style={[
                styles.paymentDot,
                {
                  backgroundColor:
                    order.payment_status === 'paid' ? colors.success : colors.warning,
                },
              ]}
            />
            <Text
              style={[
                styles.paymentStatus,
                { color: order.payment_status === 'paid' ? colors.success : colors.warning },
              ]}
            >
              {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
            </Text>
          </View>
          <Pressable
            hitSlop={8}
            style={[styles.actionButton, { backgroundColor: `${colors.primary}10` }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/(tabs)/(admin)/order-detail?id=${order.id}`);
            }}
          >
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>View</Text>
            <Ionicons color={colors.primary} name="chevron-forward" size={14} />
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Premium Stats Card with Hero Design
function OrderStats({
  pending,
  processing,
  revenue,
}: {
  pending: number;
  processing: number;
  revenue: number;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withSequence(
      withTiming(-4, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
    );

    const interval = setInterval(() => {
      floatY.value = withSequence(
        withTiming(-4, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsContainer}>
      {/* Hero Revenue Card */}
      <Animated.View style={[styles.revenueCardWrapper, floatStyle, shadows.lg]}>
        <LinearGradient
          colors={[...premiumGradients.cosmic]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.revenueCard}
        >
          {/* Decorative circles */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />

          <View style={styles.revenueContent}>
            <View style={styles.revenueIcon}>
              <Ionicons color="rgba(255,255,255,0.95)" name="wallet" size={18} />
            </View>
            <Text style={styles.revenueLabel}>Today's Revenue</Text>
            <Text style={styles.revenueValue}>{formatCurrency(revenue)}</Text>
          </View>

          {/* Mini sparkline visualization */}
          <View style={styles.sparkline}>
            {[0.4, 0.6, 0.45, 0.8, 0.65, 0.9, 0.75].map((h, i) => (
              <View key={i} style={[styles.sparklineBar, { height: h * 24 }]} />
            ))}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={[
            styles.statItem,
            { backgroundColor: isDark ? colors.surface : colors.warningLight },
            shadows.sm,
          ]}
        >
          <View style={[styles.statIconBg, { backgroundColor: `${colors.warning}20` }]}>
            <Ionicons color={colors.warning} name="time" size={16} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{pending}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(250).springify()}
          style={[
            styles.statItem,
            { backgroundColor: isDark ? colors.surface : colors.infoLight },
            shadows.sm,
          ]}
        >
          <View style={[styles.statIconBg, { backgroundColor: `${colors.info}20` }]}>
            <Ionicons color={colors.info} name="sync" size={16} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{processing}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Processing</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// Premium Filter Chip
function FilterChip({
  status,
  isActive,
  onPress,
}: {
  status: (typeof ORDER_STATUSES)[number];
  isActive: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, springs.snappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.bouncy);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[
          styles.filterChip,
          {
            backgroundColor: isActive ? colors.primary : colors.surface,
            borderColor: isActive ? colors.primary : colors.border,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Ionicons
          color={isActive ? '#FFFFFF' : colors.textSecondary}
          name={status.icon}
          size={14}
        />
        <Text style={[styles.filterText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
          {status.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const { currentTenant } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch orders with infinite scroll using real API
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: currentTenant
        ? [...QUERY_KEYS.ORDERS(currentTenant.id), activeStatus, searchQuery]
        : ['orders', activeStatus, searchQuery],
      queryFn: async ({ pageParam = 1 }) => {
        try {
          const params: Record<string, any> = {
            page: pageParam,
            limit: 20,
          };

          if (searchQuery) {
            params.search = searchQuery;
          }

          if (activeStatus !== 'all') {
            params.status = activeStatus;
          }

          console.log('[Orders] Fetching orders with params:', params);
          const response = await ordersApi.list(params);

          const ordersArray = (response as any).orders || (response as any).data || [];
          const total = (response as any).total || ordersArray.length;
          const totalPages = Math.ceil(total / 20);

          console.log(
            '[Orders] Fetched',
            ordersArray.length,
            'orders, page',
            pageParam,
            'of',
            totalPages
          );

          const orders: Order[] = ordersArray.map((o: any) => ({
            id: o.id,
            tenant_id: o.tenantId || o.tenant_id || currentTenant?.id,
            order_number: o.orderNumber || o.order_number || o.id.slice(0, 8).toUpperCase(),
            customer_id: o.customerId || o.customer_id,
            customer: o.customer
              ? {
                  id: o.customer.id,
                  tenant_id: o.customer.tenantId || o.customer.tenant_id || currentTenant?.id,
                  user_id: o.customer.userId || o.customer.user_id,
                  email: o.customer.email,
                  first_name: o.customer.firstName || o.customer.first_name,
                  last_name: o.customer.lastName || o.customer.last_name,
                  phone: o.customer.phone || null,
                  status: o.customer.status || 'active',
                  total_orders: o.customer.totalOrders || o.customer.total_orders || 0,
                  total_spent: o.customer.totalSpent || o.customer.total_spent || 0,
                  created_at:
                    o.customer.createdAt || o.customer.created_at || new Date().toISOString(),
                  updated_at:
                    o.customer.updatedAt || o.customer.updated_at || new Date().toISOString(),
                }
              : null,
            status: o.status || 'pending',
            payment_status: o.paymentStatus || o.payment_status || 'pending',
            fulfillment_status: o.fulfillmentStatus || o.fulfillment_status || 'unfulfilled',
            subtotal: parseFloat(o.subtotal?.toString() || '0'),
            discount: parseFloat(o.discount?.toString() || '0'),
            tax: parseFloat(o.tax?.toString() || '0'),
            shipping: parseFloat(o.shipping?.toString() || o.shippingCost?.toString() || '0'),
            total: parseFloat(o.total?.toString() || o.totalAmount?.toString() || '0'),
            items: (o.items || o.orderItems || []).map((item: any) => ({
              id: item.id,
              order_id: o.id,
              product_id: item.productId || item.product_id,
              variant_id: item.variantId || item.variant_id || null,
              name: item.name || item.productName || 'Product',
              sku: item.sku || null,
              price: parseFloat(item.price?.toString() || '0'),
              quantity: item.quantity || 1,
              total: parseFloat(item.total?.toString() || item.subtotal?.toString() || '0'),
            })),
            shipping_address: o.shippingAddress || o.shipping_address || null,
            billing_address: o.billingAddress || o.billing_address || null,
            notes: o.notes || null,
            created_at: o.createdAt || o.created_at || new Date().toISOString(),
            updated_at: o.updatedAt || o.updated_at || new Date().toISOString(),
          }));

          return {
            orders,
            page: pageParam,
            totalPages,
          };
        } catch (error) {
          console.error('[Orders] Error fetching orders:', error);
          return { orders: [], page: pageParam, totalPages: 1 };
        }
      },
      getNextPageParam: (lastPage) => {
        return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
      },
      initialPageParam: 1,
      enabled: !!currentTenant,
    });

  const orders = useMemo(() => {
    return data?.pages.flatMap((page) => page.orders) || [];
  }, [data]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (activeStatus !== 'all') {
      filtered = filtered.filter((o) => (o.status || 'pending') === activeStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.order_number.toLowerCase().includes(query) ||
          o.customer?.first_name?.toLowerCase().includes(query) ||
          o.customer?.last_name?.toLowerCase().includes(query) ||
          o.customer?.email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [orders, activeStatus, searchQuery]);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => (o.status || 'pending') === 'pending').length;
    const processing = orders.filter((o) => (o.status || 'pending') === 'processing').length;
    const revenue = orders
      .filter((o) => o.payment_status === 'paid')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    return { pending, processing, revenue };
  }, [orders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderOrder = useCallback(
    ({ item, index }: { item: Order; index: number }) => <OrderCard index={index} order={item} />,
    []
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) {
      return null;
    }
    return (
      <View style={styles.loadingMore}>
        <CardSkeleton />
      </View>
    );
  }, [isFetchingNextPage]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Animated.View entering={FadeInDown.springify()}>
          <Text style={[styles.title, { color: colors.text }]}>Orders</Text>
        </Animated.View>

        {/* Stats */}
        <OrderStats {...stats} />

        {/* Search */}
        <Animated.View
          entering={FadeInDown.delay(150).springify()}
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? colors.surface : '#F3F4F6',
              borderColor: colors.border,
            },
            shadows.sm,
          ]}
        >
          <Ionicons color={colors.textSecondary} name="search" size={18} />
          <TextInput
            placeholder="Search orders..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSearchQuery('');
              }}
            >
              <Ionicons color={colors.textSecondary} name="close-circle" size={18} />
            </Pressable>
          ) : null}
        </Animated.View>

        {/* Status Filters */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ScrollView
            horizontal
            contentContainerStyle={styles.filtersContainer}
            showsHorizontalScrollIndicator={false}
          >
            {ORDER_STATUSES.map((status) => (
              <FilterChip
                key={status.id}
                isActive={activeStatus === status.id}
                status={status}
                onPress={() => setActiveStatus(status.id)}
              />
            ))}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Orders List */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4].map((i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(i * 100).springify()}
              style={{ marginBottom: 12 }}
            >
              <CardSkeleton />
            </Animated.View>
          ))}
        </ScrollView>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          actionLabel={searchQuery ? 'Clear Search' : undefined}
          description={
            searchQuery
              ? 'Try adjusting your search or filters'
              : 'Orders will appear here once customers start buying'
          }
          icon="receipt-outline"
          title={searchQuery ? 'No orders found' : 'No orders yet'}
          onAction={searchQuery ? () => setSearchQuery('') : undefined}
        />
      ) : (
        <FlatList
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.primary}
              onRefresh={onRefresh}
            />
          }
          renderItem={renderOrder}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    ...typography.title1,
    marginBottom: 16,
  },
  statsContainer: {
    marginBottom: 16,
  },
  revenueCardWrapper: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  revenueCard: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  revenueContent: {
    zIndex: 2,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -40,
    right: -20,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -20,
    left: 20,
  },
  sparkline: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    opacity: 0.6,
  },
  sparklineBar: {
    width: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2,
  },
  revenueIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  revenueLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  revenueValue: {
    ...typography.title1,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  animatedValue: {
    ...typography.title1,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    ...typography.title3,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    paddingVertical: 0,
  },
  filtersContainer: {
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterText: {
    ...typography.captionMedium,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  orderCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNumber: {
    ...typography.bodyMedium,
  },
  orderTime: {
    ...typography.micro,
    marginTop: 2,
  },
  orderTotalContainer: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    ...typography.title3,
  },
  orderTotalBadge: {
    marginTop: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  customerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInitial: {
    ...typography.bodyMedium,
  },
  customerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  customerName: {
    ...typography.calloutMedium,
  },
  customerEmail: {
    ...typography.micro,
    marginTop: 1,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    borderRadius: 1,
  },
  timelineCancelled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  timelineCancelledText: {
    ...typography.captionMedium,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paymentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paymentStatus: {
    ...typography.captionMedium,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  actionButtonText: {
    ...typography.captionMedium,
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
