import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useColors } from '@/providers/ThemeProvider';
import { Card, PressableCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface MarketingFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
  status: 'active' | 'coming_soon' | 'beta';
  route?: string;
}

const MARKETING_FEATURES: MarketingFeature[] = [
  {
    id: 'coupons',
    icon: 'pricetag',
    title: 'Discount Coupons',
    description: 'Create and manage discount codes for your customers',
    status: 'active',
    route: '/(tabs)/(admin)/coupons',
  },
  {
    id: 'email',
    icon: 'mail',
    title: 'Email Campaigns',
    description: 'Send promotional emails to your customer base',
    status: 'coming_soon',
  },
  {
    id: 'sms',
    icon: 'chatbubble',
    title: 'SMS Marketing',
    description: 'Reach customers with targeted SMS messages',
    status: 'coming_soon',
  },
  {
    id: 'push',
    icon: 'notifications',
    title: 'Push Notifications',
    description: 'Send push notifications to app users',
    status: 'beta',
  },
  {
    id: 'social',
    icon: 'share-social',
    title: 'Social Media',
    description: 'Connect and post to social media platforms',
    status: 'coming_soon',
  },
  {
    id: 'referral',
    icon: 'people',
    title: 'Referral Program',
    description: 'Reward customers for bringing new customers',
    status: 'coming_soon',
  },
  {
    id: 'loyalty',
    icon: 'star',
    title: 'Loyalty Points',
    description: 'Build customer loyalty with a points program',
    status: 'coming_soon',
  },
  {
    id: 'reviews',
    icon: 'chatbubbles',
    title: 'Review Requests',
    description: 'Automatically request reviews after purchase',
    status: 'beta',
  },
];

function FeatureCard({ feature, index }: { feature: MarketingFeature; index: number }) {
  const colors = useColors();
  const router = useRouter();

  const statusVariant = {
    active: 'success',
    beta: 'info',
    coming_soon: 'default',
  }[feature.status] as 'success' | 'info' | 'default';

  const statusLabel = {
    active: 'Active',
    beta: 'Beta',
    coming_soon: 'Coming Soon',
  }[feature.status];

  const isDisabled = feature.status === 'coming_soon';

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 50)}>
      <PressableCard
        style={StyleSheet.flatten([styles.featureCard, isDisabled && styles.featureCardDisabled])}
        onPress={() => {
          if (feature.route && !isDisabled) {
            router.push(feature.route as any);
          }
        }}
        disabled={isDisabled}
      >
        <View
          style={[
            styles.featureIcon,
            { backgroundColor: isDisabled ? colors.border : `${colors.primary}20` },
          ]}
        >
          <Ionicons
            name={feature.icon as any}
            size={24}
            color={isDisabled ? colors.textTertiary : colors.primary}
          />
        </View>
        <View style={styles.featureContent}>
          <View style={styles.featureTitleRow}>
            <Text
              style={[
                styles.featureTitle,
                { color: isDisabled ? colors.textTertiary : colors.text },
              ]}
            >
              {feature.title}
            </Text>
            <Badge label={statusLabel} variant={statusVariant} size="sm" />
          </View>
          <Text
            style={[
              styles.featureDescription,
              { color: isDisabled ? colors.textTertiary : colors.textSecondary },
            ]}
          >
            {feature.description}
          </Text>
        </View>
        {!isDisabled && (
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
        )}
      </PressableCard>
    </Animated.View>
  );
}

export default function MarketingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Marketing</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Card */}
        <Animated.View entering={FadeInDown}>
          <Card style={StyleSheet.flatten([styles.introCard, { backgroundColor: `${colors.primary}10` }])}>
            <Ionicons name="megaphone" size={32} color={colors.primary} />
            <Text style={[styles.introTitle, { color: colors.text }]}>
              Grow Your Business
            </Text>
            <Text style={[styles.introText, { color: colors.textSecondary }]}>
              Use our marketing tools to reach more customers, increase sales, and build brand loyalty.
            </Text>
          </Card>
        </Animated.View>

        {/* Feature List */}
        <View style={styles.featuresList}>
          {MARKETING_FEATURES.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  introCard: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  introText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  featuresList: {
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  featureCardDisabled: {
    opacity: 0.7,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  featureDescription: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
});
