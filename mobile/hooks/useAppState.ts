import { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface UseAppStateOptions {
  onForeground?: () => void;
  onBackground?: () => void;
  onChange?: (state: AppStateStatus) => void;
}

/**
 * Hook to track app state (foreground/background)
 */
export function useAppState(options: UseAppStateOptions = {}) {
  const { onForeground, onBackground, onChange } = options;
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const previousState = appStateRef.current;

      // App came to foreground
      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        onForeground?.();
      }

      // App went to background
      if (previousState === 'active' && nextAppState.match(/inactive|background/)) {
        onBackground?.();
      }

      onChange?.(nextAppState);
      appStateRef.current = nextAppState;
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [onForeground, onBackground, onChange]);

  return {
    appState,
    isActive: appState === 'active',
    isBackground: appState === 'background',
    isInactive: appState === 'inactive',
  };
}

/**
 * Hook to execute callback when app returns to foreground
 */
export function useOnForeground(callback: () => void) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useAppState({
    onForeground: () => savedCallback.current(),
  });
}

/**
 * Hook to execute callback when app goes to background
 */
export function useOnBackground(callback: () => void) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useAppState({
    onBackground: () => savedCallback.current(),
  });
}

/**
 * Hook to track time spent in app
 */
export function useSessionDuration() {
  const [sessionStart] = useState(() => Date.now());
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(Date.now() - sessionStart);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStart]);

  return {
    duration,
    durationSeconds: Math.floor(duration / 1000),
    durationMinutes: Math.floor(duration / 60000),
  };
}
