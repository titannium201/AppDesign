// @ts-nocheck

/**
 * 按摩方案调度器（骨架）
 */

import type {
  MassageScheduler,
  MassagePlanInput,
  MassagePlan,
  MassagePlanItem,
  MassageReservation,
} from './types';
import { generateId } from '@app/shared';

/**
 * 创建按摩方案调度器
 *
 * TODO: 接入真实设备能力与预约系统。
 */
export function createMassageScheduler(): MassageScheduler {
  return {
    createPlan(input: MassagePlanInput): MassagePlan {
      const items: MassagePlanItem[] = input.targetMuscleIds.map((muscleId, index) => ({
        itemId: generateId(),
        muscleId,
        deviceType: input.availableDevices[0]?.deviceType ?? 'air_compression',
        durationMinutes: 15,
        intensity: input.preferences?.preferredIntensity ?? 3,
        scheduledAt: input.preferences?.availableTimeSlots?.[0]?.start,
      }));

      const totalDurationMinutes = items.reduce((sum, item) => sum + item.durationMinutes, 0);

      return {
        planId: generateId(),
        userId: input.userId,
        sessionId: input.sessionId,
        items,
        totalDurationMinutes,
      };
    },

    toReservations(plan: MassagePlan): MassageReservation[] {
      return plan.items.map((item) => ({
        reservationId: generateId(),
        userId: plan.userId,
        sessionId: plan.sessionId,
        scheduledAt: item.scheduledAt ?? new Date().toISOString(),
        targetRegions: [item.muscleId],
        massageType: item.deviceType,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }));
    },
  };
}
