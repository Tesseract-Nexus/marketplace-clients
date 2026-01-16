import { View, Text, ScrollView, Image, Pressable, StyleSheet, Alert, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useColors } from '@/providers/ThemeProvider';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { formatCurrency, formatDate, formatPhone } from '@/lib/utils/formatting';
import { ordersApi } from '@/lib/api';
import { QUERY_KEYS } from '@/lib/constants';
import type { Order, OrderStatus } from '@/types/entities';

const ORDER_ACTIONS = {
  pending: [
    { id: 'process', label: 'Start Processing', icon: 'play', color: 'info' },
    { id: 'cancel', label: 'Cancel Order', icon: 'close-circle', color: 'error' },
  ],
  processing: [
    { id: 'ship', label: 'Mark as Shipped', icon: 'airplane', color: 'info' },
    { id: 'cancel', label: 'Cancel Order', icon: 'close-circle', color: 'error' },
  ],
  shipped: [
    { id: 'deliver', label: 'Mark as Delivered', icon: 'checkmark-circle', color: 'success' },
  ],
  delivered: [{ id: 'refund', label: 'Issue Refund', icon: 'return-down-back', color: 'warning' }],
  cancelled: [],
  refunded: [],
};

export default function OrderDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const queryClient = useQueryClient();

  // Fetch order details
  const { data: order, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.ORDERS, id],
    queryFn: async (): Promise<Order> => {
      return {
        id: id,
        tenant_id: '1',
        order_number: 'ORD-1234',
        customer_id: 'cust-1',
        customer: {
          id: 'cust-1',
          tenant_id: '1',
          user_id: 'user-1',
          email: 'john.smith@example.com',
          first_name: 'John',
          last_name: 'Smith',
          phone: '+1 (555) 123-4567',
          status: 'active' as const,
          accepts_marketing: true,
          addresses: [],
          tags: [],
          total_orders: 12,
          total_spent: 1250.0,
          average_order_value: 104.17,
          loyalty_points: 125,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        status: 'processing' as const,
        payment_status: 'paid' as const,
        fulfillment_status: 'unfulfilled' as const,
        subtotal: 249.97,
        discount_total: 25.0,
        tax_total: 22.5,
        shipping_total: 9.99,
        total: 257.46,
        currency: 'USD',
        tags: [],
        coupon_codes: [],
        items: [
          {
            id: 'item-1',
            order_id: id,
            product_id: 'prod-1',
            variant_id: undefined,
            product_name: 'Premium Wireless Headphones',
            sku: 'WH-001',
            image_url: 'https://picsum.photos/seed/item1/200',
            unit_price: 199.99,
            quantity: 1,
            discount_amount: 0,
            tax_amount: 20,
            total: 199.99,
            fulfilled_quantity: 0,
            refunded_quantity: 0,
          },
          {
            id: 'item-2',
            order_id: id,
            product_id: 'prod-2',
            variant_id: undefined,
            product_name: 'USB-C Charging Cable (3-Pack)',
            sku: 'CB-003',
            image_url: 'https://picsum.photos/seed/item2/200',
            unit_price: 24.99,
            quantity: 2,
            discount_amount: 0,
            tax_amount: 2.5,
            total: 49.98,
            fulfilled_quantity: 0,
            refunded_quantity: 0,
          },
        ],
        shipping_address: {
          first_name: 'John',
          last_name: 'Smith',
          address1: '123 Main Street',
          address2: 'Apt 4B',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94102',
          country: 'United States',
          country_code: 'US',
        },
        billing_address: {
          first_name: 'John',
          last_name: 'Smith',
          address1: '123 Main Street',
          address2: 'Apt 4B',
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94102',
          country: 'United States',
          country_code: 'US',
        },
        notes: 'Please leave at door if not home.',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      };
    },
    enabled: !!id,
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: OrderStatus }) => ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORDERS] });
      toast.success('Order status updated');
    },
    onError: () => {
      toast.error('Failed to update order');
    },
  });

  const handleAction = (actionId: string) => {
    const statusMap: Record<string, OrderStatus> = {
      process: 'processing',
      ship: 'shipped',
      deliver: 'delivered',
      cancel: 'cancelled',
      refund: 'refunded',
    };

    const newStatus = statusMap[actionId];
    if (!newStatus) {
      return;
    }

    if (actionId === 'cancel' || actionId === 'refund') {
      Alert.alert(
        actionId === 'cancel' ? 'Cancel Order' : 'Issue Refund',
        actionId === 'cancel'
          ? 'Are you sure you want to cancel this order?'
          : 'Are you sure you want to issue a refund for this order?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: () => updateStatusMutation.mutate({ status: newStatus }),
          },
        ]
      );
    } else {
      updateStatusMutation.mutate({ status: newStatus });
    }
  };

  const getStatusConfig = (status: string) => {
    const config: Record<
      string,
      { label: string; variant: 'warning' | 'info' | 'success' | 'error' | 'secondary' }
    > = {
      pending: { label: 'Pending', variant: 'warning' },
      processing: { label: 'Processing', variant: 'info' },
      shipped: { label: 'Shipped', variant: 'info' },
      delivered: { label: 'Delivered', variant: 'success' },
      cancelled: { label: 'Cancelled', variant: 'error' },
      refunded: { label: 'Refunded', variant: 'secondary' },
    };
    return config[status] || { label: status, variant: 'secondary' };
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <IconButton
            icon={<Ionicons color={colors.text} name="arrow-back" size={24} />}
            onPress={() => router.back()}
          />
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton borderRadius={8} height={24} width="60%" />
          <Skeleton borderRadius={8} height={20} style={{ marginTop: 8 }} width="40%" />
          <Skeleton borderRadius={12} height={150} style={{ marginTop: 24 }} width="100%" />
          <Skeleton borderRadius={12} height={200} style={{ marginTop: 16 }} width="100%" />
        </ScrollView>
      </View>
    );
  }

  if (!order) {
    return null;
  }

  const statusConfig = getStatusConfig(order.status);
  const actions = ORDER_ACTIONS[order.status as keyof typeof ORDER_ACTIONS] || [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <IconButton
          icon={<Ionicons color={colors.text} name="arrow-back" size={24} />}
          onPress={() => router.back()}
        />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Order Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.orderHeader}>
          <View>
            <Text style={[styles.orderNumber, { color: colors.text }]}>#{order.order_number}</Text>
            <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
              {formatDate(order.created_at, 'MMM d, yyyy h:mm a')}
            </Text>
          </View>
          <Badge label={statusConfig.label} variant={statusConfig.variant} />
        </Animated.View>

        {/* Customer Info */}
        <Animated.View entering={FadeInDown.delay(150)}>
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer</Text>
              <Pressable
                onPress={() =>
                  router.push(`/(tabs)/(admin)/customer-detail?id=${order.customer_id}`)
                }
              >
                <Text style={[styles.viewLink, { color: colors.primary }]}>View Profile</Text>
              </Pressable>
            </View>
            <Pressable style={styles.customerRow}>
              <Avatar
                name={`${order.customer?.first_name} ${order.customer?.last_name}`}
                size="md"
              />
              <View style={styles.customerInfo}>
                <Text style={[styles.customerName, { color: colors.text }]}>
                  {order.customer?.first_name} {order.customer?.last_name}
                </Text>
                <Text style={[styles.customerEmail, { color: colors.textSecondary }]}>
                  {order.customer?.email}
                </Text>
              </View>
            </Pressable>
            <View style={styles.contactActions}>
              <Pressable
                style={[styles.contactButton, { backgroundColor: colors.surface }]}
                onPress={() => Linking.openURL(`mailto:${order.customer?.email}`)}
              >
                <Ionicons color={colors.primary} name="mail" size={18} />
                <Text style={[styles.contactLabel, { color: colors.primary }]}>Email</Text>
              </Pressable>
              {order.customer?.phone ? (
                <Pressable
                  style={[styles.contactButton, { backgroundColor: colors.surface }]}
                  onPress={() => Linking.openURL(`tel:${order.customer?.phone}`)}
                >
                  <Ionicons color={colors.primary} name="call" size={18} />
                  <Text style={[styles.contactLabel, { color: colors.primary }]}>Call</Text>
                </Pressable>
              ) : null}
            </View>
          </Card>
        </Animated.View>

        {/* Order Items */}
        <Animated.View entering={FadeInDown.delay(200)}>
          <Card style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Items ({order.items?.length || 0})
            </Text>
            {order.items?.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  { borderBottomColor: colors.border },
                  index === (order.items?.length || 0) - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text numberOfLines={2} style={[styles.itemName, { color: colors.text }]}>
                    {item.product_name}
                  </Text>
                  <Text style={[styles.itemSku, { color: colors.textTertiary }]}>
                    SKU: {item.sku}
                  </Text>
                  <View style={styles.itemMeta}>
                    <Text style={[styles.itemPrice, { color: colors.textSecondary }]}>
                      {formatCurrency(item.unit_price)} x {item.quantity}
                    </Text>
                    <Text style={[styles.itemTotal, { color: colors.text }]}>
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Card>
        </Animated.View>

        {/* Payment Summary */}
        <Animated.View entering={FadeInDown.delay(250)}>
          <Card style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment</Text>
              <Badge
                label={order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                variant={order.payment_status === 'paid' ? 'success' : 'warning'}
              />
            </View>
            {[
              { label: 'Subtotal', value: formatCurrency(order.subtotal) },
              order.discount_total > 0 && {
                label: 'Discount',
                value: `-${formatCurrency(order.discount_total)}`,
              },
              { label: 'Shipping', value: formatCurrency(order.shipping_total) },
              { label: 'Tax', value: formatCurrency(order.tax_total) },
            ]
              .filter(Boolean)
              .map((item, index) => (
                <View key={index} style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>{item.value}</Text>
                </View>
              ))}
            <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                {formatCurrency(order.total)}
              </Text>
            </View>
          </Card>
        </Animated.View>

        {/* Shipping Address */}
        {order.shipping_address ? (
          <Animated.View entering={FadeInDown.delay(300)}>
            <Card style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Shipping Address</Text>
              <Text style={[styles.addressText, { color: colors.textSecondary }]}>
                {order.shipping_address.first_name} {order.shipping_address.last_name}
                {'\n'}
                {order.shipping_address.address1}
                {'\n'}
                {order.shipping_address.address2 ? `${order.shipping_address.address2}\n` : null}
                {order.shipping_address.city}, {order.shipping_address.state}{' '}
                {order.shipping_address.postal_code}
                {'\n'}
                {order.shipping_address.country}
              </Text>
            </Card>
          </Animated.View>
        ) : null}

        {/* Notes */}
        {order.notes ? (
          <Animated.View entering={FadeInDown.delay(350)}>
            <Card style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Notes</Text>
              <Text style={[styles.notesText, { color: colors.textSecondary }]}>{order.notes}</Text>
            </Card>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Action Buttons */}
      {actions.length > 0 ? (
        <View
          style={[
            styles.bottomActions,
            {
              backgroundColor: colors.surface,
              paddingBottom: insets.bottom + 16,
              borderTopColor: colors.border,
            },
          ]}
        >
          {actions.map((action) => (
            <Button
              key={action.id}
              leftIcon={
                <Ionicons
                  color={action.color === 'error' ? '#FFFFFF' : colors.primary}
                  name={action.icon}
                  size={18}
                />
              }
              loading={updateStatusMutation.isPending}
              style={{ flex: 1 }}
              title={action.label}
              variant={
                action.color === 'error'
                  ? 'danger'
                  : action.color === 'success'
                    ? 'primary'
                    : 'outline'
              }
              onPress={() => handleAction(action.id)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  orderDate: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  viewLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  customerEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 12,
    marginBottom: 8,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemPrice: {
    fontSize: 13,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  addressText: {
    fontSize: 14,
    lineHeight: 22,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
});
