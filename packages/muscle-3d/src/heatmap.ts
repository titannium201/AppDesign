/"
 * 热力图渲染接口
 */

import type {
  HeatmapColorScale,
  HeatmapData,
  HeatmapMode,
  ModelScene,
  MuscleHeatmapData,
  PointHeatmapData,
} from './types';

/**
 * 默认疲劳热力图色阶
 */
export const DEFAULT_FATIGUE_COLOR_SCALE: HeatmapColorScale = {
  min: [0.2, 0.78, 0.35, 1.0], // #34C759
  mid: [1.0, 0.8, 0.0, 1.0], // #FFCC00
  max: [1.0, 0.23, 0.19, 1.0], // #FF3B30
  minValue: 0,
  maxValue: 100,
};

/**
 * 默认 StO2 热力图色阶
 */
export const DEFAULT_STO2_COLOR_SCALE: HeatmapColorScale = {
  min: [1.0, 0.23, 0.19, 1.0], // 低氧 = 红
  mid: [1.0, 0.8, 0.0, 1.0],
  max: [0.2, 0.78, 0.35, 1.0], // 富氧 = 绿
  minValue: 50,
  maxValue: 90,
};

/**
 * 根据模式获取默认色阶
 */
export function getDefaultColorScale(mode: HeatmapMode): HeatmapColorScale {
  switch (mode) {
    case 'sto2':
      return DEFAULT_STO2_COLOR_SCALE;
    case 'fatigue':
    case 'deltaHbt':
    case 'perfusion':
    case 'combined':
    default:
      return DEFAULT_FATIGUE_COLOR_SCALE;
  }
}

/**
 * 热力图渲染器接口
 */
export interface HeatmapRenderer {
  /** 应用热力图到模型 */
  apply(scene: ModelScene, data: HeatmapData): void;

  /** 清除热力图 */
  clear(scene: ModelScene): void;

  /** 设置色阶 */
  setColorScale(scale: HeatmapColorScale): void;

  /** 设置模式 */
  setMode(mode: HeatmapMode): void;
}

/**
 * 判断数据类型
 */
export function isMuscleHeatmapData(data: HeatmapData): data is MuscleHeatmapData {
  return data && 'entries' in data && data.entries.length > 0 && 'muscleId' in data.entries[0];
}

export function isPointHeatmapData(data: HeatmapData): data is PointHeatmapData {
  return data && 'entries' in data && data.entries.length > 0 && 'pointId' in data.entries[0];
}

/**
 * 创建热力图渲染器
 *
 * TODO: 根据渲染引擎返回具体实现。
 */
export function createHeatmapRenderer(_engine: 'three' | 'babylon'): HeatmapRenderer {
  throw new Error('createHeatmapRenderer not implemented');
}
