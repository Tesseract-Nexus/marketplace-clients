import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency, formatRelativeTime } from '@/lib/utils/formatting';
import { typography, gradients } from '@/lib/design/typography';
import { useAuthStore } from '@/stores/auth-store';

type CartStatus = 'ABANDONED' | 'CONTACTED' | 'RECOVERED' | 'EXPIRED';

interface AbandonedCart {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  status: CartStatus;
  items: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  abandonedAt: string;
  lastContactedAt?: string;
  recoveryAttempts: number;
  sessionDuration: number;
}

const CART_STATUSES = [
  { id: 'all', label: 'All', icon: 'apps' as const },
  { id: 'ABANDONED', label: 'Abandoned', icon: 'cart' as const },
  { id: 'CONTACTED', label: 'Contacted', icon: 'mail' as const },
  { id: 'RECOVERED', label: 'Recovered', icon: 'checkmark-circle' as const },
  { id: 'EXPIRED', label: 'Expired', icon: 'time' as const },
] as const;

// Stats Card Component
function StatsCards({ carts }: { carts: AbandonedCart[] }) {
  const colors = useColors();
  const isDark = useIsDark();

  const stats = useMemo(() => {
    const abandoned = carts.filter((c) => c.status === 'ABANDONED').length;
    const contacted = carts.filter((c) => c.status === 'CONTACTED').length;
    const recovered = carts.filter((c) => c.status === 'RECOVERED').length;
    const potentialRevenue = carts
      .filter((c) => c.status !== 'RECOVERED' && c.status !== 'EXPIRED')
      .reduce((sum, c) => sum + c.subtotal, 0);
    return { abandoned, contacted, recovered, potentialRevenue };
  }, [carts]);

  return (
    <Animated.View entering={FadeInDown.delay(100)} style={styles.statsContainer}>
      {/* Potential Revenue Card */}
      <LinearGradient
        colors={[...gradients.primary]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.revenueCard}
      >
        <View style={styles.revenueIcon}>
          <Ionicons color="rgba(255,255,255,0.9)" name="cash" size={16} />
        </View>
        <Text style={styles.revenueLabel}>Potential Revenue</Text>
        <Text style={styles.revenueValue}>{formatCurrency(stats.potentialRevenue)}</Text>
      </LinearGradient>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statItem,
            { backgroundColor: isDark ? colors.surface : colors.warningLight },
          ]}
        >
          <Ionicons color={colors.warning} name="cart" size={16} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.abandoned}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Abandoned</Text>
        </View>

        <View
          style={[styles.statItem, { backgroundColor: isDark ? colors.surface : colors.infoLight }]}
        >
          <Ionicons color={colors.info} name="mail" size={16} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.contacted}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Contacted</Text>
        </View>

        <View
          style={[
            styles.statItem,
            { backgroundColor: isDark ? colors.surface : colors.successLight },
          ]}
        >
          <Ionicons color={colors.success} name="checkmark-circle" size={16} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.recovered}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Recovered</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Abandoned Cart Card Component
