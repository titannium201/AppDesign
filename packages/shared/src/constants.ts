/**
 * 跨模块共享常量
 */

export const APP_NAME = 'TI 腿部恢复';
export const APP_TAGLINE = '扫描 · 评估 · 恢复';

export const MUSCLES = {
  gastrocnemius: '腓肠肌',
  tibialis_anterior: '胫骨前肌',
  quadriceps: '股四头肌',
  hamstrings: '腘绳肌',
} as const;

export const SCAN_STEPS = [
  { key: 'position', title: '定位肌肉区域', desc: '确认设备覆盖腓肠肌/胫骨前肌/股四头肌/腘绳肌' },
  { key: 'calibration', title: '自动校准', desc: 'mm-DOSI / 温度 / 热流 / 力学传感器快速校准' },
  { key: 'optical', title: '光学采集', desc: '采集 StO₂ / HbT 等氧合灌注指标' },
  { key: 'thermal', title: '热状态采集', desc: '采集皮肤温度与热流' },
  { key: 'mechanical', title: '力学压测', desc: '采集 LFR / SR / FRT90' },
  { key: 'analysis', title: '数据分析', desc: '计算 CRS 与恢复建议' },
] as const;

export const COLORS = {
  primary: '#007AFF',
  secondary: '#5AC8FA',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  indigo: '#5856D6',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  background: '#F2F2F7',
  card: '#FFFFFF',
  border: '#E5E5EA',
} as const;

export type AppColor = keyof typeof COLORS;
