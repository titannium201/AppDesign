/**
 * BLE 客户端接口（平台无关抽象）
 */

import type {
  BleConnectionOptions,
  BleDeviceState,
  BlePeripheral,
  NirsDataFrame,
  NirsDeviceInfo,
  NirsSdkConfig,
  NirsSdkError,
  BleStateHandler,
  NirsDataHandler,
  NirsErrorHandler,
} from './types';

/**
 * BLE 客户端抽象接口
 *
 * 不同平台（React Native / Web / Node）分别实现此接口。
 */
export interface BleClient {
  /** 初始化并请求权限 */
  initialize(config?: NirsSdkConfig): Promise<void>;

  /** 开始扫描设备 */
  startScan(onDiscovered: (peripheral: BlePeripheral) => void): Promise<void>;

  /** 停止扫描 */
  stopScan(): Promise<void>;

  /** 连接指定设备 */
  connect(deviceId: string, options?: BleConnectionOptions): Promise<void>;

  /** 断开连接 */
  disconnect(deviceId: string): Promise<void>;

  /** 当前设备状态 */
  getState(deviceId: string): BleDeviceState;

  /** 订阅状态变化 */
  onStateChange(deviceId: string, handler: BleStateHandler): () => void;

  /** 读取设备信息 */
  readDeviceInfo(deviceId: string): Promise<NirsDeviceInfo>;

  /** 订阅 NIRS 数据通知 */
  subscribeToData(deviceId: string, handler: NirsDataHandler): () => void;

  /** 发送原始命令 */
  sendCommand(deviceId: string, bytes: Uint8Array): Promise<void>;

  /** 全局错误监听 */
  onError(handler: NirsErrorHandler): () => void;
}

/**
 * 创建 BLE 客户端
 *
 * TODO: 根据运行平台返回具体实现。
 */
export function createBleClient(_platform: 'react-native' | 'web' | 'node'): BleClient {
  throw new Error('createBleClient not implemented');
}
