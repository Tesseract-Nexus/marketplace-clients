import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  showFill?: boolean;
}

export function Sparkline({
  data,
  width = 80,
  height = 32,
  strokeColor = '#10B981',
  fillColor,
  strokeWidth = 2,
  showFill = true,
}: SparklineProps) {
  const gradientId = useMemo(
    () => `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  const { path, fillPath } = useMemo(() => {
    if (!data || data.length < 2) {
      return { path: '', fillPath: '' };
    }

    const padding = strokeWidth;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y };
    });

    // Create smooth bezier curve
    let pathD = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const cpx = (current.x + next.x) / 2;

      pathD += ` C ${cpx} ${current.y}, ${cpx} ${next.y}, ${next.x} ${next.y}`;
    }

    // Create fill path
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    const fillPathD = `${pathD} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`;

    return { path: pathD, fillPath: fillPathD };
  }, [data, width, height, strokeWidth]);

  if (!data || data.length < 2) {
    return null;
  }

  const actualFillColor = fillColor || strokeColor;

  return (
    <Animated.View entering={FadeIn.duration(500)} style={{ width, height }}>
      <Svg height={height} width={width}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor={actualFillColor} stopOpacity="0.3" />
            <Stop offset="1" stopColor={actualFillColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {showFill ? <Path d={fillPath} fill={`url(#${gradientId})`} /> : null}

        <Path
          d={path}
          fill="none"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({});
