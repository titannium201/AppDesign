/**
 * 按摩 DTO（骨架）
 */

export class CreateMassagePlanDto {
  userId!: string;
  sessionId?: string;
  targetMuscleIds!: string[];
  preferredIntensity?: number;
  maxDurationMinutes?: number;
  availableTimeSlots?: Array<{ start: string; end: string }>;
}
