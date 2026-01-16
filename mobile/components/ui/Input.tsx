import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  TextInputProps,
  StyleProp,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useColors, useBorderRadius, useSpacing } from '@/providers/ThemeProvider';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  leftElement?: React.ReactNode; // Alias for leftIcon
  rightElement?: React.ReactNode; // Alias for rightIcon
  leftText?: string;
  rightText?: string;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<ViewStyle>;
  showClearButton?: boolean;
  type?: 'text' | 'email' | 'password' | 'phone' | 'number';
}

export interface InputRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  isFocused: () => boolean;
}

export const Input = forwardRef<InputRef, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      leftElement,
      rightElement,
      leftText,
      rightText,
      disabled = false,
      containerStyle,
      inputStyle,
      showClearButton = false,
      type = 'text',
      value,
      onChangeText,
      onFocus,
      onBlur,
      secureTextEntry,
      ...props
    },
    ref
  ) => {
    const colors = useColors();
    const borderRadius = useBorderRadius();
    const spacing = useSpacing();
    const inputRef = useRef<TextInput>(null);

    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const focusAnimation = useSharedValue(0);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
      blur: () => inputRef.current?.blur(),
      clear: () => onChangeText?.(''),
      isFocused: () => inputRef.current?.isFocused() ?? false,
    }));

    const handleFocus = (e: any) => {
      setIsFocused(true);
      focusAnimation.value = withTiming(1, { duration: 200 });
      onFocus?.(e);
    };

    const handleBlur = (e: any) => {
      setIsFocused(false);
      focusAnimation.value = withTiming(0, { duration: 200 });
      onBlur?.(e);
    };

    const containerAnimatedStyle = useAnimatedStyle(() => {
      const borderColor = error
        ? colors.error
        : interpolateColor(focusAnimation.value, [0, 1], [colors.border, colors.primary]);

      return {
        borderColor,
        borderWidth: error || isFocused ? 2 : 1,
      };
    });

    const getKeyboardType = () => {
      switch (type) {
        case 'email':
          return 'email-address';
        case 'phone':
          return 'phone-pad';
        case 'number':
          return 'numeric';
        default:
          return 'default';
      }
    };

    const isPassword = type === 'password' || secureTextEntry;
    const showPassword = isPassword && !isPasswordVisible;

    return (
      <View style={containerStyle}>
        {/* Label */}
        {label ? (
          <Text style={[styles.label, { color: error ? colors.error : colors.text }]}>{label}</Text>
        ) : null}

        {/* Input Container */}
        <AnimatedView
          style={[
            styles.inputContainer,
            {
              backgroundColor: disabled ? colors.surface : colors.background,
              borderRadius: borderRadius.xl,
            },
            containerAnimatedStyle,
          ]}
        >
          {/* Left Icon/Element */}
          {leftIcon || leftElement ? (
            <View style={[styles.iconContainer, { marginRight: spacing.sm }]}>
              {leftIcon || leftElement}
            </View>
          ) : null}

          {/* Left Text */}
          {leftText ? (
            <Text style={[styles.sideText, { color: colors.textSecondary }]}>{leftText}</Text>
          ) : null}

          {/* TextInput */}
          <TextInput
            ref={inputRef}
            autoCapitalize={type === 'email' ? 'none' : props.autoCapitalize}
            autoComplete={type === 'email' ? 'email' : props.autoComplete}
            editable={!disabled}
            keyboardType={getKeyboardType()}
            placeholderTextColor={colors.textTertiary}
            secureTextEntry={showPassword}
            style={[
              styles.input,
              {
                color: disabled ? colors.textSecondary : colors.text,
              },
              inputStyle,
            ]}
            value={value}
            onBlur={handleBlur}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            {...props}
          />

          {/* Clear Button */}
          {showClearButton && value && value.length > 0 ? (
            <Pressable hitSlop={8} style={styles.iconContainer} onPress={() => onChangeText?.('')}>
              <Ionicons color={colors.textTertiary} name="close-circle" size={20} />
            </Pressable>
          ) : null}

          {/* Password Toggle */}
          {isPassword ? (
            <Pressable
              hitSlop={8}
              style={styles.iconContainer}
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              <Ionicons
                color={colors.textTertiary}
                name={isPasswordVisible ? 'eye-off' : 'eye'}
                size={20}
              />
            </Pressable>
          ) : null}

          {/* Right Text */}
          {rightText ? (
            <Text style={[styles.sideText, { color: colors.textSecondary }]}>{rightText}</Text>
          ) : null}

          {/* Right Icon/Element */}
          {rightIcon || rightElement ? (
            <View style={[styles.iconContainer, { marginLeft: spacing.sm }]}>
              {rightIcon || rightElement}
            </View>
          ) : null}
        </AnimatedView>

        {/* Error or Hint */}
        {error || hint ? (
          <Text style={[styles.helperText, { color: error ? colors.error : colors.textSecondary }]}>
            {error || hint}
          </Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

// Search Input variant
interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onSearch?: (value: string) => void;
}

export function SearchInput({ placeholder = 'Search...', onSearch, ...props }: SearchInputProps) {
  const colors = useColors();

  return (
    <Input
      showClearButton
      leftIcon={<Ionicons color={colors.textTertiary} name="search" size={20} />}
      placeholder={placeholder}
      returnKeyType="search"
      onSubmitEditing={(e) => onSearch?.(e.nativeEvent.text)}
      {...props}
    />
  );
}

// TextArea variant
interface TextAreaProps extends Omit<InputProps, 'multiline' | 'numberOfLines'> {
  rows?: number;
}

export function TextArea({ rows = 4, ...props }: TextAreaProps) {
  return (
    <Input
      multiline
      inputStyle={{ minHeight: rows * 24, paddingTop: 12 }}
      numberOfLines={rows}
      textAlignVertical="top"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideText: {
    fontSize: 16,
    marginHorizontal: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
