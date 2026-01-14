import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useColors, useIsDark } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/stores/auth-store';
import { Avatar } from '@/components/ui/Avatar';
import { typography } from '@/lib/design/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  action?: 'logout';
  destructive?: boolean;
}

const menuItems: MenuItem[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: 'person-outline',
    route: '/(tabs)/(admin)/settings', // Routes to settings for now
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings-outline',
    route: '/(tabs)/(admin)/settings',
  },
  {
    id: 'divider',
    label: '',
    icon: 'remove',
  },
  {
    id: 'logout',
    label: 'Sign Out',
    icon: 'log-out-outline',
    action: 'logout',
    destructive: true,
  },
];

interface ProfileMenuProps {
  onOpenDrawer?: () => void;
}

export function ProfileMenu({ onOpenDrawer }: ProfileMenuProps) {
  const router = useRouter();
  const colors = useColors();
  const isDark = useIsDark();
  const { user, logout, isLoading } = useAuthStore();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleAvatarPress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuVisible(true);
  }, []);

  const handleMenuClose = useCallback(() => {
    setMenuVisible(false);
  }, []);

  const handleMenuItemPress = useCallback(
    async (item: MenuItem) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setMenuVisible(false);

      if (item.action === 'logout') {
        try {
          await logout();
          router.replace('/(auth)/login');
        } catch (error) {
          console.error('Logout failed:', error);
        }
      } else if (item.route) {
        router.push(item.route as any);
      }
    },
    [logout, router]
  );

  const userName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'User';
  const userEmail = user?.email || '';

  return (
    <>
      <Pressable
        onPress={handleAvatarPress}
        style={({ pressed }) => [
          styles.avatarButton,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Avatar
          source={user?.avatar || user?.avatar_url}
          name={userName}
          size="md"
        />
      </Pressable>

      <Modal
        visible={menuVisible}
        transparent
        animationType="none"
        onRequestClose={handleMenuClose}
      >
        <Pressable style={styles.overlay} onPress={handleMenuClose}>
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(100)}
            style={styles.backdropContainer}
          >
            <BlurView
              intensity={20}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </Pressable>

        <Animated.View
          entering={SlideInUp.springify().damping(18).stiffness(300)}
          exiting={SlideOutUp.duration(200)}
          style={[
            styles.menuContainer,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              shadowColor: '#000',
            },
          ]}
        >
          {/* User Info Header */}
          <View style={styles.userInfo}>
            <Avatar
              source={user?.avatar || user?.avatar_url}
              name={userName}
              size="lg"
            />
            <View style={styles.userDetails}>
              <Text
                style={[styles.userName, { color: colors.text }]}
                numberOfLines={1}
              >
                {userName}
              </Text>
              <Text
                style={[styles.userEmail, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {userEmail}
              </Text>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuItems}>
            {menuItems.map((item) => {
              if (item.id === 'divider') {
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.divider,
                      { backgroundColor: colors.border },
                    ]}
                  />
                );
              }

              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.menuItem,
                    {
                      backgroundColor: pressed
                        ? isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.04)'
                        : 'transparent',
                    },
                  ]}
                  onPress={() => handleMenuItemPress(item)}
                  disabled={isLoading && item.action === 'logout'}
                >
                  <View
                    style={[
                      styles.menuItemIcon,
                      {
                        backgroundColor: item.destructive
                          ? `${colors.error}15`
                          : isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.04)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={18}
                      color={item.destructive ? colors.error : colors.text}
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuItemLabel,
                      {
                        color: item.destructive ? colors.error : colors.text,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {!item.destructive && (
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textTertiary}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatarButton: {
    borderRadius: 20,
  },
  overlay: {
    flex: 1,
  },
  backdropContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  menuContainer: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: SCREEN_WIDTH - 80,
    maxWidth: 280,
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...typography.bodyMedium,
    marginBottom: 2,
  },
  userEmail: {
    ...typography.caption,
  },
  menuItems: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    ...typography.body,
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 16,
  },
});
