/**
 * NIRS 数据流管理接口
 */

import type { NirsDataFrame, NirsSdkConfig, NirsDataHandler, NirsSdkError } from './types';

/**
 * 数据流管理器
 *
 * 负责数据缓冲、采样率控制、丢帧检测与校准应用。
 */
export interface DataStreamManager {
  /** 启动数据流 */
  start(deviceId: string): Promise<void>;

  /** 停止数据流 */
  stop(deviceId: string): Promise<void>;

  /** 订阅实时数据 */
  subscribe(handler: NirsDataHandler): () => void;

  /** 订阅处理后的聚合数据（如每秒均值） */
  subscribeAggregated(
    windowMs: number,
    handler: (frames: NirsDataFrame[]) => void
  ): () => void;

  /** 获取最近 N 帧 */
  getRecentFrames(count: number): NirsDataFrame[];

  /** 应用校准参数 */
  applyCalibration(config: NirsSdkConfig['calibration']): void;

  /** 全局错误监听 */
  onError(handler: (error: NirsSdkError) => void): () => void;
}

/**
 * 创建数据流管理器
 *
 * TODO: 注入 BLE 客户端实现。
 */
export function createDataStreamManager(_bleClient: unknown): DataStreamManager {
  throw new Error('createDataStreamManager not implemented');
}
