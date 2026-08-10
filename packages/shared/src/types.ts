/**
 * 跨模块共享类型定义
 */

export type Gender = 'male' | 'female';
export type SportType = 'running' | 'cycling' | 'both' | 'other';
export type TargetEvent = 'none' | '5k_pb' | '10k_pb' | 'half_marathon' | 'full_marathon' | 'other';
export type TrainingType = 'lsd' | 'interval' | 'tempo' | 'recovery' | 'fartlek' | 'strength';
export type InjuryType = 'none' | 'achilles_tendinitis' | 'patella_pain' | 'it_band' | 'plantar_fasciitis' | 'stress_fracture' | 'meniscus' | 'lumbar_disc' | 'other';
export type DiscomfortLevel = 'none' | 'mild' | 'obvious' | 'severe' | 'rest_recommended';
export type SleepQuality = 'good' | 'average' | 'poor' | 'irregular';
export type RunningExperience = '<1' | '1-2' | '3-5' | '5-10' | '>10';
export type WatchBrand = 'none' | 'garmin' | 'apple' | 'huawei' | 'coros' | 'yuepaoquan' | 'other';
export type ScanType = 'baseline' | 'post_exercise';
export type Confidence = 'high' | 'medium' | 'low' | 'invalid';

export interface UserProfile {
  id: string;
  email: string;
  nickname?: string;
  gender?: Gender;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  sportType?: SportType;
  weeklyMileageKm?: number;
  trainingTypes?: TrainingType[];
  intervalConfig?: {
    distance: string;
    sets: number;
    targetPace: string;
  };
  bestRace?: {
    distance: '5k' | '10k' | 'half_marathon' | 'full_marathon';
    time: string;
    vdot: number;
  };
  targetEvent?: TargetEvent;
  injuryHistory?: InjuryType[];
  currentDiscomfort?: DiscomfortLevel;
  sleepQuality?: SleepQuality;
  runningExperience?: RunningExperience;
  watchBrands?: WatchBrand[];
  createdAt: string;
  updatedAt: string;
}

export interface DeviceInfo {
  id: string;
  serial: string;
  name: string;
  firmwareVersion?: string;
  isConnected: boolean;
  isBound: boolean;
  lastSeenAt?: string;
}

export interface MuscleScore {
  name: string;
  side: 'left' | 'right';
  crs: number;
  ors: number;
  mrs: number;
  trs: number;
  sto2?: number;
  hbt?: number;
  tskin?: number;
  hfr?: number;
  lfr?: number;
  sr?: number;
  frt90?: number;
}

export interface ScanReport {
  id: string;
  userId: string;
  deviceId?: string;
  scanType: ScanType;
  sportType?: SportType;
  exerciseDurationMin?: number;
  rpe?: number;
  overallScore: number;
  confidence: Confidence;
  statusLabel: string;
  muscles: MuscleScore[];
  recommendations: string[];
  trainingAdvice: string;
  createdAt: string;
}

export interface RecoveryPlan {
  focusMuscles: string[];
  mode: string;
  intensity: number;
  durationMin: number;
  frequency: string;
}

/* ================= backend / algorithm extensions ================= */

export type ConfidenceLevel = Confidence;

export interface IntervalConfig {
  distance: string;
  sets: number;
  targetPace?: string;
}

export interface BestRace {
  distance: '5k' | '10k' | 'half_marathon' | 'full_marathon' | string;
  time: string;
  vdot?: number;
}

export interface UserAccount extends UserProfile {
  passwordHash: string;
}

export interface DeviceBinding {
  id: string;
  userId: string;
  serial: string;
  name: string;
  firmwareVersion?: string;
  isConnected: boolean;
  isBound: boolean;
  lastSeenAt?: string;
  boundAt: string;
}

export interface OpticalMetrics {
  stO2: number;
  hbO2?: number;
  hHb?: number;
  hbT: number;
  deltaStO2?: number;
  deltaHbT?: number;
}

export interface ThermalMetrics {
  tSkin: number;
  deltaTSkin?: number;
  q: number;
  deltaQ?: number;
}

export interface MechanicalMetrics {
  lfr: number;
  sr: number;
  frt90: number;
}

export interface RecoveryMetrics {
  recoverySlope?: number;
  t50?: number;
  t90?: number;
}

/** NIRS / 多模态单点快照（兼容原始数据流与算法输入） */
export interface NirsMetricsSnapshot {
  /** 组织氧饱和度 SmO2 / StO2 (%) */
  stO2?: number;
  sto2?: number;
  /** 氧合血红蛋白 HbO2 */
  hbO2?: number;
  hbo2?: number;
  /** 脱氧血红蛋白 HHb */
  hHb?: number;
  hhb?: number;
  /** 总血红蛋白 THb */
  hbT?: number;
  hbt?: number;
  /** 皮肤温度 (°C) */
  tSkin?: number;
  tskin?: number;
  /** 热流量 / 灌注相关 */
  q?: number;
  /** 低频范围 LFR (Hz) */
  lfr?: number;
  /** 斜率比 SR */
  sr?: number;
  /** FRT90 (s) */
  frt90?: number;
  /** 恢复斜率 */
  recoverySlope?: number;
  /** 50% 恢复时间 (s) */
  t50?: number;
  /** 90% 恢复时间 (s) */
  t90?: number;
  /** 血流灌注 / 血流指数 */
  perfusion?: number;
  /** 血流灌注 (别名) */
  bloodFlow?: number;
}

export interface PerMuscleData {
  optical: OpticalMetrics;
  thermal: ThermalMetrics;
  mechanical: MechanicalMetrics;
  recovery?: RecoveryMetrics;
}

export interface RawScanInput {
  scanType: ScanType;
  sportType?: SportType;
  exerciseDurationMin?: number;
  rpe?: number;
  muscleData: Record<string, PerMuscleData>;
}

export interface LateralitySummary {
  [muscleName: string]: {
    leftCrs: number;
    rightCrs: number;
    differencePercent: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ProfileForm: undefined;
  MainTabs: undefined;
  ScanSelect: undefined;
  ScanPrepare: { scanType: ScanType };
  Scanning: { scanType: ScanType; sessionId: string };
  ScanReport: { reportId: string };
  Settings: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Profile: undefined;
};
