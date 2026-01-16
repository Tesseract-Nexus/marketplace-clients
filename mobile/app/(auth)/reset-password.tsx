import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuthStore } from '@/stores/auth-store';
import { useColors } from '@/providers/ThemeProvider';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { validate, resetPasswordSchema } from '@/lib/utils/validation';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { resetPassword, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    const result = validate(resetPasswordSchema, form);
    if (!result.success) {
      setErrors(result.errors || {});
      return;
    }

    if (!token) {
      toast.error('Invalid link', 'Please request a new password reset');
      return;
    }

    setErrors({});

    try {
      await resetPassword(token, form.password);
      setSuccess(true);
      toast.success('Password updated!', 'You can now sign in with your new password');
    } catch (err) {
      toast.error('Reset failed', err instanceof Error ? err.message : 'Please try again');
    }
  };

  if (success) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top + 20 },
        ]}
      >
        <Animated.View entering={FadeInDown} style={styles.successContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.successLight }]}>
            <Ionicons color={colors.success} name="checkmark-circle" size={64} />
          </View>

          <Text style={[styles.successTitle, { color: colors.text }]}>Password Reset Complete</Text>

          <Text style={[styles.successText, { color: colors.textSecondary }]}>
            Your password has been successfully updated.{'\n'}
            You can now sign in with your new password.
          </Text>

          <Button
            fullWidth
            size="lg"
            style={{ marginTop: 32 }}
            title="Sign In"
            onPress={() => router.replace('/login')}
          />
        </Animated.View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top + 20 },
      ]}
    >
      {/* Back Button */}
      <Animated.View entering={FadeInDown.delay(100)}>
        <IconButton
          icon={<Ionicons color={colors.text} name="arrow-back" size={24} />}
          onPress={() => router.back()}
        />
      </Animated.View>

      {/* Icon */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.iconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
          <Ionicons color={colors.primary} name="key" size={48} />
        </View>
      </Animated.View>

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Create New Password</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your new password must be different from previously used passwords.
        </Text>
      </Animated.View>

      {/* Form */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.form}>
        <Input
          containerStyle={styles.inputContainer}
          error={errors.password}
          hint="Must include uppercase, lowercase, and number"
          label="New Password"
          placeholder="Enter new password"
          type="password"
          value={form.password}
          onChangeText={(text) => updateForm('password', text)}
        />

        <Input
          containerStyle={styles.inputContainer}
          error={errors.confirm_password}
          label="Confirm New Password"
          placeholder="Re-enter new password"
          type="password"
          value={form.confirm_password}
          onChangeText={(text) => updateForm('confirm_password', text)}
        />

        <Button
          fullWidth
          loading={isLoading}
          size="lg"
          style={{ marginTop: 24 }}
          title="Reset Password"
          onPress={handleSubmit}
        />

        <Button
          fullWidth
          size="lg"
          style={{ marginTop: 12 }}
          title="Back to Login"
          variant="ghost"
          onPress={() => router.replace('/login')}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
