import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Image,
  TextInput,
  Dimensions,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, Layout } from 'react-native-reanimated';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useColors } from '@/providers/ThemeProvider';
import { useCartStore } from '@/stores/cart-store';
import { PressableCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatCurrency } from '@/lib/utils/formatting';
import { QUERY_KEYS } from '@/lib/constants';
import type { Product } from '@/types/entities';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  productCount: number;
}

const SORT_OPTIONS = [
  { id: 'popular', label: 'Popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'price_low', label: 'Price: Low to High' },
  { id: 'price_high', label: 'Price: High to Low' },
] as const;

function ProductCard({ product, index }: { product: Product; index: number }) {
  const colors = useColors();
  const router = useRouter();
  const { addItem } = useCartStore();

  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 30)}
      layout={Layout.springify()}
    >
      <PressableCard
        style={styles.productCard}
        onPress={() => router.push(`/(tabs)/(storefront)/product?id=${product.id}`)}
      >
        <View style={styles.productImageContainer}>
          <Image
            source={{ uri: product.images?.[0]?.url || 'https://via.placeholder.com/200' }}
            style={styles.productImage}
          />
          {discount > 0 && (
            <Badge
              label={`-${discount}%`}
              variant="error"
              size="sm"
              style={styles.discountBadge}
            />
          )}
          <Pressable
            style={[styles.wishlistButton, { backgroundColor: colors.background }]}
            onPress={() => {}}
          >
            <Ionicons name="heart-outline" size={18} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.productPrice, { color: colors.primary }]}>
              {formatCurrency(product.price)}
            </Text>
            {product.compare_at_price && (
              <Text style={[styles.comparePrice, { color: colors.textTertiary }]}>
                {formatCurrency(product.compare_at_price)}
              </Text>
            )}
          </View>
          {product.inventory_quantity <= 5 && product.inventory_quantity > 0 && (
            <Text style={[styles.lowStock, { color: colors.warning }]}>
              Only {product.inventory_quantity} left!
            </Text>
          )}
        </View>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => addItem(product, undefined, 1)}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
        </Pressable>
      </PressableCard>
    </Animated.View>
  );
}

export default function BrowseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: [QUERY_KEYS.CATEGORIES],
    queryFn: async (): Promise<Category[]> => {
      return [
        { id: 'all', name: 'All', productCount: 234 },
        { id: 'clothing', name: 'Clothing', productCount: 124 },
        { id: 'shoes', name: 'Shoes', productCount: 89 },
        { id: 'accessories', name: 'Accessories', productCount: 56 },
        { id: 'electronics', name: 'Electronics', productCount: 78 },
        { id: 'home', name: 'Home', productCount: 92 },
      ];
    },
  });

  // Fetch products
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: [QUERY_KEYS.PRODUCTS, selectedCategory, sortBy, searchQuery],
    queryFn: async ({ pageParam = 1 }) => {
      const mockProducts: Product[] = Array.from({ length: 10 }, (_, i) => ({
        id: `browse-${pageParam}-${i}`,
        tenant_id: '1',
        name: `Product ${(pageParam - 1) * 10 + i + 1}`,
        slug: `product-${(pageParam - 1) * 10 + i + 1}`,
        description: 'Product description',
        price: Math.floor(Math.random() * 150) + 20,
        compare_at_price: i % 3 === 0 ? Math.floor(Math.random() * 50) + 150 : undefined,
        cost_price: 10,
        sku: `SKU-${(pageParam - 1) * 10 + i + 1}`,
        barcode: null,
        inventory_quantity: Math.floor(Math.random() * 50),
        low_stock_threshold: 5,
        track_inventory: true,
        status: 'active',
        images: [{ id: '1', url: `https://picsum.photos/seed/browse${pageParam}${i}/400`, alt: '', position: 0 }],
        variants: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      return {
        products: mockProducts,
        page: pageParam,
        totalPages: 5,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const products = useMemo(() => {
    return data?.pages.flatMap((page) => page.products) || [];
  }, [data]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(query));
  }, [products, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
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
      <ProductCard product={item} index={index} />
    ),
    []
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.loadingMore}>
        <Skeleton width={100} height={20} borderRadius={10} />
      </View>
    );
  }, [isFetchingNextPage]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.background }]}>
        <Animated.View entering={FadeInDown}>
          <Text style={[styles.title, { color: colors.text }]}>Browse</Text>
        </Animated.View>

        {/* Search */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          style={[styles.searchContainer, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
          <View style={[styles.searchDivider, { backgroundColor: colors.border }]} />
          <Pressable onPress={() => setShowFilters(!showFilters)}>
            <Ionicons name="options" size={20} color={colors.textSecondary} />
          </Pressable>
        </Animated.View>

        {/* Categories */}
        <Animated.View entering={FadeInDown.delay(150)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories?.map((category) => (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      (selectedCategory === category.id || (category.id === 'all' && !selectedCategory))
                        ? colors.primary
                        : colors.surface,
                    borderColor:
                      (selectedCategory === category.id || (category.id === 'all' && !selectedCategory))
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(category.id === 'all' ? null : category.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color:
                        (selectedCategory === category.id || (category.id === 'all' && !selectedCategory))
                          ? '#FFFFFF'
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Sort Options */}
        {showFilters && (
          <Animated.View entering={FadeInDown} style={styles.filtersSection}>
            <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Sort by</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sortContainer}
            >
              {SORT_OPTIONS.map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.sortChip,
                    {
                      backgroundColor: sortBy === option.id ? colors.primary : colors.surface,
                      borderColor: sortBy === option.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSortBy(option.id)}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      { color: sortBy === option.id ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}
      </View>

      {/* Products Grid */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <View style={styles.productsGrid}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} width={(SCREEN_WIDTH - 52) / 2} height={240} borderRadius={12} />
            ))}
          </View>
        </ScrollView>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No products found"
          description="Try adjusting your search or browse different categories"
          actionLabel="Clear filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory(null);
          }}
        />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
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
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
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
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  searchDivider: {
    width: 1,
    height: 24,
  },
  categoriesContainer: {
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filtersSection: {
    marginTop: 12,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  sortContainer: {
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  columnWrapper: {
    gap: 12,
  },
  productCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    padding: 0,
    overflow: 'hidden',
  },
  productImageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: 12,
    paddingBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  comparePrice: {
    fontSize: 13,
    textDecorationLine: 'line-through',
  },
  lowStock: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
