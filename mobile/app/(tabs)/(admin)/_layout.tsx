import { Stack } from 'expo-router';

import { useColors } from '@/providers/ThemeProvider';

export default function AdminLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      {/* Main Screens */}
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="products" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="settings" />

      {/* Detail Screens */}
      <Stack.Screen name="product-detail" />
      <Stack.Screen name="order-detail" />
      <Stack.Screen name="customer-detail" />
      <Stack.Screen name="add-product" />

      {/* Order Management */}
      <Stack.Screen name="abandoned-orders" />
      <Stack.Screen name="returns" />

      {/* Inventory */}
      <Stack.Screen name="inventory" />

      {/* Marketing & Analytics */}
      <Stack.Screen name="notifications" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="marketing" />
      <Stack.Screen name="coupons" />
      <Stack.Screen name="campaigns" />
      <Stack.Screen name="loyalty" />
      <Stack.Screen name="gift-cards" />

      {/* Staff & Team */}
      <Stack.Screen name="staff" />
      <Stack.Screen name="staff-detail" />
      <Stack.Screen name="roles" />

      {/* Integrations */}
      <Stack.Screen name="integrations" />

      {/* Categories & Reviews */}
      <Stack.Screen name="categories" />
      <Stack.Screen name="reviews" />

      {/* Forms */}
      <Stack.Screen name="coupon-form" />
    </Stack>
  );
}
