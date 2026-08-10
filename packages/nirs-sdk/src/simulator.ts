/**
 * NIRS 全流程模拟器
 *
 * 将 MockNirsStream（高频 BLE 通知）与 NirsRateLimiter（限流）串联，
 * 提供一键启动的 Demo 数据流。适合本地无硬件时的端到端测试。
 */

import { MockNirsStream, type MockNirsStreamOptions } from './mock-stream';
import {
  NirsRateLimiter,
  type NirsRateLimiterOptions,
} from './rate-limiter';
import type { NirsDataFrame } from './types';

export interface NirsSimulatorOptions {
  /** 模拟源配置 */
  mock?: MockNirsStreamOptions;
  /** 限流器配置 */
  limiter?: NirsRateLimiterOptions;
}

export class NirsSimulator {
  private readonly mock: MockNirsStream;
  private readonly limiter: NirsRateLimiter;
  private unsubMock: (() => void) | null = null;

  constructor(private readonly options: NirsSimulatorOptions = {}) {
    this.mock = new MockNirsStream({
      ...options.mock,
      autoStart: false,
    });
    this.limiter = new NirsRateLimiter({
      targetHz: 10,
      strategy: 'latest',
      ...options.limiter,
    });
  }

  /**
   * 注册限流后的数据回调
   */
  onData(callback: (frame: NirsDataFrame) => void): () => void {
    return this.limiter.onData(callback);
  }

  /**
   * 注册错误回调
   */
  onError(callback: (error: Error) => void): () => void {
    const unsubLimiter = this.limiter.onError(callback);
    const unsubMock = this.mock.onError(callback);
    return () => {
      unsubLimiter();
      unsubMock();
    };
  }

  /**
   * 启动模拟：模拟源 -> 限流器 -> onData
   */
  start(): void {
    if (this.unsubMock) {
      return;
    }
    this.unsubMock = this.mock.onData((frame) => this.limiter.ingest(frame));
    this.limiter.start();
    this.mock.start();
  }

  /**
   * 暂停（保留限流器缓冲区）
   */
  pause(): void {
    this.mock.pause();
    this.limiter.pause();
  }

  /**
   * 恢复
   */
  resume(): void {
    this.limiter.resume();
    this.mock.resume();
  }

  /**
   * 停止并清空缓冲
   */
  stop(): void {
    this.mock.stop();
    this.limiter.stop();
    if (this.unsubMock) {
      this.unsubMock();
      this.unsubMock = null;
    }
  }

  /**
   * 状态快照
   */
  getStatus() {
    return {
      mock: this.mock.getStatus(),
      limiter: this.limiter.getStatus(),
    };
  }
}
