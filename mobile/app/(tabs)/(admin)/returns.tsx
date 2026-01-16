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

type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
type RefundStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

interface ReturnRequest {
  id: string;
  rmaNumber: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  status: ReturnStatus;
  refundStatus: RefundStatus;
  items: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  refundAmount: number;
  createdAt: string;
  updatedAt: string;
}

const RETURN_STATUSES = [
  { id: 'all', label: 'All', icon: 'apps' as const },
  { id: 'PENDING', label: 'Pending', icon: 'time' as const },
  { id: 'APPROVED', label: 'Approved', icon: 'checkmark' as const },
  { id: 'PROCESSING', label: 'Processing', icon: 'sync' as const },
  { id: 'COMPLETED', label: 'Completed', icon: 'checkmark-circle' as const },
  { id: 'REJECTED', label: 'Rejected', icon: 'close-circle' as const },
] as const;

const REASON_DISPLAY = {
  DEFECTIVE: 'Product is defective',
  DAMAGED: 'Damaged during shipping',
  WRONG_ITEM: 'Wrong item received',
  WRONG_SIZE: 'Wrong size',
  NOT_AS_DESCRIBED: 'Not as described',
  CHANGED_MIND: 'Changed my mind',
  OTHER: 'Other reason',
};

// Stats Card Component
function StatsCards({ returns }: { returns: ReturnRequest[] }) {
  const colors = useColors();
  const isDark = useIsDark();

  const stats = useMemo(() => {
    const total = returns.length;
    const pending = returns.filter((r) => r.status === 'PENDING').length;
    const completed = returns.filter((r) => r.status === 'COMPLETED').length;
    const totalRefunded = returns
      .filter((r) => r.refundStatus === 'COMPLETED')
      .reduce((sum, r) => sum + r.refundAmount, 0);
    return { total, pending, completed, totalRefunded };
  }, [returns]);

  return (
    <Animated.View entering={FadeInDown.delay(100)} style={styles.statsContainer}>
      {/* Total Refunded Card */}
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.revenueCard}
      >
        <View style={styles.revenueIcon}>
          <Ionicons color="rgba(255,255,255,0.9)" name="cash" size={16} />
        </View>
        <Text style={styles.revenueLabel}>Total Refunded</Text>
        <Text style={styles.revenueValue}>{formatCurrency(stats.totalRefunded)}</Text>
      </LinearGradient>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View
          style={[styles.statItem, { backgroundColor: isDark ? colors.surface : colors.infoLight }]}
        >
          <Ionicons color={colors.info} name="refresh" size={16} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>

        <View
          style={[
            styles.statItem,
            { backgroundColor: isDark ? colors.surface : colors.warningLight },
          ]}
        >
          <Ionicons color={colors.warning} name="time" size={16} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.pending}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>

        <View
          style={[
            styles.statItem,
            { backgroundColor: isDark ? colors.surface : colors.successLight },
          ]}
        >
          <Ionicons color={colors.success} name="checkmark-circle" size={16} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.completed}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Done</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Return Request Card Component
