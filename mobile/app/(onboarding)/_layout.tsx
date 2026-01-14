import { Stack } from 'expo-router';

import { useColors } from '@/providers/ThemeProvider';

export default function OnboardingLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        gestureEnabled: false, // Prevent swipe back during onboarding
      }}
    >
      <Stack.Screen name="store-setup" />
      <Stack.Screen name="business-details" />
      <Stack.Screen name="plan-selection" />
      <Stack.Screen name="payment-setup" />
    </Stack>
  );
}
