import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  TextInput,
  StatusBar,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '@/stores/auth-store';
import { toast } from '@/components/ui/Toast';
import { validate, loginSchema } from '@/lib/utils/validation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Marketplace Theme Colors - Warm & Inviting
const COLORS = {
  // Background
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceLight: '#242424',

  // Primary - Emerald/Teal for trust & commerce
  primary: '#10B981',
  primaryLight: '#34D399',
  primaryDark: '#059669',
  primaryGlow: 'rgba(16, 185, 129, 0.2)',

  // Accent - Warm amber for CTAs
  accent: '#F59E0B',
  accentLight: '#FBBF24',

  // Text
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',

  // Input
  inputBg: '#1F1F1F',
  inputBorder: '#2D2D2D',
  inputFocus: '#10B981',

  // Status
  error: '#EF4444',
  success: '#22C55E',
};

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  // Animations
  const shimmer = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const iconFloat = useSharedValue(0);

  useEffect(() => {
    // Shimmer effect for logo
    shimmer.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.linear }), -1, false);

    // Floating icons animation
    iconFloat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const floatingStyle1 = useAnimatedStyle((): any => {
    'worklet';
    const translateY = interpolate(iconFloat.value, [0, 1], [0, -8]);
    const rotate = interpolate(iconFloat.value, [0, 1], [-5, 5]);
    return {
      transform: [{ translateY }, { rotate: `${rotate}deg` }],
      opacity: interpolate(iconFloat.value, [0, 0.5, 1], [0.3, 0.5, 0.3]),
    };
  });

  const floatingStyle2 = useAnimatedStyle((): any => {
    'worklet';
    const translateY = interpolate(iconFloat.value, [0, 1], [0, 10]);
    const rotate = interpolate(iconFloat.value, [0, 1], [5, -5]);
    return {
      transform: [{ translateY }, { rotate: `${rotate}deg` }],
      opacity: interpolate(iconFloat.value, [0, 0.5, 1], [0.25, 0.45, 0.25]),
    };
  });

  const floatingStyle3 = useAnimatedStyle((): any => {
    'worklet';
    return {
      transform: [{ translateY: interpolate(iconFloat.value, [0, 1], [0, -6]) }],
      opacity: interpolate(iconFloat.value, [0, 0.5, 1], [0.2, 0.4, 0.2]),
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle((): any => {
    'worklet';
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handleLogin = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearError();

    // Normalize email to lowercase for API compatibility
    const normalizedEmail = email.toLowerCase().trim();

    const result = validate(loginSchema, { email: normalizedEmail, password });
    if (!result.success) {
      setErrors(result.errors || {});
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setErrors({});

    try {
      await login({ email: normalizedEmail, password });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('Welcome back!');
    } catch (err) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error('Login failed', err instanceof Error ? err.message : 'Please try again');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Gradient Background */}
      <LinearGradient
        colors={['#0F0F0F', '#1A1A1A', '#0F0F0F']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating marketplace icons */}
      <Animated.View style={[styles.floatingIcon, styles.floatingIcon1, floatingStyle1]}>
        <Ionicons color={COLORS.primary} name="cart" size={28} />
      </Animated.View>
      <Animated.View style={[styles.floatingIcon, styles.floatingIcon2, floatingStyle2]}>
        <Ionicons color={COLORS.accent} name="storefront" size={24} />
      </Animated.View>
      <Animated.View style={[styles.floatingIcon, styles.floatingIcon3, floatingStyle3]}>
        <Ionicons color={COLORS.primaryLight} name="bag-handle" size={22} />
      </Animated.View>

      {/* Gradient orbs */}
      <View style={[styles.gradientOrb, styles.orb1]} />
      <View style={[styles.gradientOrb, styles.orb2]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <Animated.View entering={FadeIn.delay(100).duration(400)}>
            <Pressable
              style={styles.backButton}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Check if we can go back, otherwise go to index
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
            >
              <Ionicons color={COLORS.text} name="chevron-back" size={24} />
            </Pressable>
          </Animated.View>

          {/* Logo & Brand */}
          <Animated.View
            entering={FadeInDown.delay(150).duration(600).springify()}
            style={styles.brandSection}
          >
            {/* Logo with glow */}
            <View style={styles.logoContainer}>
              <View style={styles.logoGlow} />
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={styles.logo}
              >
                <Ionicons color="#FFFFFF" name="cube" size={32} />
              </LinearGradient>
            </View>
            <Text style={styles.brandName}>TESSERACT</Text>
            <Text style={styles.brandTagline}>Your Marketplace Hub</Text>
          </Animated.View>

          {/* Welcome Text */}
          <Animated.View entering={FadeInDown.delay(250).duration(500)} style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to manage your store and connect with customers
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(350).duration(500)} style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email address</Text>
              <View
                style={[
                  styles.inputContainer,
                  emailFocused && styles.inputFocused,
                  errors.email && styles.inputError,
                ]}
              >
                <View style={[styles.inputIconBox, emailFocused && styles.inputIconBoxActive]}>
                  <Ionicons
                    color={emailFocused ? COLORS.primary : COLORS.textMuted}
                    name="mail"
                    size={18}
                  />
                </View>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.textMuted}
                  returnKeyType="next"
                  style={styles.input}
                  value={email}
                  onBlur={() => setEmailFocused(false)}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors((prev) => ({ ...prev, email: '' }));
                    }
                  }}
                  onFocus={() => setEmailFocused(true)}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  passwordFocused && styles.inputFocused,
                  errors.password && styles.inputError,
                ]}
              >
                <View style={[styles.inputIconBox, passwordFocused && styles.inputIconBoxActive]}>
                  <Ionicons
                    color={passwordFocused ? COLORS.primary : COLORS.textMuted}
                    name="lock-closed"
                    size={18}
                  />
                </View>
                <TextInput
                  ref={passwordRef}
                  autoCapitalize="none"
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textMuted}
                  returnKeyType="done"
                  secureTextEntry={!showPassword}
                  style={styles.input}
                  value={password}
                  onBlur={() => setPasswordFocused(false)}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: '' }));
                    }
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onSubmitEditing={handleLogin}
                />
                <Pressable
                  style={styles.eyeButton}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowPassword(!showPassword);
                  }}
                >
                  <Ionicons
                    color={COLORS.textMuted}
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                  />
                </Pressable>
              </View>
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>

            {/* Forgot Password */}
            <Link asChild href="/forgot-password">
              <Pressable
                style={styles.forgotButton}
                onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <Text style={styles.forgotText}>Forgot your password?</Text>
              </Pressable>
            </Link>

            {/* Error Banner */}
            {error ? (
              <Animated.View entering={FadeIn.duration(200)} style={styles.errorBanner}>
                <Ionicons color={COLORS.error} name="alert-circle" size={18} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </Animated.View>
            ) : null}

            {/* Sign In Button */}
            <AnimatedPressable
              disabled={isLoading}
              style={[styles.signInButton, buttonAnimatedStyle]}
              onPress={handleLogin}
              onPressIn={() => {
                buttonScale.value = withSpring(0.97);
              }}
              onPressOut={() => {
                buttonScale.value = withSpring(1);
              }}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                end={{ x: 1, y: 0 }}
                start={{ x: 0, y: 0 }}
                style={styles.signInGradient}
              >
                {isLoading ? (
                  <Text style={styles.signInText}>Signing in...</Text>
                ) : (
                  <>
                    <Text style={styles.signInText}>Sign In to Marketplace</Text>
                    <Ionicons color="#FFFFFF" name="arrow-forward" size={20} />
                  </>
                )}
              </LinearGradient>
            </AnimatedPressable>
          </Animated.View>

          {/* Divider */}
          <Animated.View entering={FadeInDown.delay(450).duration(400)} style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* Social Login */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.socialRow}>
            <Pressable
              style={styles.socialButton}
              onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Ionicons color="#EA4335" name="logo-google" size={22} />
            </Pressable>
            <Pressable
              style={styles.socialButton}
              onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Ionicons color={COLORS.text} name="logo-apple" size={22} />
            </Pressable>
            <Pressable
              style={styles.socialButton}
              onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Ionicons color="#1877F2" name="logo-facebook" size={22} />
            </Pressable>
          </Animated.View>

          {/* Sign Up */}
          <Animated.View entering={FadeInDown.delay(550).duration(400)} style={styles.signUpRow}>
            <Text style={styles.signUpText}>New to Tesseract? </Text>
            <Link asChild href="/register">
              <Pressable
                onPress={() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <Text style={styles.signUpLink}>Create an account</Text>
              </Pressable>
            </Link>
          </Animated.View>

          {/* Trust indicators */}
          <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.trustSection}>
            <View style={styles.trustItem}>
              <Ionicons color={COLORS.primary} name="shield-checkmark" size={16} />
              <Text style={styles.trustText}>Secure</Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustItem}>
              <Ionicons color={COLORS.primary} name="lock-closed" size={16} />
              <Text style={styles.trustText}>Encrypted</Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustItem}>
              <Ionicons color={COLORS.primary} name="people" size={16} />
              <Text style={styles.trustText}>10K+ Sellers</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },

  // Floating icons
  floatingIcon: {
    position: 'absolute',
    zIndex: 1,
  },
  floatingIcon1: {
    top: 120,
    right: 30,
  },
  floatingIcon2: {
    top: 200,
    left: 20,
  },
  floatingIcon3: {
    top: 280,
    right: 50,
  },

  // Gradient orbs
  gradientOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 300,
    height: 300,
    backgroundColor: COLORS.primaryGlow,
    top: -100,
    right: -100,
    opacity: 0.5,
  },
  orb2: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    bottom: 100,
    left: -80,
    opacity: 0.4,
  },

  // Back button
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  // Brand section
  brandSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  logoContainer: {
    position: 'relative',
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryGlow,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 3,
    marginTop: 14,
  },
  brandTagline: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  // Form
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    height: 54,
    paddingRight: 12,
  },
  inputFocused: {
    borderColor: COLORS.inputFocus,
    backgroundColor: '#1A1F1A',
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputIconBox: {
    width: 46,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.inputBorder,
  },
  inputIconBoxActive: {
    borderRightColor: COLORS.inputFocus,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingHorizontal: 14,
    height: '100%',
  },
  eyeButton: {
    padding: 8,
  },
  errorText: {
    fontSize: 13,
    color: COLORS.error,
    marginLeft: 2,
  },

  // Forgot
  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.error,
    fontWeight: '500',
  },

  // Sign in button
  signInButton: {
    marginTop: 6,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  signInGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    gap: 8,
  },
  signInText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.inputBorder,
  },
  dividerText: {
    fontSize: 13,
    color: COLORS.textMuted,
    paddingHorizontal: 14,
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sign up
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  signUpText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  signUpLink: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },

  // Trust section
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.inputBorder,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  trustDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: 12,
  },
});
