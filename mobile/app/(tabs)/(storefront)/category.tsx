import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api/client';
import { useRefresh } from '../../../hooks/useRefresh';
import { formatCurrency } from '../../../lib/utils/formatting';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_SPACING = 12;
const ITEM_WIDTH = (SCREEN_WIDTH - ITEM_SPACING * (COLUMN_COUNT + 1)) / COLUMN_COUNT;

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  product_count: number;
  children?: Category[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number;
  images: { url: string }[];
  rating: number;
  review_count: number;
  in_stock: boolean;
}

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export default function CategoryScreen() {
  const { id, slug } = useLocalSearchParams<{ id?: string; slug?: string }>();
  const router = useRouter();

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ['category', id || slug],
    queryFn: async () => {
      const endpoint = id ? `/categories/${id}` : `/categories/slug/${slug}`;
      const response = await apiClient.get(endpoint);
      return response.data.data;
    },
    enabled: !!(id || slug),
  });

  const {
    data: productsData,
    isLoading: productsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['category-products', id || slug, sortBy, selectedSubcategory],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '20',
        sort: sortBy,
      });
      if (selectedSubcategory) {
        params.append('category_id', selectedSubcategory);
      } else if (id) {
        params.append('category_id', id);
      }
      const response = await apiClient.get(`/products?${params.toString()}`);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta?.page < lastPage.meta?.total_pages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    enabled: !!(id || slug),
  });

  const { refreshing, onRefresh } = useRefresh({
    onRefresh: refetch,
    minimumDelay: 500,
  });

  const products = productsData?.pages.flatMap((page) => page.data) ?? [];

  const handleProductPress = useCallback(
    (product: Product) => {
      router.push(`/(tabs)/(storefront)/product?id=${product.id}`);
    },
    [router]
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => {
      const discount = item.compare_at_price
        ? Math.round(
            ((item.compare_at_price - item.price) / item.compare_at_price) * 100
          )
        : 0;

      return (
        <TouchableOpacity
          onPress={() => handleProductPress(item)}
          style={{ width: ITEM_WIDTH }}
          className="mb-3"
        >
          <View className="overflow-hidden rounded-xl bg-white shadow-sm">
            <View className="relative">
              <Image
                source={{ uri: item.images[0]?.url }}
                style={{ width: ITEM_WIDTH, height: ITEM_WIDTH }}
                resizeMode="cover"
              />
              {discount > 0 && (
                <View className="absolute left-2 top-2 rounded bg-red-500 px-2 py-1">
                  <Text className="text-xs font-bold text-white">-{discount}%</Text>
                </View>
              )}
              {!item.in_stock && (
                <View className="absolute inset-0 items-center justify-center bg-black/40">
                  <Text className="font-semibold text-white">Out of Stock</Text>
                </View>
              )}
            </View>
            <View className="p-3">
              <Text className="text-sm text-gray-900" numberOfLines={2}>
                {item.name}
              </Text>
              <View className="mt-1 flex-row items-baseline">
                <Text className="font-bold text-indigo-600">
                  {formatCurrency(item.price)}
                </Text>
                {item.compare_at_price && (
                  <Text className="ml-2 text-xs text-gray-400 line-through">
                    {formatCurrency(item.compare_at_price)}
                  </Text>
                )}
              </View>
              {item.review_count > 0 && (
                <View className="mt-1 flex-row items-center">
                  <Ionicons name="star" size={12} color="#fbbf24" />
                  <Text className="ml-1 text-xs text-gray-500">
                    {item.rating.toFixed(1)} ({item.review_count})
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [handleProductPress]
  );

  const renderHeader = useCallback(() => {
    if (!category) return null;

    return (
      <View>
        {/* Category Header */}
        {category.image_url && (
          <Image
            source={{ uri: category.image_url }}
            className="h-40 w-full"
            resizeMode="cover"
          />
        )}

        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-900">{category.name}</Text>
          {category.description && (
            <Text className="mt-1 text-gray-500">{category.description}</Text>
          )}
          <Text className="mt-1 text-sm text-gray-400">
            {category.product_count} products
          </Text>
        </View>

        {/* Subcategories */}
        {category.children && category.children.length > 0 && (
          <View className="mb-4">
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ id: null, name: 'All' }, ...category.children]}
              keyExtractor={(item) => item.id || 'all'}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              ItemSeparatorComponent={() => <View className="w-2" />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setSelectedSubcategory(item.id)}
                  className={`rounded-full px-4 py-2 ${
                    (item.id === null && !selectedSubcategory) ||
                    item.id === selectedSubcategory
                      ? 'bg-indigo-600'
                      : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`font-medium ${
                      (item.id === null && !selectedSubcategory) ||
                      item.id === selectedSubcategory
                        ? 'text-white'
                        : 'text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Sort Bar */}
        <View className="mb-4 flex-row items-center justify-between px-4">
          <Text className="text-gray-500">
            {products.length} {products.length === 1 ? 'result' : 'results'}
          </Text>
          <TouchableOpacity
            onPress={() => setShowSortModal(true)}
            className="flex-row items-center"
          >
            <Ionicons name="swap-vertical-outline" size={18} color="#6b7280" />
            <Text className="ml-1 text-gray-600">
              {sortOptions.find((s) => s.value === sortBy)?.label}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [category, selectedSubcategory, sortBy, products.length]);

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  }, [isFetchingNextPage]);

  const renderEmpty = useCallback(() => {
    if (productsLoading) return null;
    return (
      <View className="flex-1 items-center justify-center py-16">
        <Ionicons name="cube-outline" size={48} color="#d1d5db" />
        <Text className="mt-4 text-lg font-medium text-gray-900">No Products Found</Text>
        <Text className="mt-1 text-center text-gray-500">
          Try adjusting your filters or check back later
        </Text>
      </View>
    );
  }, [productsLoading]);

  if (categoryLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: category?.name || 'Category',
          headerBackTitle: 'Back',
        }}
      />

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        numColumns={COLUMN_COUNT}
        columnWrapperStyle={{
          paddingHorizontal: ITEM_SPACING,
          justifyContent: 'space-between',
        }}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        showsVerticalScrollIndicator={false}
        className="flex-1 bg-gray-50"
      />

      {/* Sort Modal */}
      {showSortModal && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
          className="absolute inset-0 items-center justify-end bg-black/50"
        >
          <View className="w-full rounded-t-3xl bg-white pb-8 pt-4">
            <View className="mb-4 items-center">
              <View className="h-1 w-12 rounded-full bg-gray-300" />
            </View>
            <Text className="mb-4 px-4 text-lg font-semibold text-gray-900">Sort By</Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => {
                  setSortBy(option.value);
                  setShowSortModal(false);
                }}
                className={`flex-row items-center justify-between px-4 py-3 ${
                  sortBy === option.value ? 'bg-indigo-50' : ''
                }`}
              >
                <Text
                  className={`text-base ${
                    sortBy === option.value
                      ? 'font-medium text-indigo-600'
                      : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </Text>
                {sortBy === option.value && (
                  <Ionicons name="checkmark" size={20} color="#4f46e5" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      )}
    </>
  );
}
