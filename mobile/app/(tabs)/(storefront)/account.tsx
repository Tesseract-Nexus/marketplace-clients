import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useColors } from '@/providers/ThemeProvider';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface MenuItemProps {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

function MenuItem({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = true,
}: MenuItemProps) {
  const colors = useColors();

  return (
    <Pressable
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: `${iconColor || colors.primary}20` }]}>
        <Ionicons name={icon as any} size={20} color={iconColor || colors.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        )}
      </View>
      {rightElement || (showChevron && onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      ))}
    </Pressable>
  );
}

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isDark, toggleMode } = useThemeStore();
  const [pushEnabled, setPushEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={[styles.title, { color: colors.text }]}>Account</Text>
        </View>
        <View style={styles.guestContent}>
          <View style={[styles.guestIcon, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="person" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.guestTitle, { color: colors.text }]}>Welcome!</Text>
          <Text style={[styles.guestSubtitle, { color: colors.textSecondary }]}>
            Sign in to track orders, save items, and get personalized recommendations.
          </Text>
          <View style={styles.guestButtons}>
            <Button
              title="Sign In"
              size="lg"
              fullWidth
              onPress={() => router.push('/login')}
            />
            <Button
              title="Create Account"
              variant="outline"
              size="lg"
              fullWidth
              onPress={() => router.push('/register')}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown}>
          <Text style={[styles.title, { color: colors.text }]}>Account</Text>
        </Animated.View>

        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Pressable
            style={[styles.profileCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/(tabs)/(storefront)/profile' as any)}
          >
            <Avatar
              name={`${user?.first_name || ''} ${user?.last_name || ''}`}
              source={user?.avatar || user?.avatar_url}
              size="lg"
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user?.first_name} {user?.last_name}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {user?.email}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </Pressable>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>QUICK ACTIONS</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="receipt"
              iconColor={colors.info}
              title="My Orders"
              subtitle="Track and manage your orders"
              onPress={() => router.push('/(tabs)/(storefront)/order-history')}
            />
            <MenuItem
              icon="heart"
              iconColor={colors.error}
              title="Wishlist"
              subtitle="Items you've saved"
              onPress={() => router.push('/(tabs)/(storefront)/wishlist' as any)}
            />
            <MenuItem
              icon="location"
              iconColor={colors.success}
              title="Addresses"
              subtitle="Manage delivery addresses"
              onPress={() => router.push('/(tabs)/(storefront)/addresses' as any)}
            />
            <MenuItem
              icon="card"
              iconColor={colors.warning}
              title="Payment Methods"
              subtitle="Manage saved cards"
              onPress={() => router.push('/(tabs)/(storefront)/payment-methods' as any)}
            />
          </Card>
        </Animated.View>

        {/* Preferences */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PREFERENCES</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="moon"
              iconColor={colors.info}
              title="Dark Mode"
              showChevron={false}
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={toggleMode}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <MenuItem
              icon="notifications"
              iconColor={colors.error}
              title="Push Notifications"
              showChevron={false}
              rightElement={
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <MenuItem
              icon="language"
              iconColor={colors.primary}
              title="Language"
              subtitle="English"
              onPress={() => {}}
            />
            <MenuItem
              icon="cash"
              iconColor={colors.success}
              title="Currency"
              subtitle="USD ($)"
              onPress={() => {}}
            />
          </Card>
        </Animated.View>

        {/* Support */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SUPPORT</Text>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="help-circle"
              iconColor={colors.info}
              title="Help Center"
              onPress={() => {}}
            />
            <MenuItem
              icon="chatbubbles"
              iconColor={colors.success}
              title="Contact Us"
              onPress={() => {}}
            />
            <MenuItem
              icon="document-text"
              iconColor={colors.textSecondary}
              title="Terms & Conditions"
              onPress={() => {}}
            />
            <MenuItem
              icon="shield-checkmark"
              iconColor={colors.primary}
              title="Privacy Policy"
              onPress={() => {}}
            />
          </Card>
        </Animated.View>

        {/* Sign Out */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.section}>
          <Card style={styles.menuCard}>
            <MenuItem
              icon="log-out"
              iconColor={colors.error}
              title="Sign Out"
              showChevron={false}
              onPress={handleLogout}
            />
          </Card>
        </Animated.View>

        {/* App Version */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>
            Version 1.0.0
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
  },
  guestContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  guestIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  guestSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  guestButtons: {
    width: '100%',
    gap: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 13,
  },
});
