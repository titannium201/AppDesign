/**
 * BLE 配网接口（M2）
 *
 * 基于 ESP Provisioning 协议封装，支持 Security 0/1。
 */

import type { ProvisioningConfig, ProvisioningResult } from './types';

/**
 * 配网器接口
 */
export interface ProvisioningClient {
  /**
   * 扫描未配网设备
   * @param timeoutMs 扫描超时
   */
  scanUnprovisionedDevices(timeoutMs?: number): Promise<Array<{ deviceId: string; name?: string }>>;

  /**
   * 向指定设备发送 Wi-Fi 凭据
   * @param deviceId 设备 ID
   * @param config 配网配置
   */
  provisionDevice(deviceId: string, config: ProvisioningConfig): Promise<ProvisioningResult>;

  /**
   * 应用自定义配置（如服务器地址、OTA 参数）
   * @param deviceId 设备 ID
   * @param customData 键值对配置
   */
  applyCustomConfig(deviceId: string, customData: Record<string, string>): Promise<void>;
}

/**
 * 创建配网客户端
 *
 * TODO: 注入具体 BLE 实现。
 */
export function createProvisioningClient(_bleClient: unknown): ProvisioningClient {
  throw new Error('createProvisioningClient not implemented');
}