function ReturnCard({
  returnRequest,
  index,
  onApprove,
  onReject,
  onViewDetails,
}: {
  returnRequest: ReturnRequest;
  index: number;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetails: (r: ReturnRequest) => void;
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

  const statusConfig: Record<
    ReturnStatus,
    {
      label: string;
      variant: 'warning' | 'info' | 'success' | 'error' | 'secondary';
      icon: keyof typeof Ionicons.glyphMap;
      color: string;
    }
  > = {
    PENDING: {
      label: 'Pending',
      variant: 'warning',
      icon: 'time',
      color: colors.warning,
    },
    APPROVED: {
      label: 'Approved',
      variant: 'info',
      icon: 'checkmark',
      color: colors.info,
    },
    PROCESSING: {
      label: 'Processing',
      variant: 'info',
      icon: 'sync',
      color: colors.info,
    },
    COMPLETED: {
      label: 'Completed',
      variant: 'success',
      icon: 'checkmark-circle',
      color: colors.success,
    },
    REJECTED: {
      label: 'Rejected',
      variant: 'error',
      icon: 'close-circle',
      color: colors.error,
    },
    CANCELLED: {
      label: 'Cancelled',
      variant: 'secondary',
      icon: 'ban',
      color: colors.textSecondary,
    },
  };

  const refundStatusConfig: Record<RefundStatus, { label: string; color: string }> = {
    PENDING: { label: 'Refund Pending', color: colors.warning },
    PROCESSING: { label: 'Refund Processing', color: colors.info },
    COMPLETED: { label: 'Refunded', color: colors.success },
    FAILED: { label: 'Refund Failed', color: colors.error },
  };

  const config = statusConfig[returnRequest.status];
  const refundConfig = refundStatusConfig[returnRequest.refundStatus];

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 40)
        .springify()
        .damping(15)}
      style={animatedStyle}
    >
      <Pressable
        style={[
          styles.returnCard,
          {
            backgroundColor: isDark ? colors.surface : colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() => onViewDetails(returnRequest)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Header */}
        <View style={styles.returnHeader}>
          <View style={styles.returnHeaderLeft}>
            <View style={[styles.returnIconContainer, { backgroundColor: `${config.color}15` }]}>
              <Ionicons color={config.color} name={config.icon} size={18} />
            </View>
            <View>
              <Text style={[styles.rmaNumber, { color: colors.text }]}>
                {returnRequest.rmaNumber || returnRequest.orderNumber}
              </Text>
              <Text style={[styles.orderNumber, { color: colors.textTertiary }]}>
                Order: {returnRequest.orderNumber}
              </Text>
            </View>
          </View>
          <Text style={[styles.returnTotal, { color: colors.text }]}>
            {formatCurrency(returnRequest.refundAmount)}
          </Text>
        </View>

        {/* Customer Info */}
        <View style={styles.customerRow}>
          <View style={[styles.customerAvatar, { backgroundColor: `${colors.primary}15` }]}>
            <Text style={[styles.customerInitial, { color: colors.primary }]}>
              {returnRequest.customerName?.[0] || 'C'}
            </Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={[styles.customerName, { color: colors.text }]}>
              {returnRequest.customerName}
            </Text>
            <Text numberOfLines={1} style={[styles.reasonText, { color: colors.textSecondary }]}>
              {REASON_DISPLAY[returnRequest.reason as keyof typeof REASON_DISPLAY] ||
                returnRequest.reason}
            </Text>
          </View>
        </View>

        {/* Status Badges */}
        <View style={styles.badgesRow}>
          <Badge label={config.label} size="sm" variant={config.variant} />
          <View style={[styles.refundBadge, { backgroundColor: `${refundConfig.color}15` }]}>
            <Text style={[styles.refundBadgeText, { color: refundConfig.color }]}>
              {refundConfig.label}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.returnFooter, { borderTopColor: colors.border }]}>
          <View style={styles.dateInfo}>
            <Ionicons color={colors.textSecondary} name="calendar-outline" size={14} />
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {formatRelativeTime(returnRequest.createdAt)}
            </Text>
          </View>
          <View style={styles.actionButtons}>
            {returnRequest.status === 'PENDING' ? (
              <>
                <Pressable
                  hitSlop={8}
                  style={[styles.iconButton, { backgroundColor: `${colors.success}15` }]}
                  onPress={() => onApprove(returnRequest.id)}
                >
                  <Ionicons color={colors.success} name="checkmark" size={18} />
                </Pressable>
                <Pressable
                  hitSlop={8}
                  style={[styles.iconButton, { backgroundColor: `${colors.error}15` }]}
                  onPress={() => onReject(returnRequest.id)}
                >
                  <Ionicons color={colors.error} name="close" size={18} />
                </Pressable>
              </>
            ) : null}
            <Pressable
              hitSlop={8}
              style={[styles.actionButton, { backgroundColor: `${colors.primary}10` }]}
              onPress={() => onViewDetails(returnRequest)}
            >
              <Text style={[styles.actionButtonText, { color: colors.primary }]}>Details</Text>
              <Ionicons color={colors.primary} name="chevron-forward" size={14} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ReturnsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const { currentTenant } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch returns
  const {
    data: returns = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: currentTenant ? ['returns', currentTenant.id] : ['returns'],
    queryFn: async (): Promise<ReturnRequest[]> => {
      // TODO: Replace with actual API call
      // const response = await returnsApi.list();
      // return response.data;

      // Mock data for now
      return [
        {
          id: '1',
          rmaNumber: 'RMA-001234',
          orderNumber: 'ORD-5678',
          customerId: 'c1',
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          reason: 'DEFECTIVE',
          status: 'PENDING',
          refundStatus: 'PENDING',
          items: [{ id: 'i1', productName: 'Wireless Headphones', quantity: 1, price: 149.99 }],
          totalAmount: 149.99,
          refundAmount: 149.99,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          rmaNumber: 'RMA-001235',
          orderNumber: 'ORD-5679',
          customerId: 'c2',
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          reason: 'WRONG_SIZE',
          status: 'APPROVED',
          refundStatus: 'PROCESSING',
          items: [{ id: 'i2', productName: 'Running Shoes', quantity: 1, price: 89.99 }],
          totalAmount: 89.99,
          refundAmount: 89.99,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          rmaNumber: 'RMA-001236',
          orderNumber: 'ORD-5680',
          customerId: 'c3',
          customerName: 'Bob Wilson',
          customerEmail: 'bob@example.com',
          reason: 'DAMAGED',
          status: 'COMPLETED',
          refundStatus: 'COMPLETED',
          items: [{ id: 'i3', productName: 'Glass Vase', quantity: 2, price: 45.0 }],
          totalAmount: 90.0,
          refundAmount: 90.0,
          createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '4',
          rmaNumber: 'RMA-001237',
          orderNumber: 'ORD-5681',
          customerId: 'c4',
          customerName: 'Alice Brown',
          customerEmail: 'alice@example.com',
          reason: 'CHANGED_MIND',
          status: 'REJECTED',
          refundStatus: 'FAILED',
          items: [{ id: 'i4', productName: 'Designer Bag', quantity: 1, price: 299.99 }],
          totalAmount: 299.99,
          refundAmount: 0,
          createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        },
      ];
    },
    enabled: !!currentTenant,
  });

  const filteredReturns = useMemo(() => {
    let filtered = returns;

    if (activeStatus !== 'all') {
      filtered = filtered.filter((r) => r.status === activeStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.rmaNumber.toLowerCase().includes(query) ||
          r.orderNumber.toLowerCase().includes(query) ||
          r.customerName.toLowerCase().includes(query) ||
          r.customerEmail.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [returns, activeStatus, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleApprove = useCallback((returnId: string) => {
    Alert.alert('Approve Return', 'Are you sure you want to approve this return request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: () => {
          // TODO: Call API to approve return
          Alert.alert('Success', 'Return request approved!');
        },
      },
    ]);
  }, []);

  const handleReject = useCallback((returnId: string) => {
    Alert.alert('Reject Return', 'Are you sure you want to reject this return request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          // TODO: Call API to reject return
          Alert.alert('Rejected', 'Return request has been rejected.');
        },
      },
    ]);
  }, []);

  const handleViewDetails = useCallback((returnRequest: ReturnRequest) => {
    const reason =
      REASON_DISPLAY[returnRequest.reason as keyof typeof REASON_DISPLAY] || returnRequest.reason;
    Alert.alert(
      'Return Details',
      `RMA: ${returnRequest.rmaNumber}\nOrder: ${returnRequest.orderNumber}\nCustomer: ${returnRequest.customerName}\nReason: ${reason}\nAmount: ${formatCurrency(returnRequest.refundAmount)}\nStatus: ${returnRequest.status}`
    );
  }, []);

  const renderReturn = useCallback(
    ({ item, index }: { item: ReturnRequest; index: number }) => (
      <ReturnCard
        index={index}
        returnRequest={item}
        onApprove={handleApprove}
        onReject={handleReject}
        onViewDetails={handleViewDetails}
      />
    ),
    [handleApprove, handleReject, handleViewDetails]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons color={colors.text} name="arrow-back" size={24} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Returns & Refunds</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Stats */}
        <StatsCards returns={returns} />

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
            placeholder="Search returns..."
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
            {RETURN_STATUSES.map((status) => (
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

      {/* Returns List */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              borderRadius={16}
              height={180}
              style={{ marginBottom: 12 }}
              width="100%"
            />
          ))}
        </ScrollView>
      ) : filteredReturns.length === 0 ? (
        <EmptyState
          actionLabel={searchQuery ? 'Clear Search' : undefined}
          description={
            searchQuery
              ? 'Try adjusting your search or filters'
              : 'Return requests will appear here when customers request refunds'
          }
          icon="refresh-outline"
          title={searchQuery ? 'No returns found' : 'No return requests'}
          onAction={searchQuery ? () => setSearchQuery('') : undefined}
        />
      ) : (
        <FlatList
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
          data={filteredReturns}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.primary}
              onRefresh={onRefresh}
            />
          }
          renderItem={renderReturn}
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
  returnCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  returnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  returnHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  returnIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rmaNumber: {
    ...typography.bodyMedium,
  },
  orderNumber: {
    ...typography.micro,
    marginTop: 2,
  },
  returnTotal: {
    ...typography.title3,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
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
  reasonText: {
    ...typography.micro,
    marginTop: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  refundBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  refundBadgeText: {
    ...typography.micro,
    fontWeight: '600',
  },
  returnFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    ...typography.caption,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
