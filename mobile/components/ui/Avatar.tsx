import React from 'react';
import { View, Text, ViewStyle, ImageStyle } from 'react-native';
import { Image } from 'expo-image';

import { useColors, useBorderRadius } from '@/providers/ThemeProvider';
import { getInitials } from '@/lib/utils/formatting';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type AvatarShape = 'circle' | 'rounded' | 'square';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
}

export function Avatar({
  source,
  name,
  size = 'md',
  shape = 'circle',
  backgroundColor,
  textColor,
  style,
}: AvatarProps) {
  const colors = useColors();
  const borderRadius = useBorderRadius();

  const getSizeValue = (): number => {
    switch (size) {
      case 'xs':
        return 24;
      case 'sm':
        return 32;
      case 'md':
        return 40;
      case 'lg':
        return 48;
      case 'xl':
        return 64;
      case '2xl':
        return 96;
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'xs':
        return 10;
      case 'sm':
        return 12;
      case 'md':
        return 14;
      case 'lg':
        return 18;
      case 'xl':
        return 24;
      case '2xl':
        return 36;
    }
  };

  const getBorderRadius = (): number => {
    const sizeValue = getSizeValue();
    switch (shape) {
      case 'circle':
        return sizeValue / 2;
      case 'rounded':
        return borderRadius.lg;
      case 'square':
        return borderRadius.sm;
    }
  };

  const sizeValue = getSizeValue();
  const fontSize = getFontSize();
  const radius = getBorderRadius();

  const containerStyle: ViewStyle = {
    width: sizeValue,
    height: sizeValue,
    borderRadius: radius,
    backgroundColor: backgroundColor || colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...style,
  };

  const imageStyle: ImageStyle = {
    width: sizeValue,
    height: sizeValue,
    borderRadius: radius,
  };

  if (source) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: source }}
          style={imageStyle}
          contentFit="cover"
          transition={200}
        />
      </View>
    );
  }

  const initials = name ? getInitials(name) : '?';

  return (
    <View style={containerStyle}>
      <Text
        style={{
          color: textColor || colors.textOnPrimary,
          fontSize,
          fontWeight: '600',
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

// Avatar Group
interface AvatarGroupProps {
  items: Array<{ source?: string; name: string }>;
  max?: number;
  size?: AvatarSize;
  style?: ViewStyle;
}

export function AvatarGroup({
  items,
  max = 4,
  size = 'md',
  style,
}: AvatarGroupProps) {
  const colors = useColors();
  const displayItems = items.slice(0, max);
  const remainingCount = items.length - max;

  const getSizeValue = (): number => {
    switch (size) {
      case 'xs':
        return 24;
      case 'sm':
        return 32;
      case 'md':
        return 40;
      case 'lg':
        return 48;
      case 'xl':
        return 64;
      case '2xl':
        return 96;
    }
  };

  const sizeValue = getSizeValue();
  const overlap = sizeValue * 0.3;

  return (
    <View style={[{ flexDirection: 'row' }, style]}>
      {displayItems.map((item, index) => (
        <View
          key={index}
          style={{
            marginLeft: index === 0 ? 0 : -overlap,
            zIndex: displayItems.length - index,
          }}
        >
          <Avatar
            source={item.source}
            name={item.name}
            size={size}
            style={{
              borderWidth: 2,
              borderColor: colors.background,
            }}
          />
        </View>
      ))}
      {remainingCount > 0 && (
        <View
          style={{
            marginLeft: -overlap,
            width: sizeValue,
            height: sizeValue,
            borderRadius: sizeValue / 2,
            backgroundColor: colors.surface,
            borderWidth: 2,
            borderColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: sizeValue * 0.35,
              fontWeight: '600',
            }}
          >
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
}

// Avatar with Badge
interface AvatarWithBadgeProps extends AvatarProps {
  badge?: React.ReactNode;
  badgePosition?: 'top-right' | 'bottom-right';
}

export function AvatarWithBadge({
  badge,
  badgePosition = 'bottom-right',
  ...avatarProps
}: AvatarWithBadgeProps) {
  const getSizeValue = (): number => {
    switch (avatarProps.size) {
      case 'xs':
        return 24;
      case 'sm':
        return 32;
      case 'md':
        return 40;
      case 'lg':
        return 48;
      case 'xl':
        return 64;
      case '2xl':
        return 96;
      default:
        return 40;
    }
  };

  const sizeValue = getSizeValue();

  const badgePositionStyle: ViewStyle =
    badgePosition === 'top-right'
      ? { top: 0, right: 0 }
      : { bottom: 0, right: 0 };

  return (
    <View style={{ width: sizeValue, height: sizeValue }}>
      <Avatar {...avatarProps} />
      {badge && (
        <View style={[{ position: 'absolute' }, badgePositionStyle]}>
          {badge}
        </View>
      )}
    </View>
  );
}
