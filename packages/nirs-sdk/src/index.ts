/**
 * @app/nirs-sdk — NIRS 设备 BLE 通信 SDK（接口定义）
 *
 * 当前仅定义 BLE 发现、连接、配网、数据流 API 与数据类型。
 * 平台相关实现（react-native-ble-plx / Web Bluetooth）将在后续补充。
 */

export * from './types';
export * from './protocol';
export * from './ble-client';
export * from './provisioning';
export * from './data-stream';
