import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { LinearGradient } from 'expo-linear-gradient';

function TabIcon({
  icon,
  iconFocused,
  focused,
  color,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused?: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  badge?: number;
}) {
  const colors = useColors();

  const animatedStyle = useAnimatedStyle((): any => ({
    transform: [
      { scale: focused ? 1.1 : 1 },
      { translateY: focused ? -2 : 0 },
    ],
  }), [focused]);

  return (
    <Animated.View style={[styles.iconContainer, animatedStyle]}>
      <Ionicons
        name={focused && iconFocused ? iconFocused : icon}
        size={24}
        color={color}
      />
      {badge !== undefined && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.error }]}>
          <Animated.Text style={styles.badgeText}>
            {badge > 99 ? '99+' : badge}
          </Animated.Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function TabsLayout() {
  const colors = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { getItemCount } = useCartStore();

  // Define admin roles - users with these roles see Admin portal
  // All other users (customers) see Storefront/Marketplace
  const ADMIN_ROLES = ['super_admin', 'admin', 'manager', 'staff'];
  const isAdmin = user?.role && ADMIN_ROLES.includes(user.role);
  const cartCount = getItemCount();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : isDark ? 'rgba(0,0,0,0.95)' : 'rgba(255,255,255,0.95)',
          borderTopWidth: 0,
          elevation: 0,
          height: 70 + insets.bottom,
          paddingTop: 12,
          paddingBottom: insets.bottom + 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <View style={StyleSheet.absoluteFill}>
              <BlurView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)', 'transparent']
                    : ['rgba(0,0,0,0.03)', 'rgba(0,0,0,0)', 'transparent']
                }
                style={styles.topBorder}
              />
            </View>
          ) : null,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
      }}
      screenListeners={{
        tabPress: () => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      {/* Admin Tabs - shown when user is admin, hidden otherwise */}
      <Tabs.Screen
        name="(admin)"
        options={{
          title: 'Dashboard',
          href: isAdmin ? '/(tabs)/(admin)/dashboard' : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon="grid-outline"
              iconFocused="grid"
              focused={focused}
              color={color}
            />
          ),
        }}
      />

      {/* Storefront Tabs - shown when user is customer, hidden otherwise */}
      <Tabs.Screen
        name="(storefront)"
        options={{
          title: 'Home',
          href: !isAdmin ? '/(tabs)/(storefront)/home' : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              icon="home-outline"
              iconFocused="home"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
