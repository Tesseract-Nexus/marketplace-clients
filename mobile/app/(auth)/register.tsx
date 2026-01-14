import { useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuthStore } from '@/stores/auth-store';
import { useColors } from '@/providers/ThemeProvider';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { validate, registerSchema } from '@/lib/utils/validation';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    accept_terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateForm = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleRegister = async () => {
    clearError();

    const result = validate(registerSchema, form);
    if (!result.success) {
      setErrors(result.errors || {});
      return;
    }

    setErrors({});

    try {
      await register({
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
      });
      toast.success('Account created!', 'Please verify your email');
      router.replace('/verify-email');
    } catch (err) {
      toast.error('Registration failed', err instanceof Error ? err.message : 'Please try again');
    }
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
            icon={<Ionicons name="arrow-back" size={24} color={colors.text} />}
            onPress={() => router.back()}
            style={styles.backButton}
          />
        </Animated.View>

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Start building your online store today
          </Text>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInDown.delay(300)} style={styles.form}>
          {/* Name Row */}
          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <Input
                label="First Name"
                placeholder="John"
                value={form.first_name}
                onChangeText={(text) => updateForm('first_name', text)}
                error={errors.first_name}
              />
            </View>
            <View style={styles.nameField}>
              <Input
                label="Last Name"
                placeholder="Doe"
                value={form.last_name}
                onChangeText={(text) => updateForm('last_name', text)}
                error={errors.last_name}
              />
            </View>
          </View>

          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            value={form.email}
            onChangeText={(text) => updateForm('email', text)}
            error={errors.email}
            containerStyle={styles.inputContainer}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Minimum 8 characters"
            value={form.password}
            onChangeText={(text) => updateForm('password', text)}
            error={errors.password}
            hint="Must include uppercase, lowercase, and number"
            containerStyle={styles.inputContainer}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter your password"
            value={form.confirm_password}
            onChangeText={(text) => updateForm('confirm_password', text)}
            error={errors.confirm_password}
            containerStyle={styles.inputContainer}
          />

          {/* Terms Checkbox */}
          <Pressable
            style={styles.termsContainer}
            onPress={() => updateForm('accept_terms', !form.accept_terms)}
          >
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: form.accept_terms ? colors.primary : 'transparent',
                  borderColor: errors.accept_terms ? colors.error : form.accept_terms ? colors.primary : colors.border,
                },
              ]}
            >
              {form.accept_terms && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
              I agree to the{' '}
              <Text style={{ color: colors.primary }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: colors.primary }}>Privacy Policy</Text>
            </Text>
          </Pressable>
          {errors.accept_terms && (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.accept_terms}
            </Text>
          )}

          {/* Error Message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          {/* Register Button */}
          <Button
            title="Create Account"
            size="lg"
            fullWidth
            loading={isLoading}
            onPress={handleRegister}
            style={styles.registerButton}
          />
        </Animated.View>

        {/* Divider */}
        <Animated.View entering={FadeInDown.delay(400)} style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textTertiary }]}>
            or continue with
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </Animated.View>

        {/* Social Login */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.socialContainer}>
          <Pressable
            style={[
              styles.socialButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="logo-google" size={24} color="#DB4437" />
          </Pressable>

          <Pressable
            style={[
              styles.socialButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="logo-apple" size={24} color={colors.text} />
          </Pressable>
        </Animated.View>

        {/* Sign In Link */}
        <Animated.View entering={FadeInDown.delay(600)} style={styles.signinContainer}>
          <Text style={[styles.signinText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Link href="/login" asChild>
            <Pressable>
              <Text style={[styles.signinLink, { color: colors.primary }]}>
                Sign In
              </Text>
            </Pressable>
          </Link>
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
  backButton: {
    alignSelf: 'flex-start',
  },
  header: {
    marginTop: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  form: {
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  nameField: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    marginTop: 4,
  },
  registerButton: {
    marginTop: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signinText: {
    fontSize: 15,
  },
  signinLink: {
    fontSize: 15,
    fontWeight: '600',
  },
});
