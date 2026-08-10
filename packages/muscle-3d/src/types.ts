/**
 * 3D 肌肉模型类型定义
 */

import type { LegMuscleId, NirsMetricsSnapshot, ScanPointData } from '@app/shared';

/** 解剖结构类型 */
export type AnatomyStructureType =
  | 'bone'
  | 'muscle'
  | 'tendon'
  | 'ligament'
  | 'fascia'
  | 'organ'
  | 'vessel'
  | 'nerve';

/** 结构层级（0=最深/骨骼，3=最浅/皮肤） */
export type AnatomyLayer = 0 | 1 | 2 | 3;

/** 单块肌肉/解剖结构元数据 */
export interface AnatomyStructure {
  /** 结构唯一 ID（对应 GLB mesh 名称） */
  meshId: string;
  /** GLB 中原始名称 */
  originalName: string;
  /** 标准化基础名称 */
  baseName: string;
  /** 结构类型 */
  type: AnatomyStructureType;
  /** 解剖层级 */
  layer: AnatomyLayer;
  /** 所属区域，如 lower_limb、torso */
  region: string;
  /** 是否双侧结构 */
  bilateral: boolean;
  /** 包围盒中心 */
  center?: [number, number, number];
  /** 镜像中心（双侧结构） */
  mirroredCenter?: [number, number, number];
}

/** 腿部肌肉映射条目 */
export interface LegMuscleMapping {
  /** 项目内肌肉 ID */
  muscleId: LegMuscleId;
  /** 对应 GLB mesh ID 列表（可能包含左右、多头） */
  meshIds: string[];
  /** 人体解剖学术名 */
  clinicalName: string;
  /** 健身/通俗名称 */
  fitnessName: string;
  /** 所属区域 */
  region: string;
  /** 是否双侧 */
  bilateral: boolean;
}

/** 模型加载选项 */
export interface ModelLoadOptions {
  /** 本地 body.glb 绝对路径或可访问 URL */
  modelUrl: string;
  /** 是否自动镜像生成右侧结构 */
  mirrorBilateral?: boolean;
  /** 初始可见层级 */
  initialLayerVisibility?: LayerVisibility;
  /** 加载进度回调 */
  onProgress?: (progress: number) => void;
  /** 加载完成回调 */
  onLoad?: (scene: ModelScene) => void;
  /** 加载错误回调 */
  onError?: (error: Error) => void;
}

/** 层级可见性配置 */
export interface LayerVisibility {
  bones: boolean;
  muscles: boolean;
  tendons: boolean;
  ligaments: boolean;
  fascia: boolean;
  organs: boolean;
}

/** 模型场景抽象（隐藏具体渲染引擎） */
export interface ModelScene {
  /** 场景根对象 */
  root: unknown;
  /** 获取指定 mesh */
  getMesh(meshId: string): unknown | undefined;
  /** 显示/隐藏结构 */
  setVisible(meshId: string, visible: boolean): void;
  /** 设置结构高亮/颜色 */
  setColor(meshId: string, color: string | [number, number, number, number]): void;
  /** 设置结构透明度 */
  setOpacity(meshId: string, opacity: number): void;
  /** 聚焦到指定结构 */
  focus(meshId: string): void;
}

/** 热力图模式 */
export type HeatmapMode = 'fatigue' | 'sto2' | 'deltaHbt' | 'perfusion' | 'combined';

/** 热力图色阶 */
export interface HeatmapColorScale {
  /** 最小值对应颜色 */
  min: [number, number, number, number];
  /** 中间值对应颜色 */
  mid: [number, number, number, number];
  /** 最大值对应颜色 */
  max: [number, number, number, number];
  /** 最小阈值 */
  minValue: number;
  /** 最大阈值 */
  maxValue: number;
}

/** 单肌肉热力图数据 */
export interface MuscleHeatmapEntry {
  muscleId: LegMuscleId;
  /** 用于渲染的值 */
  value: number;
  /** 原始 NIRS 指标 */
  metrics: NirsMetricsSnapshot;
  /** 风险等级 */
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
}

/** 扫描点热力图数据 */
export interface PointHeatmapEntry extends ScanPointData {
  /** 归一化后的热力值 0-1 */
  heatValue: number;
}

/** 肌肉热力图数据（按肌肉聚合） */
export interface MuscleHeatmapData {
  mode: HeatmapMode;
  scale: HeatmapColorScale;
  entries: MuscleHeatmapEntry[];
}

/** 扫描点热力图数据（按测点分布） */
export interface PointHeatmapData {
  mode: HeatmapMode;
  scale: HeatmapColorScale;
  entries: PointHeatmapEntry[];
}

/** 通用热力图数据 */
export type HeatmapData = MuscleHeatmapData | PointHeatmapData;

/** 3D 坐标 */
export type Vector3 = [number, number, number];

/** 四元数/欧拉角 */
export type Rotation = { x: number; y: number; z: number } | [number, number, number, number];
