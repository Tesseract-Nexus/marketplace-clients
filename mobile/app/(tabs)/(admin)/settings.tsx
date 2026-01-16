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
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

interface SettingItemProps {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  destructive?: boolean;
}

function SettingItem({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = true,
  destructive = false,
}: SettingItemProps) {
  const colors = useColors();

  return (
    <Pressable
      disabled={!onPress}
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={[styles.settingIcon, { backgroundColor: `${iconColor || colors.primary}20` }]}>
        <Ionicons
          color={destructive ? colors.error : iconColor || colors.primary}
          name={icon as any}
          size={20}
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: destructive ? colors.error : colors.text }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {rightElement ||
        (showChevron && onPress && (
          <Ionicons color={colors.textTertiary} name="chevron-forward" size={20} />
        ))}
    </Pressable>
  );
}

function SettingSection({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const colors = useColors();

  return (
    <Animated.View entering={FadeInDown.delay(delay)} style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <Card style={styles.sectionCard}>{children}</Card>
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user, currentTenant, logout } = useAuthStore();
  const { isDark, toggleMode } = useThemeStore();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Handle account deletion
          },
        },
      ]
    );
  };

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
          <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        </Animated.View>

        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Pressable
            style={[styles.profileCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/(tabs)/(admin)/profile' as any)}
          >
            <Avatar
              name={`${user?.first_name || ''} ${user?.last_name || ''}`}
              size="lg"
              source={user?.avatar || user?.avatar_url}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {user?.first_name} {user?.last_name}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {user?.email}
              </Text>
              <Badge
                label={user?.role === 'admin' ? 'Admin' : 'Merchant'}
                size="sm"
                style={{ marginTop: 8 }}
                variant="primary"
              />
            </View>
            <Ionicons color={colors.textTertiary} name="chevron-forward" size={20} />
          </Pressable>
        </Animated.View>

        {/* Store Settings */}
        <SettingSection delay={200} title="STORE">
          <SettingItem
            icon="storefront"
            subtitle={currentTenant?.name}
            title="Store Information"
            onPress={() => router.push('/(tabs)/(admin)/store-settings' as any)}
          />
          <SettingItem
            icon="globe"
            subtitle={`${currentTenant?.slug}.tesserix.app`}
            title="Domain & URL"
            onPress={() => router.push('/(tabs)/(admin)/domain-settings' as any)}
          />
          <SettingItem
            icon="card"
            title="Payment Methods"
            onPress={() => router.push('/(tabs)/(admin)/payment-settings' as any)}
          />
          <SettingItem
            icon="cube"
            title="Shipping Settings"
            onPress={() => router.push('/(tabs)/(admin)/shipping-settings' as any)}
          />
          <SettingItem
            icon="calculator"
            title="Tax Settings"
            onPress={() => router.push('/(tabs)/(admin)/tax-settings' as any)}
          />
        </SettingSection>

        {/* Appearance */}
        <SettingSection delay={300} title="APPEARANCE">
          <SettingItem
            icon="moon"
            iconColor={colors.info}
            rightElement={
              <Switch
                thumbColor="#FFFFFF"
                trackColor={{ false: colors.border, true: colors.primary }}
                value={isDark}
                onValueChange={toggleMode}
              />
            }
            showChevron={false}
            subtitle={isDark ? 'On' : 'Off'}
            title="Dark Mode"
          />
          <SettingItem
            icon="color-palette"
            iconColor={colors.warning}
            title="Theme & Branding"
            onPress={() => router.push('/(tabs)/(admin)/theme-settings' as any)}
          />
        </SettingSection>

        {/* Notifications */}
        <SettingSection delay={400} title="NOTIFICATIONS">
          <SettingItem
            icon="notifications"
            iconColor={colors.error}
            rightElement={
              <Switch
                thumbColor="#FFFFFF"
                trackColor={{ false: colors.border, true: colors.primary }}
                value={pushEnabled}
                onValueChange={setPushEnabled}
              />
            }
            showChevron={false}
            subtitle={pushEnabled ? 'Enabled' : 'Disabled'}
            title="Push Notifications"
          />
          <SettingItem
            icon="mail"
            iconColor={colors.info}
            title="Email Notifications"
            onPress={() => router.push('/(tabs)/(admin)/email-settings' as any)}
          />
        </SettingSection>

        {/* Security */}
        <SettingSection delay={500} title="SECURITY">
          <SettingItem
            icon="lock-closed"
            iconColor={colors.success}
            title="Change Password"
            onPress={() => router.push('/(tabs)/(admin)/change-password' as any)}
          />
          <SettingItem
            icon="finger-print"
            iconColor={colors.primary}
            rightElement={
              <Switch
                thumbColor="#FFFFFF"
                trackColor={{ false: colors.border, true: colors.primary }}
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
              />
            }
            showChevron={false}
            subtitle={biometricEnabled ? 'Enabled' : 'Disabled'}
            title="Biometric Login"
          />
          <SettingItem
            icon="shield-checkmark"
            iconColor={colors.info}
            title="Two-Factor Authentication"
            onPress={() => router.push('/(tabs)/(admin)/2fa-settings' as any)}
          />
        </SettingSection>

        {/* Billing */}
        <SettingSection delay={600} title="BILLING">
          <SettingItem
            icon="ribbon"
            iconColor={colors.warning}
            subtitle="Growth - $29/month"
            title="Current Plan"
            onPress={() => router.push('/(tabs)/(admin)/subscription' as any)}
          />
          <SettingItem
            icon="document-text"
            iconColor={colors.textSecondary}
            title="Billing History"
            onPress={() => router.push('/(tabs)/(admin)/billing-history' as any)}
          />
        </SettingSection>

        {/* Support */}
        <SettingSection delay={700} title="SUPPORT">
          <SettingItem
            icon="help-circle"
            iconColor={colors.info}
            title="Help Center"
            onPress={() => {}}
          />
          <SettingItem
            icon="chatbubbles"
            iconColor={colors.success}
            title="Contact Support"
            onPress={() => {}}
          />
          <SettingItem
            icon="information-circle"
            iconColor={colors.textSecondary}
            subtitle="Version 1.0.0"
            title="About"
            onPress={() => router.push('/(tabs)/(admin)/about' as any)}
          />
        </SettingSection>

        {/* Account Actions */}
        <SettingSection delay={800} title="ACCOUNT">
          <SettingItem destructive icon="log-out" title="Sign Out" onPress={handleLogout} />
          <SettingItem
            destructive
            icon="trash"
            title="Delete Account"
            onPress={handleDeleteAccount}
          />
        </SettingSection>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
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
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
});
