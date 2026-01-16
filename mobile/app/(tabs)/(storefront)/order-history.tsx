import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api/client';
import { useRefresh } from '../../../hooks/useRefresh';
import { formatCurrency, formatRelativeTime } from '../../../lib/utils/formatting';

interface OrderItem {
  id: string;
  product_name: string;
  image_url: string;
  quantity: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  items: OrderItem[];
  items_count: number;
  created_at: string;
}

type OrderFilter = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800' },
  processing: { bg: 'bg-purple-100', text: 'text-purple-800' },
  shipped: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  delivered: { bg: 'bg-green-100', text: 'text-green-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

const filters: { value: OrderFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function OrderHistoryScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<OrderFilter>('all');

  const {
    data: ordersData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['my-orders', activeFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: '20',
      });
      if (activeFilter !== 'all') {
        params.append('status', activeFilter);
      }
      const response = await apiClient.get(`/customers/me/orders?${params.toString()}`);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.meta?.page < lastPage.meta?.total_pages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  const { refreshing, onRefresh } = useRefresh({
    onRefresh: refetch,
    minimumDelay: 500,
  });

  const orders = ordersData?.pages.flatMap((page) => page.data) ?? [];

  const handleOrderPress = useCallback(
    (order: Order) => {
      router.push(`/(tabs)/(storefront)/order-tracking?id=${order.id}`);
    },
    [router]
  );

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderOrder = useCallback(
    ({ item }: { item: Order }) => {
      const statusStyle = statusColors[item.status] || statusColors.pending;
      const displayItems = item.items.slice(0, 3);
      const moreCount = item.items_count - displayItems.length;

      return (
        <TouchableOpacity
          className="mx-4 mb-4 rounded-xl bg-white p-4 shadow-sm"
          onPress={() => handleOrderPress(item)}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-semibold text-gray-900">#{item.order_number}</Text>
              <Text className="text-sm text-gray-500">{formatRelativeTime(item.created_at)}</Text>
            </View>
            <View className={`rounded-full px-3 py-1 ${statusStyle.bg}`}>
              <Text className={`text-xs font-medium capitalize ${statusStyle.text}`}>
                {item.status}
              </Text>
            </View>
          </View>

          {/* Items Preview */}
          <View className="mt-4 flex-row">
            {displayItems.map((orderItem, index) => (
              <View key={orderItem.id} className="mr-2" style={{ marginLeft: index > 0 ? -16 : 0 }}>
                <Image
                  className="h-14 w-14 rounded-lg border-2 border-white"
                  source={{ uri: orderItem.image_url }}
                />
              </View>
            ))}
            {moreCount > 0 ? (
              <View
                className="h-14 w-14 items-center justify-center rounded-lg border-2 border-white bg-gray-100"
                style={{ marginLeft: -16 }}
              >
                <Text className="text-sm font-medium text-gray-600">+{moreCount}</Text>
              </View>
            ) : null}
          </View>

          {/* Footer */}
          <View className="mt-4 flex-row items-center justify-between border-t border-gray-100 pt-3">
            <Text className="text-gray-500">
              {item.items_count} item{item.items_count !== 1 ? 's' : ''}
            </Text>
            <View className="flex-row items-center">
              <Text className="font-bold text-gray-900">{formatCurrency(item.total)}</Text>
              <Ionicons className="ml-1" color="#9ca3af" name="chevron-forward" size={20} />
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [handleOrderPress]
  );

  const renderHeader = useCallback(
    () => (
      <View className="mb-4">
        <FlatList
          horizontal
          contentContainerStyle={{ paddingHorizontal: 16 }}
          data={filters}
          ItemSeparatorComponent={() => <View className="w-2" />}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`rounded-full px-4 py-2 ${
                activeFilter === item.value ? 'bg-indigo-600' : 'bg-white'
              }`}
              onPress={() => setActiveFilter(item.value)}
            >
              <Text
                className={`font-medium ${
                  activeFilter === item.value ? 'text-white' : 'text-gray-700'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    ),
    [activeFilter]
  );

  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) {
      return null;
    }
    return (
      <View className="py-4">
        <ActivityIndicator color="#6366f1" size="small" />
      </View>
    );
  }, [isFetchingNextPage]);

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return null;
    }
    return (
      <View className="flex-1 items-center justify-center py-16">
        <Ionicons color="#d1d5db" name="receipt-outline" size={64} />
        <Text className="mt-4 text-xl font-semibold text-gray-900">No Orders Yet</Text>
        <Text className="mt-2 px-8 text-center text-gray-500">
          {activeFilter === 'all'
            ? "You haven't placed any orders yet."
            : `No ${activeFilter} orders found.`}
        </Text>
        <TouchableOpacity
          className="mt-6 rounded-xl bg-indigo-600 px-6 py-3"
          onPress={() => router.push('/(tabs)/(storefront)/browse')}
        >
          <Text className="font-semibold text-white">Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }, [isLoading, activeFilter, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'My Orders',
          headerBackTitle: 'Account',
        }}
      />

      <FlatList
        className="flex-1 bg-gray-50"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
        data={orders}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} tintColor="#6366f1" onRefresh={onRefresh} />
        }
        renderItem={renderOrder}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />
    </>
  );
}
