/**
 * UI 组件库类型定义
 */

/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'system';

/** iOS 风格颜色 token */
export interface ColorTokens {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

/** 间距 token */
export interface SpacingTokens {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

/** 圆角 token */
export interface RadiusTokens {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

/** 字体 token */
export interface TypographyTokens {
  fontFamily: string;
  sizes: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  };
  weights: {
    regular: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

/** 完整主题 */
export interface Theme {
  mode: ThemeMode;
  colors: ColorTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  typography: TypographyTokens;
}

/** 按钮变体 */
export type ButtonVariant = 'filled' | 'outlined' | 'ghost';

/** 按钮尺寸 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** 按钮属性 */
export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
}

/** 卡片属性 */
export interface CardProps {
  children: React.ReactNode;
  padding?: keyof SpacingTokens;
  onPress?: () => void;
}
