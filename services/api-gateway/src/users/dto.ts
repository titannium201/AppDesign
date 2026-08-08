/**
 * 用户 DTO（骨架）
 */

export class CreateProfileDto {
  userId!: string;
  nickname?: string;
  birthday?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  heightCm?: number;
  weightKg?: number;
  exerciseFrequency?: 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
  primarySports?: string[];
  injuryHistory?: string[];
}
