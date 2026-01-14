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
import { formatCurrency } from '@/lib/utils/formatting';
import { typography, gradients } from '@/lib/design/typography';
import { useAuthStore } from '@/stores/auth-store';

type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  variantName?: string;
  quantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  unitPrice: number;
  status: StockStatus;
  lastUpdated: string;
  location?: string;
}

const STOCK_FILTERS = [
  { id: 'all', label: 'All', icon: 'apps' as const },
  { id: 'in_stock', label: 'In Stock', icon: 'checkmark-circle' as const },
  { id: 'low_stock', label: 'Low Stock', icon: 'warning' as const },
  { id: 'out_of_stock', label: 'Out of Stock', icon: 'close-circle' as const },
] as const;

// Stats Card Component
function StatsCards({ items }: { items: InventoryItem[] }) {
  const colors = useColors();
  const isDark = useIsDark();

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);
    const lowStock = items.filter(i => i.status === 'low_stock').length;
    const outOfStock = items.filter(i => i.status === 'out_of_stock').length;
    const inventoryValue = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    return { totalItems, totalUnits, lowStock, outOfStock, inventoryValue };
  }, [items]);

  return (
    <Animated.View entering={FadeInDown.delay(100)} style={styles.statsContainer}>
      {/* Inventory Value Card */}
      <LinearGradient
        colors={['#059669', '#10B981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.valueCard}
      >
        <View style={styles.valueIcon}>
          <Ionicons name="cube" size={16} color="rgba(255,255,255,0.9)" />
        </View>
        <Text style={styles.valueLabel}>Inventory Value</Text>
        <Text style={styles.valueAmount}>{formatCurrency(stats.inventoryValue)}</Text>
      </LinearGradient>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View
          style={[
            styles.statItem,
            { backgroundColor: isDark ? colors.surface : colors.infoLight },
          ]}
        >
          <Ionicons name="layers" size={16} color={colors.info} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalUnits}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Units</Text>
        </View>

        <View
          style={[
            styles.statItem,
            { backgroundColor: isDark ? colors.surface : colors.warningLight },
          ]}
        >
          <Ionicons name="warning" size={16} color={colors.warning} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.lowStock}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Low</Text>
        </View>

        <View
          style={[
            styles.statItem,
            { backgroundColor: isDark ? colors.surface : colors.errorLight },
          ]}
        >
          <Ionicons name="alert-circle" size={16} color={colors.error} />
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.outOfStock}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Out</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// Inventory Item Card Component
function InventoryCard({
  item,
  index,
  onAdjustStock,
  onViewDetails,
}: {
  item: InventoryItem;
  index: number;
  onAdjustStock: (item: InventoryItem) => void;
  onViewDetails: (item: InventoryItem) => void;
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

  const statusConfig: Record<StockStatus, { label: string; variant: 'success' | 'warning' | 'error'; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    in_stock: {
      label: 'In Stock',
      variant: 'success',
      icon: 'checkmark-circle',
      color: colors.success,
    },
    low_stock: {
      label: 'Low Stock',
      variant: 'warning',
      icon: 'warning',
      color: colors.warning,
    },
    out_of_stock: {
      label: 'Out of Stock',
      variant: 'error',
      icon: 'close-circle',
      color: colors.error,
    },
  };

  const config = statusConfig[item.status];

  // Calculate stock percentage for visual indicator
  const stockPercentage = Math.min(100, (item.quantity / (item.reorderLevel * 3)) * 100);

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 30).springify().damping(15)}
      style={animatedStyle}
    >
      <Pressable
        style={[
          styles.inventoryCard,
          {
            backgroundColor: isDark ? colors.surface : colors.card,
            borderColor: colors.border,
          },
        ]}
        onPress={() => onViewDetails(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Header */}
        <View style={styles.inventoryHeader}>
          <View style={styles.inventoryHeaderLeft}>
            <View style={[styles.inventoryIconContainer, { backgroundColor: `${config.color}15` }]}>
              <Ionicons name="cube-outline" size={20} color={config.color} />
            </View>
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                {item.productName}
              </Text>
              <Text style={[styles.skuText, { color: colors.textTertiary }]}>
                SKU: {item.sku}
                {item.variantName && ` • ${item.variantName}`}
              </Text>
            </View>
          </View>
          <Badge label={config.label} variant={config.variant} size="sm" />
        </View>

        {/* Stock Level */}
        <View style={styles.stockLevelContainer}>
          <View style={styles.stockLevelHeader}>
            <Text style={[styles.stockLabel, { color: colors.textSecondary }]}>Stock Level</Text>
            <Text style={[styles.stockQuantity, { color: colors.text }]}>
              {item.quantity} units
            </Text>
          </View>
          <View style={[styles.stockBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.stockBarFill,
                {
                  width: `${stockPercentage}%`,
                  backgroundColor: config.color,
                },
              ]}
            />
          </View>
          <View style={styles.stockLevelFooter}>
            <Text style={[styles.reorderText, { color: colors.textSecondary }]}>
              Reorder at: {item.reorderLevel}
            </Text>
            <Text style={[styles.valueText, { color: colors.textSecondary }]}>
              Value: {formatCurrency(item.quantity * item.unitPrice)}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={[styles.inventoryFooter, { borderTopColor: colors.border }]}>
          {item.location && (
            <View style={styles.locationInfo}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                {item.location}
              </Text>
            </View>
          )}
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.adjustButton, { backgroundColor: `${colors.primary}15` }]}
              onPress={() => onAdjustStock(item)}
              hitSlop={8}
            >
              <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
              <Text style={[styles.adjustButtonText, { color: colors.primary }]}>
                Adjust
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function InventoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const { currentTenant } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch inventory items
  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: currentTenant ? ['inventory', currentTenant.id] : ['inventory'],
    queryFn: async (): Promise<InventoryItem[]> => {
      // TODO: Replace with actual API call
      // const response = await inventoryApi.list();
      // return response.data;

      // Mock data for now
      return [
        {
          id: '1',
          productId: 'p1',
          productName: 'Premium Wireless Headphones',
          sku: 'WH-001',
          quantity: 45,
          reorderLevel: 20,
          reorderQuantity: 50,
          unitPrice: 149.99,
          status: 'in_stock',
          lastUpdated: new Date().toISOString(),
          location: 'Warehouse A',
        },
        {
          id: '2',
          productId: 'p2',
          productName: 'Bluetooth Speaker Mini',
          sku: 'BS-002',
          variantName: 'Black',
          quantity: 12,
          reorderLevel: 15,
          reorderQuantity: 30,
          unitPrice: 49.99,
          status: 'low_stock',
          lastUpdated: new Date().toISOString(),
          location: 'Warehouse A',
        },
        {
          id: '3',
          productId: 'p3',
          productName: 'USB-C Charging Cable',
          sku: 'CC-003',
          quantity: 0,
          reorderLevel: 50,
          reorderQuantity: 100,
          unitPrice: 12.99,
          status: 'out_of_stock',
          lastUpdated: new Date().toISOString(),
          location: 'Warehouse B',
        },
        {
          id: '4',
          productId: 'p4',
          productName: 'Smart Watch Pro',
          sku: 'SW-004',
          variantName: 'Silver 44mm',
          quantity: 8,
          reorderLevel: 10,
          reorderQuantity: 25,
          unitPrice: 299.99,
          status: 'low_stock',
          lastUpdated: new Date().toISOString(),
          location: 'Warehouse A',
        },
        {
          id: '5',
          productId: 'p5',
          productName: 'Laptop Stand Adjustable',
          sku: 'LS-005',
          quantity: 67,
          reorderLevel: 25,
          reorderQuantity: 50,
          unitPrice: 79.99,
          status: 'in_stock',
          lastUpdated: new Date().toISOString(),
          location: 'Warehouse B',
        },
        {
          id: '6',
          productId: 'p6',
          productName: 'Wireless Mouse Ergonomic',
          sku: 'WM-006',
          variantName: 'White',
          quantity: 0,
          reorderLevel: 30,
          reorderQuantity: 60,
          unitPrice: 39.99,
          status: 'out_of_stock',
          lastUpdated: new Date().toISOString(),
          location: 'Warehouse A',
        },
      ];
    },
    enabled: !!currentTenant,
  });

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(i => i.status === activeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        i =>
          i.productName.toLowerCase().includes(query) ||
          i.sku.toLowerCase().includes(query) ||
          (i.variantName && i.variantName.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [items, activeFilter, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAdjustStock = useCallback((item: InventoryItem) => {
    Alert.alert(
      'Adjust Stock',
      `Current stock for ${item.productName}: ${item.quantity} units`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add Stock',
          onPress: () => {
            Alert.prompt(
              'Add Stock',
              'Enter quantity to add:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Add',
                  onPress: (qty) => {
                    if (qty && !isNaN(parseInt(qty))) {
                      // TODO: Call API to update stock
                      Alert.alert('Success', `Added ${qty} units to ${item.productName}`);
                    }
                  },
                },
              ],
              'plain-text',
              '',
              'number-pad'
            );
          },
        },
        {
          text: 'Remove Stock',
          style: 'destructive',
          onPress: () => {
            Alert.prompt(
              'Remove Stock',
              'Enter quantity to remove:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: (qty) => {
                    if (qty && !isNaN(parseInt(qty))) {
                      // TODO: Call API to update stock
                      Alert.alert('Success', `Removed ${qty} units from ${item.productName}`);
                    }
                  },
                },
              ],
              'plain-text',
              '',
              'number-pad'
            );
          },
        },
      ]
    );
  }, []);

  const handleViewDetails = useCallback((item: InventoryItem) => {
    router.push(`/(tabs)/(admin)/product-detail?id=${item.productId}`);
  }, [router]);

  const renderItem = useCallback(
    ({ item, index }: { item: InventoryItem; index: number }) => (
      <InventoryCard
        item={item}
        index={index}
        onAdjustStock={handleAdjustStock}
        onViewDetails={handleViewDetails}
      />
    ),
    [handleAdjustStock, handleViewDetails]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTop}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: colors.text }]}>Inventory</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => Alert.alert('Coming Soon', 'Bulk import feature coming soon!')}
          >
            <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
          </Pressable>
        </View>

        {/* Stats */}
        <StatsCards items={items} />

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
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products or SKU..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </Animated.View>

        {/* Stock Filters */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {STOCK_FILTERS.map(filter => (
              <Pressable
                key={filter.id}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      activeFilter === filter.id ? colors.primary : colors.surface,
                    borderColor:
                      activeFilter === filter.id ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveFilter(filter.id)}
              >
                <Ionicons
                  name={filter.icon}
                  size={14}
                  color={activeFilter === filter.id ? '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.filterText,
                    { color: activeFilter === filter.id ? '#FFFFFF' : colors.textSecondary },
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Inventory List */}
      {isLoading ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {[1, 2, 3, 4].map(i => (
            <Skeleton
              key={i}
              width="100%"
              height={160}
              borderRadius={16}
              style={{ marginBottom: 12 }}
            />
          ))}
        </ScrollView>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title={searchQuery ? 'No items found' : 'No inventory items'}
          description={
            searchQuery
              ? 'Try adjusting your search or filters'
              : 'Your inventory will appear here once you add products'
          }
          actionLabel={searchQuery ? 'Clear Search' : undefined}
          onAction={searchQuery ? () => setSearchQuery('') : undefined}
        />
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
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
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title2,
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: 16,
  },
  valueCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  valueIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  valueLabel: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  valueAmount: {
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
  inventoryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  inventoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  inventoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  inventoryIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    ...typography.bodyMedium,
  },
  skuText: {
    ...typography.micro,
    marginTop: 2,
  },
  stockLevelContainer: {
    marginBottom: 14,
  },
  stockLevelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stockLabel: {
    ...typography.caption,
  },
  stockQuantity: {
    ...typography.bodyMedium,
  },
  stockBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  stockBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stockLevelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  reorderText: {
    ...typography.micro,
  },
  valueText: {
    ...typography.micro,
  },
  inventoryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    ...typography.caption,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  adjustButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  adjustButtonText: {
    ...typography.captionMedium,
  },
});
