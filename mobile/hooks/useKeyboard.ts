import { useState, useEffect, useCallback } from 'react';
import { Keyboard, KeyboardEvent, Platform, LayoutAnimation } from 'react-native';

interface KeyboardState {
  isVisible: boolean;
  isKeyboardVisible: boolean; // Alias for isVisible
  keyboardHeight: number;
  keyboardAnimationDuration: number;
}

/**
 * Hook to track keyboard visibility and height
 */
export function useKeyboard(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    isVisible: false,
    isKeyboardVisible: false,
    keyboardHeight: 0,
    keyboardAnimationDuration: 250,
  });

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleKeyboardShow = (event: KeyboardEvent) => {
      // Animate the layout change
      LayoutAnimation.configureNext({
        duration: event.duration,
        update: {
          type: LayoutAnimation.Types.keyboard,
        },
      });

      setState({
        isVisible: true,
        isKeyboardVisible: true,
        keyboardHeight: event.endCoordinates.height,
        keyboardAnimationDuration: event.duration,
      });
    };

    const handleKeyboardHide = (event: KeyboardEvent) => {
      LayoutAnimation.configureNext({
        duration: event.duration,
        update: {
          type: LayoutAnimation.Types.keyboard,
        },
      });

      setState({
        isVisible: false,
        isKeyboardVisible: false,
        keyboardHeight: 0,
        keyboardAnimationDuration: event.duration,
      });
    };

    const showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return state;
}

/**
 * Hook to dismiss keyboard on tap outside
 */
export function useKeyboardDismiss() {
  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return { dismissKeyboard };
}

/**
 * Hook to track if input is focused
 */
export function useInputFocus() {
  const [isFocused, setIsFocused] = useState(false);

  const onFocus = useCallback(() => setIsFocused(true), []);
  const onBlur = useCallback(() => setIsFocused(false), []);

  return {
    isFocused,
    onFocus,
    onBlur,
    inputProps: { onFocus, onBlur },
  };
}
