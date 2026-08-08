/**
 * 按摩 DTO（P0 占位）
 */
export class CreateMassagePlanDto {
  userId!: string;
  sessionId?: string;
  targetMuscleIds!: string[];
  preferredIntensity?: number;
  maxDurationMinutes?: number;
  availableTimeSlots?: Array<{ start: string; end: string }>;
}
