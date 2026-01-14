import React, { useEffect, useState } from 'react';
import { Text, TextStyle, StyleSheet, StyleProp } from 'react-native';
import Animated from 'react-native-reanimated';

import { useColors } from '@/providers/ThemeProvider';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: StyleProp<TextStyle>;
  delay?: number;
  formatNumber?: boolean;
}

// Main animated counter component
export function AnimatedCounter({
  value,
  duration = 1500,
  prefix = '',
  suffix = '',
  decimals = 0,
  style,
  delay = 0,
  formatNumber = true,
}: AnimatedCounterProps) {
  const colors = useColors();
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const startValue = 0;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = startValue + (value - startValue) * eased;

        setDisplayValue(current);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration, delay]);

  const formatValue = () => {
    const fixed = displayValue.toFixed(decimals);
    if (formatNumber && !decimals) {
      const formatted = Math.round(displayValue).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return `${prefix}${formatted}${suffix}`;
    }
    return `${prefix}${fixed}${suffix}`;
  };

  return (
    <Animated.Text style={[styles.text, { color: colors.text }, style]}>
      {formatValue()}
    </Animated.Text>
  );
}

// Alias for backwards compatibility
export const SimpleAnimatedCounter = AnimatedCounter;

const styles = StyleSheet.create({
  text: {
    fontSize: 32,
    fontWeight: '700',
  },
});
