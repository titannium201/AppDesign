/**
 * Web 3D 可视化类型定义（骨架）
 */

import type { MuscleHeatmapData, ModelLoadOptions } from '@app/muscle-3d';

export interface ViewerConfig {
  /** 本地 body.glb 绝对路径或可访问 URL */
  modelUrl: string;
  /** 画布初始宽度 */
  width?: number;
  /** 画布初始高度 */
  height?: number;
  /** 背景色 */
  backgroundColor?: string;
  /** 是否自动旋转展示 */
  autoRotate?: boolean;
}

export interface Web3DViewerProps {
  config: ViewerConfig;
  /** 热力图数据：按肌肉/扫描点映射 */
  heatmapData?: MuscleHeatmapData;
  /** 选中肌肉回调 */
  onMuscleSelect?: (muscleId: string) => void;
  /** 加载进度回调 */
  onLoadProgress?: (progress: number) => void;
}
