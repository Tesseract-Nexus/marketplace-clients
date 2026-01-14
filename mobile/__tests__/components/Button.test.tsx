import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, IconButton } from '../../components/ui/Button';

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with title', () => {
      const { getByText } = render(<Button title="Click me" />);
      expect(getByText('Click me')).toBeTruthy();
    });

    it('renders with left icon', () => {
      const { getByText, UNSAFE_getByType } = render(
        <Button
          title="With Icon"
          leftIcon={<Ionicons name="add" size={20} />}
        />
      );
      expect(getByText('With Icon')).toBeTruthy();
      expect(UNSAFE_getByType(Ionicons)).toBeTruthy();
    });

    it('renders with right icon', () => {
      const { getByText, UNSAFE_getByType } = render(
        <Button
          title="With Icon"
          rightIcon={<Ionicons name="arrow-forward" size={20} />}
        />
      );
      expect(getByText('With Icon')).toBeTruthy();
      expect(UNSAFE_getByType(Ionicons)).toBeTruthy();
    });
  });

  describe('Variants', () => {
    it('renders primary variant by default', () => {
      const { toJSON } = render(<Button title="Primary" />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders secondary variant', () => {
      const { toJSON } = render(<Button title="Secondary" variant="secondary" />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders outline variant', () => {
      const { toJSON } = render(<Button title="Outline" variant="outline" />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders ghost variant', () => {
      const { toJSON } = render(<Button title="Ghost" variant="ghost" />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders danger variant', () => {
      const { toJSON } = render(<Button title="Danger" variant="danger" />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      const { toJSON } = render(<Button title="Small" size="sm" />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders medium size', () => {
      const { toJSON } = render(<Button title="Medium" size="md" />);
      expect(toJSON()).toBeTruthy();
    });

    it('renders large size', () => {
      const { toJSON } = render(<Button title="Large" size="lg" />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('States', () => {
    it('handles disabled state', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button title="Disabled" disabled onPress={onPress} />
      );

      fireEvent.press(getByText('Disabled'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('shows loading state', () => {
      const { getByTestId, queryByText } = render(
        <Button title="Loading" loading testID="loading-button" />
      );

      expect(getByTestId('loading-button')).toBeTruthy();
      // Title should be hidden when loading
      expect(queryByText('Loading')).toBeNull();
    });

    it('handles fullWidth prop', () => {
      const { toJSON } = render(<Button title="Full Width" fullWidth />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      const { getByText } = render(<Button title="Press Me" onPress={onPress} />);

      fireEvent.press(getByText('Press Me'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const onPress = jest.fn();
      const { getByText } = render(
        <Button title="Disabled" disabled onPress={onPress} />
      );

      fireEvent.press(getByText('Disabled'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('does not call onPress when loading', () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <Button title="Loading" loading onPress={onPress} testID="loading-btn" />
      );

      fireEvent.press(getByTestId('loading-btn'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });
});

describe('IconButton Component', () => {
  it('renders with icon', () => {
    const { UNSAFE_getByType } = render(
      <IconButton icon={<Ionicons name="add" size={24} />} />
    );
    expect(UNSAFE_getByType(Ionicons)).toBeTruthy();
  });

  it('handles press events', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <IconButton
        icon={<Ionicons name="add" size={24} />}
        onPress={onPress}
        testID="icon-btn"
      />
    );

    fireEvent.press(getByTestId('icon-btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('applies custom styles', () => {
    const { toJSON } = render(
      <IconButton
        icon={<Ionicons name="add" size={24} />}
        style={{ backgroundColor: 'red' }}
      />
    );
    expect(toJSON()).toBeTruthy();
  });
});