function AbandonedCartCard({
  cart,
  index,
  onSendEmail,
  onViewDetails,
}: {
  cart: AbandonedCart;
  index: number;
  onSendEmail: (id: string) => void;
  onViewDetails: (cart: AbandonedCart) => void;
}) {
  const colors = useColors();
  const isDark = useIsDark();

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const statusConfig = {
    ABANDONED: {
      label: 'Abandoned',
      variant: 'warning' as const,
      icon: 'cart' as const,
      color: colors.warning,
    },
    CONTACTED: {
      label: 'Contacted',
      variant: 'info' as const,
      icon: 'mail' as const,
      color: colors.info,
    },
    RECOVERED: {
      label: 'Recovered',
      variant: 'success' as const,
      icon: 'checkmark-circle' as const,
      color: colors.success,
    },
    EXPIRED: {
      label: 'Expired',
      variant: 'secondary' as const,
      icon: 'time' as const,
      color: colors.textSecondary,
    },
  }[cart.status];

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 40)
        .springify()
        .damping(15)}
      style={animatedStyle}
    >
      <Pressable
        style={[
          styles.cartCard,
          {
            backgroundColor: isDark ? colors.surface : colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() => onViewDetails(cart)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Header */}
        <View style={styles.cartHeader}>
          <View style={styles.cartHeaderLeft}>
            <View
              style={[styles.cartIconContainer, { backgroundColor: `${statusConfig.color}15` }]}
            >
              <Ionicons color={statusConfig.color} name={statusConfig.icon} size={18} />
            </View>
            <View>
              <Text style={[styles.customerName, { color: colors.text }]}>{cart.customerName}</Text>
              <Text style={[styles.customerEmail, { color: colors.textTertiary }]}>
                {cart.customerEmail}
              </Text>
            </View>
          </View>
          <Text style={[styles.cartTotal, { color: colors.text }]}>
            {formatCurrency(cart.subtotal)}
          </Text>
        </View>

        {/* Cart Info */}
        <View style={styles.cartInfoRow}>
          <View style={styles.cartInfoItem}>
            <Ionicons color={colors.textSecondary} name="bag-outline" size={14} />
            <Text style={[styles.cartInfoText, { color: colors.textSecondary }]}>
              {cart.items.length} items
            </Text>
          </View>
          <View style={styles.cartInfoItem}>
            <Ionicons color={colors.textSecondary} name="time-outline" size={14} />
            <Text style={[styles.cartInfoText, { color: colors.textSecondary }]}>
              {formatRelativeTime(cart.abandonedAt)}
            </Text>
          </View>
          <Badge label={statusConfig.label} size="sm" variant={statusConfig.variant} />
        </View>

        {/* Footer */}
        <View style={[styles.cartFooter, { borderTopColor: colors.border }]}>
          <View style={styles.recoveryInfo}>
            <Ionicons color={colors.textSecondary} name="reload" size={14} />
            <Text style={[styles.recoveryText, { color: colors.textSecondary }]}>
              {cart.recoveryAttempts} attempts
            </Text>
          </View>
          <View style={styles.actionButtons}>
            {cart.status === 'ABANDONED' || cart.status === 'CONTACTED' ? (
              <Pressable
                hitSlop={8}
                style={[styles.actionButton, { backgroundColor: `${colors.success}15` }]}
                onPress={() => onSendEmail(cart.id)}
              >
                <Ionicons color={colors.success} name="mail" size={14} />
                <Text style={[styles.actionButtonText, { color: colors.success }]}>Send Email</Text>
              </Pressable>
            ) : null}
            <Pressable
              hitSlop={8}
              style={[styles.actionButton, { backgroundColor: `${colors.primary}10` }]}
              onPress={() => onViewDetails(cart)}
            >
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>View</Text>
              <Ionicons color={colors.primary} name="chevron-forward" size={14} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function AbandonedOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const { currentTenant } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch abandoned carts
  const {
    data: carts = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: currentTenant ? ['abandoned-carts', currentTenant.id] : ['abandoned-carts'],
    queryFn: async (): Promise<AbandonedCart[]> => {
      // TODO: Replace with actual API call
      // const response = await abandonedCartsApi.list();
      // return response.data;

      // Mock data for now
      return [
        {
          id: '1',
          customerId: 'c1',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          status: 'ABANDONED',
          items: [
            { id: 'i1', productName: 'Premium Headphones', quantity: 1, price: 199.99 },
            { id: 'i2', productName: 'Phone Case', quantity: 2, price: 29.99 },
          ],
          subtotal: 259.97,
          abandonedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          recoveryAttempts: 0,
          sessionDuration: 15,
        },
        {
          id: '2',
          customerId: 'c2',
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          status: 'CONTACTED',
          items: [{ id: 'i3', productName: 'Wireless Mouse', quantity: 1, price: 49.99 }],
          subtotal: 49.99,
          abandonedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          lastContactedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          recoveryAttempts: 1,
          sessionDuration: 8,
        },
        {
          id: '3',
          customerId: 'c3',
          customerName: 'Bob Wilson',
          customerEmail: 'bob@example.com',
          status: 'RECOVERED',
          items: [{ id: 'i4', productName: 'Laptop Stand', quantity: 1, price: 79.99 }],
          subtotal: 79.99,
          abandonedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          lastContactedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
          recoveryAttempts: 2,
          sessionDuration: 22,
        },
        {
          id: '4',
          customerId: 'c4',
          customerName: 'Alice Brown',
          customerEmail: 'alice@example.com',
          status: 'ABANDONED',
          items: [
            { id: 'i5', productName: 'Smart Watch', quantity: 1, price: 299.99 },
            { id: 'i6', productName: 'Watch Band', quantity: 3, price: 19.99 },
          ],
          subtotal: 359.96,
          abandonedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          recoveryAttempts: 0,
          sessionDuration: 12,
        },
      ];
    },
    enabled: !!currentTenant,
  });

  const filteredCarts = useMemo(() => {
    let filtered = carts;

    if (activeStatus !== 'all') {
      filtered = filtered.filter((c) => c.status === activeStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.customerName.toLowerCase().includes(query) ||
          c.customerEmail.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [carts, activeStatus, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleSendEmail = useCallback((cartId: string) => {
    Alert.alert('Send Recovery Email', 'Send a cart recovery email to this customer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send',
        onPress: () => {
          // TODO: Call API to send recovery email
          Alert.alert('Success', 'Recovery email sent successfully!');
        },
      },
    ]);
  }, []);

  const handleViewDetails = useCallback((cart: AbandonedCart) => {
    // Navigate to cart details or show modal
    Alert.alert(
      'Cart Details',
      `Customer: ${cart.customerName}\nItems: ${cart.items.length}\nTotal: ${formatCurrency(cart.subtotal)}\nAbandoned: ${formatRelativeTime(cart.abandonedAt)}`
    );
  }, []);

  const renderCart = useCallback(
    ({ item, index }: { item: AbandonedCart; index: number }) => (
      <AbandonedCartCard
        cart={item}
        index={index}
        onSendEmail={handleSendEmail}
        onViewDetails={handleViewDetails}
      />
    ),
    [handleSendEmail, handleViewDetails]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons color={colors.text} name="arrow-back" size={24} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Abandoned Carts</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Stats */}
        <StatsCards carts={carts} />

        {/* Search */}
        <Animated.View
          entering={FadeInDown.delay(150)}
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? colors.surface : '#F3F4F6',
              borderColor: colors.border,
            },
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
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons color={colors.textSecondary} name="close-circle" size={18} />
            </Pressable>
          ) : null}
        </Animated.View>

        {/* Status Filters */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <ScrollView
            horizontal
            contentContainerStyle={styles.filtersContainer}
            showsHorizontalScrollIndicator={false}
          >
            {CART_STATUSES.map((status) => (
              <Pressable
                key={status.id}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: activeStatus === status.id ? colors.primary : colors.surface,
                    borderColor: activeStatus === status.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveStatus(status.id)}
              >
                <Ionicons
                  color={activeStatus === status.id ? '#FFFFFF' : colors.textSecondary}
                  name={status.icon}
                  size={14}
                />
                <Text
                  style={[
                    styles.filterText,
                    { color: activeStatus === status.id ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {status.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Cart List */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              borderRadius={16}
              height={160}
              style={{ marginBottom: 12 }}
              width="100%"
            />
          ))}
        </ScrollView>
      ) : filteredCarts.length === 0 ? (
        <EmptyState
          actionLabel={searchQuery ? 'Clear Search' : undefined}
          description={
            searchQuery
              ? 'Try adjusting your search or filters'
              : 'Great news! No customers have abandoned their carts'
          }
          icon="cart-outline"
          title={searchQuery ? 'No carts found' : 'No abandoned carts'}
          onAction={searchQuery ? () => setSearchQuery('') : undefined}
        />
      ) : (
        <FlatList
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          data={filteredCarts}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.primary}
              onRefresh={onRefresh}
            />
          }
          renderItem={renderCart}
          showsVerticalScrollIndicator={false}
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title2,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  statsContainer: {
    marginBottom: 16,
  },
  revenueCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  revenueIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  revenueLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  revenueValue: {
    ...typography.title2,
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  statValue: {
    ...typography.bodyMedium,
  },
  statLabel: {
    ...typography.micro,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
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
    paddingVertical: 8,
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
  cartCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cartHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cartIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerName: {
    ...typography.bodyMedium,
  },
  customerEmail: {
    ...typography.micro,
    marginTop: 2,
  },
  cartTotal: {
    ...typography.title3,
  },
  cartInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 16,
  },
  cartInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cartInfoText: {
    ...typography.caption,
  },
  cartFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
  },
  recoveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recoveryText: {
    ...typography.caption,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonText: {
    ...typography.captionMedium,
  },
});
