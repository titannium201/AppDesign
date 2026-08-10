/**
 * NIRS SDK 类型定义
 */

import type { NirsMetricsSnapshot } from '@app/shared';

/** BLE 设备状态 */
export type BleDeviceState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'error';

/** 扫描到的 BLE 外设摘要 */
export interface BlePeripheral {
  deviceId: string;
  /** 广播名称 */
  name?: string;
  /** 信号强度 dBm */
  rssi?: number;
  /** 厂商数据 / 服务 UUID 列表 */
  serviceUuids?: string[];
  /** 原始广播数据（平台相关） */
  rawAdvertisement?: Uint8Array | Record<string, unknown>;
}

/** BLE 连接配置 */
export interface BleConnectionOptions {
  /** 自动重连 */
  autoReconnect?: boolean;
  /** 连接超时（毫秒） */
  timeoutMs?: number;
  /** 请求 MTU（仅 Android） */
  requestMtu?: number;
}

/** 配网安全模式 */
export type ProvisioningSecurityMode = 'none' | 'security0' | 'security1';

/** 配网配置（M2 BLE 配网） */
export interface ProvisioningConfig {
  /** Wi-Fi SSID */
  ssid: string;
  /** Wi-Fi 密码 */
  password: string;
  /** 设备 Proof-of-Possession（Security 1 时使用） */
  pop?: string;
  /** 安全模式 */
  securityMode: ProvisioningSecurityMode;
  /** 设备服务 UUID */
  deviceUuid?: string;
}

/** 配网结果 */
export interface ProvisioningResult {
  success: boolean;
  deviceId: string;
  /** 设备返回的 IP 地址（可选） */
  assignedIp?: string;
  /** 错误码 */
  errorCode?: string;
  /** 错误信息 */
  errorMessage?: string;
}

/** NIRS 设备信息 */
export interface NirsDeviceInfo {
  deviceId: string;
  serialNumber: string;
  modelName: string;
  firmwareVersion: string;
  hardwareVersion?: string;
  batteryPercent?: number;
  /** 支持的通道数 */
  channelCount: number;
  /** 采样率 Hz */
  sampleRateHz: number;
  /** 支持的波长列表（nm） */
  wavelengths: number[];
}

/** 单个通道的 NIRS 原始/计算数据 */
export interface NirsChannelSample {
  channelIndex: number;
  timestamp: number;
  metrics: NirsMetricsSnapshot;
  /** 原始光强（可选，调试/标定使用） */
  rawIntensities?: Record<number, number>;
}

/** NIRS 数据帧 */
export interface NirsDataFrame {
  frameId: string;
  deviceId: string;
  /** 设备时间戳（毫秒） */
  deviceTimestamp: number;
  /** 接收时间戳（毫秒） */
  receivedAt: number;
  channels: NirsChannelSample[];
}

/** 标定参数（用于将原始光强转换为生理指标） */
export interface NirsCalibrationParams {
  wavelengths: number[];
  extinctionCoefficients: number[][];
  pathlengthMm: number;
  dpf: number;
}

/** SDK 配置 */
export interface NirsSdkConfig {
  /** 目标服务 UUID 过滤列表 */
  serviceUuids?: string[];
  /** 默认连接选项 */
  defaultConnectionOptions?: BleConnectionOptions;
  /** 标定参数 */
  calibration?: NirsCalibrationParams;
  /** 是否启用详细日志 */
  enableLogging?: boolean;
}

/** SDK 错误码 */
export type NirsErrorCode =
  | 'BLE_NOT_SUPPORTED'
  | 'BLE_DISABLED'
  | 'SCAN_FAILED'
  | 'DEVICE_NOT_FOUND'
  | 'CONNECTION_FAILED'
  | 'CONNECTION_LOST'
  | 'SERVICE_DISCOVERY_FAILED'
  | 'CHARACTERISTIC_NOT_FOUND'
  | 'PROVISIONING_FAILED'
  | 'INVALID_POP'
  | 'DATA_PARSE_ERROR'
  | 'CALIBRATION_MISSING'
  | 'UNKNOWN_ERROR';

/** SDK 错误 */
export class NirsSdkError extends Error {
  constructor(
    public readonly code: NirsErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'NirsSdkError';
  }
}

/** 数据流订阅回调 */
export type NirsDataHandler = (frame: NirsDataFrame) => void;

/** 状态变更回调 */
export type BleStateHandler = (state: BleDeviceState) => void;

/** 错误回调 */
export type NirsErrorHandler = (error: NirsSdkError) => void;
