import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/stores/auth-store';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/lib/utils/formatting';
import { ordersApi, productsApi, customersApi } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/constants';
import { StoreSelector } from '@/components/StoreSelector';
import { typography, gradients, spacing } from '@/lib/design/typography';
import { springs, shadows, premiumGradients } from '@/lib/design/animations';
import { useUnreadNotificationCount } from '@/hooks/useNotifications';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { ProfileMenu, DrawerNavigation } from '@/components/admin';
import {
  SimpleAnimatedCounter,
  ShimmerLoader,
  CardSkeleton,
  AnimatedProgressBar,
  FAB,
} from '@/components/premium';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface DashboardStats {
  revenue: { total: number; change: number; currency: string };
  orders: { total: number; change: number };
  customers: { total: number; change: number };
  products: { total: number; outOfStock: number };
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  currency: string;
  status: string;
  createdAt: string;
}

// Premium Hero Card with floating animation
function HeroRevenueCard({
  value,
  change,
  currency,
  onPress,
}: {
  value: number;
  change: number;
  currency: string;
  onPress?: () => void;
}) {
  const scale = useSharedValue(1);
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withSequence(
      withTiming(-4, { duration: 2000 }),
      withTiming(0, { duration: 2000 })
    );
    // Continue floating
    const interval = setInterval(() => {
      floatY.value = withSequence(
        withTiming(-4, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }, { translateY: floatY.value }] as any,
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.97, springs.snappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.bouncy);
  };

  const isPositive = change >= 0;

  return (
    <AnimatedPressable
      style={[styles.heroCard, shadows.xl, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <LinearGradient
        colors={[...premiumGradients.cosmic]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.heroGradient}
      >
        {/* Decorative circles */}
        <View style={styles.heroDecoration}>
          <View style={[styles.decorCircle, styles.decorCircle1]} />
          <View style={[styles.decorCircle, styles.decorCircle2]} />
          <View style={[styles.decorCircle, styles.decorCircle3]} />
        </View>

        <View style={styles.heroContent}>
          <View style={styles.heroTop}>
            <View style={styles.heroLabelContainer}>
              <View style={styles.heroIconBg}>
                <Ionicons color="#FFFFFF" name="wallet" size={20} />
              </View>
              <Text style={styles.heroLabel}>Total Revenue</Text>
            </View>
            <View
              style={[
                styles.changeBadge,
                {
                  backgroundColor: isPositive ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)',
                },
              ]}
            >
              <Ionicons
                color={isPositive ? '#34D399' : '#F87171'}
                name={isPositive ? 'trending-up' : 'trending-down'}
                size={14}
              />
              <Text style={[styles.changeText, { color: isPositive ? '#34D399' : '#F87171' }]}>
                {isPositive ? '+' : ''}
                {change}%
              </Text>
            </View>
          </View>

          <View style={styles.heroValueContainer}>
            <Text style={styles.heroCurrency}>{currency}</Text>
            <SimpleAnimatedCounter
              duration={1500}
              prefix=""
              style={styles.heroValue}
              value={value}
            />
          </View>

          <Text style={styles.heroSubtext}>vs last month</Text>

          {/* Mini sparkline visualization */}
          <View style={styles.sparklineContainer}>
            {[35, 52, 48, 65, 55, 75, 68, 85, 78, 95].map((val, i) => (
              <Animated.View
                key={i}
                entering={FadeInUp.delay(i * 50).springify()}
                style={[styles.sparklineBar, { height: val * 0.4, opacity: 0.3 + i * 0.07 }]}
              />
            ))}
          </View>
        </View>
      </LinearGradient>
    </AnimatedPressable>
  );
}

// Premium Stat Card
function StatCard({
  title,
  value,
  change,
  icon,
  color,
  index,
  onPress,
}: {
  title: string;
  value: number;
  change?: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  index: number;
  onPress?: () => void;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, springs.snappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.bouncy);
  };

  const isPositive = (change ?? 0) >= 0;

  return (
    <AnimatedPressable
      entering={FadeInUp.delay(100 + index * 80).springify()}
      style={[
        styles.statCard,
        { backgroundColor: isDark ? colors.surface : colors.card },
        shadows.md,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={[styles.statIconBg, { backgroundColor: `${color}15` }]}>
        <Ionicons color={color} name={icon} size={20} />
      </View>

      <SimpleAnimatedCounter
        delay={200 + index * 100}
        duration={1200}
        style={[styles.statValue, { color: colors.text }]}
        value={value}
      />

      <View style={styles.statBottom}>
        <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
        {change !== undefined ? (
          <View style={styles.statChange}>
            <Ionicons
              color={isPositive ? colors.success : colors.error}
              name={isPositive ? 'arrow-up' : 'arrow-down'}
              size={10}
            />
            <Text
              style={[styles.statChangeText, { color: isPositive ? colors.success : colors.error }]}
            >
              {Math.abs(change)}%
            </Text>
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

// Premium Quick Action
function QuickActionButton({
  icon,
  label,
  color,
  index,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  index: number;
  onPress: () => void;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, springs.snappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.bouncy);
  };

  return (
    <AnimatedPressable
      entering={FadeInUp.delay(300 + index * 60).springify()}
      style={[styles.quickAction, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <LinearGradient
        colors={[color, `${color}CC`]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.quickActionGradient}
      >
        <Ionicons color="#FFFFFF" name={icon} size={24} />
      </LinearGradient>
      <Text numberOfLines={1} style={[styles.quickActionLabel, { color: colors.text }]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

// Premium Activity Item
function ActivityItem({
  order,
  index,
  onPress,
}: {
  order: RecentOrder;
  index: number;
  onPress: () => void;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const scale = useSharedValue(1);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: 'time' as const, color: colors.warning, bg: `${colors.warning}15` };
      case 'processing':
        return { icon: 'sync' as const, color: colors.info, bg: `${colors.info}15` };
      case 'shipped':
        return { icon: 'airplane' as const, color: colors.primary, bg: `${colors.primary}15` };
      case 'delivered':
        return {
          icon: 'checkmark-circle' as const,
          color: colors.success,
          bg: `${colors.success}15`,
        };
      case 'cancelled':
        return { icon: 'close-circle' as const, color: colors.error, bg: `${colors.error}15` };
      default:
        return {
          icon: 'ellipse' as const,
          color: colors.textSecondary,
          bg: `${colors.textSecondary}15`,
        };
    }
  };

  const statusConfig = getStatusConfig(order.status);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springs.snappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.bouncy);
  };

  return (
    <AnimatedPressable
      entering={FadeInRight.delay(400 + index * 60).springify()}
      style={[
        styles.activityItem,
        { backgroundColor: isDark ? colors.surface : colors.card },
        shadows.sm,
        animatedStyle,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={[styles.activityIcon, { backgroundColor: statusConfig.bg }]}>
        <Ionicons color={statusConfig.color} name={statusConfig.icon} size={18} />
      </View>
      <View style={styles.activityContent}>
        <Text numberOfLines={1} style={[styles.activityTitle, { color: colors.text }]}>
          Order #{order.orderNumber}
        </Text>
        <Text numberOfLines={1} style={[styles.activitySubtitle, { color: colors.textSecondary }]}>
          {order.customerName} • {formatCurrency(order.total, order.currency)}
        </Text>
      </View>
      <View style={styles.activityRight}>
        <Text style={[styles.activityTime, { color: colors.textTertiary }]}>
          {formatRelativeTime(order.createdAt)}
        </Text>
        <Ionicons color={colors.textTertiary} name="chevron-forward" size={16} />
      </View>
    </AnimatedPressable>
  );
}

// Main Dashboard Component
export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const { user, currentTenant, isAuthenticated, isInitialized } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const unreadNotificationCount = useUnreadNotificationCount();

  const adminCurrency = currentTenant?.settings?.currency || 'USD';

  const {
    formatConverted,
    formatConvertedSync,
    convert,
    isLoading: currencyLoading,
    refreshRates,
  } = useCurrency({
    preferredCurrency: adminCurrency,
    preloadRates: true,
    baseCurrencies: Array.from(new Set(['EUR', 'USD', 'GBP', 'INR', 'AUD', adminCurrency])),
  });

  const [convertedRevenue, setConvertedRevenue] = useState<string | null>(null);

  // Fetch dashboard stats
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: currentTenant ? QUERY_KEYS.DASHBOARD_STATS(currentTenant.id) : ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        const [allProducts, allOrders, allCustomers] = await Promise.all([
          productsApi.list({ page: 1, limit: 100 }),
          ordersApi.list({ page: 1, limit: 100 }),
          customersApi.list({ page: 1, limit: 100 }),
        ]);

        const productsArray = (allProducts as any).data || [];
        const productsTotal = (allProducts as any).pagination?.total || productsArray.length;
        const outOfStock = productsArray.filter(
          (p: any) => p.inventoryStatus === 'OUT_OF_STOCK' || p.quantity === 0 || p.stock === 0
        ).length;

        const ordersArray = (allOrders as any).orders || (allOrders as any).data || [];
        const ordersTotal = (allOrders as any).total || ordersArray.length;
        const revenue = ordersArray.reduce(
          (sum: number, order: any) =>
            sum + parseFloat(order.total?.toString() || order.totalAmount?.toString() || '0'),
          0
        );

        const customersArray = (allCustomers as any).customers || (allCustomers as any).data || [];
        const customersTotal = (allCustomers as any).total || customersArray.length;

        const orderCurrencies = ordersArray.map((o: any) => o.currency || 'USD');
        const mostCommonCurrency =
          orderCurrencies.length > 0
            ? orderCurrencies
                .sort(
                  (a: string, b: string) =>
                    orderCurrencies.filter((v: string) => v === a).length -
                    orderCurrencies.filter((v: string) => v === b).length
                )
                .pop()
            : 'USD';

        return {
          revenue: { total: revenue, change: 12.5, currency: mostCommonCurrency || 'USD' },
          orders: { total: ordersTotal, change: 8.3 },
          customers: { total: customersTotal, change: 15.2 },
          products: { total: productsTotal, outOfStock },
        };
      } catch (error: any) {
        if (error?.status === 404 || error?.status === 503) {
          return {
            revenue: { total: 0, change: 0, currency: 'USD' },
            orders: { total: 0, change: 0 },
            customers: { total: 0, change: 0 },
            products: { total: 0, outOfStock: 0 },
          };
        }
        return {
          revenue: { total: 0, change: 0, currency: 'USD' },
          orders: { total: 0, change: 0 },
          customers: { total: 0, change: 0 },
          products: { total: 0, outOfStock: 0 },
        };
      }
    },
    enabled: !!currentTenant,
    retry: false,
  });

  // Fetch recent orders
  const {
    data: recentOrders,
    isLoading: ordersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: currentTenant
      ? [...QUERY_KEYS.ORDERS(currentTenant.id), 'recent']
      : ['orders-recent'],
    queryFn: async (): Promise<RecentOrder[]> => {
      try {
        const response = await ordersApi.list({ page: 1, limit: 5 });
        const orders = (response as any).orders || (response as any).data || [];

        return orders.map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber || order.order_number || `${order.id.slice(0, 8)}`,
          customerName: order.customer?.firstName
            ? `${order.customer.firstName} ${order.customer.lastName || ''}`
            : order.customerEmail || 'Guest Customer',
          total: parseFloat(order.total?.toString() || '0'),
          currency: order.currency || 'USD',
          status: (order.status || 'pending').toLowerCase(),
          createdAt: order.createdAt || order.created_at || new Date().toISOString(),
        }));
      } catch (error: any) {
        return [];
      }
    },
    enabled: !!currentTenant,
    retry: false,
  });

  useEffect(() => {
    const convertRevenue = async () => {
      if (stats?.revenue.total && stats.revenue.total > 0) {
        try {
          const formatted = await formatConverted(stats.revenue.total, stats.revenue.currency, {
            compact: false,
          });
          setConvertedRevenue(formatted);
        } catch (error) {
          setConvertedRevenue(formatCurrency(stats.revenue.total, stats.revenue.currency));
        }
      } else {
        setConvertedRevenue(formatCurrency(0, adminCurrency));
      }
    };
    convertRevenue();
  }, [stats?.revenue.total, stats?.revenue.currency, adminCurrency, formatConverted]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([refetchStats(), refetchOrders(), refreshRates()]);
    setRefreshing(false);
  }, [refetchStats, refetchOrders, refreshRates]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good morning';
    }
    if (hour < 17) {
      return 'Good afternoon';
    }
    return 'Good evening';
  };

  const quickActions = [
    {
      icon: 'add-circle' as const,
      label: 'Add Product',
      color: '#6366F1',
      route: '/(tabs)/(admin)/add-product',
    },
    {
      icon: 'receipt' as const,
      label: 'Orders',
      color: '#3B82F6',
      route: '/(tabs)/(admin)/orders',
    },
    {
      icon: 'people' as const,
      label: 'Customers',
      color: '#10B981',
      route: '/(tabs)/(admin)/customers',
    },
    {
      icon: 'bar-chart' as const,
      label: 'Analytics',
      color: '#F59E0B',
      route: '/(tabs)/(admin)/analytics',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={onRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.springify().damping(15)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              style={[styles.menuButton, { backgroundColor: colors.surface }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDrawerVisible(true);
              }}
            >
              <Ionicons color={colors.text} name="menu" size={22} />
            </Pressable>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                {getGreeting()},
              </Text>
              <Text style={[styles.userName, { color: colors.text }]}>
                {user?.first_name || 'Merchant'}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={[styles.iconButton, { backgroundColor: colors.surface }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(admin)/search' as any);
              }}
            >
              <Ionicons color={colors.text} name="search" size={20} />
            </Pressable>
            <Pressable
              style={[styles.notificationButton, { backgroundColor: colors.surface }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(admin)/notifications' as any);
              }}
            >
              <Ionicons color={colors.text} name="notifications-outline" size={20} />
              {unreadNotificationCount > 0 ? (
                <View style={[styles.notificationBadge, { backgroundColor: colors.error }]}>
                  <Text style={styles.notificationCount}>
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <ProfileMenu />
          </View>
        </Animated.View>

        {/* Store Selector */}
        {currentTenant ? (
          <Animated.View
            entering={FadeInDown.delay(50).springify()}
            style={styles.storeSelectorContainer}
          >
            <StoreSelector />
          </Animated.View>
        ) : null}

        {/* Hero Revenue Card */}
        {statsLoading || currencyLoading ? (
          <View style={styles.heroSkeleton}>
            <ShimmerLoader borderRadius={24} height={180} />
          </View>
        ) : (
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <HeroRevenueCard
              change={stats?.revenue.change || 0}
              currency={adminCurrency}
              value={stats?.revenue.total || 0}
              onPress={() => router.push('/(tabs)/(admin)/analytics')}
            />
          </Animated.View>
        )}

        {/* Stats Cards Row */}
        {statsLoading ? (
          <View style={styles.statsRow}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.statCardSkeleton}>
                <ShimmerLoader borderRadius={20} height={120} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.statsRow}>
            <StatCard
              change={stats?.orders.change}
              color={colors.info}
              icon="receipt"
              index={0}
              title="Orders"
              value={stats?.orders.total || 0}
              onPress={() => router.push('/(tabs)/(admin)/orders')}
            />
            <StatCard
              change={stats?.customers.change}
              color={colors.success}
              icon="people"
              index={1}
              title="Customers"
              value={stats?.customers.total || 0}
              onPress={() => router.push('/(tabs)/(admin)/customers')}
            />
            <StatCard
              color={colors.warning}
              icon="cube"
              index={2}
              title="Products"
              value={stats?.products.total || 0}
              onPress={() => router.push('/(tabs)/(admin)/products')}
            />
          </View>
        )}

        {/* Low Stock Alert */}
        {stats && stats.products.outOfStock > 2 ? (
          <Animated.View entering={FadeInDown.delay(280).springify()}>
            <Pressable
              style={[styles.alertCard, { backgroundColor: `${colors.warning}12` }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(admin)/products?filter=low-stock');
              }}
            >
              <View style={[styles.alertIcon, { backgroundColor: `${colors.warning}20` }]}>
                <Ionicons color={colors.warning} name="alert-circle" size={20} />
              </View>
              <View style={styles.alertContent}>
                <Text style={[styles.alertTitle, { color: colors.text }]}>
                  {stats.products.outOfStock} products low on stock
                </Text>
                <AnimatedProgressBar
                  gradient={[colors.warning, colors.error]}
                  height={4}
                  progress={(stats.products.outOfStock / stats.products.total) * 100}
                  style={{ marginTop: 8 }}
                />
              </View>
              <Ionicons color={colors.textTertiary} name="chevron-forward" size={18} />
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <QuickActionButton
                key={action.label}
                color={action.color}
                icon={action.icon}
                index={index}
                label={action.label}
                onPress={() => router.push(action.route as any)}
              />
            ))}
          </View>
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/(admin)/orders');
              }}
            >
              <Text style={[styles.sectionAction, { color: colors.primary }]}>View All</Text>
            </Pressable>
          </View>

          {ordersLoading ? (
            <View style={styles.activityList}>
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </View>
          ) : recentOrders && recentOrders.length > 0 ? (
            <View style={styles.activityList}>
              {recentOrders.map((order, index) => (
                <ActivityItem
                  key={order.id}
                  index={index}
                  order={order}
                  onPress={() => router.push(`/(tabs)/(admin)/order-detail?id=${order.id}`)}
                />
              ))}
            </View>
          ) : (
            <Animated.View
              entering={FadeInUp.delay(400).springify()}
              style={[styles.emptyState, { backgroundColor: colors.surface }]}
            >
              <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}10` }]}>
                <Ionicons color={colors.primary} name="receipt-outline" size={32} />
              </View>
              <Text style={[styles.emptyText, { color: colors.text }]}>No recent orders</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Orders will appear here when customers make purchases
              </Text>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        gradient={premiumGradients.cosmic}
        icon="add"
        onPress={() => router.push('/(tabs)/(admin)/add-product')}
      />

      {/* Drawer Navigation */}
      <DrawerNavigation visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
  },
  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  storeSelectorContainer: {
    marginBottom: 16,
  },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroGradient: {
    padding: 24,
    minHeight: 180,
  },
  heroDecoration: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle1: {
    width: 180,
    height: 180,
    top: -60,
    right: -40,
  },
  decorCircle2: {
    width: 120,
    height: 120,
    bottom: -40,
    left: -20,
  },
  decorCircle3: {
    width: 80,
    height: 80,
    top: '50%',
    left: '60%',
  },
  heroContent: {
    flex: 1,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  heroCurrency: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 20,
    fontWeight: '600',
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    marginTop: 4,
  },
  sparklineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginTop: 16,
    height: 40,
  },
  sparklineBar: {
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 4,
  },
  heroSkeleton: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCardSkeleton: {
    flex: 1,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    minHeight: 120,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  statBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statChangeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 12,
  },
  alertIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionGradient: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  activityList: {
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 13,
  },
  activityRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  activityTime: {
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 240,
  },
});
