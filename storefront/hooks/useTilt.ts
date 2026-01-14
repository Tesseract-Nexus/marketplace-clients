'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface TiltState {
  rotateX: number;
  rotateY: number;
  scale: number;
}

interface UseTiltOptions {
  /** Maximum tilt angle in degrees */
  maxTilt?: number;
  /** Scale factor on hover (1 = no scale) */
  scale?: number;
  /** Perspective in pixels */
  perspective?: number;
  /** Transition speed in ms */
  speed?: number;
  /** Enable/disable the effect */
  enabled?: boolean;
  /** Enable shine/glare effect */
  glare?: boolean;
}

interface UseTiltReturn {
  tiltStyle: React.CSSProperties;
  glareStyle: React.CSSProperties;
  handleMouseMove: (e: React.MouseEvent<HTMLElement>) => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  ref: React.RefObject<HTMLElement | null>;
}

/**
 * Custom hook for adding 3D tilt effect to elements
 *
 * @example
 * ```tsx
 * const { tiltStyle, handleMouseMove, handleMouseEnter, handleMouseLeave } = useTilt({
 *   maxTilt: 10,
 *   scale: 1.02,
 * });
 *
 * return (
 *   <div
 *     style={tiltStyle}
 *     onMouseMove={handleMouseMove}
 *     onMouseEnter={handleMouseEnter}
 *     onMouseLeave={handleMouseLeave}
 *   >
 *     Content
 *   </div>
 * );
 * ```
 */
export function useTilt({
  maxTilt = 10,
  scale = 1.02,
  perspective = 1000,
  speed = 400,
  enabled = true,
  glare = false,
}: UseTiltOptions = {}): UseTiltReturn {
  const ref = useRef<HTMLElement | null>(null);
  const [tilt, setTilt] = useState<TiltState>({ rotateX: 0, rotateY: 0, scale: 1 });
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Check for reduced motion preference and touch device
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    // Check for touch device
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!enabled || prefersReducedMotion || isTouchDevice) return;

      const element = e.currentTarget;
      const rect = element.getBoundingClientRect();

      // Calculate mouse position relative to element center
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate tilt percentages
      const percentX = (x - centerX) / centerX;
      const percentY = (y - centerY) / centerY;

      // Apply tilt (inverted for natural feel)
      const rotateX = -percentY * maxTilt;
      const rotateY = percentX * maxTilt;

      setTilt({ rotateX, rotateY, scale });

      // Update glare position
      if (glare) {
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        setGlarePosition({ x: glareX, y: glareY });
      }
    },
    [enabled, maxTilt, scale, prefersReducedMotion, isTouchDevice, glare]
  );

  const handleMouseEnter = useCallback(() => {
    if (!enabled || prefersReducedMotion || isTouchDevice) return;
    setIsHovered(true);
  }, [enabled, prefersReducedMotion, isTouchDevice]);

  const handleMouseLeave = useCallback(() => {
    if (!enabled || prefersReducedMotion || isTouchDevice) return;
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0, scale: 1 });
  }, [enabled, prefersReducedMotion, isTouchDevice]);

  const tiltStyle: React.CSSProperties = {
    transform: `perspective(${perspective}px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale(${tilt.scale})`,
    transition: isHovered ? `transform ${speed * 0.3}ms ease-out` : `transform ${speed}ms ease-out`,
    transformStyle: 'preserve-3d',
    willChange: 'transform',
  };

  const glareStyle: React.CSSProperties = glare
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255, 255, 255, 0.2) 0%, transparent 60%)`,
        opacity: isHovered ? 1 : 0,
        transition: `opacity ${speed}ms ease-out`,
        borderRadius: 'inherit',
        zIndex: 10,
      }
    : {};

  return {
    tiltStyle,
    glareStyle,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    ref,
  };
}

/**
 * Simpler hook that returns just the transform values for use with framer-motion
 */
export function useTiltValues({
  maxTilt = 8,
  enabled = true,
}: {
  maxTilt?: number;
  enabled?: boolean;
} = {}) {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldAnimate(!mediaQuery.matches);

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) {
      setShouldAnimate(false);
    }

    const handleChange = (e: MediaQueryListEvent) => {
      setShouldAnimate(!e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!enabled || !shouldAnimate) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const percentX = (x - centerX) / centerX;
      const percentY = (y - centerY) / centerY;

      setRotateX(-percentY * maxTilt);
      setRotateY(percentX * maxTilt);
    },
    [enabled, maxTilt, shouldAnimate]
  );

  const onMouseEnter = useCallback(() => {
    if (enabled && shouldAnimate) {
      setIsActive(true);
    }
  }, [enabled, shouldAnimate]);

  const onMouseLeave = useCallback(() => {
    setIsActive(false);
    setRotateX(0);
    setRotateY(0);
  }, []);

  return {
    rotateX,
    rotateY,
    isActive,
    shouldAnimate: shouldAnimate && enabled,
    handlers: {
      onMouseMove,
      onMouseEnter,
      onMouseLeave,
    },
  };
}

export default useTilt;
