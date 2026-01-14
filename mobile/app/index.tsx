import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/stores/auth-store';
import { useColors } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function WelcomeScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isAuthenticated, isInitialized, tenants, user } = useAuthStore();
  const [hasNavigated, setHasNavigated] = useState(false);

  // Define admin roles
  const ADMIN_ROLES = ['super_admin', 'admin', 'manager', 'staff'];
  const isAdminUser = user?.role && ADMIN_ROLES.includes(user.role);

  // Check if navigation is ready
  const navigationReady = rootNavigationState?.key != null;

  useEffect(() => {
    // Only navigate once and when navigation is ready
    if (!navigationReady || hasNavigated) return;

    if (isInitialized && isAuthenticated) {
      setHasNavigated(true);

      // Use setTimeout to ensure navigation happens after mount
      setTimeout(() => {
        if (!user?.email_verified) {
          // Email not verified - go to verification
          router.replace('/verify-email');
        } else if (isAdminUser && tenants.length === 0) {
          // Admin without a store - go to store setup
          router.replace('/store-setup');
        } else if (isAdminUser) {
          // Admin/Manager/Staff - go to admin dashboard
          router.replace('/(tabs)/(admin)/dashboard');
        } else {
          // Customer - go to marketplace/storefront home
          router.replace('/(tabs)/(storefront)/home');
        }
      }, 100);
    }
  }, [isInitialized, isAuthenticated, user, tenants, isAdminUser, navigationReady, hasNavigated]);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <LoadingScreen message="Loading your workspace..." />;
  }

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      style={styles.container}
    >
      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}>
        {/* Logo */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="cube" size={48} color={colors.primary} />
            </View>
            <Text style={styles.logoText}>Tesseract</Text>
          </View>
        </Animated.View>

        {/* Hero Section */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.heroSection}
        >
          <Text style={styles.heroTitle}>
            Launch Your Store{'\n'}In Minutes
          </Text>
          <Text style={styles.heroSubtitle}>
            Create a powerful online store with inventory management,
            analytics, and everything you need to grow.
          </Text>
        </Animated.View>

        {/* Features */}
        <Animated.View
          entering={FadeInDown.delay(600).springify()}
          style={styles.features}
        >
          <FeatureItem icon="cube-outline" text="Unlimited Products" />
          <FeatureItem icon="analytics-outline" text="Real-time Analytics" />
          <FeatureItem icon="card-outline" text="Secure Payments" />
          <FeatureItem icon="phone-portrait-outline" text="Mobile-First Design" />
        </Animated.View>

        {/* CTA Buttons */}
        <Animated.View
          entering={FadeInUp.delay(800).springify()}
          style={styles.ctaSection}
        >
          <Button
            title="Get Started Free"
            size="xl"
            fullWidth
            onPress={() => router.push('/register')}
            style={{
              backgroundColor: '#FFFFFF',
            }}
            textClassName="text-indigo-600"
          />

          <Pressable
            onPress={() => router.push('/login')}
            style={styles.loginButton}
          >
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginLink}>Sign In</Text>
            </Text>
          </Pressable>
        </Animated.View>

        {/* Trust Badges */}
        <Animated.View
          entering={FadeInUp.delay(1000).springify()}
          style={styles.trustBadges}
        >
          <View style={styles.trustItem}>
            <Ionicons name="shield-checkmark" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.trustText}>256-bit SSL</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.trustText}>GDPR Compliant</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <Ionicons name="time" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.trustText}>24/7 Support</Text>
          </View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

function FeatureItem({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={20} color="#FFFFFF" />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  heroSection: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 44,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    maxWidth: 320,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  ctaSection: {
    gap: 16,
  },
  loginButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  loginText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
  },
  loginLink: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  trustDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 12,
  },
});
