/**
 * 3D 相机/视图控制接口
 */

import type { ModelScene, Rotation, Vector3 } from './types';

/**
 * 预置相机视角
 */
export type CameraPreset =
  | 'full_body'
  | 'lower_limb_front'
  | 'lower_limb_back'
  | 'lower_limb_left'
  | 'lower_limb_right'
  | 'thigh'
  | 'calf'
  | 'knee'
  | 'ankle';

/**
 * 相机构型
 */
export interface CameraConfig {
  position?: Vector3;
  target?: Vector3;
  up?: Vector3;
  fov?: number;
  near?: number;
  far?: number;
}

/**
 * 相机控制器接口
 */
export interface CameraController {
  /** 设置相机位置与目标 */
  set(config: CameraConfig): void;

  /** 切换到预置视角 */
  applyPreset(preset: CameraPreset): void;

  /** 环绕目标旋转 */
  orbit(deltaAzimuth: number, deltaPolar: number): void;

  /** 缩放 */
  zoom(delta: number): void;

  /** 平移 */
  pan(deltaX: number, deltaY: number): void;

  /** 聚焦到指定结构 */
  focus(meshId: string): void;

  /** 重置为默认视角 */
  reset(): void;

  /** 获取当前相机状态 */
  getState(): CameraConfig;

  /** 应用外部状态 */
  setState(state: CameraConfig): void;
}

/**
 * 创建相机控制器
 *
 * TODO: 根据渲染引擎返回具体实现。
 */
export function createCameraController(
  _scene: ModelScene,
  _engine: 'three' | 'babylon'
): CameraController {
  throw new Error('createCameraController not implemented');
}

/**
 * 预置视角默认配置（简化占位）
 */
export const CAMERA_PRESET_CONFIGS: Record<CameraPreset, CameraConfig> = {
  full_body: { position: [0, 1, 3], target: [0, 0.9, 0] },
  lower_limb_front: { position: [0, 0.6, 1.5], target: [0, 0.5, 0] },
  lower_limb_back: { position: [0, 0.6, -1.5], target: [0, 0.5, 0] },
  lower_limb_left: { position: [-1.5, 0.6, 0], target: [0, 0.5, 0] },
  lower_limb_right: { position: [1.5, 0.6, 0], target: [0, 0.5, 0] },
  thigh: { position: [0, 0.8, 1.2], target: [0, 0.75, 0] },
  calf: { position: [0, 0.35, 1.2], target: [0, 0.35, 0] },
  knee: { position: [0, 0.55, 0.8], target: [0, 0.55, 0] },
  ankle: { position: [0, 0.1, 0.8], target: [0, 0.1, 0] },
};
