import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { useColors } from '@/providers/ThemeProvider';
import { Button, IconButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type PlanId = 'free' | 'starter' | 'growth' | 'professional' | 'enterprise';

interface Plan {
  id: PlanId;
  name: string;
  description: string;
  price: { monthly: number; yearly: number };
  popular?: boolean;
  features: string[];
  limits: {
    products: number;
    orders: number;
    storage: string;
  };
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for new businesses',
    price: { monthly: 0, yearly: 0 },
    features: [
      'Up to 100 products',
      'Basic analytics',
      '2.5% transaction fee',
      'Email support',
      'Mobile app access',
    ],
    limits: {
      products: 100,
      orders: 500,
      storage: '1 GB',
    },
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'For growing businesses',
    price: { monthly: 29, yearly: 290 },
    popular: true,
    features: [
      'Unlimited products',
      'Advanced analytics',
      '1.5% transaction fee',
      'Priority support',
      'Custom domain',
      'Marketing tools',
      'Team members (up to 5)',
    ],
    limits: {
      products: -1,
      orders: -1,
      storage: '10 GB',
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For high-volume sellers',
    price: { monthly: 99, yearly: 990 },
    features: [
      'Everything in Growth',
      '0.5% transaction fee',
      'Dedicated support',
      'API access',
      'White-label branding',
      'Unlimited team members',
      'Advanced integrations',
      'SLA guarantee',
    ],
    limits: {
      products: -1,
      orders: -1,
      storage: 'Unlimited',
    },
  },
];

export default function PlanSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { data, setData } = useOnboardingStore();

  const [selectedPlan, setSelectedPlan] = useState<PlanId>(data.plan || 'starter');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>(
    data.billingCycle || 'monthly'
  );

  const handleContinue = () => {
    setData({
      plan: selectedPlan,
      billingCycle,
    });

    // Free plan skips payment
    if (selectedPlan === 'starter') {
      router.replace('/success');
    } else {
      router.push('/payment-setup');
    }
  };

  const getPrice = (plan: Plan) => {
    const price = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;
    if (price === 0) {
      return 'Free';
    }
    return `$${price}`;
  };

  const getSavings = (plan: Plan) => {
    if (plan.price.monthly === 0) {
      return null;
    }
    const yearlySavings = plan.price.monthly * 12 - plan.price.yearly;
    return yearlySavings > 0 ? yearlySavings : null;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <IconButton
            icon={<Ionicons color={colors.text} name="arrow-back" size={24} />}
            onPress={() => router.back()}
          />
        </Animated.View>

        {/* Progress Indicator */}
        <Animated.View entering={FadeInDown.delay(150)} style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: '75%', backgroundColor: colors.primary }]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>Step 3 of 4</Text>
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Choose Your Plan</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Start free and upgrade as you grow. No credit card required.
          </Text>
        </Animated.View>

        {/* Billing Toggle */}
        <Animated.View entering={FadeInDown.delay(250)} style={styles.billingToggle}>
          <View style={[styles.toggleContainer, { backgroundColor: colors.surface }]}>
            <Pressable
              style={[
                styles.toggleOption,
                billingCycle === 'monthly' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setBillingCycle('monthly')}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: billingCycle === 'monthly' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Monthly
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.toggleOption,
                billingCycle === 'yearly' && { backgroundColor: colors.primary },
              ]}
              onPress={() => setBillingCycle('yearly')}
            >
              <Text
                style={[
                  styles.toggleText,
                  { color: billingCycle === 'yearly' ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                Yearly
              </Text>
              {billingCycle !== 'yearly' ? (
                <Badge label="Save 17%" size="sm" style={{ marginLeft: 6 }} variant="success" />
              ) : null}
            </Pressable>
          </View>
        </Animated.View>

        {/* Plans */}
        <View style={styles.plansContainer}>
          {PLANS.map((plan, index) => {
            const isSelected = selectedPlan === plan.id;
            const savings = getSavings(plan);

            return (
              <Animated.View key={plan.id} entering={FadeInUp.delay(300 + index * 100).springify()}>
                <Pressable
                  style={[
                    styles.planCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                  onPress={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular ? (
                    <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                      <Ionicons color="#FFFFFF" name="star" size={12} />
                      <Text style={styles.popularText}>Most Popular</Text>
                    </View>
                  ) : null}

                  <View style={styles.planHeader}>
                    <View style={styles.planNameRow}>
                      <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
                      {isSelected ? (
                        <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                          <Ionicons color="#FFFFFF" name="checkmark" size={16} />
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
                      {plan.description}
                    </Text>
                  </View>

                  <View style={styles.priceContainer}>
                    <Text style={[styles.priceAmount, { color: colors.text }]}>
                      {getPrice(plan)}
                    </Text>
                    {plan.price.monthly > 0 ? (
                      <Text style={[styles.pricePeriod, { color: colors.textSecondary }]}>
                        /{billingCycle === 'yearly' ? 'year' : 'month'}
                      </Text>
                    ) : null}
                  </View>

                  {billingCycle === 'yearly' && savings ? (
                    <Text style={[styles.savingsText, { color: colors.success }]}>
                      Save ${savings}/year
                    </Text>
                  ) : null}

                  <View style={styles.featuresContainer}>
                    {plan.features.map((feature, featureIndex) => (
                      <View key={featureIndex} style={styles.featureRow}>
                        <Ionicons color={colors.success} name="checkmark-circle" size={18} />
                        <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <Animated.View
        entering={FadeInUp.delay(600)}
        style={[
          styles.bottomContainer,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom + 16,
            borderTopColor: colors.border,
          },
        ]}
      >
        <Button
          fullWidth
          rightIcon={<Ionicons color="#FFFFFF" name="arrow-forward" size={20} />}
          size="lg"
          title={selectedPlan === 'starter' ? 'Start Free' : 'Continue to Payment'}
          onPress={handleContinue}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  billingToggle: {
    alignItems: 'center',
    marginBottom: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  planHeader: {
    marginBottom: 16,
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  pricePeriod: {
    fontSize: 16,
    marginLeft: 4,
  },
  savingsText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
  },
  featuresContainer: {
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
