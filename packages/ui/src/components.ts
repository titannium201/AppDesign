/**
 * 组件导出（骨架）
 *
 * TODO: 实现跨端 Button、Card、Input、ListItem、HeatmapLegend 等组件。
 */

import type { ButtonProps, CardProps } from './types';

/** 按钮组件类型占位 */
export type Button = React.FC<ButtonProps>;

/** 卡片组件类型占位 */
export type Card = React.FC<CardProps>;

/**
 * 创建平台相关的 Button 组件
 *
 * TODO: 分别返回 React Native / Web 实现。
 */
export function createButton(_platform: 'native' | 'web'): Button {
  throw new Error('createButton not implemented');
}

/**
 * 创建平台相关的 Card 组件
 *
 * TODO: 分别返回 React Native / Web 实现。
 */
export function createCard(_platform: 'native' | 'web'): Card {
  throw new Error('createCard not implemented');
}
