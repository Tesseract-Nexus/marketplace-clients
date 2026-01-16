import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useColors } from '@/providers/ThemeProvider';
import { ScreenHeader } from '@/components/admin';
import { Button } from '@/components/ui/Button';

type CouponType = 'percentage' | 'fixed_amount' | 'free_shipping';

interface CouponFormData {
  code: string;
  name: string;
  description: string;
  type: CouponType;
  value: string;
  minOrderAmount: string;
  maxDiscount: string;
  usageLimit: string;
  perCustomerLimit: string;
  startsAt: Date | null;
  expiresAt: Date | null;
  isActive: boolean;
  excludeSaleItems: boolean;
  firstOrderOnly: boolean;
}

const couponTypes = [
  {
    id: 'percentage' as CouponType,
    label: 'Percentage',
    icon: 'git-branch',
    example: 'e.g., 20% off',
  },
  {
    id: 'fixed_amount' as CouponType,
    label: 'Fixed Amount',
    icon: 'cash',
    example: 'e.g., $10 off',
  },
  {
    id: 'free_shipping' as CouponType,
    label: 'Free Shipping',
    icon: 'car',
    example: 'Free delivery',
  },
];

export default function CouponFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!params.id;
  const insets = useSafeAreaInsets();
  const colors = useColors();

  const [formData, setFormData] = useState<CouponFormData>({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    perCustomerLimit: '1',
    startsAt: null,
    expiresAt: null,
    isActive: true,
    excludeSaleItems: false,
    firstOrderOnly: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  const updateField = <K extends keyof CouponFormData>(key: K, value: CouponFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    updateField('code', code);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      router.back();
    }, 1000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        subtitle={isEditing ? `Editing ${params.id}` : 'Create a discount code'}
        title={isEditing ? 'Edit Coupon' : 'New Coupon'}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Coupon Code */}
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Coupon Code</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Customers will enter this code at checkout
              </Text>

              <View style={styles.codeInputRow}>
                <TextInput
                  autoCapitalize="characters"
                  maxLength={15}
                  placeholder="SUMMER20"
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.codeInput,
                    { backgroundColor: `${colors.text}08`, color: colors.text },
                  ]}
                  value={formData.code}
                  onChangeText={(v) => updateField('code', v.toUpperCase())}
                />
                <Pressable
                  style={[styles.generateBtn, { backgroundColor: colors.primary }]}
                  onPress={generateCode}
                >
                  <Ionicons color="#FFFFFF" name="shuffle" size={20} />
                </Pressable>
              </View>

              <TextInput
                placeholder="Coupon name (internal use)"
                placeholderTextColor={colors.textTertiary}
                style={[styles.input, { backgroundColor: `${colors.text}08`, color: colors.text }]}
                value={formData.name}
                onChangeText={(v) => updateField('name', v)}
              />

              <TextInput
                multiline
                numberOfLines={3}
                placeholder="Description (optional)"
                placeholderTextColor={colors.textTertiary}
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: `${colors.text}08`, color: colors.text },
                ]}
                value={formData.description}
                onChangeText={(v) => updateField('description', v)}
              />
            </View>
          </Animated.View>

          {/* Discount Type */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Discount Type</Text>

              <View style={styles.typeGrid}>
                {couponTypes.map((type) => (
                  <Pressable
                    key={type.id}
                    style={[
                      styles.typeCard,
                      {
                        backgroundColor:
                          formData.type === type.id ? `${colors.primary}15` : `${colors.text}05`,
                        borderColor: formData.type === type.id ? colors.primary : 'transparent',
                      },
                    ]}
                    onPress={() => {
                      updateField('type', type.id);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <View
                      style={[
                        styles.typeIcon,
                        {
                          backgroundColor:
                            formData.type === type.id ? colors.primary : `${colors.text}10`,
                        },
                      ]}
                    >
                      <Ionicons
                        color={formData.type === type.id ? '#FFFFFF' : colors.textSecondary}
                        name={type.icon as any}
                        size={20}
                      />
                    </View>
                    <Text
                      style={[
                        styles.typeLabel,
                        {
                          color: formData.type === type.id ? colors.primary : colors.text,
                        },
                      ]}
                    >
                      {type.label}
                    </Text>
                    <Text style={[styles.typeExample, { color: colors.textSecondary }]}>
                      {type.example}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {formData.type !== 'free_shipping' ? (
                <View style={styles.valueInputRow}>
                  <Text style={[styles.valuePrefix, { color: colors.textSecondary }]}>
                    {formData.type === 'percentage' ? '%' : '$'}
                  </Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    placeholder={formData.type === 'percentage' ? '20' : '10.00'}
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      styles.valueInput,
                      { backgroundColor: `${colors.text}08`, color: colors.text },
                    ]}
                    value={formData.value}
                    onChangeText={(v) => updateField('value', v.replace(/[^0-9.]/g, ''))}
                  />
                  {formData.type === 'percentage' ? (
                    <Text style={[styles.valueSuffix, { color: colors.textSecondary }]}>off</Text>
                  ) : null}
                </View>
              ) : null}

              {formData.type === 'percentage' ? (
                <View style={styles.inputWithLabel}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Maximum discount (optional)
                  </Text>
                  <View style={styles.currencyInput}>
                    <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>$</Text>
                    <TextInput
                      keyboardType="decimal-pad"
                      placeholder="100.00"
                      placeholderTextColor={colors.textTertiary}
                      style={[
                        styles.input,
                        { backgroundColor: `${colors.text}08`, color: colors.text, flex: 1 },
                      ]}
                      value={formData.maxDiscount}
                      onChangeText={(v) => updateField('maxDiscount', v.replace(/[^0-9.]/g, ''))}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          </Animated.View>

          {/* Requirements */}
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Requirements</Text>

              <View style={styles.inputWithLabel}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Minimum order amount
                </Text>
                <View style={styles.currencyInput}>
                  <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>$</Text>
                  <TextInput
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.textTertiary}
                    style={[
                      styles.input,
                      { backgroundColor: `${colors.text}08`, color: colors.text, flex: 1 },
                    ]}
                    value={formData.minOrderAmount}
                    onChangeText={(v) => updateField('minOrderAmount', v.replace(/[^0-9.]/g, ''))}
                  />
                </View>
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>
                    Exclude sale items
                  </Text>
                  <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                    Coupon won't apply to discounted products
                  </Text>
                </View>
                <Switch
                  thumbColor={formData.excludeSaleItems ? colors.primary : colors.textSecondary}
                  trackColor={{ false: colors.border, true: `${colors.primary}50` }}
                  value={formData.excludeSaleItems}
                  onValueChange={(v) => updateField('excludeSaleItems', v)}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>First order only</Text>
                  <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                    Only valid for customer's first purchase
                  </Text>
                </View>
                <Switch
                  thumbColor={formData.firstOrderOnly ? colors.primary : colors.textSecondary}
                  trackColor={{ false: colors.border, true: `${colors.primary}50` }}
                  value={formData.firstOrderOnly}
                  onValueChange={(v) => updateField('firstOrderOnly', v)}
                />
              </View>
            </View>
          </Animated.View>

          {/* Usage Limits */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Usage Limits</Text>

              <View style={styles.inputWithLabel}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Total usage limit
                </Text>
                <TextInput
                  keyboardType="number-pad"
                  placeholder="Unlimited"
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.input,
                    { backgroundColor: `${colors.text}08`, color: colors.text },
                  ]}
                  value={formData.usageLimit}
                  onChangeText={(v) => updateField('usageLimit', v.replace(/[^0-9]/g, ''))}
                />
              </View>

              <View style={styles.inputWithLabel}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Limit per customer
                </Text>
                <TextInput
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor={colors.textTertiary}
                  style={[
                    styles.input,
                    { backgroundColor: `${colors.text}08`, color: colors.text },
                  ]}
                  value={formData.perCustomerLimit}
                  onChangeText={(v) => updateField('perCustomerLimit', v.replace(/[^0-9]/g, ''))}
                />
              </View>
            </View>
          </Animated.View>

          {/* Schedule */}
          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Schedule</Text>

              <View style={styles.dateRow}>
                <Pressable
                  style={[styles.dateBtn, { backgroundColor: `${colors.text}08` }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // For now, set to current date + options
                    Alert.alert('Start Date', 'When should this coupon become active?', [
                      { text: 'Immediately', onPress: () => updateField('startsAt', null) },
                      {
                        text: 'Tomorrow',
                        onPress: () => updateField('startsAt', new Date(Date.now() + 86400000)),
                      },
                      {
                        text: 'Next Week',
                        onPress: () => updateField('startsAt', new Date(Date.now() + 7 * 86400000)),
                      },
                      { text: 'Cancel', style: 'cancel' },
                    ]);
                  }}
                >
                  <Ionicons color={colors.textSecondary} name="calendar-outline" size={20} />
                  <View>
                    <Text style={[styles.dateBtnLabel, { color: colors.textSecondary }]}>
                      Starts
                    </Text>
                    <Text style={[styles.dateBtnValue, { color: colors.text }]}>
                      {formData.startsAt ? formData.startsAt.toLocaleDateString() : 'Immediately'}
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  style={[styles.dateBtn, { backgroundColor: `${colors.text}08` }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert('Expiry Date', 'When should this coupon expire?', [
                      { text: 'Never', onPress: () => updateField('expiresAt', null) },
                      {
                        text: '7 Days',
                        onPress: () =>
                          updateField('expiresAt', new Date(Date.now() + 7 * 86400000)),
                      },
                      {
                        text: '30 Days',
                        onPress: () =>
                          updateField('expiresAt', new Date(Date.now() + 30 * 86400000)),
                      },
                      {
                        text: '90 Days',
                        onPress: () =>
                          updateField('expiresAt', new Date(Date.now() + 90 * 86400000)),
                      },
                      { text: 'Cancel', style: 'cancel' },
                    ]);
                  }}
                >
                  <Ionicons color={colors.textSecondary} name="calendar-outline" size={20} />
                  <View>
                    <Text style={[styles.dateBtnLabel, { color: colors.textSecondary }]}>
                      Expires
                    </Text>
                    <Text style={[styles.dateBtnValue, { color: colors.text }]}>
                      {formData.expiresAt ? formData.expiresAt.toLocaleDateString() : 'Never'}
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* Date pickers handled through platform-specific UI */}
            </View>
          </Animated.View>

          {/* Status */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={[styles.toggleLabel, { color: colors.text }]}>Active</Text>
                  <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>
                    Coupon can be used by customers
                  </Text>
                </View>
                <Switch
                  thumbColor={formData.isActive ? colors.success : colors.textSecondary}
                  trackColor={{ false: colors.border, true: `${colors.success}50` }}
                  value={formData.isActive}
                  onValueChange={(v) => updateField('isActive', v)}
                />
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom Actions */}
        <View
          style={[
            styles.bottomActions,
            { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <Button
            style={{ flex: 1 }}
            title="Cancel"
            variant="outline"
            onPress={() => router.back()}
          />
          <Button
            loading={isLoading}
            style={{ flex: 2 }}
            title={isEditing ? 'Save Changes' : 'Create Coupon'}
            variant="primary"
            onPress={handleSave}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  codeInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  codeInput: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  generateBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  typeExample: {
    fontSize: 11,
    textAlign: 'center',
  },
  valueInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valuePrefix: {
    fontSize: 24,
    fontWeight: '600',
  },
  valueInput: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 28,
    fontWeight: '700',
  },
  valueSuffix: {
    fontSize: 18,
    fontWeight: '500',
  },
  inputWithLabel: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  currencyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '500',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 16,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  dateBtnLabel: {
    fontSize: 12,
  },
  dateBtnValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
});
