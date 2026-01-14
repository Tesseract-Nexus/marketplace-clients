import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { useColors } from '@/providers/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { confetti } from '@/lib/utils/helpers';

const CONFETTI_PIECES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'][i % 6],
  left: Math.random() * 100,
  delay: Math.random() * 500,
  duration: 2000 + Math.random() * 1000,
}));

function ConfettiPiece({ piece }: { piece: typeof CONFETTI_PIECES[0] }) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      piece.delay,
      withTiming(500, { duration: piece.duration })
    );
    translateX.value = withDelay(
      piece.delay,
      withSequence(
        withTiming((Math.random() - 0.5) * 100, { duration: piece.duration / 4 }),
        withTiming((Math.random() - 0.5) * 100, { duration: piece.duration / 4 }),
        withTiming((Math.random() - 0.5) * 100, { duration: piece.duration / 4 }),
        withTiming((Math.random() - 0.5) * 100, { duration: piece.duration / 4 })
      )
    );
    rotate.value = withDelay(
      piece.delay,
      withRepeat(withTiming(360, { duration: 1000 }), -1)
    );
    opacity.value = withDelay(
      piece.delay + piece.duration - 500,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const style = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { rotate: `${rotate.value}deg` as const },
      ] as const,
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        { left: `${piece.left}%`, backgroundColor: piece.color },
        style,
      ]}
    />
  );
}

export default function SuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { data, reset } = useOnboardingStore();

  const scale = useSharedValue(0);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    // Trigger native haptic feedback
    confetti();

    // Animate success icon
    scale.value = withSpring(1, { damping: 12 });
    checkScale.value = withDelay(300, withSpring(1, { damping: 15 }));
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const handleGoToDashboard = () => {
    reset();
    router.replace('/(tabs)/(admin)/dashboard');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Confetti */}
      <View style={styles.confettiContainer}>
        {CONFETTI_PIECES.map((piece) => (
          <ConfettiPiece key={piece.id} piece={piece} />
        ))}
      </View>

      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 }]}>
        {/* Success Icon */}
        <Animated.View style={[styles.iconContainer, circleStyle]}>
          <View style={[styles.outerCircle, { backgroundColor: colors.successLight }]}>
            <View style={[styles.innerCircle, { backgroundColor: colors.success }]}>
              <Animated.View style={checkStyle}>
                <Ionicons name="checkmark" size={60} color="#FFFFFF" />
              </Animated.View>
            </View>
          </View>
        </Animated.View>

        {/* Content */}
        <Animated.View entering={FadeInDown.delay(500)} style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            You're All Set!
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Your store <Text style={{ color: colors.primary, fontWeight: '700' }}>{data.storeName}</Text> is
            ready to go live.
          </Text>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInUp.delay(700)} style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="storefront" size={24} color={colors.primary} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Your Store URL</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {data.storeUrl}.tesserix.app
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="ribbon" size={24} color={colors.warning} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Your Plan</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {data.plan === 'free' ? 'Free Starter' : data.plan === 'professional' ? 'Professional' : 'Enterprise'}
            </Text>
          </View>
        </Animated.View>

        {/* Next Steps */}
        <Animated.View entering={FadeInUp.delay(900)} style={styles.nextStepsContainer}>
          <Text style={[styles.nextStepsTitle, { color: colors.text }]}>Next Steps</Text>

          {[
            { icon: 'cube', label: 'Add your first product', done: false },
            { icon: 'card', label: 'Set up payment methods', done: false },
            { icon: 'brush', label: 'Customize your storefront', done: false },
            { icon: 'megaphone', label: 'Share your store', done: false },
          ].map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={[styles.stepIcon, { backgroundColor: colors.surface }]}>
                <Ionicons name={step.icon as any} size={18} color={colors.primary} />
              </View>
              <Text style={[styles.stepLabel, { color: colors.textSecondary }]}>{step.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </View>
          ))}
        </Animated.View>

        {/* CTA Button */}
        <Animated.View entering={FadeIn.delay(1100)} style={styles.buttonContainer}>
          <Button
            title="Go to Dashboard"
            size="lg"
            fullWidth
            onPress={handleGoToDashboard}
            rightIcon={<Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 32,
  },
  outerCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  nextStepsContainer: {
    width: '100%',
    marginBottom: 24,
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  stepIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    flex: 1,
    fontSize: 15,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 'auto',
  },
});
