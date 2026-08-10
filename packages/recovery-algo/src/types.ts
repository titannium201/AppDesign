// @ts-nocheck

/**
 * 恢复算法类型定义（P0 占位）
 */

import type {
  LegMuscleId,
  NirsMetricsSnapshot,
  ScanPointData,
  RecoveryRecommendation,
  MuscleAssessment,
  ScanReport,
  MassageReservation,
} from '@app/shared';

/** 评估上下文 */
export interface AssessmentContext {
  userId: string;
  sessionId: string;
  /** 用户历史均值（可选，用于纵向对比） */
  historicalAverage?: Record<LegMuscleId, NirsMetricsSnapshot>;
  /** 对侧数据（可选，用于左右对比） */
  contralateralData?: Record<LegMuscleId, NirsMetricsSnapshot>;
  /** 运动强度自我评分 1-10 */
  perceivedExertion?: number;
  /** 睡眠时长（小时） */
  sleepHours?: number;
}

/** 单肌肉疲劳评估输入 */
export interface MuscleFatigueInput {
  muscleId: LegMuscleId;
  /** 该肌肉所有测点数据 */
  points: ScanPointData[];
  /** 用户历史均值 */
  baseline?: NirsMetricsSnapshot;
}

/** 整体疲劳评估输入 */
export interface OverallFatigueInput {
  /** 所有扫描点数据 */
  allPoints: ScanPointData[];
  /** 按肌肉分组的数据 */
  muscleInputs: MuscleFatigueInput[];
  context: AssessmentContext;
}

/** 疲劳评估器接口 */
export interface FatigueAssessor {
  /** 评估单肌肉疲劳 */
  assessMuscle(input: MuscleFatigueInput): MuscleAssessment;

  /** 评估整体疲劳与生成报告 */
  assessOverall(input: OverallFatigueInput): ScanReport;
}

/** 恢复建议生成器接口 */
export interface RecommendationEngine {
  /**
   * 根据评估结果生成恢复建议
   * @param assessments 肌肉评估列表
   * @param context 上下文
   */
  generate(
    assessments: MuscleAssessment[],
    context: AssessmentContext
  ): RecoveryRecommendation[];
}

/** 按摩方案输入 */
export interface MassagePlanInput {
  userId: string;
  sessionId?: string;
  /** 目标肌肉 */
  targetMuscleIds: LegMuscleId[];
  /** 可用按摩设备能力 */
  availableDevices: MassageDeviceCapability[];
  /** 用户偏好 */
  preferences?: MassagePreference;
}

/** 按摩设备能力 */
export interface MassageDeviceCapability {
  deviceId: string;
  deviceType: 'air_compression' | 'vibration' | 'heat_therapy' | 'manual';
  supportedRegions: string[];
  intensityLevels: number;
  /** 单次最大时长（分钟） */
  maxDurationMinutes: number;
}

/** 按摩偏好 */
export interface MassagePreference {
  /** 最大单次时长 */
  maxDurationMinutes?: number;
  /** 偏好强度 1-5 */
  preferredIntensity?: number;
  /** 是否避开伤病部位 */
  avoidInjuredRegions?: boolean;
  /** 可用时间段 */
  availableTimeSlots?: Array<{ start: string; end: string }>;
}

/** 按摩方案输出 */
export interface MassagePlan {
  planId: string;
  userId: string;
  sessionId?: string;
  items: MassagePlanItem[];
  totalDurationMinutes: number;
}

/** 按摩方案单项 */
export interface MassagePlanItem {
  itemId: string;
  muscleId: LegMuscleId;
  deviceType: MassageDeviceCapability['deviceType'];
  durationMinutes: number;
  intensity: number;
  /** 建议执行时间 */
  scheduledAt?: string;
}

/** 按摩调度器接口（M7） */
export interface MassageScheduler {
  /** 生成按摩方案 */
  createPlan(input: MassagePlanInput): MassagePlan;

  /** 将方案转换为可预约记录 */
  toReservations(plan: MassagePlan): MassageReservation[];
}
