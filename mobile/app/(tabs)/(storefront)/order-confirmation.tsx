import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

import { apiClient } from '../../../lib/api/client';
import { formatCurrency, formatDate } from '../../../lib/utils/formatting';

interface OrderItem {
  id: string;
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
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  estimated_delivery: string;
  created_at: string;
}

export default function OrderConfirmationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const { data: order } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await apiClient.get(`/orders/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    scale.value = withSequence(withSpring(1.2, { damping: 8 }), withSpring(1, { damping: 10 }));
    opacity.value = withDelay(300, withSpring(1));
  }, []);

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />

      <ScrollView className="flex-1 bg-white">
        <View className="items-center px-6 pt-20">
          {/* Success Animation */}
          <Animated.View
            className="h-24 w-24 items-center justify-center rounded-full bg-green-100"
            style={checkmarkStyle}
          >
            <Ionicons color="#22c55e" name="checkmark-circle" size={64} />
          </Animated.View>

          <Animated.View className="w-full items-center" style={contentStyle}>
            <Text className="mt-6 text-2xl font-bold text-gray-900">Order Confirmed!</Text>
            <Text className="mt-2 text-center text-gray-500">
              Thank you for your order. We'll send you a confirmation email shortly.
            </Text>

            {order ? (
              <>
                {/* Order Number */}
                <View className="mt-6 rounded-xl bg-gray-50 p-4">
                  <Text className="text-center text-sm text-gray-500">Order Number</Text>
                  <Text className="mt-1 text-center text-xl font-bold text-gray-900">
                    #{order.order_number}
                  </Text>
                </View>

                {/* Order Summary */}
                <View className="mt-6 w-full rounded-xl border border-gray-200 p-4">
                  <Text className="mb-4 font-semibold text-gray-900">Order Summary</Text>

                  {order.items.map((item) => (
                    <View
                      key={item.id}
                      className="mb-3 flex-row border-b border-gray-100 pb-3 last:border-0"
                    >
                      <Image className="h-14 w-14 rounded-lg" source={{ uri: item.image_url }} />
                      <View className="ml-3 flex-1">
                        <Text className="font-medium text-gray-900" numberOfLines={1}>
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
                    </View>
                  ))}

                  <View className="mt-2 space-y-1 border-t border-gray-200 pt-2">
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

                {/* Shipping Info */}
                <View className="mt-4 w-full rounded-xl border border-gray-200 p-4">
                  <Text className="mb-2 font-semibold text-gray-900">Shipping To</Text>
                  <Text className="text-gray-700">{order.shipping_address.line1}</Text>
                  <Text className="text-gray-700">
                    {order.shipping_address.city}, {order.shipping_address.state}{' '}
                    {order.shipping_address.postal_code}
                  </Text>
                  <Text className="text-gray-500">{order.shipping_address.country}</Text>

                  <View className="mt-4 flex-row items-center rounded-lg bg-blue-50 p-3">
                    <Ionicons color="#3b82f6" name="time-outline" size={20} />
                    <View className="ml-3">
                      <Text className="text-sm text-blue-800">Estimated Delivery</Text>
                      <Text className="font-medium text-blue-900">
                        {formatDate(order.estimated_delivery)}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            ) : null}

            {/* Action Buttons */}
            <View className="mt-8 w-full gap-3">
              <TouchableOpacity
                className="rounded-xl bg-indigo-600 py-4"
                onPress={() => router.push(`/(tabs)/(storefront)/order-tracking?id=${id}`)}
              >
                <Text className="text-center font-semibold text-white">Track Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="rounded-xl border border-gray-200 py-4"
                onPress={() => router.replace('/(tabs)/(storefront)/home')}
              >
                <Text className="text-center font-semibold text-gray-700">Continue Shopping</Text>
              </TouchableOpacity>
            </View>

            {/* Help Section */}
            <View className="mb-12 mt-8 flex-row items-center justify-center">
              <Ionicons color="#6b7280" name="help-circle-outline" size={18} />
              <Text className="ml-1 text-gray-500">
                Need help? <Text className="text-indigo-600">Contact Support</Text>
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </>
  );
}
