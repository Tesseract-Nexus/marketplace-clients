import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/stores/auth-store';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency, formatNumber } from '@/lib/utils/formatting';
import { QUERY_KEYS } from '@/lib/constants';
import { ordersApi, productsApi, customersApi, analyticsApi } from '@/lib/api';
import { typography, gradients } from '@/lib/design/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type AnalyticsTab = 'overview' | 'sales' | 'customers' | 'inventory';

// Analytics category card
function CategoryCard({
  title,
  subtitle,
  icon,
  gradient,
  onPress,
  delay = 0,
}: {
  title: string;
  subtitle: string;
  icon: string;
  gradient: readonly [string, string];
  onPress: () => void;
  delay?: number;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(delay)} style={styles.categoryCard}>
      <Pressable onPress={onPress}>
        <LinearGradient
          colors={[...gradient]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.categoryGradient}
        >
          <View style={styles.categoryIcon}>
            <Ionicons color="rgba(255,255,255,0.9)" name={icon as any} size={24} />
          </View>
          <Text style={styles.categoryTitle}>{title}</Text>
          <Text style={styles.categorySubtitle}>{subtitle}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// Metric row component
function MetricRow({
  label,
  value,
  change,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  change?: number;
  icon: string;
  iconColor: string;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const isPositive = (change ?? 0) >= 0;

  return (
    <View style={[styles.metricRow, { backgroundColor: isDark ? colors.surface : colors.card }]}>
      <View style={[styles.metricIcon, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons color={iconColor} name={icon as any} size={18} />
      </View>
      <View style={styles.metricContent}>
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      </View>
      {change !== undefined ? (
        <View
          style={[
            styles.changeBadge,
            { backgroundColor: isPositive ? `${colors.success}15` : `${colors.error}15` },
          ]}
        >
          <Ionicons
            color={isPositive ? colors.success : colors.error}
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={12}
          />
          <Text style={[styles.changeText, { color: isPositive ? colors.success : colors.error }]}>
            {Math.abs(change)}%
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const { currentTenant } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

  // Fetch overview stats
  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: currentTenant
      ? [...QUERY_KEYS.ANALYTICS(currentTenant.id, 'overview')]
      : ['analytics-overview'],
    queryFn: async () => {
      try {
        // Fetch all data in parallel
        const [ordersResponse, productsResponse, customersResponse] = await Promise.all([
          ordersApi.list({ page: 1, limit: 500 }),
          productsApi.list({ page: 1, limit: 500 }),
          customersApi.list({ page: 1, limit: 500 }),
        ]);

        const ordersArray = (ordersResponse as any).orders || (ordersResponse as any).data || [];
        const productsArray = (productsResponse as any).data || [];
        const customersArray =
          (customersResponse as any).customers || (customersResponse as any).data || [];

        // Calculate totals
        const totalRevenue = ordersArray.reduce(
          (sum: number, o: any) =>
            sum + parseFloat(o.total?.toString() || o.totalAmount?.toString() || '0'),
          0
        );
        const totalOrders = ordersArray.length;
        const totalCustomers = customersArray.length;
        const totalProducts = productsArray.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Calculate inventory stats
        const lowStock = productsArray.filter((p: any) => {
          const stock = p.quantity || p.stock || p.inventory_count || 0;
          return stock > 0 && stock <= 10;
        }).length;
        const outOfStock = productsArray.filter((p: any) => {
          const stock = p.quantity || p.stock || p.inventory_count || 0;
          return stock === 0;
        }).length;

        return {
          revenue: totalRevenue,
          orders: totalOrders,
          customers: totalCustomers,
          products: totalProducts,
          avgOrderValue,
          lowStock,
          outOfStock,
          // Mock changes - in real app these would come from analytics API
          revenueChange: 12.5,
          ordersChange: 8.3,
          customersChange: 15.2,
        };
      } catch (error: any) {
        console.log('[Analytics] Stats fetch skipped:', error?.message || 'API not available');
        return null;
      }
    },
    enabled: !!currentTenant,
    retry: false,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const tabs: { id: AnalyticsTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'sales', label: 'Sales' },
    { id: 'customers', label: 'Customers' },
    { id: 'inventory', label: 'Inventory' },
  ];

  const categoryCards = [
    {
      title: 'Sales Analytics',
      subtitle: 'Revenue & orders',
      icon: 'trending-up',
      gradient: gradients.revenue,
      route: '/(tabs)/(admin)/analytics-sales',
    },
    {
      title: 'Customer Insights',
      subtitle: 'Behavior & retention',
      icon: 'people',
      gradient: gradients.ocean,
      route: '/(tabs)/(admin)/analytics-customers',
    },
    {
      title: 'Inventory Health',
      subtitle: 'Stock & turnover',
      icon: 'cube',
      gradient: gradients.warning,
      route: '/(tabs)/(admin)/analytics-inventory',
    },
    {
      title: 'Performance',
      subtitle: 'Conversion & growth',
      icon: 'speedometer',
      gradient: gradients.primary,
      route: '/(tabs)/(admin)/analytics-performance',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons color={colors.text} name="arrow-back" size={22} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
        <Pressable style={styles.headerAction}>
          <Ionicons color={colors.text} name="download-outline" size={22} />
        </Pressable>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          contentContainerStyle={styles.tabScroll}
          showsHorizontalScrollIndicator={false}
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === tab.id ? colors.primary : colors.textSecondary },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.primary}
            onRefresh={onRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'overview' ? (
          <>
            {/* Category Navigation Cards */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Explore</Text>
              <View style={styles.categoriesGrid}>
                {categoryCards.map((card, index) => (
                  <CategoryCard
                    key={card.title}
                    {...card}
                    delay={150 + index * 50}
                    onPress={() => router.push(card.route as any)}
                  />
                ))}
              </View>
            </Animated.View>

            {/* Key Metrics */}
            {isLoading ? (
              <View style={styles.section}>
                <Skeleton borderRadius={12} height={70} style={{ marginBottom: 8 }} width="100%" />
                <Skeleton borderRadius={12} height={70} style={{ marginBottom: 8 }} width="100%" />
                <Skeleton borderRadius={12} height={70} width="100%" />
              </View>
            ) : stats ? (
              <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Metrics</Text>
                <View style={styles.metricsContainer}>
                  <MetricRow
                    change={stats.revenueChange}
                    icon="wallet"
                    iconColor={colors.success}
                    label="Total Revenue"
                    value={formatCurrency(stats.revenue)}
                  />
                  <MetricRow
                    change={stats.ordersChange}
                    icon="receipt"
                    iconColor={colors.info}
                    label="Total Orders"
                    value={formatNumber(stats.orders)}
                  />
                  <MetricRow
                    change={stats.customersChange}
                    icon="people"
                    iconColor={colors.warning}
                    label="Total Customers"
                    value={formatNumber(stats.customers)}
                  />
                  <MetricRow
                    icon="stats-chart"
                    iconColor={colors.primary}
                    label="Avg. Order Value"
                    value={formatCurrency(stats.avgOrderValue)}
                  />
                  <MetricRow
                    icon="cube"
                    iconColor={colors.textSecondary}
                    label="Products"
                    value={formatNumber(stats.products)}
                  />
                </View>
              </Animated.View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
                <Ionicons color={colors.textTertiary} name="analytics-outline" size={48} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No analytics data available
                </Text>
              </View>
            )}

            {/* Inventory Status */}
            {stats && (stats.lowStock > 0 || stats.outOfStock > 0) ? (
              <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Inventory Alerts</Text>
                <View style={styles.metricsContainer}>
                  {stats.lowStock > 0 ? (
                    <MetricRow
                      icon="alert-circle"
                      iconColor={colors.warning}
                      label="Low Stock Items"
                      value={formatNumber(stats.lowStock)}
                    />
                  ) : null}
                  {stats.outOfStock > 0 ? (
                    <MetricRow
                      icon="close-circle"
                      iconColor={colors.error}
                      label="Out of Stock"
                      value={formatNumber(stats.outOfStock)}
                    />
                  ) : null}
                </View>
              </Animated.View>
            ) : null}
          </>
        ) : null}

        {activeTab === 'sales' ? (
          <Animated.View entering={FadeInDown} style={styles.tabContent}>
            <CategoryCard
              gradient={gradients.revenue}
              icon="trending-up"
              subtitle="Detailed revenue & orders analysis"
              title="Sales Analytics"
              onPress={() => router.push('/(tabs)/(admin)/analytics-sales' as any)}
            />
            {stats ? (
              <View style={[styles.metricsContainer, { marginTop: 16 }]}>
                <MetricRow
                  change={stats.revenueChange}
                  icon="wallet"
                  iconColor={colors.success}
                  label="Total Revenue"
                  value={formatCurrency(stats.revenue)}
                />
                <MetricRow
                  change={stats.ordersChange}
                  icon="receipt"
                  iconColor={colors.info}
                  label="Total Orders"
                  value={formatNumber(stats.orders)}
                />
                <MetricRow
                  icon="stats-chart"
                  iconColor={colors.primary}
                  label="Avg. Order Value"
                  value={formatCurrency(stats.avgOrderValue)}
                />
              </View>
            ) : null}
          </Animated.View>
        ) : null}

        {activeTab === 'customers' ? (
          <Animated.View entering={FadeInDown} style={styles.tabContent}>
            <CategoryCard
              gradient={gradients.ocean}
              icon="people"
              subtitle="Behavior & retention analysis"
              title="Customer Insights"
              onPress={() => router.push('/(tabs)/(admin)/analytics-customers' as any)}
            />
            {stats ? (
              <View style={[styles.metricsContainer, { marginTop: 16 }]}>
                <MetricRow
                  change={stats.customersChange}
                  icon="people"
                  iconColor={colors.warning}
                  label="Total Customers"
                  value={formatNumber(stats.customers)}
                />
              </View>
            ) : null}
          </Animated.View>
        ) : null}

        {activeTab === 'inventory' ? (
          <Animated.View entering={FadeInDown} style={styles.tabContent}>
            <CategoryCard
              gradient={gradients.warning}
              icon="cube"
              subtitle="Stock levels & turnover"
              title="Inventory Health"
              onPress={() => router.push('/(tabs)/(admin)/analytics-inventory' as any)}
            />
            {stats ? (
              <View style={[styles.metricsContainer, { marginTop: 16 }]}>
                <MetricRow
                  icon="cube"
                  iconColor={colors.primary}
                  label="Total Products"
                  value={formatNumber(stats.products)}
                />
                <MetricRow
                  icon="alert-circle"
                  iconColor={colors.warning}
                  label="Low Stock Items"
                  value={formatNumber(stats.lowStock)}
                />
                <MetricRow
                  icon="close-circle"
                  iconColor={colors.error}
                  label="Out of Stock"
                  value={formatNumber(stats.outOfStock)}
                />
              </View>
            ) : null}
          </Animated.View>
        ) : null}
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
  headerAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tabScroll: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  tabText: {
    ...typography.calloutMedium,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.headline,
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: (SCREEN_WIDTH - 52) / 2,
  },
  categoryGradient: {
    borderRadius: 16,
    padding: 16,
    minHeight: 110,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    ...typography.bodyMedium,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  categorySubtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  metricsContainer: {
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    ...typography.caption,
    marginBottom: 2,
  },
  metricValue: {
    ...typography.bodyMedium,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  changeText: {
    ...typography.micro,
    fontWeight: '600',
  },
  tabContent: {
    paddingTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 16,
  },
  emptyText: {
    ...typography.bodyMedium,
    marginTop: 12,
  },
});
