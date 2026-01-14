import { Stack } from 'expo-router';

import { useColors } from '@/providers/ThemeProvider';

export default function StorefrontLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="home" />
      <Stack.Screen name="browse" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="account" />
      <Stack.Screen name="product" />
      <Stack.Screen name="category" />
      <Stack.Screen name="search" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="order-confirmation" />
      <Stack.Screen name="order-history" />
      <Stack.Screen name="order-tracking" />
    </Stack>
  );
}
