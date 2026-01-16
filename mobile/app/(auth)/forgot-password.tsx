import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuthStore } from '@/stores/auth-store';
import { useColors } from '@/providers/ThemeProvider';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/Toast';
import { validate, forgotPasswordSchema } from '@/lib/utils/validation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { forgotPassword, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const result = validate(forgotPasswordSchema, { email });
    if (!result.success) {
      setErrors(result.errors || {});
      return;
    }

    setErrors({});

    try {
      await forgotPassword(email);
      setSent(true);
      toast.success('Email sent!', 'Check your inbox for reset instructions');
    } catch (err) {
      toast.error('Failed to send', err instanceof Error ? err.message : 'Please try again');
    }
  };

  if (sent) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top + 20 },
        ]}
      >
        <Animated.View entering={FadeInDown} style={styles.successContainer}>
          <View style={[styles.iconCircle, { backgroundColor: colors.successLight }]}>
            <Ionicons color={colors.success} name="checkmark" size={48} />
          </View>

          <Text style={[styles.successTitle, { color: colors.text }]}>Check Your Email</Text>

          <Text style={[styles.successText, { color: colors.textSecondary }]}>
            We've sent password reset instructions to{'\n'}
            <Text style={{ color: colors.text, fontWeight: '600' }}>{email}</Text>
          </Text>

          <Button
            fullWidth
            size="lg"
            style={{ marginTop: 32 }}
            title="Open Email App"
            onPress={() => {
              // Could use expo-linking to open email app
            }}
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
          <Ionicons color={colors.primary} name="lock-open" size={48} />
        </View>
      </Animated.View>

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Forgot Password?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          No worries! Enter your email and we'll send you reset instructions.
        </Text>
      </Animated.View>

      {/* Form */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.form}>
        <Input
          autoFocus
          error={errors.email}
          label="Email Address"
          placeholder="Enter your email"
          type="email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errors.email) {
              setErrors({});
            }
          }}
        />

        <Button
          fullWidth
          loading={isLoading}
          size="lg"
          style={{ marginTop: 24 }}
          title="Send Reset Link"
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
