import type { ScanType } from '@app/shared';

/**
 * Mobile App 类型定义（骨架）
 */

export interface MobileAppProps {
  /** 是否启用开发调试菜单 */
  enableDebugMenu?: boolean;
}

/**
 * 根导航栈参数列表
 */
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ProfileForm: undefined;
  BleProvisioning: undefined;
  MainTabs: undefined;
  ScanSelect: undefined;
  ScanPrepare: { scanType: ScanType };
  Scanning: { scanType: ScanType; sessionId: string };
  ScanSession: { sessionId: string };
  ScanReport: { reportId: string };
  RecoveryPlan: { reportId: string };
  MassageReservation: { reportId?: string };
  Web3DViewer: { muscleHeatmapData?: unknown };
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};
