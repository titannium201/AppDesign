/**
 * NIRS 数据流限流器
 *
 * 把 BLE 高频通知（可能 50~100 Hz）限流到业务需要的采样率（默认 10 Hz）。
 * 支持 pause / resume / stop 控制，并通过 onData / onError 回调输出。
 */

import type { NirsChannelSample, NirsDataFrame } from './types';

/** 限流策略 */
export type RateLimitStrategy = 'latest' | 'sample' | 'average';

export interface NirsRateLimiterOptions {
  /** 目标输出采样率 (Hz)，默认 10 */
  targetHz?: number;
  /** 超过目标频率时的处理策略，默认 'latest' */
  strategy?: RateLimitStrategy;
  /** 缓冲队列最大长度，默认 1000，防止内存无限增长 */
  maxBufferSize?: number;
}

export type NirsDataCallback = (frame: NirsDataFrame) => void;
export type NirsErrorCallback = (error: Error) => void;

export interface NirsRateLimiterStatus {
  state: 'idle' | 'running' | 'paused' | 'stopped';
  bufferedFrames: number;
  emittedFrames: number;
  targetHz: number;
}

export class NirsRateLimiter {
  private state: 'idle' | 'running' | 'paused' | 'stopped' = 'idle';
  private buffer: NirsDataFrame[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly intervalMs: number;
  private readonly onDataCallbacks: NirsDataCallback[] = [];
  private readonly onErrorCallbacks: NirsErrorCallback[] = [];
  private emittedCount = 0;

  constructor(private readonly options: NirsRateLimiterOptions = {}) {
    this.intervalMs = 1000 / (options.targetHz ?? 10);
  }

  /**
   * 注册数据回调
   * @returns 取消订阅函数
   */
  onData(callback: NirsDataCallback): () => void {
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
   * @returns 取消订阅函数
   */
  onError(callback: NirsErrorCallback): () => void {
    this.onErrorCallbacks.push(callback);
    return () => {
      const index = this.onErrorCallbacks.indexOf(callback);
      if (index >= 0) {
        this.onErrorCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 接收一帧原始 NIRS 数据
   */
  ingest(frame: NirsDataFrame): void {
    if (this.state === 'stopped') {
      this.emitError(new Error('Rate limiter is stopped'));
      return;
    }
    if (this.state === 'paused') {
      return;
    }
    if (!frame || typeof frame !== 'object') {
      this.emitError(new Error('Invalid frame: expected NirsDataFrame object'));
      return;
    }

    this.buffer.push(frame);
    this.trimBuffer();
  }

  /**
   * 开始按目标频率输出数据
   */
  start(): void {
    if (this.state === 'running') {
      return;
    }
    if (this.state === 'stopped') {
      this.buffer = [];
      this.emittedCount = 0;
    }
    this.state = 'running';
    this.timer = setInterval(() => this.tick(), this.intervalMs);
  }

  /**
   * 暂停输出（保留缓冲区）
   */
  pause(): void {
    if (this.state !== 'running') {
      return;
    }
    this.state = 'paused';
    this.clearTimer();
  }

  /**
   * 恢复输出
   */
  resume(): void {
    if (this.state !== 'paused') {
      return;
    }
    this.state = 'running';
    this.timer = setInterval(() => this.tick(), this.intervalMs);
  }

  /**
   * 停止输出并清空缓冲区
   */
  stop(): void {
    this.state = 'stopped';
    this.clearTimer();
    this.buffer = [];
  }

  /**
   * 获取当前状态
   */
  getStatus(): NirsRateLimiterStatus {
    return {
      state: this.state,
      bufferedFrames: this.buffer.length,
      emittedFrames: this.emittedCount,
      targetHz: this.options.targetHz ?? 10,
    };
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private trimBuffer(): void {
    const maxBuffer = this.options.maxBufferSize ?? 1000;
    if (this.buffer.length <= maxBuffer) {
      return;
    }

    const strategy = this.options.strategy ?? 'latest';
    if (strategy === 'latest') {
      // 保留最新数据
      this.buffer = this.buffer.slice(-maxBuffer);
    } else if (strategy === 'sample') {
      // 等间隔采样保留
      const step = Math.ceil(this.buffer.length / maxBuffer);
      this.buffer = this.buffer.filter((_, idx) => idx % step === 0);
    } else if (strategy === 'average') {
      // 丢弃最旧的一半，让平均值反映较新的趋势
      this.buffer = this.buffer.slice(Math.floor(this.buffer.length / 2));
    } else {
      this.buffer = this.buffer.slice(-maxBuffer);
    }
  }

  private tick(): void {
    if (this.buffer.length === 0) {
      return;
    }

    const strategy = this.options.strategy ?? 'latest';
    let frame: NirsDataFrame;

    switch (strategy) {
      case 'latest': {
        frame = this.buffer[this.buffer.length - 1];
        this.buffer = [];
        break;
      }
      case 'sample': {
        frame = this.buffer.shift()!;
        break;
      }
      case 'average': {
        frame = this.averageFrames(this.buffer);
        this.buffer = [];
        break;
      }
      default: {
        frame = this.buffer.pop()!;
        this.buffer = [];
      }
    }

    this.emitData(frame);
  }

  private averageFrames(frames: NirsDataFrame[]): NirsDataFrame {
    if (frames.length === 1) {
      return frames[0];
    }

    const base = frames[frames.length - 1];
    const averagedChannels: NirsChannelSample[] = base.channels.map(
      (channel) => {
        const samples = frames
          .map((f) => f.channels[channel.channelIndex])
          .filter(Boolean);

        const metrics: NirsChannelSample['metrics'] = { ...channel.metrics };
        for (const key of Object.keys(metrics) as Array<
          keyof NirsChannelSample['metrics']
        >) {
          const values = samples
            .map((s) => s.metrics[key])
            .filter(
              (v): v is number => typeof v === 'number' && !Number.isNaN(v),
            );
          if (values.length > 0) {
            metrics[key] =
              values.reduce((a, b) => a + b, 0) / values.length;
          }
        }

        return {
          ...channel,
          metrics,
          timestamp: base.channels[channel.channelIndex].timestamp,
        };
      },
    );

    return {
      ...base,
      receivedAt: Date.now(),
      channels: averagedChannels,
      frameId: `${base.frameId}-avg`,
    };
  }

  private emitData(frame: NirsDataFrame): void {
    this.emittedCount++;
    for (const callback of this.onDataCallbacks) {
      try {
        callback(frame);
      } catch (err) {
        this.emitError(
          err instanceof Error ? err : new Error(String(err)),
        );
      }
    }
  }

  private emitError(error: Error): void {
    for (const callback of this.onErrorCallbacks) {
      try {
        callback(error);
      } catch {
        // 忽略回调抛错，避免递归
      }
    }
  }
}
