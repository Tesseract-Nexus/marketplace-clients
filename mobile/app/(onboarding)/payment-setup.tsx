import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { useColors } from '@/providers/ThemeProvider';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';

const PLAN_DETAILS: Record<string, { name: string; price: { monthly: number; yearly: number } }> = {
  growth: { name: 'Growth', price: { monthly: 29, yearly: 290 } },
  enterprise: { name: 'Enterprise', price: { monthly: 99, yearly: 990 } },
};

export default function PaymentSetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { data, setData, createStore, isCreating } = useOnboardingStore();

  const plan = PLAN_DETAILS[data.plan || 'growth'];
  const price = data.billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;

  const [form, setForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateForm = (field: string, value: string) => {
    let formattedValue = value;

    // Format card number with spaces
    if (field === 'cardNumber') {
      formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{4})(?=\d)/g, '$1 ')
        .slice(0, 19);
    }

    // Format expiry date
    if (field === 'expiryDate') {
      formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(?=\d)/, '$1/')
        .slice(0, 5);
    }

    // Limit CVV
    if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setForm((prev) => ({ ...prev, [field]: formattedValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateCard = () => {
    const newErrors: Record<string, string> = {};

    const cardNumber = form.cardNumber.replace(/\s/g, '');
    if (!cardNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (cardNumber.length < 15) {
      newErrors.cardNumber = 'Invalid card number';
    }

    if (!form.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      const [month, year] = form.expiryDate.split('/');
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      if (!month || !year || parseInt(month) > 12 || parseInt(month) < 1) {
        newErrors.expiryDate = 'Invalid expiry date';
      } else if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        newErrors.expiryDate = 'Card has expired';
      }
    }

    if (!form.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (form.cvv.length < 3) {
      newErrors.cvv = 'Invalid CVV';
    }

    if (!form.cardholderName.trim()) {
      newErrors.cardholderName = 'Cardholder name is required';
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateCard();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      // In real app, this would tokenize the card with Stripe/payment provider
      // and send the token to the backend
      setData({
        paymentMethod: {
          last4: form.cardNumber.slice(-4),
          brand: getCardBrand(form.cardNumber),
          expiryMonth: parseInt(form.expiryDate.split('/')[0]),
          expiryYear: parseInt(form.expiryDate.split('/')[1]) + 2000,
        },
      });

      await createStore();
      router.replace('/success');
    } catch (err) {
      toast.error('Payment failed', err instanceof Error ? err.message : 'Please try again');
    }
  };

  const getCardBrand = (number: string): string => {
    const cleanNumber = number.replace(/\s/g, '');
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
    return 'unknown';
  };

  const cardBrand = getCardBrand(form.cardNumber);
  const cardIcon = {
    visa: 'card',
    mastercard: 'card',
    amex: 'card',
    discover: 'card',
    unknown: 'card-outline',
  }[cardBrand];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <IconButton
            icon={<Ionicons name="arrow-back" size={24} color={colors.text} />}
            onPress={() => router.back()}
          />
        </Animated.View>

        {/* Progress Indicator */}
        <Animated.View entering={FadeInDown.delay(150)} style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%', backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>Step 4 of 4</Text>
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Payment Details</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Secure payment powered by Stripe. Cancel anytime.
          </Text>
        </Animated.View>

        {/* Order Summary */}
        <Animated.View
          entering={FadeInDown.delay(250)}
          style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Plan</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{plan.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Billing</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {data.billingCycle === 'yearly' ? 'Annual' : 'Monthly'}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              ${price}/{data.billingCycle === 'yearly' ? 'year' : 'month'}
            </Text>
          </View>
        </Animated.View>

        {/* Payment Form */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.form}>
          <Input
            label="Card Number"
            placeholder="1234 5678 9012 3456"
            value={form.cardNumber}
            onChangeText={(text) => updateForm('cardNumber', text)}
            error={errors.cardNumber}
            keyboardType="numeric"
            rightElement={<Ionicons name={cardIcon as any} size={24} color={colors.textSecondary} />}
            containerStyle={styles.inputContainer}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Input
                label="Expiry Date"
                placeholder="MM/YY"
                value={form.expiryDate}
                onChangeText={(text) => updateForm('expiryDate', text)}
                error={errors.expiryDate}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfField}>
              <Input
                label="CVV"
                placeholder="123"
                value={form.cvv}
                onChangeText={(text) => updateForm('cvv', text)}
                error={errors.cvv}
                keyboardType="numeric"
                secureTextEntry
              />
            </View>
          </View>

          <Input
            label="Cardholder Name"
            placeholder="John Doe"
            value={form.cardholderName}
            onChangeText={(text) => updateForm('cardholderName', text)}
            error={errors.cardholderName}
            autoCapitalize="words"
            containerStyle={[styles.inputContainer, { marginTop: 16 }]}
          />
        </Animated.View>

        {/* Security Note */}
        <Animated.View entering={FadeInDown.delay(350)} style={styles.securityNote}>
          <Ionicons name="lock-closed" size={16} color={colors.textTertiary} />
          <Text style={[styles.securityText, { color: colors.textTertiary }]}>
            Your payment information is encrypted and secure.
          </Text>
        </Animated.View>

        {/* Submit Button */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.buttonContainer}>
          <Button
            title={`Pay $${price} and Start`}
            size="lg"
            fullWidth
            loading={isCreating}
            onPress={handleSubmit}
          />

          <Pressable style={styles.termsLink}>
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              By subscribing, you agree to our{' '}
              <Text style={{ color: colors.primary }}>Terms</Text> and{' '}
              <Text style={{ color: colors.primary }}>Privacy Policy</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  form: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  securityText: {
    fontSize: 13,
  },
  buttonContainer: {
    gap: 16,
  },
  termsLink: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
});
