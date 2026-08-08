/**
 * 腿部肌肉与 GLB mesh 的映射注册表
 */

import type { LegMuscleId, LegMuscleMapping } from './types';

/**
 * 默认腿部肌肉映射表
 *
 * 基于 肌肉建模_原版/data/body_registry.json 中的 lower_limb 肌群整理。
 */
export const DEFAULT_LEG_MUSCLE_REGISTRY: Record<LegMuscleId, LegMuscleMapping> = {
  gastrocnemius_medial: {
    muscleId: 'gastrocnemius_medial',
    meshIds: ['medial_head_of_gastrocnemius.l', 'medial_head_of_gastrocnemius.r'],
    clinicalName: 'Medial head of gastrocnemius',
    fitnessName: '腓肠肌内侧头',
    region: 'lower_limb',
    bilateral: true,
  },
  gastrocnemius_lateral: {
    muscleId: 'gastrocnemius_lateral',
    meshIds: ['lateral_head_of_gastrocnemius.l', 'lateral_head_of_gastrocnemius.r'],
    clinicalName: 'Lateral head of gastrocnemius',
    fitnessName: '腓肠肌外侧头',
    region: 'lower_limb',
    bilateral: true,
  },
  soleus: {
    muscleId: 'soleus',
    meshIds: ['soleus_muscle.l', 'soleus_muscle.r'],
    clinicalName: 'Soleus muscle',
    fitnessName: '比目鱼肌',
    region: 'lower_limb',
    bilateral: true,
  },
  tibialis_anterior: {
    muscleId: 'tibialis_anterior',
    meshIds: ['tibialis_anterior_muscle.l', 'tibialis_anterior_muscle.r'],
    clinicalName: 'Tibialis anterior muscle',
    fitnessName: '胫骨前肌',
    region: 'lower_limb',
    bilateral: true,
  },
  tibialis_posterior: {
    muscleId: 'tibialis_posterior',
    meshIds: ['tibialis_posterior_muscle.l', 'tibialis_posterior_muscle.r'],
    clinicalName: 'Tibialis posterior muscle',
    fitnessName: '胫骨后肌',
    region: 'lower_limb',
    bilateral: true,
  },
  vastus_lateralis: {
    muscleId: 'vastus_lateralis',
    meshIds: ['vastus_lateralis_muscle.l', 'vastus_lateralis_muscle.r'],
    clinicalName: 'Vastus lateralis muscle',
    fitnessName: '股外侧肌',
    region: 'lower_limb',
    bilateral: true,
  },
  vastus_medialis: {
    muscleId: 'vastus_medialis',
    meshIds: ['vastus_medialis_muscle.l', 'vastus_medialis_muscle.r'],
    clinicalName: 'Vastus medialis muscle',
    fitnessName: '股内侧肌',
    region: 'lower_limb',
    bilateral: true,
  },
  vastus_intermedius: {
    muscleId: 'vastus_intermedius',
    meshIds: ['vastus_intermedius_muscle.l', 'vastus_intermedius_muscle.r'],
    clinicalName: 'Vastus intermedius muscle',
    fitnessName: '股中间肌',
    region: 'lower_limb',
    bilateral: true,
  },
  rectus_femoris: {
    muscleId: 'rectus_femoris',
    meshIds: ['rectus_femoris_muscle.l', 'rectus_femoris_muscle.r'],
    clinicalName: 'Rectus femoris muscle',
    fitnessName: '股直肌',
    region: 'lower_limb',
    bilateral: true,
  },
  biceps_femoris_long: {
    muscleId: 'biceps_femoris_long',
    meshIds: ['long_head_of_biceps_femoris.l', 'long_head_of_biceps_femoris.r'],
    clinicalName: 'Long head of biceps femoris',
    fitnessName: '股二头肌长头',
    region: 'lower_limb',
    bilateral: true,
  },
  biceps_femoris_short: {
    muscleId: 'biceps_femoris_short',
    meshIds: ['short_head_of_biceps_femoris.l', 'short_head_of_biceps_femoris.r'],
    clinicalName: 'Short head of biceps femoris',
    fitnessName: '股二头肌短头',
    region: 'lower_limb',
    bilateral: true,
  },
  semitendinosus: {
    muscleId: 'semitendinosus',
    meshIds: ['semitendinosus_muscle.l', 'semitendinosus_muscle.r'],
    clinicalName: 'Semitendinosus muscle',
    fitnessName: '半腱肌',
    region: 'lower_limb',
    bilateral: true,
  },
  semimembranosus: {
    muscleId: 'semimembranosus',
    meshIds: ['semimembranosus_muscle.l', 'semimembranosus_muscle.r'],
    clinicalName: 'Semimembranosus muscle',
    fitnessName: '半膜肌',
    region: 'lower_limb',
    bilateral: true,
  },
  iliotibial_band: {
    muscleId: 'iliotibial_band',
    meshIds: ['iliotibial_tract.l', 'iliotibial_tract.r'],
    clinicalName: 'Iliotibial tract',
    fitnessName: '髂胫束',
    region: 'lower_limb',
    bilateral: true,
  },
  popliteus: {
    muscleId: 'popliteus',
    meshIds: ['popliteus_muscle.l', 'popliteus_muscle.r'],
    clinicalName: 'Popliteus muscle',
    fitnessName: '腘肌',
    region: 'lower_limb',
    bilateral: true,
  },
};

/**
 * 肌肉注册表接口
 */
export interface MuscleRegistry {
  /** 获取所有腿部肌肉映射 */
  getAll(): LegMuscleMapping[];
  /** 根据 ID 获取映射 */
  getById(id: LegMuscleId): LegMuscleMapping | undefined;
  /** 根据 mesh ID 反查肌肉 ID */
  findByMeshId(meshId: string): LegMuscleMapping | undefined;
  /** 自定义/覆盖映射 */
  register(mapping: LegMuscleMapping): void;
}

/**
 * 创建默认腿部肌肉注册表
 */
export function createMuscleRegistry(
  initial: Record<LegMuscleId, LegMuscleMapping> = DEFAULT_LEG_MUSCLE_REGISTRY
): MuscleRegistry {
  const registry = new Map<string, LegMuscleMapping>(Object.entries(initial));

  return {
    getAll: () => Array.from(registry.values()),
    getById: (id) => registry.get(id),
    findByMeshId: (meshId) =>
      Array.from(registry.values()).find((m) => m.meshIds.includes(meshId)),
    register: (mapping) => {
      registry.set(mapping.muscleId, mapping);
    },
  };
}
