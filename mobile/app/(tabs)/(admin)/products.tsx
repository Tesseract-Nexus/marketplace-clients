import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Image,
  TextInput,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
  Layout,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { Button, IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils/formatting';
import { productsApi } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/constants';
import { typography, gradients } from '@/lib/design/typography';
import { useAuthStore } from '@/stores/auth-store';
import { CardSkeleton } from '@/components/premium';
import { springs, shadows, premiumGradients } from '@/lib/design/animations';
import type { Product } from '@/types/entities';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;

const FILTERS = [
  { id: 'all', label: 'All', icon: 'apps' as const },
  { id: 'active', label: 'Active', icon: 'checkmark-circle' as const },
  { id: 'draft', label: 'Draft', icon: 'document' as const },
  { id: 'low-stock', label: 'Low Stock', icon: 'alert-circle' as const },
  { id: 'out-of-stock', label: 'Out', icon: 'close-circle' as const },
] as const;

// Premium Product Card Component
function ProductCard({
  product,
  index,
  viewMode,
}: {
  product: Product;
  index: number;
  viewMode: 'list' | 'grid';
}) {
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
      transform: [
        { scale: scale.value },
        { translateY: translateY.value },
      ] as any,
    };
  });

  const stockStatus =
    product.inventory_quantity === 0
      ? 'out-of-stock'
      : product.inventory_quantity <= (product.low_stock_threshold || 10)
      ? 'low-stock'
      : 'in-stock';

  const statusConfig = {
    'in-stock': {
      label: 'In Stock',
      variant: 'success' as const,
      color: colors.success,
      bgColor: colors.successLight,
      gradient: premiumGradients.success,
    },
    'low-stock': {
      label: 'Low Stock',
      variant: 'warning' as const,
      color: colors.warning,
      bgColor: colors.warningLight,
      gradient: premiumGradients.warning,
    },
    'out-of-stock': {
      label: 'Out',
      variant: 'error' as const,
      color: colors.error,
      bgColor: colors.errorLight,
      gradient: premiumGradients.error,
    },
  }[stockStatus];

  if (viewMode === 'grid') {
    return (
      <Animated.View
        entering={FadeInUp.delay(index * 50).springify().damping(14)}
        layout={Layout.springify()}
        style={[styles.gridCardWrapper, animatedStyle]}
      >
        <Pressable
          style={[
            styles.gridCard,
            {
              backgroundColor: isDark ? colors.surface : colors.card,
              borderColor: colors.border,
            },
            shadows.md,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push(`/(tabs)/(admin)/product-detail?id=${product.id}`);
          }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {/* Image */}
          <View style={styles.gridImageContainer}>
            <Image
              source={{
                uri: product.images?.[0]?.url || 'https://via.placeholder.com/200',
              }}
              style={styles.gridImage}
            />
            {/* Status Badge */}
            <View style={styles.gridStatusBadge}>
              <LinearGradient
                colors={[...statusConfig.gradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statusGradient}
              >
                <View style={styles.statusDot} />
              </LinearGradient>
            </View>
            {/* Overlay gradient for text readability */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)']}
              style={styles.imageOverlay}
            />
          </View>

          {/* Info */}
          <View style={styles.gridInfo}>
            <Text
              style={[styles.gridProductName, { color: colors.text }]}
              numberOfLines={2}
            >
              {product.name}
            </Text>
            <Text style={[styles.gridSku, { color: colors.textTertiary }]}>
              {product.sku || 'No SKU'}
            </Text>
            <View style={styles.gridPriceRow}>
              <Text style={[styles.gridPrice, { color: colors.primary }]}>
                {formatCurrency(product.price)}
              </Text>
              <View style={[styles.stockBadge, { backgroundColor: `${statusConfig.color}15` }]}>
                <Text style={[styles.gridStock, { color: statusConfig.color }]}>
                  {product.inventory_quantity}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50).springify().damping(14)}
      layout={Layout.springify()}
      style={animatedStyle}
    >
      <Pressable
        style={[
          styles.listCard,
          {
            backgroundColor: isDark ? colors.surface : colors.card,
            borderColor: colors.border,
          },
          shadows.md,
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push(`/(tabs)/(admin)/product-detail?id=${product.id}`);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Image */}
        <View style={styles.listImageContainer}>
          <Image
            source={{
              uri: product.images?.[0]?.url || 'https://via.placeholder.com/100',
            }}
            style={styles.listImage}
          />
          {/* Floating status indicator */}
          <View style={[styles.listStatusIndicator, { backgroundColor: statusConfig.color }]} />
        </View>

        {/* Info */}
        <View style={styles.listInfo}>
          <View style={styles.listHeader}>
            <Text
              style={[styles.listProductName, { color: colors.text }]}
              numberOfLines={1}
            >
              {product.name}
            </Text>
            <Badge label={statusConfig.label} variant={statusConfig.variant} size="sm" />
          </View>
          <Text style={[styles.listSku, { color: colors.textTertiary }]}>
            SKU: {product.sku || 'N/A'}
          </Text>
          <View style={styles.listFooter}>
            <Text style={[styles.listPrice, { color: colors.primary }]}>
              {formatCurrency(product.price)}
            </Text>
            <View style={styles.stockInfo}>
              <Ionicons name="cube-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.listStock, { color: colors.textSecondary }]}>
                {product.inventory_quantity} units
              </Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <Pressable
          style={styles.menuButton}
          hitSlop={8}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

// Premium Stats Component with Floating Effect
function ProductStats({
  total,
  active,
  lowStock,
}: {
  total: number;
  active: number;
  lowStock: number;
}) {
  const colors = useColors();
  const isDark = useIsDark();

  return (
    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsContainer}>
      <Animated.View
        entering={FadeInDown.delay(150).springify()}
        style={[
          styles.statItem,
          { backgroundColor: isDark ? colors.surface : `${colors.primary}08` },
          shadows.sm,
        ]}
      >
        <LinearGradient
          colors={[...premiumGradients.cosmic]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.statIconBg}
        >
          <Ionicons name="cube" size={16} color="#FFFFFF" />
        </LinearGradient>
        <Text style={[styles.statValue, { color: colors.text }]}>{total}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(200).springify()}
        style={[
          styles.statItem,
          { backgroundColor: isDark ? colors.surface : `${colors.success}08` },
          shadows.sm,
        ]}
      >
        <View style={[styles.statIconBgSolid, { backgroundColor: `${colors.success}20` }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>{active}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(250).springify()}
        style={[
          styles.statItem,
          { backgroundColor: isDark ? colors.surface : `${colors.warning}08` },
          shadows.sm,
        ]}
      >
        <View style={[styles.statIconBgSolid, { backgroundColor: `${colors.warning}20` }]}>
          <Ionicons name="alert-circle" size={16} color={colors.warning} />
        </View>
        <Text style={[styles.statValue, { color: colors.text }]}>{lowStock}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Low</Text>
      </Animated.View>
    </Animated.View>
  );
}

// Premium Filter Chip
function FilterChip({
  filter,
  isActive,
  onPress
}: {
  filter: typeof FILTERS[number];
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
          name={filter.icon}
          size={14}
          color={isActive ? '#FFFFFF' : colors.textSecondary}
        />
        <Text
          style={[
            styles.filterText,
            { color: isActive ? '#FFFFFF' : colors.textSecondary },
          ]}
        >
          {filter.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// Premium View Toggle
function ViewToggle({
  viewMode,
  onToggle
}: {
  viewMode: 'list' | 'grid';
  onToggle: (mode: 'list' | 'grid') => void;
}) {
  const colors = useColors();

  return (
    <View style={[styles.viewToggle, { backgroundColor: colors.surface }, shadows.sm]}>
      <Pressable
        style={[
          styles.viewToggleButton,
          viewMode === 'list' && {
            backgroundColor: colors.primary,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle('list');
        }}
      >
        <Ionicons
          name="list"
          size={18}
          color={viewMode === 'list' ? '#FFFFFF' : colors.textSecondary}
        />
      </Pressable>
      <Pressable
        style={[
          styles.viewToggleButton,
          viewMode === 'grid' && {
            backgroundColor: colors.primary,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle('grid');
        }}
      >
        <Ionicons
          name="grid"
          size={18}
          color={viewMode === 'grid' ? '#FFFFFF' : colors.textSecondary}
        />
      </Pressable>
    </View>
  );
}

export default function ProductsScreen() {
  const router = useRouter();
  const { filter: initialFilter } = useLocalSearchParams<{ filter?: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const isDark = useIsDark();
  const { currentTenant } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(initialFilter || 'all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch products with infinite scroll using real API
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: currentTenant
      ? [...QUERY_KEYS.PRODUCTS(currentTenant.id), activeFilter, searchQuery]
      : ['products', activeFilter, searchQuery],
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
        } else if (activeFilter === 'draft') {
          params.status = 'draft';
        }

        console.log('[Products] Fetching products with params:', params);
        const response = await productsApi.list(params);

        const productsArray = (response as any).data || [];
        const pagination = (response as any).pagination || {};
        const totalPages = pagination.totalPages || Math.ceil((pagination.total || productsArray.length) / 20);

        console.log('[Products] Fetched', productsArray.length, 'products, page', pageParam, 'of', totalPages);

        const products: Product[] = productsArray.map((p: any) => ({
          id: p.id,
          tenant_id: p.tenantId || p.tenant_id || currentTenant?.id,
          name: p.name,
          slug: p.slug,
          description: p.description || '',
          price: parseFloat(p.price?.toString() || '0'),
          compare_at_price: p.compareAtPrice ? parseFloat(p.compareAtPrice.toString()) : null,
          cost_price: p.costPrice ? parseFloat(p.costPrice.toString()) : null,
          sku: p.sku || null,
          barcode: p.barcode || null,
          inventory_quantity: p.stock ?? p.inventory_quantity ?? p.inventoryQuantity ?? 0,
          low_stock_threshold: p.lowStockThreshold || p.low_stock_threshold || 10,
          track_inventory: p.trackInventory ?? p.track_inventory ?? true,
          status: p.status || 'active',
          images: p.images?.map((img: any, idx: number) => ({
            id: img.id || `${p.id}-img-${idx}`,
            url: img.url || img.imageUrl || img,
            alt: img.alt || p.name,
            position: img.position || idx,
          })) || [],
          variants: p.variants || [],
          created_at: p.createdAt || p.created_at || new Date().toISOString(),
          updated_at: p.updatedAt || p.updated_at || new Date().toISOString(),
        }));

        return {
          products,
          page: pageParam,
          totalPages,
        };
      } catch (error) {
        console.error('[Products] Error fetching products:', error);
        return { products: [], page: pageParam, totalPages: 1 };
      }
    },
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: !!currentTenant,
  });

  const products = useMemo(() => {
    return data?.pages.flatMap((page) => page.products) || [];
  }, [data]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (activeFilter !== 'all') {
      filtered = filtered.filter((p) => {
        switch (activeFilter) {
          case 'active':
            return p.status === 'active';
          case 'draft':
            return p.status === 'draft';
          case 'low-stock':
            return (
              p.inventory_quantity <= (p.low_stock_threshold || 10) &&
              p.inventory_quantity > 0
            );
          case 'out-of-stock':
            return p.inventory_quantity === 0;
          default:
            return true;
        }
      });
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, activeFilter, searchQuery]);

  const stats = useMemo(
    () => ({
      total: products.length,
      active: products.filter((p) => p.status === 'active').length,
      lowStock: products.filter(
        (p) =>
          p.inventory_quantity <= (p.low_stock_threshold || 10) &&
          p.inventory_quantity > 0
      ).length,
    }),
    [products]
  );

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

  const renderProduct = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <ProductCard product={item} index={index} viewMode={viewMode} />
    ),
    [viewMode]
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
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
        <Animated.View
          entering={FadeInDown.springify()}
          style={styles.headerTop}
        >
          <Text style={[styles.title, { color: colors.text }]}>Products</Text>
          <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
        </Animated.View>

        {/* Stats */}
        <ProductStats {...stats} />

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
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSearchQuery('');
              }}
            >
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </Animated.View>

        {/* Filters */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          >
            {FILTERS.map((filter) => (
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

      {/* Product List */}
      {isLoading ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {viewMode === 'grid' ? (
            <View style={styles.gridContainer}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Animated.View
                  key={i}
                  entering={FadeInDown.delay(i * 80).springify()}
                  style={styles.gridSkeletonWrapper}
                >
                  <CardSkeleton />
                </Animated.View>
              ))}
            </View>
          ) : (
            [1, 2, 3, 4, 5].map((i) => (
              <Animated.View
                key={i}
                entering={FadeInDown.delay(i * 80).springify()}
                style={{ marginBottom: 12 }}
              >
                <CardSkeleton />
              </Animated.View>
            ))
          )}
        </ScrollView>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon="cube-outline"
          title={searchQuery ? 'No products found' : 'No products yet'}
          description={
            searchQuery
              ? 'Try adjusting your search or filters'
              : 'Add your first product to start selling'
          }
          actionLabel={searchQuery ? 'Clear Search' : 'Add Product'}
          onAction={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            searchQuery
              ? setSearchQuery('')
              : router.push('/(tabs)/(admin)/add-product');
          }}
        />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
        />
      )}

      {/* Floating Action Button */}
      <Animated.View
        entering={FadeInUp.delay(400).springify()}
        style={[styles.fab, { bottom: insets.bottom + 80 }]}
      >
        <Pressable
          style={styles.fabButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            router.push('/(tabs)/(admin)/add-product');
          }}
        >
          <LinearGradient
            colors={[...premiumGradients.cosmic]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </Animated.View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...typography.title1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  viewToggleButton: {
    width: 38,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
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
  statIconBgSolid: {
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridRow: {
    gap: 12,
  },
  gridSkeletonWrapper: {
    width: GRID_CARD_WIDTH,
    height: 200,
    marginBottom: 12,
  },
  // Grid Card Styles
  gridCardWrapper: {
    width: GRID_CARD_WIDTH,
  },
  gridCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gridImageContainer: {
    position: 'relative',
    aspectRatio: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  gridStatusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusGradient: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  gridInfo: {
    padding: 14,
  },
  gridProductName: {
    ...typography.bodyMedium,
    marginBottom: 2,
  },
  gridSku: {
    ...typography.micro,
    marginBottom: 10,
  },
  gridPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridPrice: {
    ...typography.headline,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gridStock: {
    ...typography.captionMedium,
  },
  // List Card Styles
  listCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    gap: 14,
  },
  listImageContainer: {
    width: 76,
    height: 76,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  listImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  listStatusIndicator: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  listInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  listProductName: {
    ...typography.bodyMedium,
    flex: 1,
    marginRight: 8,
  },
  listSku: {
    ...typography.micro,
    marginBottom: 8,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listPrice: {
    ...typography.headline,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listStock: {
    ...typography.caption,
  },
  menuButton: {
    padding: 8,
    alignSelf: 'center',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  // FAB Styles
  fab: {
    position: 'absolute',
    right: 20,
  },
  fabButton: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
