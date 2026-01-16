import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { useColors } from '@/providers/ThemeProvider';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const COUNTRIES = [
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'AE', name: 'UAE', dialCode: '+971' },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
];

export default function BusinessDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { data, setData } = useOnboardingStore();

  const [form, setForm] = useState({
    businessName: data.businessName || '',
    address: data.address || '',
    city: data.city || '',
    state: data.state || '',
    zipCode: data.zipCode || '',
    country: data.country || 'US',
    phone: data.phone || '',
    currency: data.currency || 'USD',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const selectedCountry = COUNTRIES.find((c) => c.code === form.country);
  const selectedCurrency = CURRENCIES.find((c) => c.code === form.currency);

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (!form.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    if (!form.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (!form.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!form.zipCode.trim()) {
      newErrors.zipCode = 'ZIP/Postal code is required';
    }
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setData({
      businessName: form.businessName.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      zipCode: form.zipCode.trim(),
      country: form.country,
      phone: form.phone.trim(),
      currency: form.currency,
    });

    router.push('/plan-selection');
  };

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
            icon={<Ionicons color={colors.text} name="arrow-back" size={24} />}
            onPress={() => router.back()}
          />
        </Animated.View>

        {/* Progress Indicator */}
        <Animated.View entering={FadeInDown.delay(150)} style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: '50%', backgroundColor: colors.primary }]}
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>Step 2 of 4</Text>
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Business Details</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Tell us about your business for invoices and shipping.
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.form}>
          <Input
            containerStyle={styles.inputContainer}
            error={errors.businessName}
            label="Legal Business Name"
            placeholder="Acme Inc."
            value={form.businessName}
            onChangeText={(text) => updateForm('businessName', text)}
          />

          <Input
            containerStyle={styles.inputContainer}
            error={errors.address}
            label="Street Address"
            placeholder="123 Main Street"
            value={form.address}
            onChangeText={(text) => updateForm('address', text)}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Input
                error={errors.city}
                label="City"
                placeholder="New York"
                value={form.city}
                onChangeText={(text) => updateForm('city', text)}
              />
            </View>
            <View style={styles.halfField}>
              <Input
                error={errors.state}
                label="State/Province"
                placeholder="NY"
                value={form.state}
                onChangeText={(text) => updateForm('state', text)}
              />
            </View>
          </View>

          <View style={[styles.row, { marginTop: 16 }]}>
            <View style={styles.halfField}>
              <Input
                error={errors.zipCode}
                keyboardType="numeric"
                label="ZIP/Postal Code"
                placeholder="10001"
                value={form.zipCode}
                onChangeText={(text) => updateForm('zipCode', text)}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.pickerLabel, { color: colors.text }]}>Country</Text>
              <Pressable
                style={[
                  styles.pickerButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => setShowCountryPicker(!showCountryPicker)}
              >
                <Text style={[styles.pickerText, { color: colors.text }]}>
                  {selectedCountry?.name || 'Select'}
                </Text>
                <Ionicons color={colors.textSecondary} name="chevron-down" size={20} />
              </Pressable>
            </View>
          </View>

          {showCountryPicker ? (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={[
                styles.pickerDropdown,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {COUNTRIES.map((country) => (
                <Pressable
                  key={country.code}
                  style={[
                    styles.pickerOption,
                    form.country === country.code && { backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => {
                    updateForm('country', country.code);
                    setShowCountryPicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, { color: colors.text }]}>
                    {country.name}
                  </Text>
                  {form.country === country.code ? (
                    <Ionicons color={colors.primary} name="checkmark" size={20} />
                  ) : null}
                </Pressable>
              ))}
            </Animated.View>
          ) : null}

          <View style={[styles.row, { marginTop: 16 }]}>
            <View style={styles.halfField}>
              <Input
                error={errors.phone}
                keyboardType="phone-pad"
                label="Phone Number"
                leftElement={
                  <Text style={{ color: colors.textSecondary, marginRight: 4 }}>
                    {selectedCountry?.dialCode}
                  </Text>
                }
                placeholder="(555) 123-4567"
                value={form.phone}
                onChangeText={(text) => updateForm('phone', text)}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.pickerLabel, { color: colors.text }]}>Currency</Text>
              <Pressable
                style={[
                  styles.pickerButton,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
              >
                <Text style={[styles.pickerText, { color: colors.text }]}>
                  {selectedCurrency?.symbol} {selectedCurrency?.code}
                </Text>
                <Ionicons color={colors.textSecondary} name="chevron-down" size={20} />
              </Pressable>
            </View>
          </View>

          {showCurrencyPicker ? (
            <Animated.View
              entering={FadeInDown.duration(200)}
              style={[
                styles.pickerDropdown,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {CURRENCIES.map((currency) => (
                <Pressable
                  key={currency.code}
                  style={[
                    styles.pickerOption,
                    form.currency === currency.code && { backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => {
                    updateForm('currency', currency.code);
                    setShowCurrencyPicker(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, { color: colors.text }]}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </Text>
                  {form.currency === currency.code ? (
                    <Ionicons color={colors.primary} name="checkmark" size={20} />
                  ) : null}
                </Pressable>
              ))}
            </Animated.View>
          ) : null}
        </Animated.View>

        {/* Continue Button */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.buttonContainer}>
          <Button
            fullWidth
            rightIcon={<Ionicons color="#FFFFFF" name="arrow-forward" size={20} />}
            size="lg"
            title="Continue"
            onPress={handleContinue}
          />
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
  form: {
    flex: 1,
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
  pickerLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  pickerText: {
    fontSize: 16,
  },
  pickerDropdown: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerOptionText: {
    fontSize: 15,
  },
  buttonContainer: {
    marginTop: 24,
  },
});
