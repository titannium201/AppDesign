/**
 * NIRS BLE 协议常量（基于 ESP Provisioning + 自定义 NIRS 服务）
 *
 * 注：当前为接口/常量定义。具体 UUID 与字节布局需结合实际固件再调整。
 */

/** NIRS 主服务 UUID（自定义） */
export const NIRS_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';

/** 命令特征（App -> 设备） */
export const NIRS_COMMAND_CHAR_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';

/** 数据通知特征（设备 -> App） */
export const NIRS_DATA_CHAR_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

/** 设备信息服务 UUID */
export const DEVICE_INFO_SERVICE_UUID = '180a';

/** 固件版本特征 UUID */
export const FIRMWARE_VERSION_CHAR_UUID = '2a26';

/** 序列号特征 UUID */
export const SERIAL_NUMBER_CHAR_UUID = '2a25';

/** 电池服务 UUID */
export const BATTERY_SERVICE_UUID = '180f';

/** 电池电量特征 UUID */
export const BATTERY_LEVEL_CHAR_UUID = '2a19';

/** ESP Provisioning 服务 UUID */
export const ESP_PROV_SERVICE_UUID = '021a9004-0000-1000-8000-00805f9b34fb';

/** 设备命令码 */
export enum NirsCommandCode {
  START_STREAM = 0x01,
  STOP_STREAM = 0x02,
  SET_SAMPLE_RATE = 0x03,
  SET_LED_INTENSITY = 0x04,
  GET_DEVICE_INFO = 0x05,
  SET_CALIBRATION = 0x06,
}

/** 设备响应码 */
export enum NirsResponseCode {
  ACK = 0x00,
  ERROR = 0x01,
  DATA_FRAME = 0x10,
  DEVICE_INFO = 0x11,
}

/** 命令请求结构 */
export interface NirsCommand {
  code: NirsCommandCode;
  /** 命令 payload */
  payload?: Uint8Array;
}

/** 命令响应结构 */
export interface NirsResponse {
  code: NirsResponseCode;
  payload: Uint8Array;
}

/**
 * 将命令序列化为 Uint8Array
 * TODO: 实现具体 TLV/COBS 打包逻辑
 */
export function serializeCommand(_command: NirsCommand): Uint8Array {
  throw new Error('serializeCommand not implemented');
}

/**
 * 将原始字节解析为数据帧
 * TODO: 实现具体解析逻辑
 */
export function parseDataFrame(_bytes: Uint8Array): import('./types').NirsDataFrame {
  throw new Error('parseDataFrame not implemented');
}
