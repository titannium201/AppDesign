/**
 * iOS 风格主题 token
 */

import type { Theme } from './types';

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    border: '#C6C6C8',
    success: '#34C759',
    warning: '#FFCC00',
    danger: '#FF3B30',
    info: '#5AC8FA',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 20,
    full: 9999,
  },
  typography: {
    fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
    sizes: {
      xs: 10,
      sm: 12,
      base: 16,
      lg: 18,
      xl: 22,
      '2xl': 28,
      '3xl': 34,
    },
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
};

export const darkTheme: Theme = {
  ...lightTheme,
  mode: 'dark',
  colors: {
    ...lightTheme.colors,
    background: '#000000',
    surface: '#1C1C1E',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    border: '#38383A',
  },
};
