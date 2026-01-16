import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useAuthStore } from '@/stores/auth-store';
import { useColors } from '@/providers/ThemeProvider';
import { Button, IconButton } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

const handleBack = async (router: ReturnType<typeof useRouter>, logout: () => Promise<void>) => {
  // Logout and go to login since verify-email is reached via replace()
  await logout();
  router.replace('/login');
};

export default function VerifyEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user, verifyEmail, resendVerification, logout, isLoading } = useAuthStore();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-advance
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit
    if (index === 5 && text) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (verificationCode: string) => {
    try {
      // DEV BYPASS: Enter 123456 to skip verification in development
      if (__DEV__ && verificationCode === '123456') {
        toast.success('Dev bypass - Email verified!');
        router.replace('/store-setup');
        return;
      }

      await verifyEmail(verificationCode);
      toast.success('Email verified!');
      router.replace('/store-setup');
    } catch (err) {
      toast.error('Verification failed', err instanceof Error ? err.message : 'Invalid code');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0) {
      return;
    }

    setIsResending(true);
    try {
      await resendVerification();
      setCountdown(60);
      toast.success('Code sent!', 'Check your email');
    } catch (err) {
      toast.error('Failed to resend', err instanceof Error ? err.message : 'Please try again');
    } finally {
      setIsResending(false);
    }
  };

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
          onPress={() => void handleBack(router, logout)}
        />
      </Animated.View>

      {/* Icon */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.iconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
          <Ionicons color={colors.primary} name="mail" size={48} />
        </View>
      </Animated.View>

      {/* Header */}
      <Animated.View entering={FadeInDown.delay(300)} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Verify Your Email</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          We sent a 6-digit code to{'\n'}
          <Text style={{ color: colors.text, fontWeight: '600' }}>{user?.email}</Text>
        </Text>
      </Animated.View>

      {/* Code Inputs */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.codeContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              inputRefs.current[index] = ref;
            }}
            selectTextOnFocus
            keyboardType="number-pad"
            maxLength={1}
            style={[
              styles.codeInput,
              {
                backgroundColor: colors.surface,
                borderColor: digit ? colors.primary : colors.border,
                color: colors.text,
              },
            ]}
            value={digit}
            onChangeText={(text) => handleCodeChange(text.slice(-1), index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
          />
        ))}
      </Animated.View>

      {/* Verify Button */}
      <Animated.View entering={FadeInDown.delay(500)} style={styles.buttonContainer}>
        <Button
          fullWidth
          disabled={code.join('').length !== 6}
          loading={isLoading}
          size="lg"
          title="Verify Email"
          onPress={() => handleVerify(code.join(''))}
        />
      </Animated.View>

      {/* Resend */}
      <Animated.View entering={FadeInDown.delay(600)} style={styles.resendContainer}>
        <Pressable disabled={countdown > 0 || isResending} onPress={handleResend}>
          <Text
            style={[
              styles.resendText,
              { color: countdown > 0 ? colors.textTertiary : colors.primary },
            ]}
          >
            {countdown > 0
              ? `Resend code in ${countdown}s`
              : isResending
                ? 'Sending...'
                : 'Resend verification code'}
          </Text>
        </Pressable>
      </Animated.View>

      {/* Change Email */}
      <Animated.View entering={FadeInDown.delay(700)} style={styles.changeEmailContainer}>
        <Pressable onPress={() => void handleBack(router, logout)}>
          <Text style={[styles.changeEmailText, { color: colors.textSecondary }]}>
            Wrong email? <Text style={{ color: colors.primary }}>Change it</Text>
          </Text>
        </Pressable>
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 40,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 40,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  resendText: {
    fontSize: 15,
    fontWeight: '500',
  },
  changeEmailContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  changeEmailText: {
    fontSize: 14,
  },
});
