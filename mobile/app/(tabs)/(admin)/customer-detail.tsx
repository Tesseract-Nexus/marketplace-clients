import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../../../lib/api/client';
import { useRefresh } from '../../../hooks/useRefresh';
import { formatCurrency, formatDate, formatRelativeTime } from '../../../lib/utils/formatting';

interface CustomerOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  items_count: number;
  created_at: string;
}

interface CustomerAddress {
  id: string;
  type: 'billing' | 'shipping';
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
}

interface CustomerNote {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  status: 'active' | 'inactive' | 'blocked';
  tags: string[];
  total_orders: number;
  total_spent: number;
  average_order_value: number;
  last_order_at?: string;
  created_at: string;
  addresses: CustomerAddress[];
  recent_orders: CustomerOrder[];
  notes: CustomerNote[];
  metadata?: Record<string, string>;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-800' },
  blocked: { bg: 'bg-red-100', text: 'text-red-800' },
};

const orderStatusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800' },
  processing: { bg: 'bg-purple-100', text: 'text-purple-800' },
  shipped: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  delivered: { bg: 'bg-green-100', text: 'text-green-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'addresses' | 'notes'>(
    'overview'
  );

  const {
    data: customer,
    isLoading,
    error,
    refetch,
  } = useQuery<Customer>({
    queryKey: ['customer', id],
    queryFn: async () => {
      const response = await apiClient.get(`/customers/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });

  const { refreshing, onRefresh } = useRefresh({
    onRefresh: refetch,
    minimumDelay: 500,
  });

  const blockMutation = useMutation({
    mutationFn: async (blocked: boolean) => {
      return apiClient.patch(`/customers/${id}/status`, {
        status: blocked ? 'blocked' : 'active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const handleCall = useCallback(() => {
    if (customer?.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  }, [customer?.phone]);

  const handleEmail = useCallback(() => {
    if (customer?.email) {
      Linking.openURL(`mailto:${customer.email}`);
    }
  }, [customer?.email]);

  const handleBlockCustomer = useCallback(() => {
    if (!customer) {
      return;
    }

    const isBlocked = customer.status === 'blocked';
    Alert.alert(
      isBlocked ? 'Unblock Customer' : 'Block Customer',
      isBlocked
        ? 'This customer will be able to place orders again.'
        : 'This customer will not be able to place new orders.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isBlocked ? 'Unblock' : 'Block',
          style: isBlocked ? 'default' : 'destructive',
          onPress: () => blockMutation.mutate(!isBlocked),
        },
      ]
    );
  }, [customer, blockMutation]);

  const handleViewOrder = useCallback(
    (orderId: string) => {
      router.push(`/(tabs)/(admin)/order-detail?id=${orderId}`);
    },
    [router]
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator color="#6366f1" size="large" />
        <Text className="mt-2 text-gray-500">Loading customer...</Text>
      </View>
    );
  }

  if (error || !customer) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-6">
        <Ionicons color="#ef4444" name="alert-circle-outline" size={48} />
        <Text className="mt-4 text-lg font-semibold text-gray-900">Customer Not Found</Text>
        <Text className="mt-2 text-center text-gray-500">
          The customer you're looking for doesn't exist or has been removed.
        </Text>
        <TouchableOpacity
          className="mt-6 rounded-lg bg-indigo-600 px-6 py-3"
          onPress={() => router.back()}
        >
          <Text className="font-semibold text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusStyle = statusColors[customer.status] || statusColors.inactive;
  const initials = `${customer.first_name[0]}${customer.last_name[0]}`.toUpperCase();

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'person-outline' },
    { key: 'orders', label: 'Orders', icon: 'receipt-outline' },
    { key: 'addresses', label: 'Addresses', icon: 'location-outline' },
    { key: 'notes', label: 'Notes', icon: 'document-text-outline' },
  ] as const;

  return (
    <>
      <Stack.Screen
        options={{
          title: `${customer.first_name} ${customer.last_name}`,
          headerRight: () => (
            <TouchableOpacity className="mr-4" onPress={handleBlockCustomer}>
              <Ionicons
                color={customer.status === 'blocked' ? '#22c55e' : '#ef4444'}
                name={customer.status === 'blocked' ? 'lock-open-outline' : 'ban-outline'}
                size={24}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl refreshing={refreshing} tintColor="#6366f1" onRefresh={onRefresh} />
        }
      >
        {/* Customer Header */}
        <View className="bg-white p-6">
          <View className="flex-row items-center">
            {customer.avatar_url ? (
              <Image className="h-20 w-20 rounded-full" source={{ uri: customer.avatar_url }} />
            ) : (
              <View className="h-20 w-20 items-center justify-center rounded-full bg-indigo-100">
                <Text className="text-2xl font-bold text-indigo-600">{initials}</Text>
              </View>
            )}

            <View className="ml-4 flex-1">
              <View className="flex-row items-center">
                <Text className="text-xl font-bold text-gray-900">
                  {customer.first_name} {customer.last_name}
                </Text>
                {customer.total_spent >= 1000 ? (
                  <View className="ml-2 rounded-full bg-amber-100 px-2 py-0.5">
                    <Text className="text-xs font-medium text-amber-800">VIP</Text>
                  </View>
                ) : null}
              </View>
              <View className={`mt-1 self-start rounded-full px-3 py-1 ${statusStyle.bg}`}>
                <Text className={`text-xs font-medium capitalize ${statusStyle.text}`}>
                  {customer.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Contact Actions */}
          <View className="mt-4 flex-row gap-3">
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-3"
              onPress={handleEmail}
            >
              <Ionicons color="#4b5563" name="mail-outline" size={20} />
              <Text className="ml-2 font-medium text-gray-700">Email</Text>
            </TouchableOpacity>
            {customer.phone ? (
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-3"
                onPress={handleCall}
              >
                <Ionicons color="#4b5563" name="call-outline" size={20} />
                <Text className="ml-2 font-medium text-gray-700">Call</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Stats Cards */}
        <View className="flex-row gap-3 p-4">
          <View className="flex-1 rounded-xl bg-white p-4 shadow-sm">
            <Text className="text-xs text-gray-500">Total Orders</Text>
            <Text className="mt-1 text-2xl font-bold text-gray-900">{customer.total_orders}</Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4 shadow-sm">
            <Text className="text-xs text-gray-500">Total Spent</Text>
            <Text className="mt-1 text-2xl font-bold text-gray-900">
              {formatCurrency(customer.total_spent)}
            </Text>
          </View>
          <View className="flex-1 rounded-xl bg-white p-4 shadow-sm">
            <Text className="text-xs text-gray-500">Avg Order</Text>
            <Text className="mt-1 text-2xl font-bold text-gray-900">
              {formatCurrency(customer.average_order_value)}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row border-b border-gray-200 bg-white">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className={`flex-1 flex-row items-center justify-center py-3 ${
                activeTab === tab.key ? 'border-b-2 border-indigo-600' : ''
              }`}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                color={activeTab === tab.key ? '#4f46e5' : '#9ca3af'}
                name={tab.icon as any}
                size={18}
              />
              <Text
                className={`ml-1 text-sm font-medium ${
                  activeTab === tab.key ? 'text-indigo-600' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View className="p-4">
          {activeTab === 'overview' ? (
            <View className="space-y-4">
              {/* Contact Info */}
              <View className="rounded-xl bg-white p-4 shadow-sm">
                <Text className="mb-3 text-sm font-semibold text-gray-900">
                  Contact Information
                </Text>
                <View className="space-y-3">
                  <View className="flex-row items-center">
                    <Ionicons color="#6b7280" name="mail-outline" size={18} />
                    <Text className="ml-3 text-gray-700">{customer.email}</Text>
                  </View>
                  {customer.phone ? (
                    <View className="flex-row items-center">
                      <Ionicons color="#6b7280" name="call-outline" size={18} />
                      <Text className="ml-3 text-gray-700">{customer.phone}</Text>
                    </View>
                  ) : null}
                  <View className="flex-row items-center">
                    <Ionicons color="#6b7280" name="calendar-outline" size={18} />
                    <Text className="ml-3 text-gray-700">
                      Customer since {formatDate(customer.created_at)}
                    </Text>
                  </View>
                  {customer.last_order_at ? (
                    <View className="flex-row items-center">
                      <Ionicons color="#6b7280" name="time-outline" size={18} />
                      <Text className="ml-3 text-gray-700">
                        Last order {formatRelativeTime(customer.last_order_at)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Tags */}
              {customer.tags.length > 0 ? (
                <View className="rounded-xl bg-white p-4 shadow-sm">
                  <Text className="mb-3 text-sm font-semibold text-gray-900">Tags</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {customer.tags.map((tag, index) => (
                      <View key={index} className="rounded-full bg-gray-100 px-3 py-1">
                        <Text className="text-sm text-gray-700">{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Default Address */}
              {customer.addresses.length > 0 ? (
                <View className="rounded-xl bg-white p-4 shadow-sm">
                  <Text className="mb-3 text-sm font-semibold text-gray-900">Default Address</Text>
                  {(() => {
                    const defaultAddr =
                      customer.addresses.find((a) => a.is_default) || customer.addresses[0];
                    return (
                      <View>
                        <Text className="text-gray-700">{defaultAddr.line1}</Text>
                        {defaultAddr.line2 ? (
                          <Text className="text-gray-700">{defaultAddr.line2}</Text>
                        ) : null}
                        <Text className="text-gray-700">
                          {defaultAddr.city}, {defaultAddr.state} {defaultAddr.postal_code}
                        </Text>
                        <Text className="text-gray-500">{defaultAddr.country}</Text>
                      </View>
                    );
                  })()}
                </View>
              ) : null}
            </View>
          ) : null}

          {activeTab === 'orders' ? (
            <View className="space-y-3">
              {customer.recent_orders.length === 0 ? (
                <View className="items-center justify-center rounded-xl bg-white p-8">
                  <Ionicons color="#d1d5db" name="receipt-outline" size={48} />
                  <Text className="mt-2 text-gray-500">No orders yet</Text>
                </View>
              ) : (
                customer.recent_orders.map((order) => {
                  const orderStatus = orderStatusColors[order.status] || orderStatusColors.pending;
                  return (
                    <TouchableOpacity
                      key={order.id}
                      className="rounded-xl bg-white p-4 shadow-sm"
                      onPress={() => handleViewOrder(order.id)}
                    >
                      <View className="flex-row items-center justify-between">
                        <View>
                          <Text className="font-semibold text-gray-900">#{order.order_number}</Text>
                          <Text className="text-sm text-gray-500">
                            {order.items_count} item{order.items_count !== 1 ? 's' : ''} •{' '}
                            {formatRelativeTime(order.created_at)}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="font-semibold text-gray-900">
                            {formatCurrency(order.total)}
                          </Text>
                          <View className={`mt-1 rounded-full px-2 py-0.5 ${orderStatus.bg}`}>
                            <Text className={`text-xs font-medium capitalize ${orderStatus.text}`}>
                              {order.status}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          ) : null}

          {activeTab === 'addresses' ? (
            <View className="space-y-3">
              {customer.addresses.length === 0 ? (
                <View className="items-center justify-center rounded-xl bg-white p-8">
                  <Ionicons color="#d1d5db" name="location-outline" size={48} />
                  <Text className="mt-2 text-gray-500">No addresses saved</Text>
                </View>
              ) : (
                customer.addresses.map((address) => (
                  <View key={address.id} className="rounded-xl bg-white p-4 shadow-sm">
                    <View className="mb-2 flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View
                          className={`rounded-full px-2 py-0.5 ${
                            address.type === 'shipping' ? 'bg-blue-100' : 'bg-purple-100'
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium capitalize ${
                              address.type === 'shipping' ? 'text-blue-800' : 'text-purple-800'
                            }`}
                          >
                            {address.type}
                          </Text>
                        </View>
                        {address.is_default ? (
                          <View className="ml-2 rounded-full bg-green-100 px-2 py-0.5">
                            <Text className="text-xs font-medium text-green-800">Default</Text>
                          </View>
                        ) : null}
                      </View>
                      <Ionicons color="#9ca3af" name="ellipsis-horizontal" size={20} />
                    </View>
                    <Text className="text-gray-700">{address.line1}</Text>
                    {address.line2 ? <Text className="text-gray-700">{address.line2}</Text> : null}
                    <Text className="text-gray-700">
                      {address.city}, {address.state} {address.postal_code}
                    </Text>
                    <Text className="text-gray-500">{address.country}</Text>
                  </View>
                ))
              )}
            </View>
          ) : null}

          {activeTab === 'notes' ? (
            <View className="space-y-3">
              {customer.notes.length === 0 ? (
                <View className="items-center justify-center rounded-xl bg-white p-8">
                  <Ionicons color="#d1d5db" name="document-text-outline" size={48} />
                  <Text className="mt-2 text-gray-500">No notes yet</Text>
                  <TouchableOpacity className="mt-4 rounded-lg bg-indigo-600 px-4 py-2">
                    <Text className="font-medium text-white">Add Note</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity className="mb-2 self-end rounded-lg bg-indigo-600 px-4 py-2">
                    <Text className="font-medium text-white">Add Note</Text>
                  </TouchableOpacity>
                  {customer.notes.map((note) => (
                    <View key={note.id} className="rounded-xl bg-white p-4 shadow-sm">
                      <Text className="text-gray-700">{note.content}</Text>
                      <View className="mt-2 flex-row items-center justify-between">
                        <Text className="text-xs text-gray-500">By {note.created_by}</Text>
                        <Text className="text-xs text-gray-500">
                          {formatRelativeTime(note.created_at)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}
