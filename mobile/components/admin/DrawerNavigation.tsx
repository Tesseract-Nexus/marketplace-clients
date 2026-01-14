import { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideOutLeft,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/stores/auth-store';
import { Avatar } from '@/components/ui/Avatar';
import { typography, gradients } from '@/lib/design/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);

interface NavItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFilled: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'grid-outline',
        iconFilled: 'grid',
        route: '/(tabs)/(admin)/dashboard',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: 'bar-chart-outline',
        iconFilled: 'bar-chart',
        route: '/(tabs)/(admin)/analytics',
      },
    ],
  },
  {
    title: 'Catalog',
    items: [
      {
        id: 'products',
        label: 'Products',
        icon: 'cube-outline',
        iconFilled: 'cube',
        route: '/(tabs)/(admin)/products',
      },
      {
        id: 'orders',
        label: 'Orders',
        icon: 'receipt-outline',
        iconFilled: 'receipt',
        route: '/(tabs)/(admin)/orders',
      },
      {
        id: 'customers',
        label: 'Customers',
        icon: 'people-outline',
        iconFilled: 'people',
        route: '/(tabs)/(admin)/customers',
      },
    ],
  },
  {
    title: 'Marketing',
    items: [
      {
        id: 'marketing',
        label: 'Campaigns',
        icon: 'megaphone-outline',
        iconFilled: 'megaphone',
        route: '/(tabs)/(admin)/marketing',
      },
      {
        id: 'coupons',
        label: 'Coupons',
        icon: 'pricetag-outline',
        iconFilled: 'pricetag',
        route: '/(tabs)/(admin)/coupons',
      },
    ],
  },
  {
    title: 'Settings',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        icon: 'settings-outline',
        iconFilled: 'settings',
        route: '/(tabs)/(admin)/settings',
      },
    ],
  },
];

interface DrawerNavigationProps {
  visible: boolean;
  onClose: () => void;
}

export function DrawerNavigation({ visible, onClose }: DrawerNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const { user, currentTenant, logout } = useAuthStore();

  const handleNavItemPress = useCallback(
    (route: string) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
      // Small delay to let the drawer close
      setTimeout(() => {
        router.push(route as any);
      }, 150);
    },
    [router, onClose]
  );

  const handleLogout = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, [logout, router, onClose]);

  const isActiveRoute = (route: string) => {
    const routePath = route.replace('/(tabs)/(admin)/', '');
    return pathname.includes(routePath);
  };

  const userName =
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User';
  const userEmail = user?.email || '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.backdropContainer}
        >
          <BlurView
            intensity={25}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(0,0,0,0.3)' },
            ]}
          />
        </Animated.View>
      </Pressable>

      {/* Drawer */}
      <Animated.View
        entering={SlideInLeft.springify().damping(20).stiffness(200)}
        exiting={SlideOutLeft.duration(200)}
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* Header with gradient */}
        <LinearGradient
          colors={gradients.primary as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>

          <View style={styles.userSection}>
            <Avatar
              source={user?.avatar || user?.avatar_url}
              name={userName}
              size="lg"
            />
            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {userEmail}
            </Text>
          </View>

          {currentTenant && (
            <View style={styles.storeInfo}>
              <Ionicons name="storefront" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.storeName} numberOfLines={1}>
                {currentTenant.name}
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Navigation Items */}
        <ScrollView
          style={styles.navContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.navContentContainer}
        >
          {navSections.map((section) => (
            <View key={section.title} style={styles.navSection}>
              <Text
                style={[styles.sectionTitle, { color: colors.textTertiary }]}
              >
                {section.title}
              </Text>
              {section.items.map((item) => {
                const isActive = isActiveRoute(item.route);
                return (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [
                      styles.navItem,
                      {
                        backgroundColor: isActive
                          ? isDark
                            ? `${colors.primary}20`
                            : `${colors.primary}10`
                          : pressed
                          ? isDark
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.03)'
                          : 'transparent',
                      },
                    ]}
                    onPress={() => handleNavItemPress(item.route)}
                  >
                    <View
                      style={[
                        styles.navItemIcon,
                        {
                          backgroundColor: isActive
                            ? `${colors.primary}20`
                            : isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.04)',
                        },
                      ]}
                    >
                      <Ionicons
                        name={isActive ? item.iconFilled : item.icon}
                        size={18}
                        color={isActive ? colors.primary : colors.text}
                      />
                    </View>
                    <Text
                      style={[
                        styles.navItemLabel,
                        {
                          color: isActive ? colors.primary : colors.text,
                          fontWeight: isActive ? '600' : '400',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                    {item.badge !== undefined && item.badge > 0 && (
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: colors.error },
                        ]}
                      >
                        <Text style={styles.badgeText}>{item.badge}</Text>
                      </View>
                    )}
                    {isActive && (
                      <View
                        style={[
                          styles.activeIndicator,
                          { backgroundColor: colors.primary },
                        ]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View
          style={[styles.footer, { borderTopColor: colors.border }]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              {
                backgroundColor: pressed
                  ? `${colors.error}15`
                  : 'transparent',
              },
            ]}
            onPress={handleLogout}
          >
            <View
              style={[styles.logoutIcon, { backgroundColor: `${colors.error}15` }]}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.error} />
            </View>
            <Text style={[styles.logoutLabel, { color: colors.error }]}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdropContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: SCREEN_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userSection: {
    marginTop: 32,
  },
  userName: {
    ...typography.title2,
    color: '#FFFFFF',
    marginTop: 12,
  },
  userEmail: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  storeName: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  navContent: {
    flex: 1,
  },
  navContentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  navSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    ...typography.micro,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 16,
    marginBottom: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 12,
    marginBottom: 2,
  },
  navItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemLabel: {
    ...typography.body,
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  activeIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginLeft: 4,
  },
  footer: {
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 12,
  },
  logoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: {
    ...typography.bodyMedium,
  },
});
