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
  Easing,
} from 'react-native-reanimated';
import { useInfiniteQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils/formatting';
import { QUERY_KEYS } from '@/lib/constants';
import { customersApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { CardSkeleton } from '@/components/premium';
import { springs, shadows, premiumGradients } from '@/lib/design/animations';
import { typography } from '@/lib/design/typography';
import type { Customer } from '@/types/entities';

const CUSTOMER_FILTERS = [
  { id: 'all', label: 'All', icon: 'people' as const },
  { id: 'active', label: 'Active', icon: 'checkmark-circle' as const },
  { id: 'new', label: 'New', icon: 'sparkles' as const },
  { id: 'vip', label: 'VIP', icon: 'star' as const },
  { id: 'inactive', label: 'Inactive', icon: 'moon' as const },
] as const;

// Premium Customer Card
function CustomerCard({ customer, index }: { customer: Customer; index: number }) {
  const colors = useColors();
  const isDark = useIsDark();
  const router = useRouter();

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const isVip = customer.total_spent >= 1000;
  const isNew = new Date(customer.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

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
          styles.customerCard,
          {
            backgroundColor: isDark ? colors.surface : colors.card,
            borderColor: colors.border,
          },
          shadows.md,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push(`/(tabs)/(admin)/customer-detail?id=${customer.id}`);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Avatar with VIP indicator */}
        <View style={styles.avatarContainer}>
          <Avatar name={`${customer.first_name} ${customer.last_name}`} size="lg" />
          {isVip ? (
            <View style={[styles.vipBadge, shadows.sm]}>
              <LinearGradient
                colors={[...premiumGradients.gold]}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={styles.vipBadgeGradient}
              >
                <Ionicons color="#FFFFFF" name="star" size={10} />
              </LinearGradient>
            </View>
          ) : null}
        </View>

        <View style={styles.customerInfo}>
          <View style={styles.customerNameRow}>
            <Text style={[styles.customerName, { color: colors.text }]}>
              {customer.first_name} {customer.last_name}
            </Text>
            {isVip ? <Badge label="VIP" size="sm" variant="warning" /> : null}
            {isNew && !isVip ? <Badge label="New" size="sm" variant="info" /> : null}
          </View>
          <Text style={[styles.customerEmail, { color: colors.textSecondary }]}>
            {customer.email}
          </Text>
          <View style={styles.customerMeta}>
            <View style={[styles.metaItem, { backgroundColor: `${colors.primary}10` }]}>
              <Ionicons color={colors.primary} name="receipt-outline" size={12} />
              <Text style={[styles.metaText, { color: colors.primary }]}>
                {customer.total_orders}
              </Text>
            </View>
            <View style={[styles.metaItem, { backgroundColor: `${colors.success}10` }]}>
              <Ionicons color={colors.success} name="wallet-outline" size={12} />
              <Text style={[styles.metaText, { color: colors.success }]}>
                {formatCurrency(customer.total_spent, { compact: true })}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.arrowButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/(tabs)/(admin)/customer-detail?id=${customer.id}`);
          }}
        >
          <View style={[styles.arrowCircle, { backgroundColor: `${colors.primary}10` }]}>
            <Ionicons color={colors.primary} name="chevron-forward" size={16} />
          </View>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

// Premium Stats Header with Hero Card
function CustomerStats({
  total,
  vip,
  newCustomers,
  totalRevenue,
}: {
  total: number;
  vip: number;
  newCustomers: number;
  totalRevenue: number;
}) {
  const colors = useColors();
  const isDark = useIsDark();
  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withSequence(
      withTiming(-3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
    );

    const interval = setInterval(() => {
      floatY.value = withSequence(
        withTiming(-3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
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
      <Animated.View style={[styles.heroCardWrapper, floatStyle, shadows.lg]}>
        <LinearGradient
          colors={[...premiumGradients.aurora]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.heroCard}
        >
          {/* Decorative elements */}
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />

          <View style={styles.heroContent}>
            <View style={styles.heroIcon}>
              <Ionicons color="rgba(255,255,255,0.95)" name="people" size={20} />
            </View>
            <Text style={styles.heroLabel}>Customer Revenue</Text>
            <Text style={styles.heroValue}>{formatCurrency(totalRevenue)}</Text>
          </View>

          {/* Mini stat badges */}
          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeValue}>{total}</Text>
              <Text style={styles.heroBadgeLabel}>Total</Text>
            </View>
            <View style={styles.heroBadgeDivider} />
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeValue}>{vip}</Text>
              <Text style={styles.heroBadgeLabel}>VIP</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={[
            styles.statItem,
            { backgroundColor: isDark ? colors.surface : `${colors.primary}08` },
            shadows.sm,
          ]}
        >
          <View style={[styles.statIconBg, { backgroundColor: `${colors.primary}20` }]}>
            <Ionicons color={colors.primary} name="people" size={16} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{total}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(250).springify()}
          style={[
            styles.statItem,
            { backgroundColor: isDark ? colors.surface : `${colors.warning}08` },
            shadows.sm,
          ]}
        >
          <View style={[styles.statIconBg, { backgroundColor: `${colors.warning}20` }]}>
            <Ionicons color={colors.warning} name="star" size={16} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{vip}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>VIP</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={[
            styles.statItem,
            { backgroundColor: isDark ? colors.surface : `${colors.info}08` },
            shadows.sm,
          ]}
        >
          <View style={[styles.statIconBg, { backgroundColor: `${colors.info}20` }]}>
            <Ionicons color={colors.info} name="sparkles" size={16} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{newCustomers}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>New</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// Premium Filter Chip
function FilterChip({
  filter,
  isActive,
  onPress,
}: {
  filter: (typeof CUSTOMER_FILTERS)[number];
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
          shadows.sm,
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
          name={filter.icon}
          size={14}
        />
        <Text style={[styles.filterText, { color: isActive ? '#FFFFFF' : colors.textSecondary }]}>
          {filter.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function CustomersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const { currentTenant } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch customers with infinite scroll using real API
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: currentTenant
        ? [...QUERY_KEYS.CUSTOMERS(currentTenant.id), activeFilter, searchQuery]
        : ['customers', activeFilter, searchQuery],
      queryFn: async ({ pageParam = 1 }) => {
        try {
          const params: Record<string, any> = {
            page: pageParam,
            limit: 20,
          };

          if (searchQuery) {
            params.search = searchQuery;
          }

          if (activeFilter === 'active') {
            params.status = 'active';
          } else if (activeFilter === 'inactive') {
            params.status = 'inactive';
          }

          console.log('[Customers] Fetching customers with params:', params);
          const response = await customersApi.list(params);

          const customersArray = (response as any).customers || (response as any).data || [];
          const total = (response as any).total || customersArray.length;
          const totalPages = (response as any).totalPages || Math.ceil(total / 20);

          console.log(
            '[Customers] Fetched',
            customersArray.length,
            'customers, page',
            pageParam,
            'of',
            totalPages
          );

          const customers: Customer[] = customersArray.map((c: any) => ({
            id: c.id,
            tenant_id: c.tenantId || c.tenant_id || currentTenant?.id,
            user_id: c.userId || c.user_id || c.id,
            email: c.email,
            first_name: c.firstName || c.first_name || '',
            last_name: c.lastName || c.last_name || '',
            phone: c.phone || null,
            status: c.status || 'active',
            total_orders: c.totalOrders || c.total_orders || c.ordersCount || 0,
            total_spent: parseFloat(
              c.totalSpent?.toString() ||
                c.total_spent?.toString() ||
                c.totalRevenue?.toString() ||
                '0'
            ),
            addresses: c.addresses || [],
            created_at: c.createdAt || c.created_at || new Date().toISOString(),
            updated_at: c.updatedAt || c.updated_at || new Date().toISOString(),
          }));

          return {
            customers,
            page: pageParam,
            totalPages,
          };
        } catch (error) {
          console.error('[Customers] Error fetching customers:', error);
          return { customers: [], page: pageParam, totalPages: 1 };
        }
      },
      getNextPageParam: (lastPage) => {
        return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
      },
      initialPageParam: 1,
      enabled: !!currentTenant,
    });

  const customers = useMemo(() => {
    return data?.pages.flatMap((page) => page.customers) || [];
  }, [data]);

  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    if (activeFilter !== 'all') {
      filtered = filtered.filter((c) => {
        switch (activeFilter) {
          case 'active':
            return c.status === 'active';
          case 'new':
            return new Date(c.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
          case 'vip':
            return c.total_spent >= 1000;
          case 'inactive':
            return c.status === 'inactive';
          default:
            return true;
        }
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.first_name?.toLowerCase().includes(query) ||
          c.last_name?.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.phone?.includes(query)
      );
    }

    return filtered;
  }, [customers, activeFilter, searchQuery]);

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

  const renderCustomer = useCallback(
    ({ item, index }: { item: Customer; index: number }) => (
      <CustomerCard customer={item} index={index} />
    ),
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

  // Calculate stats
  const stats = useMemo(() => {
    const total = customers.length;
    const vip = customers.filter((c) => c.total_spent >= 1000).length;
    const newCustomers = customers.filter(
      (c) => new Date(c.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    ).length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);
    return { total, vip, newCustomers, totalRevenue };
  }, [customers]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Animated.View entering={FadeInDown.springify()}>
          <Text style={[styles.title, { color: colors.text }]}>Customers</Text>
        </Animated.View>

        {/* Stats */}
        <CustomerStats {...stats} />

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
            placeholder="Search customers..."
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

        {/* Filters */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ScrollView
            horizontal
            contentContainerStyle={styles.filtersContainer}
            showsHorizontalScrollIndicator={false}
          >
            {CUSTOMER_FILTERS.map((filter) => (
              <FilterChip
                key={filter.id}
                filter={filter}
                isActive={activeFilter === filter.id}
                onPress={() => setActiveFilter(filter.id)}
              />
            ))}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Customer List */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Animated.View
              key={i}
              entering={FadeInDown.delay(i * 80).springify()}
              style={{ marginBottom: 12 }}
            >
              <CardSkeleton />
            </Animated.View>
          ))}
        </ScrollView>
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          actionLabel={searchQuery ? 'Clear Search' : undefined}
          description={
            searchQuery
              ? 'Try adjusting your search or filters'
              : 'Customers will appear here when they make purchases'
          }
          icon="people-outline"
          title={searchQuery ? 'No customers found' : 'No customers yet'}
          onAction={
            searchQuery
              ? () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setSearchQuery('');
                }
              : undefined
          }
        />
      ) : (
        <FlatList
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.primary}
              onRefresh={onRefresh}
            />
          }
          renderItem={renderCustomer}
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
  heroCardWrapper: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
  },
  heroCard: {
    padding: 20,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  heroContent: {
    zIndex: 2,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -30,
    right: -20,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -10,
    left: 30,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  heroValue: {
    ...typography.title1,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    alignSelf: 'flex-start',
  },
  heroBadge: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  heroBadgeValue: {
    ...typography.headline,
    color: '#FFFFFF',
  },
  heroBadgeLabel: {
    ...typography.micro,
    color: 'rgba(255,255,255,0.7)',
  },
  heroBadgeDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statItem: {
    flex: 1,
    padding: 12,
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
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    gap: 14,
    borderWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  vipBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  vipBadgeGradient: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfo: {
    flex: 1,
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  customerName: {
    ...typography.bodyMedium,
  },
  customerEmail: {
    ...typography.caption,
    marginBottom: 10,
  },
  customerMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: {
    ...typography.captionMedium,
  },
  arrowButton: {
    padding: 4,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
