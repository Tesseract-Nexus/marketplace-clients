import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api/client';
import { useRefresh } from '../../../hooks/useRefresh';
import { formatCurrency, formatDate, formatRelativeTime } from '../../../lib/utils/formatting';

interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  location?: string;
  timestamp: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  variant_name?: string;
  quantity: number;
  price: number;
  image_url: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  shipping_address: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
  tracking_number?: string;
  carrier?: string;
  tracking_url?: string;
  estimated_delivery?: string;
  delivered_at?: string;
  tracking_events: TrackingEvent[];
  created_at: string;
}

const statusSteps = [
  { key: 'confirmed', label: 'Order Confirmed', icon: 'checkmark-circle' },
  { key: 'processing', label: 'Processing', icon: 'cog' },
  { key: 'shipped', label: 'Shipped', icon: 'airplane' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'car' },
  { key: 'delivered', label: 'Delivered', icon: 'home' },
];

const statusOrder = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
];

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/${id}`);
      return response.data.data;
    },
    enabled: !!id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { refreshing, onRefresh } = useRefresh({
    onRefresh: refetch,
    minimumDelay: 500,
  });

  const handleTrackWithCarrier = useCallback(() => {
    if (order?.tracking_url) {
      Linking.openURL(order.tracking_url);
    }
  }, [order?.tracking_url]);

  const handleContactSupport = useCallback(() => {
    // Open support chat or email
    Linking.openURL('mailto:support@example.com?subject=Order%20' + order?.order_number);
  }, [order?.order_number]);

  const handleReorder = useCallback(() => {
    // Add items back to cart
    router.push('/(tabs)/(storefront)/cart');
  }, [router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-6">
        <Ionicons color="#ef4444" name="alert-circle-outline" size={48} />
        <Text className="mt-4 text-lg font-semibold text-gray-900">Order Not Found</Text>
        <TouchableOpacity
          className="mt-6 rounded-lg bg-indigo-600 px-6 py-3"
          onPress={() => router.back()}
        >
          <Text className="font-semibold text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatusIndex = statusOrder.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const isDelivered = order.status === 'delivered';

  return (
    <>
      <Stack.Screen
        options={{
          title: `Order #${order.order_number}`,
          headerBackTitle: 'Orders',
        }}
      />

      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl refreshing={refreshing} tintColor="#6366f1" onRefresh={onRefresh} />
        }
      >
        {/* Status Header */}
        <View className="bg-white p-6">
          {isCancelled ? (
            <View className="items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <Ionicons color="#ef4444" name="close-circle" size={40} />
              </View>
              <Text className="mt-4 text-xl font-bold text-gray-900">Order Cancelled</Text>
              <Text className="mt-1 text-gray-500">This order has been cancelled</Text>
            </View>
          ) : isDelivered ? (
            <View className="items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Ionicons color="#22c55e" name="checkmark-circle" size={40} />
              </View>
              <Text className="mt-4 text-xl font-bold text-gray-900">Delivered</Text>
              <Text className="mt-1 text-gray-500">
                {order.delivered_at ? `Delivered ${formatRelativeTime(order.delivered_at)}` : null}
              </Text>
            </View>
          ) : (
            <View className="items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <Ionicons color="#4f46e5" name="cube-outline" size={40} />
              </View>
              <Text className="mt-4 text-xl font-bold capitalize text-gray-900">
                {order.status.replace('_', ' ')}
              </Text>
              {order.estimated_delivery ? (
                <Text className="mt-1 text-gray-500">
                  Estimated delivery: {formatDate(order.estimated_delivery)}
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Progress Steps */}
        {!isCancelled ? (
          <View className="bg-white px-6 pb-6">
            <View className="flex-row justify-between">
              {statusSteps.map((step, index) => {
                const stepIndex = statusOrder.indexOf(step.key);
                const isCompleted = stepIndex <= currentStatusIndex;
                const isCurrent = stepIndex === currentStatusIndex;

                return (
                  <View key={step.key} className="flex-1 items-center">
                    <View className="w-full flex-row items-center">
                      {index > 0 ? (
                        <View
                          className={`h-0.5 flex-1 ${
                            stepIndex <= currentStatusIndex ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        />
                      ) : null}
                      <View
                        className={`h-8 w-8 items-center justify-center rounded-full ${
                          isCurrent
                            ? 'bg-indigo-600'
                            : isCompleted
                              ? 'bg-indigo-600'
                              : 'bg-gray-200'
                        }`}
                      >
                        <Ionicons
                          color={isCompleted || isCurrent ? '#fff' : '#9ca3af'}
                          name={step.icon as any}
                          size={16}
                        />
                      </View>
                      {index < statusSteps.length - 1 ? (
                        <View
                          className={`h-0.5 flex-1 ${
                            stepIndex < currentStatusIndex ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        />
                      ) : null}
                    </View>
                    <Text
                      className={`mt-2 text-center text-xs ${
                        isCurrent ? 'font-medium text-indigo-600' : 'text-gray-500'
                      }`}
                      numberOfLines={2}
                    >
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Tracking Info */}
        {order.tracking_number ? (
          <View className="mx-4 mt-4 rounded-xl bg-white p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-gray-500">Tracking Number</Text>
                <Text className="font-medium text-gray-900">{order.tracking_number}</Text>
                {order.carrier ? (
                  <Text className="text-sm text-gray-500">{order.carrier}</Text>
                ) : null}
              </View>
              {order.tracking_url ? (
                <TouchableOpacity
                  className="rounded-lg bg-indigo-100 px-4 py-2"
                  onPress={handleTrackWithCarrier}
                >
                  <Text className="font-medium text-indigo-600">Track</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Tracking Events */}
        {order.tracking_events.length > 0 ? (
          <View className="mx-4 mt-4 rounded-xl bg-white p-4 shadow-sm">
            <Text className="mb-4 font-semibold text-gray-900">Tracking History</Text>
            {order.tracking_events.map((event, index) => (
              <View key={event.id} className="flex-row">
                <View className="items-center">
                  <View
                    className={`h-3 w-3 rounded-full ${
                      index === 0 ? 'bg-indigo-600' : 'bg-gray-300'
                    }`}
                  />
                  {index < order.tracking_events.length - 1 ? (
                    <View className="w-0.5 flex-1 bg-gray-200" style={{ minHeight: 40 }} />
                  ) : null}
                </View>
                <View className="ml-3 flex-1 pb-4">
                  <Text
                    className={`font-medium ${index === 0 ? 'text-gray-900' : 'text-gray-500'}`}
                  >
                    {event.description}
                  </Text>
                  {event.location ? (
                    <Text className="text-sm text-gray-500">{event.location}</Text>
                  ) : null}
                  <Text className="text-xs text-gray-400">
                    {formatRelativeTime(event.timestamp)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Shipping Address */}
        <View className="mx-4 mt-4 rounded-xl bg-white p-4 shadow-sm">
          <Text className="mb-3 font-semibold text-gray-900">Shipping Address</Text>
          <Text className="font-medium text-gray-900">{order.shipping_address.name}</Text>
          <Text className="text-gray-700">{order.shipping_address.line1}</Text>
          {order.shipping_address.line2 ? (
            <Text className="text-gray-700">{order.shipping_address.line2}</Text>
          ) : null}
          <Text className="text-gray-700">
            {order.shipping_address.city}, {order.shipping_address.state}{' '}
            {order.shipping_address.postal_code}
          </Text>
          <Text className="text-gray-500">{order.shipping_address.country}</Text>
          {order.shipping_address.phone ? (
            <Text className="mt-1 text-gray-500">{order.shipping_address.phone}</Text>
          ) : null}
        </View>

        {/* Order Items */}
        <View className="mx-4 mt-4 rounded-xl bg-white p-4 shadow-sm">
          <Text className="mb-4 font-semibold text-gray-900">
            Order Items ({order.items.length})
          </Text>
          {order.items.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="mb-3 flex-row border-b border-gray-100 pb-3 last:border-0"
              onPress={() => router.push(`/(tabs)/(storefront)/product?id=${item.product_id}`)}
            >
              <Image className="h-16 w-16 rounded-lg" source={{ uri: item.image_url }} />
              <View className="ml-3 flex-1">
                <Text className="font-medium text-gray-900" numberOfLines={2}>
                  {item.product_name}
                </Text>
                {item.variant_name ? (
                  <Text className="text-sm text-gray-500">{item.variant_name}</Text>
                ) : null}
                <Text className="text-sm text-gray-500">Qty: {item.quantity}</Text>
              </View>
              <Text className="font-medium text-gray-900">
                {formatCurrency(item.price * item.quantity)}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Order Summary */}
          <View className="mt-2 space-y-1 border-t border-gray-200 pt-3">
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Subtotal</Text>
              <Text className="text-gray-900">{formatCurrency(order.subtotal)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Shipping</Text>
              <Text className="text-gray-900">
                {order.shipping_cost === 0 ? 'FREE' : formatCurrency(order.shipping_cost)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500">Tax</Text>
              <Text className="text-gray-900">{formatCurrency(order.tax)}</Text>
            </View>
            <View className="flex-row justify-between pt-1">
              <Text className="font-bold text-gray-900">Total</Text>
              <Text className="font-bold text-gray-900">{formatCurrency(order.total)}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="mx-4 mb-8 mt-4 gap-3">
          {isDelivered ? (
            <TouchableOpacity className="rounded-xl bg-indigo-600 py-4" onPress={handleReorder}>
              <Text className="text-center font-semibold text-white">Reorder</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            className="rounded-xl border border-gray-200 bg-white py-4"
            onPress={handleContactSupport}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons color="#4b5563" name="chatbubble-outline" size={20} />
              <Text className="ml-2 font-semibold text-gray-700">Contact Support</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}
