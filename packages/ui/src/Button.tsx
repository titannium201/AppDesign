import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  type TouchableOpacityProps,
} from 'react-native';
import { COLORS } from '@app/shared';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  disabled,
  style,
  ...props
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isGhost = variant === 'ghost';
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      style={[
        styles.base,
        size === 'lg' && styles.lg,
        isPrimary && styles.primary,
        variant === 'secondary' && styles.secondary,
        isGhost && styles.ghost,
        disabled && styles.disabled,
        style,
      ]}
      {...props}>
      <Text
        style={[
          styles.text,
          size === 'lg' && styles.textLg,
          isPrimary && styles.textPrimary,
          isGhost && styles.textGhost,
        ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  textLg: {
    fontSize: 17,
  },
  textPrimary: {
    color: '#fff',
  },
  textGhost: {
    color: COLORS.primary,
  },
});
