/**
 * NIRS 模拟数据流
 *
 * 在没有真实 BLE 硬件时，按设定速率生成逼真的 NIRS 数据帧，
 * 可直接接入 NirsRateLimiter 做全链路 Demo。
 */

import type { NirsChannelSample, NirsDataFrame } from './types';

export interface MockNirsStreamOptions {
  /** 模拟设备 ID */
  deviceId?: string;
  /** BLE 原始通知速率 (Hz)，默认 100 */
  burstRateHz?: number;
  /** 通道数，默认 4 */
  channelCount?: number;
  /** 波长数量（用于 rawIntensities），默认 4 */
  wavelengthCount?: number;
  /** 基线 SmO2 (%)，默认 70 */
  baselineStO2?: number;
  /** 基线 THb (μM)，默认 100 */
  baselineHbT?: number;
  /** 是否自动启动，默认 false */
  autoStart?: boolean;
  /** 模拟运动后的恢复期（数值波动更大），默认 false */
  postExercise?: boolean;
}

export type MockNirsDataCallback = (frame: NirsDataFrame) => void;
export type MockNirsErrorCallback = (error: Error) => void;

export class MockNirsStream {
  private state: 'idle' | 'running' | 'paused' | 'stopped' = 'idle';
  private timer: ReturnType<typeof setInterval> | null = null;
  private frameSeq = 0;
  private readonly onDataCallbacks: MockNirsDataCallback[] = [];
  private readonly onErrorCallbacks: MockNirsErrorCallback[] = [];

  constructor(private readonly options: MockNirsStreamOptions = {}) {
    if (options.autoStart) {
      this.start();
    }
  }

  /**
   * 注册数据回调
   */
  onData(callback: MockNirsDataCallback): () => void {
    this.onDataCallbacks.push(callback);
    return () => {
      const index = this.onDataCallbacks.indexOf(callback);
      if (index >= 0) {
        this.onDataCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 注册错误回调
   */
  onError(callback: MockNirsErrorCallback): () => void {
    this.onErrorCallbacks.push(callback);
    return () => {
      const index = this.onErrorCallbacks.indexOf(callback);
      if (index >= 0) {
        this.onErrorCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 开始按 burstRateHz 生成数据
   */
  start(): void {
    if (this.state === 'running') {
      return;
    }
    if (this.state === 'stopped') {
      this.frameSeq = 0;
    }
    this.state = 'running';

    const intervalMs = 1000 / (this.options.burstRateHz ?? 100);
    this.timer = setInterval(() => this.tick(), intervalMs);
  }

  /**
   * 暂停生成
   */
  pause(): void {
    if (this.state !== 'running') {
      return;
    }
    this.state = 'paused';
    this.clearTimer();
  }

  /**
   * 恢复生成
   */
  resume(): void {
    if (this.state !== 'paused') {
      return;
    }
    this.state = 'running';
    const intervalMs = 1000 / (this.options.burstRateHz ?? 100);
    this.timer = setInterval(() => this.tick(), intervalMs);
  }

  /**
   * 停止生成
   */
  stop(): void {
    this.state = 'stopped';
    this.clearTimer();
    this.frameSeq = 0;
  }

  /**
   * 当前状态
   */
  getStatus() {
    return {
      state: this.state,
      burstRateHz: this.options.burstRateHz ?? 100,
      emittedFrames: this.frameSeq,
    };
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    try {
      const frame = this.generateFrame();
      this.frameSeq++;
      for (const callback of this.onDataCallbacks) {
        try {
          callback(frame);
        } catch (err) {
          this.emitError(
            err instanceof Error ? err : new Error(String(err)),
          );
        }
      }
    } catch (err) {
      this.emitError(err instanceof Error ? err : new Error(String(err)));
    }
  }

  private generateFrame(): NirsDataFrame {
    const deviceId = this.options.deviceId ?? 'mock-nirs-device';
    const channelCount = this.options.channelCount ?? 4;
    const wavelengthCount = this.options.wavelengthCount ?? 4;
    const baselineStO2 = this.options.baselineStO2 ?? 70;
    const baselineHbT = this.options.baselineHbT ?? 100;
    const now = Date.now();

    const channels: NirsChannelSample[] = Array.from({ length: channelCount },
      (_, channelIndex) => {
        // 给不同通道 slightly different baseline，看起来更真实
        const channelOffset = channelIndex * 2;
        const noise = () => (Math.random() - 0.5) * (this.options.postExercise ? 6 : 2);

        const stO2 = clamp(baselineStO2 + channelOffset * 0.3 + noise(), 30, 95);
        const hbT = clamp(baselineHbT + channelOffset * 0.5 + noise() * 2, 60, 160);
        const hbO2 = (stO2 / 100) * hbT;
        const hHb = hbT - hbO2;

        const rawIntensities: Record<number, number> = {};
        for (let w = 0; w < wavelengthCount; w++) {
          rawIntensities[730 + w * 40] =
            50000 + Math.random() * 5000 + channelIndex * 1000;
        }

        return {
          channelIndex,
          timestamp: now,
          metrics: {
            stO2,
            sto2: stO2,
            hbT,
            hbt: hbT,
            hbO2,
            hbo2: hbO2,
            hHb,
            hhb: hHb,
            perfusion: clamp(100 + noise() * 10, 0, 200),
            bloodFlow: clamp(1.2 + noise() * 0.2, 0, 5),
          },
          rawIntensities,
        };
      },
    );

    return {
      frameId: `mock-${this.frameSeq}`,
      deviceId,
      deviceTimestamp: now,
      receivedAt: now,
      channels,
    };
  }

  private emitError(error: Error): void {
    for (const callback of this.onErrorCallbacks) {
      try {
        callback(error);
      } catch {
        // 忽略
      }
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
